"use client";

import { useState, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import VideoFeed from "@/components/VideoFeed";
import FeedHeader from "@/components/FeedHeader";

/**
 * Layout:
 *   ┌──────────────────────────┐  ← solid header (56px)
 *   │         FeedHeader       │
 *   ├──────────────────────────┤
 *   │                          │
 *   │        VideoFeed         │  ← fills remaining space; videos never go under bars
 *   │                          │
 *   ├──────────────────────────┤
 *   │         BottomNav        │  ← solid nav (64px)
 *   └──────────────────────────┘
 */
export default function FeedPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
  }, []);

  return (
    <main
      className="flex flex-col w-full bg-black"
      style={{ height: "100dvh" }}
    >
      {/* Solid header — not an overlay */}
      <FeedHeader onSearch={handleSearch} />

      {/* Feed takes all remaining space between header and nav */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <VideoFeed searchQuery={searchQuery} />
      </div>

      {/* Solid nav — not an overlay */}
      <BottomNav />
    </main>
  );
}
