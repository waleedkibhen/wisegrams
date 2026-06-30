"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import VideoCard from "@/components/VideoCard";
import { useVideoStore } from "@/hooks/useVideoStore";
import { Play, Search } from "lucide-react";

// Minimum items remaining before appending the next infinite-scroll batch
const PREFETCH_THRESHOLD = 3;

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyFeed() {
  const setShowUploadModal = useVideoStore((s) => s.setShowUploadModal);
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-6">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(168,85,247,0.1) 100%)",
          border: "1px solid rgba(124,58,237,0.2)",
        }}
      >
        <Play size={32} className="text-purple-400 ml-1" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-white font-bold text-xl tracking-tight">No videos yet</h2>
        <p className="text-neutral-500 text-sm leading-relaxed max-w-[240px]">
          Tap <strong className="text-purple-400">+</strong> below to add your first Google Drive video.
        </p>
      </div>
      <button
        onClick={() => setShowUploadModal(true)}
        className="px-6 py-2.5 rounded-full text-white text-sm font-semibold transition-colors"
        style={{ background: "rgba(124,58,237,0.9)" }}
      >
        Add a video
      </button>
    </div>
  );
}

// ── Search empty state ────────────────────────────────────────────────────────
function SearchEmpty({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
      <Search size={36} className="text-neutral-600" />
      <p className="text-neutral-400 text-sm">
        No videos matching <span className="text-white font-semibold">"{query}"</span>
      </p>
    </div>
  );
}


interface VideoFeedProps {
  searchQuery?: string;
}

export default function VideoFeed({ searchQuery = "" }: VideoFeedProps) {
  const { videos, toggleLike, isInitializing } = useVideoStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const [feedItems, setFeedItems] = useState<{ id: string; key: string }[]>([]);
  const [searchResults, setSearchResults] = useState<typeof videos | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const programmaticScroll = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedItems = useRef<Set<Element>>(new Set());

  // ── Live search via API (debounced, abortable) ────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/videos/search?q=${encodeURIComponent(searchQuery.trim())}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.videos);
        }
      } catch {
        // aborted or network error — ignore
      }
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery]);

  // Full list or search results
  const sourceVideos = searchResults !== null ? searchResults : videos;

  // ── Sync feedItems with sourceVideos ──────────────────────────────────────
  useEffect(() => {
    if (sourceVideos.length === 0) {
      setFeedItems([]);
      setActiveIndex(0);
      return;
    }
    setFeedItems((prev) => {
      if (prev.length === 0) {
        return sourceVideos.map((v, i) => ({ id: v.id, key: `${v.id}-init-${i}` }));
      }
      const validIds = new Set(sourceVideos.map((v) => v.id));
      const filtered = prev.filter((item) => validIds.has(item.id));
      if (filtered.length === 0) {
        return sourceVideos.map((v, i) => ({ id: v.id, key: `${v.id}-init-${i}` }));
      }
      return filtered;
    });
  }, [sourceVideos]);

  // ── Infinite scroll: append shuffled batch when near end ──────────────────
  useEffect(() => {
    // Only in non-search mode and with more than 1 video to shuffle
    if (searchQuery.trim() || sourceVideos.length <= 1) return;
    if (feedItems.length === 0) return;
    if (activeIndex < feedItems.length - PREFETCH_THRESHOLD) return;

    const shuffled = [...sourceVideos].sort(() => Math.random() - 0.5);
    const newItems = shuffled.map((v, i) => ({
      id: v.id,
      key: `${v.id}-${Date.now()}-${i}`,
    }));
    setFeedItems((prev) => [...prev, ...newItems]);
  }, [activeIndex, sourceVideos, feedItems.length, searchQuery]);

  // ── IntersectionObserver — observe items as they mount ───────────────────
  const observeElement = useCallback((el: HTMLElement) => {
    if (!observerRef.current || observedItems.current.has(el)) return;
    observerRef.current.observe(el);
    observedItems.current.add(el);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.55 }
    );

    const items = container.querySelectorAll<HTMLElement>("[data-feed-item]");
    items.forEach((el) => observeElement(el));

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      observedItems.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard nav ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") setActiveIndex((i) => Math.min(i + 1, feedItems.length - 1));
      else if (e.key === "ArrowUp") setActiveIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [feedItems.length]);

  // ── Programmatic scroll on keyboard nav ──────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || programmaticScroll.current) return;
    const item = container.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (item) {
      programmaticScroll.current = true;
      requestAnimationFrame(() => {
        item.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => { programmaticScroll.current = false; }, 600);
      });
    }
  }, [activeIndex]);

  const renderedVideos = useMemo(() => {
    const videoMap = new Map(sourceVideos.map((v) => [v.id, v]));
    return feedItems
      .map((item) => ({ key: item.key, video: videoMap.get(item.id) }))
      .filter(
        (item): item is { key: string; video: NonNullable<typeof item.video> } => !!item.video
      );
  }, [feedItems, sourceVideos]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  if (videos.length === 0) return <EmptyFeed />;

  if (searchQuery.trim() && searchResults !== null && searchResults.length === 0) {
    return <SearchEmpty query={searchQuery} />;
  }

  return (
    <div
      ref={containerRef}
      className="feed-container w-full h-full"
    >
      {renderedVideos.map(({ key, video }, index) => (
        <div
          key={key}
          data-feed-item
          data-index={index}
          className="feed-item"
          ref={(el) => { if (el) observeElement(el); }}
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
