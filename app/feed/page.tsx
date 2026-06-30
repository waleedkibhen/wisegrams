"use client";

import { useState, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import VideoFeed from "@/components/VideoFeed";
import FeedHeader from "@/components/FeedHeader";

export default function FeedPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
  }, []);

  return (
    <main className="relative w-full bg-black" style={{ height: "100dvh" }}>
      {/* Full-screen snap-scroll feed */}
      <VideoFeed searchQuery={searchQuery} />

      {/* Floating header with search */}
      <FeedHeader onSearch={handleSearch} />

      {/* Floating bottom nav */}
      <BottomNav />
    </main>
  );
}
