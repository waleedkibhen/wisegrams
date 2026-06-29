import { NextResponse } from "next/server";
import { getVideosDb, saveVideosDb } from "@/lib/db";

// POST: Toggle like on a video
export async function POST(req: Request) {
  try {
    const { id } = (await req.json()) as { id: string };
    if (!id) {
      return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
    }

    const videos = await getVideosDb();
    const newVideos = videos.map((v) =>
      v.id === id
        ? { ...v, liked: !v.liked, likes: v.liked ? Math.max(0, v.likes - 1) : v.likes + 1 }
        : v
    );
    
    await saveVideosDb(newVideos);
    return NextResponse.json({ success: true, videos: newVideos });
  } catch (error) {
    return NextResponse.json({ error: "Failed to like video" }, { status: 500 });
  }
}
