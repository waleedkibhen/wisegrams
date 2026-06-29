import { NextResponse } from "next/server";
import { getVideosDb, saveVideosDb } from "@/lib/db";
import type { VideoPost } from "@/lib/storage";

// GET: Fetch all videos globally
export async function GET() {
  const videos = await getVideosDb();
  return NextResponse.json({ videos });
}

// POST: Add a new video globally
export async function POST(req: Request) {
  try {
    const { video } = (await req.json()) as { video: VideoPost };
    if (!video || !video.id) {
      return NextResponse.json({ error: "Invalid video" }, { status: 400 });
    }

    const videos = await getVideosDb();
    // Add to the front of the list
    const newVideos = [video, ...videos];
    
    await saveVideosDb(newVideos);
    return NextResponse.json({ success: true, videos: newVideos });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add video" }, { status: 500 });
  }
}

// DELETE: Remove a video globally
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
    }

    const videos = await getVideosDb();
    const newVideos = videos.filter((v) => v.id !== id);
    
    await saveVideosDb(newVideos);
    return NextResponse.json({ success: true, videos: newVideos });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove video" }, { status: 500 });
  }
}
