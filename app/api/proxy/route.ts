/**
 * app/api/proxy/route.ts
 *
 * Streaming proxy for Google Drive videos.
 *
 * Why this exists:
 *   Google Drive's uc?export=download endpoint is CORS-blocked by browsers
 *   when used as a cross-origin <video src>. This route runs server-side,
 *   fetches the video from Drive (server → Drive, no CORS), and streams the
 *   bytes back to the browser as a same-origin response. The browser can now:
 *     - Use a native <video> element with full preloading
 *     - Issue Range requests for video seeking
 *     - Cache video data in its media buffer
 *
 * Security: file ID is validated to contain only valid Drive ID characters
 * before any external request is made.
 */

import type { NextRequest } from "next/server";

// Mark as dynamic so Next.js never statically caches this route
export const dynamic = "force-dynamic";

// Use Node.js runtime for full streaming / ReadableStream pipe support
export const runtime = "nodejs";

const DRIVE_ID_RE = /^[a-zA-Z0-9_-]{10,}$/;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  // ── Validate ────────────────────────────────────────────────────────────────
  if (!id || !DRIVE_ID_RE.test(id)) {
    return new Response(JSON.stringify({ error: "Invalid or missing Drive file ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Forward Range header (enables video seeking) ─────────────────────────────
  const rangeHeader = request.headers.get("range");
  const fetchHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  };
  if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

  // ── Fetch from Google Drive ──────────────────────────────────────────────────
  // confirm=t bypasses the "file too large to scan" HTML interstitial for files > 25 MB.
  let driveUrl = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;

  let upstream = await fetch(driveUrl, {
    headers: fetchHeaders,
    redirect: "follow",
  });

  let contentType = upstream.headers.get("content-type") ?? "";

  // ── If we still got an HTML page, try the authuser=0 variant ─────────────────
  if (contentType.includes("text/html")) {
    driveUrl = `https://drive.google.com/uc?export=download&id=${id}&confirm=t&authuser=0`;
    upstream = await fetch(driveUrl, {
      headers: fetchHeaders,
      redirect: "follow",
    });
    contentType = upstream.headers.get("content-type") ?? "";
  }

  // ── Still HTML → could not retrieve the file ────────────────────────────────
  if (contentType.includes("text/html")) {
    return new Response(
      JSON.stringify({
        error:
          "Could not stream video. Make sure the file is publicly shared (Anyone with the link → Viewer).",
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ── Build response headers ──────────────────────────────────────────────────
  const responseHeaders = new Headers();

  // Always declare a video content-type so the browser treats it as media
  responseHeaders.set(
    "Content-Type",
    contentType.startsWith("video/") ? contentType : "video/mp4"
  );

  // Critical for video seeking — tell the browser byte ranges are accepted
  responseHeaders.set("Accept-Ranges", "bytes");

  // Allow browser to cache the proxied video for 1 hour
  responseHeaders.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) responseHeaders.set("Content-Length", contentLength);

  const contentRange = upstream.headers.get("content-range");
  if (contentRange) responseHeaders.set("Content-Range", contentRange);

  // ── Stream the response body ─────────────────────────────────────────────────
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
