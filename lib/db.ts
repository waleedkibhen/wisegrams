import { Redis } from "@upstash/redis";
import type { VideoPost } from "./storage";

// Global fallback for local development before Vercel Redis is configured
const globalForDb = global as unknown as { localVideos: VideoPost[] };
if (!globalForDb.localVideos) {
  globalForDb.localVideos = [];
}

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    })
  : null;

const REDIS_KEY = "wisegrams:videos";

export async function getVideosDb(): Promise<VideoPost[]> {
  if (redis) {
    const data = await redis.get<VideoPost[]>(REDIS_KEY);
    return data || [];
  }
  return globalForDb.localVideos;
}

export async function saveVideosDb(videos: VideoPost[]): Promise<void> {
  if (redis) {
    await redis.set(REDIS_KEY, videos);
  } else {
    globalForDb.localVideos = videos;
  }
}
