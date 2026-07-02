"use client";

import { useCallback } from "react";
import VideoFeed from "@/components/VideoFeed";
import { useVideoStore } from "@/hooks/useVideoStore";
import { PlusSquare } from "lucide-react";

/**
 * FeedPage — True fullscreen Instagram Reels layout.
 *
 * Layout (all overlays, nothing takes up layout flow):
 *   ┌─────────────────────────────────┐
 *   │  [Wisegrams]          [+] [🔇]  │  ← top overlay
 *   │                                 │
 *   │         VideoFeed (100dvh)      │  ← takes entire screen
 *   │                                 │
 *   │  @user  caption                 │  ← bottom-left overlay (in VideoCard)
 *   │                       [♥][💬]  │  ← right overlay (in VideoCard)
 *   └─────────────────────────────────┘
 */
export default function FeedPage() {
  const setShowUploadModal = useVideoStore((s) => s.setShowUploadModal);

  const handleAddVideo = useCallback(() => {
    setShowUploadModal(true);
  }, [setShowUploadModal]);

  return (
    <main
      className="relative w-full bg-black"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      {/* ── Full-screen video feed ── */}
      <VideoFeed onAddVideo={handleAddVideo} />

      {/* ── Top overlay bar ── */}
      <div
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pointer-events-none"
        style={{
          paddingTop: "env(safe-area-inset-top, 12px)",
          height: "60px",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)",
        }}
      >
        {/* App name */}
        <span
          className="text-white font-bold text-[22px] tracking-tight italic select-none pointer-events-none"
          style={{
            fontFamily: "var(--font-inter)",
            textShadow: "0 1px 6px rgba(0,0,0,0.6)",
          }}
        >
          Wisegrams
        </span>

        {/* Upload button */}
        <button
          onClick={handleAddVideo}
          aria-label="Add video"
          id="nav-add-video"
          className="pointer-events-auto w-9 h-9 flex items-center justify-center rounded-full active:opacity-60 transition-opacity"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
        >
          <PlusSquare size={22} color="white" strokeWidth={2} />
        </button>
      </div>
    </main>
  );
}
