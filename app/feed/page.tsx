import type { Metadata } from "next";
import BottomNav from "@/components/BottomNav";
import VideoFeed from "@/components/VideoFeed";
import FeedHeader from "@/components/FeedHeader";

export const metadata: Metadata = {
  title: "Feed — Wisegrams",
  description: "Your personalised short-form video feed on Wisegrams.",
};

export default function FeedPage() {
  return (
    <main className="relative w-full bg-black" style={{ height: "100dvh" }}>
      {/* Full-screen snap-scroll feed — extends behind the fixed header + nav */}
      <VideoFeed />

      {/* Instagram-style floating header (like "Reels" at top-left) */}
      <FeedHeader />

      {/* Floating bottom nav — overlays on top of video */}
      <BottomNav />
    </main>
  );
}
