"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Heart, MessageCircle } from "lucide-react";

const HEADER_H = 56;

interface FeedHeaderProps {
  onSearch: (query: string) => void;
}

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
      className="flex items-center justify-between px-4 shrink-0 border-b border-[#262626]"
      style={{
        height: `${HEADER_H}px`,
        background: "#000",
      }}
    >
      {/* App name - Instagram style text logo */}
      <span
        className="text-white font-bold text-[22px] tracking-tight select-none transition-all duration-300 shrink-0 italic"
        style={{
          fontFamily: "var(--font-inter)",
          opacity: searchOpen ? 0 : 1,
          width: searchOpen ? 0 : "auto",
          overflow: "hidden",
        }}
      >
        Wisegrams
      </span>

      {/* Right side actions */}
      <div
        className="flex items-center transition-all duration-300"
        style={{ flex: searchOpen ? "1 1 auto" : "0 0 auto", gap: searchOpen ? "8px" : "16px" }}
      >
        {searchOpen ? (
          <div className="flex items-center gap-2 w-full search-expand">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A8A8] pointer-events-none"
              />
              <input
                ref={inputRef}
                id="feed-search-input"
                type="search"
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="search-input w-full pl-9 pr-3 py-1.5 text-[14px] bg-[#262626] text-white rounded-lg focus:outline-none"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
            <button
              onClick={handleClose}
              className="text-white text-[14px] font-semibold hover:opacity-70 transition-opacity shrink-0"
              id="search-close-btn"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleOpen}
              aria-label="Search"
              id="feed-search-btn"
              className="active:opacity-50 transition-opacity"
            >
              <Search size={24} className="text-white" strokeWidth={2} />
            </button>
            <button aria-label="Notifications" className="active:opacity-50 transition-opacity">
               <Heart size={24} className="text-white" strokeWidth={2} />
            </button>
            <button aria-label="Messages" className="active:opacity-50 transition-opacity relative">
               <MessageCircle size={24} className="text-white scale-x-[-1]" strokeWidth={2} />
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center">
                 <span className="text-white text-[9px] font-bold">1</span>
               </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
