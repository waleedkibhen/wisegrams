"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface FeedHeaderProps {
  onSearch: (query: string) => void;
}

/**
 * FeedHeader
 * Floats above the video feed. No gradient overlay — video plays at full brightness.
 * A subtle text-shadow on the title keeps it legible against any background.
 * The search icon toggles a slide-in input for filtering by caption / author.
 */
export default function FeedHeader({ onSearch }: FeedHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (searchOpen) {
      // Slight delay so the animation starts first
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  const handleOpen = useCallback(() => setSearchOpen(true), []);

  const handleClose = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
    onSearch("");
  }, [onSearch]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      onSearch(val);
    },
    [onSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    },
    [handleClose]
  );

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 gap-3"
      style={{
        paddingTop: "max(14px, env(safe-area-inset-top, 14px))",
        paddingBottom: "12px",
        // No gradient — just pointer events passthrough for the background
        pointerEvents: "none",
      }}
    >
      {/* App name — always visible, shrinks when search is open */}
      <span
        className="text-white font-bold text-[22px] tracking-tight select-none shrink-0 transition-all duration-300"
        style={{
          fontFamily: "var(--font-inter)",
          textShadow: "0 1px 12px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.6)",
          pointerEvents: "none",
          opacity: searchOpen ? 0 : 1,
          width: searchOpen ? 0 : "auto",
          overflow: "hidden",
        }}
      >
        Wisegrams
      </span>

      {/* Search area — grows to fill when open */}
      <div
        className="flex items-center gap-2 transition-all duration-300"
        style={{
          flex: searchOpen ? "1 1 auto" : "0 0 auto",
          pointerEvents: "auto",
        }}
      >
        {searchOpen ? (
          <div className="flex items-center gap-2 w-full search-expand">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
              />
              <input
                ref={inputRef}
                id="feed-search-input"
                type="search"
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Search videos..."
                className="search-input w-full pl-9 pr-3 py-2 text-sm"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
            <button
              onClick={handleClose}
              aria-label="Close search"
              id="search-close-btn"
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white active:scale-90 transition-all shrink-0"
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(6px)",
              }}
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleOpen}
            aria-label="Search videos"
            id="feed-search-btn"
            className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{
              background: "rgba(0,0,0,0.25)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <Search size={18} className="text-white" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
