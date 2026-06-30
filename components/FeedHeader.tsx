"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

const HEADER_H = 56; // must match feed layout and VideoCard constant

interface FeedHeaderProps {
  onSearch: (query: string) => void;
}

/**
 * FeedHeader — solid black bar at the top of the feed.
 * Sits above (not over) the video area so no content is hidden behind it.
 */
export default function FeedHeader({ onSearch }: FeedHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
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
      className="flex items-center justify-between px-4 gap-3 shrink-0 border-b border-neutral-900"
      style={{
        height: `${HEADER_H}px`,
        background: "#000",
      }}
    >
      {/* App name */}
      <span
        className="text-white font-bold text-[20px] tracking-tight select-none transition-all duration-300 shrink-0"
        style={{
          fontFamily: "var(--font-inter)",
          opacity: searchOpen ? 0 : 1,
          width: searchOpen ? 0 : "auto",
          overflow: "hidden",
        }}
      >
        Wisegrams
      </span>

      {/* Search area */}
      <div
        className="flex items-center gap-2 transition-all duration-300"
        style={{ flex: searchOpen ? "1 1 auto" : "0 0 auto" }}
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
                placeholder="Search by caption or author…"
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
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white active:scale-90 transition-all shrink-0 bg-white/10"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleOpen}
            aria-label="Search videos"
            id="feed-search-btn"
            className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform bg-neutral-900 border border-neutral-800"
          >
            <Search size={17} className="text-white" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
