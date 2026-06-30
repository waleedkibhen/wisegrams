import { NextResponse } from "next/server";
import { getVideosDb } from "@/lib/db";

/**
 * GET /api/videos/search?q=...
 * Returns videos whose caption or author field contains the query string (case-insensitive).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  if (!q) {
    // Empty query → return nothing (caller should show full feed instead)
    return NextResponse.json({ videos: [] });
  }

  try {
    const allVideos = await getVideosDb();
    const results = allVideos.filter(
      (v) =>
        v.caption?.toLowerCase().includes(q) ||
        v.author?.toLowerCase().includes(q)
    );
    return NextResponse.json({ videos: results });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
