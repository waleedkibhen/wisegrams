/**
 * app/api/proxy/route.ts
 *
 * Fallback streaming proxy for Google Drive videos.
 *
 * ⚠️  This proxy is the FALLBACK path used when NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY
 *     is not set. The primary path (API key) bypasses this proxy entirely —
 *     the browser streams directly from googleapis.com with no server hop.
 *
 * Why server-proxying Google Drive is hard:
 *   Google Drive protects large files behind an anti-hotlinking interstitial.
 *   The bypass requires:
 *     1. A browser session/cookie (which a server proxy doesn't have), OR
 *     2. Parsing the HTML interstitial to extract a one-time confirm token, OR
 *     3. Using the official Drive API with an API key (recommended).
 *
 * This route implements strategy 2: parse the HTML, extract the real download
 * URL, and retry. This handles the "video 2 stuck, video 3 blank" bug by
 * resolving the actual content URL before beginning to stream.
 */

import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DRIVE_ID_RE = /^[a-zA-Z0-9_-]{10,}$/;

// ─── Resolve the real streaming URL from Google Drive ────────────────────────

async function resolveStreamUrl(id: string, signal: AbortSignal): Promise<string | null> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  // Ordered list of candidate URLs to try
  const candidates = [
    `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${id}&confirm=t&authuser=0`,
    `https://drive.google.com/uc?export=download&id=${id}&confirm=t`,
  ];

  for (const url of candidates) {
    try {
      // HEAD request first: fast check to see if we get video bytes immediately
      const head = await fetch(url, {
        method: "HEAD",
        headers,
        redirect: "follow",
        signal,
      }).catch(() => null);

      const headCt = head?.headers.get("content-type") ?? "";
      if (head?.ok && headCt.startsWith("video/")) {
        return url; // Direct video URL — use it
      }

      // If HEAD suggests HTML, do a GET to parse the confirmation form
      const res = await fetch(url, {
        headers,
        redirect: "follow",
        signal,
      });

      const ct = res.headers.get("content-type") ?? "";

      if (!ct.includes("text/html") && res.ok) {
        return url; // Non-HTML response on the same URL
      }

      // ── Parse Google's download interstitial page ─────────────────────────
      // Google returns an HTML page with a "Download anyway" link that contains
      // a one-time confirm token. We extract that token and build the real URL.
      const html = await res.text();

      // Pattern 1: look for confirm=TOKEN in any URL (not the generic 't')
      const allConfirms = [...html.matchAll(/confirm=([0-9A-Za-z_-]+)/g)];
      for (const m of allConfirms) {
        const token = m[1];
        if (token !== "t") {
          return `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0&confirm=${token}`;
        }
      }

      // Pattern 2: find the download form action URL (absolute)
      const formAction = html.match(
        /action="(https:\/\/drive[^"]+export=download[^"]*)"/
      );
      if (formAction) {
        return formAction[1].replace(/&amp;/g, "&");
      }

      // Pattern 2b: find the download form action URL (relative)
      const relativeAction = html.match(
        /action="(\/uc\?export=download[^"]*)"/
      );
      if (relativeAction) {
        return "https://drive.google.com" + relativeAction[1].replace(/&amp;/g, "&");
      }

      // Pattern 3: find a full usercontent URL in the page
      const usercontent = html.match(
        /href="(https:\/\/drive\.usercontent\.google\.com\/download[^"]*)"/
      );
      if (usercontent) {
        return usercontent[1].replace(/&amp;/g, "&");
      }
      
      console.warn(`[Proxy] Failed to extract download URL from interstitial for ID: ${id}`);
    } catch (e) {
      console.error(`[Proxy] Error resolving URL for ID: ${id}`, e);
      continue;
    }
  }

  console.error(`[Proxy] Completely failed to resolve stream URL for ID: ${id}`);
  return null;
}

// ─── GET handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id || !DRIVE_ID_RE.test(id)) {
    return new Response(JSON.stringify({ error: "Invalid or missing Drive file ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rangeHeader = request.headers.get("range");

  // Step 1: resolve the actual streaming URL (handles interstitials)
  const streamUrl = await resolveStreamUrl(id, request.signal);

  if (!streamUrl) {
    return new Response(
      JSON.stringify({
        error:
          "Could not stream video. Ensure sharing is set to 'Anyone with the link → Viewer' in Google Drive. " +
          "For best results, set NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY in your environment.",
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      }
    );
  }

  // Step 2: fetch the actual content (with optional Range for seeking)
  const fetchHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "video/webm,video/mp4,video/*;q=0.9,*/*;q=0.8",
  };
  if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

  let upstream: Response;
  try {
    upstream = await fetch(streamUrl, {
      headers: fetchHeaders,
      redirect: "follow",
      signal: request.signal,
    });
  } catch {
    return new Response(JSON.stringify({ error: "Upstream fetch failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const upstreamCt = upstream.headers.get("content-type") ?? "";
  if (upstreamCt.includes("text/html")) {
    return new Response(
      JSON.stringify({ error: "Google Drive returned an HTML page instead of video bytes." }),
      { status: 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  }

  // Step 3: Build and return the streaming response
  const responseHeaders = new Headers();
  responseHeaders.set(
    "Content-Type",
    upstreamCt.startsWith("video/") ? upstreamCt : "video/mp4"
  );
  responseHeaders.set("Accept-Ranges", "bytes");
  // Allow CORS so the video element on any origin can load it
  responseHeaders.set("Access-Control-Allow-Origin", "*");

  // Cache full-video responses on the CDN; never cache range requests
  if (rangeHeader) {
    responseHeaders.set("Cache-Control", "no-store");
  } else {
    responseHeaders.set(
      "Cache-Control",
      "public, s-maxage=3600, max-age=3600, stale-while-revalidate=86400"
    );
  }

  const cl = upstream.headers.get("content-length");
  if (cl) responseHeaders.set("Content-Length", cl);
  const cr = upstream.headers.get("content-range");
  if (cr) responseHeaders.set("Content-Range", cr);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
