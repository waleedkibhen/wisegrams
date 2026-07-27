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
import { Play } from "lucide-react";

// Removed infinite loop constants. The feed will now render available videos
// without duplicating them, ensuring maximum load speed and cache efficiency.
// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyFeed({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-6 bg-black">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(131,58,180,0.25) 0%, rgba(253,29,29,0.1) 100%)",
          border: "1px solid rgba(131,58,180,0.3)",
        }}
      >
        <Play size={32} className="text-purple-400 ml-1" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-white font-bold text-xl tracking-tight">No videos yet</h2>
        <p className="text-neutral-500 text-sm leading-relaxed max-w-[240px]">
          Tap <strong className="text-purple-400">+</strong> to add your first Google Drive video.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="px-6 py-2.5 rounded-full text-white text-sm font-semibold transition-opacity active:opacity-70"
        style={{ background: "linear-gradient(135deg, #833ab4 0%, #fd1d1d 100%)" }}
      >
        Add a video
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VideoFeed
// ─────────────────────────────────────────────────────────────────────────────
interface VideoFeedProps {
  onAddVideo: () => void;
}

export default function VideoFeed({ onAddVideo }: VideoFeedProps) {
  const { videos, toggleLike, removeVideo, isInitializing, setShowUploadModal } = useVideoStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedItems = useRef<Set<Element>>(new Set());
  // ── IntersectionObserver — detects which video is on screen ─────────────
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
            if (!isNaN(idx)) {
               setActiveIndex(idx);
            }
          }
        }
      },
      { root: container, threshold: 0.55 }
    );

    // Observe any items already in DOM
    const items = container.querySelectorAll<HTMLElement>("[data-feed-item]");
    items.forEach((el) => observeElement(el));

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      observedItems.current.clear();
    };
  }, [isInitializing, videos.length === 0]);

  // ── Keyboard nav (desktop) ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;
      if (e.key === "ArrowDown" || e.key === "k") {
        const next = container.querySelector<HTMLElement>(`[data-index="${activeIndex + 1}"]`);
        next?.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "ArrowUp" || e.key === "j") {
        const prev = container.querySelector<HTMLElement>(`[data-index="${activeIndex - 1}"]`);
        prev?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);


  // ── Loading state ─────────────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (videos.length === 0) {
    return <EmptyFeed onAdd={() => setShowUploadModal(true)} />;
  }

  return (
    <div ref={containerRef} className="feed-container">
      {videos.map((video, index) => (
        <div
          key={video.id}
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
            onDelete={removeVideo}
          />
        </div>
      ))}
    </div>
  );
}
