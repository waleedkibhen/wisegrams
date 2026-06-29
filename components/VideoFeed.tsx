"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import VideoCard from "@/components/VideoCard";
import { useVideoStore } from "@/hooks/useVideoStore";
import { Play } from "lucide-react";

export default function VideoFeed() {
  const { videos, toggleLike } = useVideoStore();
  const [activeIndex, setActiveIndex] = useState(0);
  
  // To support infinite loop, we store an array of instances referencing video IDs.
  // Each instance gets a unique key so React can render duplicates of the same video.
  const [feedItems, setFeedItems] = useState<{ id: string; key: string }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const programmaticScroll = useRef(false);

  // ── Sync feedItems with available videos ─────────────────────────────────────
  useEffect(() => {
    if (videos.length === 0) {
      setFeedItems([]);
      return;
    }

    setFeedItems((prev) => {
      // If empty, initialize with the current videos in order
      if (prev.length === 0) {
        return videos.map((v, i) => ({ id: v.id, key: `${v.id}-init-${i}` }));
      }
      // If not empty, just filter out any videos that were deleted
      const validIds = new Set(videos.map(v => v.id));
      return prev.filter(item => validIds.has(item.id));
    });
  }, [videos]);

  // ── Infinite scroll logic: append randomly shuffled videos when near the end ──
  useEffect(() => {
    if (videos.length === 0 || feedItems.length === 0) return;

    // If the user scrolls within 3 items of the end, append another batch
    if (activeIndex >= feedItems.length - 3) {
      const shuffled = [...videos].sort(() => Math.random() - 0.5);
      const newItems = shuffled.map((v, i) => ({
        id: v.id,
        key: `${v.id}-${Date.now()}-${i}`,
      }));
      setFeedItems((prev) => [...prev, ...newItems]);
    }
  }, [activeIndex, videos, feedItems.length]);

  // ── IntersectionObserver: set active index when a card is ≥ 55% visible ──────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || feedItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.55 }
    );

    // Give React a tick to render the feed items before observing
    const timeout = setTimeout(() => {
      const items = container.querySelectorAll<HTMLElement>("[data-feed-item]");
      items.forEach((el) => observer.observe(el));
    }, 50);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [feedItems.length]); // Re-observe when items are appended

  // ── Keyboard nav (desktop) ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        setActiveIndex((i) => Math.min(i + 1, feedItems.length - 1));
      } else if (e.key === "ArrowUp") {
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [feedItems.length]);

  // ── Programmatic scroll when activeIndex changes via keyboard ─────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || programmaticScroll.current) return;
    const item = container.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (item) {
      programmaticScroll.current = true;
      item.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => { programmaticScroll.current = false; }, 500);
    }
  }, [activeIndex]);

  const handleScroll = useCallback(() => {
    // Nothing needed — IntersectionObserver handles active index detection
  }, []);

  // Map the feedItems back to actual video objects for rendering
  const renderedVideos = useMemo(() => {
    const videoMap = new Map(videos.map(v => [v.id, v]));
    return feedItems
      .map(item => ({ key: item.key, video: videoMap.get(item.id) }))
      .filter((item): item is { key: string; video: NonNullable<typeof item.video> } => !!item.video);
  }, [feedItems, videos]);

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh text-center px-8 gap-5">
        <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
          <Play size={32} className="text-neutral-400 ml-1" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl mb-2">No videos yet</h2>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Tap <strong className="text-white">+</strong> below to add your first Google Drive video.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="feed-container w-full"
      style={{ height: "100dvh" }}
      onScroll={handleScroll}
    >
      {renderedVideos.map(({ key, video }, index) => (
        <div
          key={key}
          data-feed-item
          data-index={index}
          className="feed-item"
        >
          <VideoCard
            video={video}
            index={index}
            activeIndex={activeIndex}
            onLike={toggleLike}
          />
        </div>
      ))}
    </div>
  );
}
