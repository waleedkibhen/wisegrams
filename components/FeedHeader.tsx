"use client";

import { Camera } from "lucide-react";

/**
 * FeedHeader
 * Overlays the top of the video feed exactly like Instagram's "Reels" label.
 * - Pure overlay (pointer-events-none on the gradient; camera button is interactive)
 * - Fades the very top of the video slightly so text is always readable
 */
export default function FeedHeader() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
      style={{
        paddingTop: "max(14px, env(safe-area-inset-top, 14px))",
        paddingBottom: "14px",
        // Very subtle top gradient so the header text is legible
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
        pointerEvents: "none",
      }}
    >
      {/* App name — like Instagram's "Reels" label */}
      <span
        className="text-white font-bold text-[22px] tracking-tight drop-shadow-lg select-none"
        style={{
          fontFamily: "var(--font-inter)",
          textShadow: "0 1px 8px rgba(0,0,0,0.5)",
        }}
      >
        Wisegrams
      </span>

      {/* Camera icon — decorative for now, pointer-events-auto so it's tappable */}
      <button
        aria-label="Camera"
        id="feed-camera-btn"
        style={{ pointerEvents: "auto" }}
        className="w-9 h-9 flex items-center justify-center active:scale-90 transition-transform"
      >
        <Camera size={24} className="text-white drop-shadow-lg" strokeWidth={1.8} />
      </button>
    </div>
  );
}
