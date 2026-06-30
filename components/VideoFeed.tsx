"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import VideoCard from "@/components/VideoCard";
import { useVideoStore } from "@/hooks/useVideoStore";
import { Play } from "lucide-react";

// Minimum videos buffered ahead before we append the next batch
const PREFETCH_THRESHOLD = 3;

// ── Skeleton loader shown while the initial DB fetch is in-flight ─────────────
function FeedSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-dvh text-center px-8 gap-6">
      <div className="flex flex-col items-center gap-4">
        {/* Pulsing logo placeholder */}
        <div
          className="w-16 h-16 rounded-2xl animate-pulse"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(168,85,247,0.2) 100%)",
          }}
        />
        <div className="flex flex-col gap-2 items-center">
          <div className="w-32 h-3 rounded-full bg-white/10 animate-pulse" />
          <div className="w-24 h-2.5 rounded-full bg-white/6 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center h-dvh text-center px-8 gap-6">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(168,85,247,0.1) 100%)",
          border: "1px solid rgba(124,58,237,0.2)",
        }}
      >
        <Play size={32} className="text-purple-400 ml-1" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-white font-bold text-xl tracking-tight">
          No videos yet
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed max-w-[240px]">
          Tap <strong className="text-purple-400">+</strong> below to add your
          first Google Drive video.
        </p>
      </div>
    </div>
  );
}

// ── Search empty state ────────────────────────────────────────────────────────
function SearchEmpty({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-dvh text-center px-8 gap-5">
      <p className="text-neutral-400 text-sm">
        No videos matching{" "}
        <span className="text-white font-semibold">"{query}"</span>
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

  // Feed items support infinite scroll: each entry has a unique key + video id
  const [feedItems, setFeedItems] = useState<{ id: string; key: string }[]>([]);

  // Search results from the API (null = not in search mode)
  const [searchResults, setSearchResults] = useState<typeof videos | null>(null);
  const [_isPending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const programmaticScroll = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedItems = useRef<Set<Element>>(new Set());

  // ── Live search via API ───────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/videos/search?q=${encodeURIComponent(searchQuery.trim())}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          startTransition(() => setSearchResults(data.videos));
        }
      } catch {
        // Aborted or failed — ignore
      }
    }, 220);
    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [searchQuery]);

  // ── Source videos: full list or search results ────────────────────────────
  const sourceVideos = searchResults !== null ? searchResults : videos;

  // ── Sync feedItems when sourceVideos changes ──────────────────────────────
  useEffect(() => {
    if (sourceVideos.length === 0) {
      setFeedItems([]);
      setActiveIndex(0);
      return;
    }
    setFeedItems((prev) => {
      if (prev.length === 0) {
        return sourceVideos.map((v, i) => ({
          id: v.id,
          key: `${v.id}-init-${i}`,
        }));
      }
      // Filter out deleted/unavailable videos
      const validIds = new Set(sourceVideos.map((v) => v.id));
      const filtered = prev.filter((item) => validIds.has(item.id));
      // If all gone (e.g. search changed completely), reset
      if (filtered.length === 0) {
        return sourceVideos.map((v, i) => ({
          id: v.id,
          key: `${v.id}-init-${i}`,
        }));
      }
      return filtered;
    });
  }, [sourceVideos]);

  // ── Infinite scroll: append batch when near the end ──────────────────────
  useEffect(() => {
    // Only infinite-scroll in non-search mode and with >1 video
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

  // ── Observe a single element ──────────────────────────────────────────────
  const observeElement = useCallback((el: HTMLElement) => {
    if (!observerRef.current || observedItems.current.has(el)) return;
    observerRef.current.observe(el);
    observedItems.current.add(el);
  }, []);

  // ── IntersectionObserver setup ────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.index
            );
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.55 }
    );

    // Observe all currently-rendered items
    const items = container.querySelectorAll<HTMLElement>("[data-feed-item]");
    items.forEach((el) => observeElement(el));

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      observedItems.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only set up once; new items are observed via observeElement callback

  // ── Keyboard nav (desktop) ────────────────────────────────────────────────
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

  // ── Programmatic scroll on keyboard nav ──────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || programmaticScroll.current) return;
    const item = container.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`
    );
    if (item) {
      programmaticScroll.current = true;
      requestAnimationFrame(() => {
        item.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
          programmaticScroll.current = false;
        }, 600);
      });
    }
  }, [activeIndex]);

  // Map feedItems → actual video objects
  const renderedVideos = useMemo(() => {
    const videoMap = new Map(sourceVideos.map((v) => [v.id, v]));
    return feedItems
      .map((item) => ({ key: item.key, video: videoMap.get(item.id) }))
      .filter(
        (
          item
        ): item is { key: string; video: NonNullable<typeof item.video> } =>
          !!item.video
      );
  }, [feedItems, sourceVideos]);

  // ── Render states ─────────────────────────────────────────────────────────
  if (isInitializing) return <FeedSkeleton />;
  if (videos.length === 0) return <EmptyFeed />;
  if (searchQuery.trim() && searchResults !== null && searchResults.length === 0) {
    return <SearchEmpty query={searchQuery} />;
  }

  return (
    <div
      ref={containerRef}
      className="feed-container w-full"
      style={{ height: "100dvh" }}
    >
      {renderedVideos.map(({ key, video }, index) => (
        <div
          key={key}
          data-feed-item
          data-index={index}
          className="feed-item"
          ref={(el) => {
            if (el) observeElement(el);
          }}
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
