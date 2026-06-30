/**
 * app/api/proxy/route.ts
 *
 * Streaming proxy for Google Drive videos.
 *
 * Why this exists:
 *   Google Drive's uc?export=download endpoint is CORS-blocked by browsers
 *   when used as a cross-origin <video src>. This route runs server-side,
 *   fetches the video from Drive (server → Drive, no CORS), and streams the
 *   bytes back to the browser as a same-origin response.
 *
 * Multi-user caching strategy:
 *   `force-dynamic` is intentionally NOT used here. Without it, Vercel's
 *   Edge CDN will cache responses based on the s-maxage Cache-Control header.
 *   This means:
 *     - User 1 (desktop) requests /api/proxy?id=abc → fetches from Google Drive
 *     - User 2 (mobile) requests /api/proxy?id=abc → served from CDN cache
 *     - Google Drive is only hit ONCE per video per hour, regardless of how
 *       many users are watching simultaneously.
 *   Without this, every user hits Google Drive directly, causing rate limiting
 *   and blank video screens for concurrent users.
 *
 * Range requests:
 *   Range requests (for seeking) are passed through but NOT cached by the CDN
 *   since range responses are unique per byte range.
 *
 * Security: file ID is validated to contain only valid Drive ID characters
 * before any external request is made.
 */

import type { NextRequest } from "next/server";

// Restore force-dynamic to prevent Next.js from statically generating a 400 error.
export const dynamic = "force-dynamic";

// Use Node.js runtime for full streaming / ReadableStream pipe support
export const runtime = "nodejs";

const DRIVE_ID_RE = /^[a-zA-Z0-9_-]{10,}$/;

// All the Google Drive URL formats we try in order
const driveUrls = (id: string) => [
  `https://drive.google.com/uc?export=download&id=${id}&confirm=t`,
  `https://drive.google.com/uc?export=download&id=${id}&confirm=t&authuser=0`,
  `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
];

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  // ── Validate ──────────────────────────────────────────────────────────────────
  if (!id || !DRIVE_ID_RE.test(id)) {
    return new Response(JSON.stringify({ error: "Invalid or missing Drive file ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Forward Range header (enables video seeking) ──────────────────────────────
  const rangeHeader = request.headers.get("range");
  const fetchHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  };
  if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

  // ── Try each Drive URL format until we get a non-HTML response ────────────────
  let upstream: Response | null = null;
  let contentType = "";

  for (const url of driveUrls(id)) {
    try {
      const res = await fetch(url, {
        headers: fetchHeaders,
        redirect: "follow",
      });
      contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html")) {
        upstream = res;
        break;
      }
    } catch {
      // Network error on this URL — try the next one
      continue;
    }
  }

  // ── All URLs returned HTML → rate limited or file not found ──────────────────
  if (!upstream || contentType.includes("text/html")) {
    return new Response(
      JSON.stringify({
        error:
          "Could not stream video. Make sure the file is publicly shared (Anyone with the link → Viewer). If it was shared recently, wait 30 seconds and try again.",
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          // Do NOT cache error responses — let the next request retry
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // ── Build response headers ───────────────────────────────────────────────────
  const responseHeaders = new Headers();

  responseHeaders.set(
    "Content-Type",
    contentType.startsWith("video/") ? contentType : "video/mp4"
  );

  // Critical for video seeking — tell the browser byte ranges are accepted
  responseHeaders.set("Accept-Ranges", "bytes");

  // ── Caching strategy ──────────────────────────────────────────────────────────
  // For range requests (seeking), we don't cache — each byte range is unique.
  // For full-video requests, we tell the CDN (s-maxage) and browser (max-age)
  // to cache for 1 hour. This means multiple simultaneous users all share the
  // same cached response — Google Drive is only hit once.
  if (rangeHeader) {
    responseHeaders.set("Cache-Control", "no-store");
  } else {
    responseHeaders.set(
      "Cache-Control",
      "public, s-maxage=3600, max-age=3600, stale-while-revalidate=86400"
    );
  }

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) responseHeaders.set("Content-Length", contentLength);

  const contentRange = upstream.headers.get("content-range");
  if (contentRange) responseHeaders.set("Content-Range", contentRange);

  // ── Stream the response body ──────────────────────────────────────────────────
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
