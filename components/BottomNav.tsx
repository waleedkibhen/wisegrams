"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, User, Film } from "lucide-react";
import { useVideoStore } from "@/hooks/useVideoStore";

export default function BottomNav() {
  const pathname = usePathname();
  const setShowUploadModal = useVideoStore((s) => s.setShowUploadModal);
  const isProfile = pathname === "/profile";
  const isFeed = pathname === "/feed";

  return (
    <nav
      className="w-full flex items-center justify-around shrink-0 border-t border-[#262626]"
      style={{
        height: "50px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "#000",
      }}
      aria-label="Main navigation"
    >
      {/* Home */}
      <Link
        href="/feed"
        id="nav-home"
        aria-label="Home"
        className="flex flex-col items-center justify-center p-2 group"
      >
        <Home
          size={26}
          className={`transition-all duration-150 group-active:scale-95 ${
            isFeed ? "text-white" : "text-white/60"
          }`}
          strokeWidth={isFeed ? 2.5 : 1.8}
          fill={isFeed ? "white" : "none"}
        />
      </Link>

      {/* Explore/Search (Placeholder for now) */}
      <button
        aria-label="Search"
        disabled
        className="flex flex-col items-center justify-center p-2 opacity-30"
      >
        <Film size={26} strokeWidth={1.8} className="text-white" />
      </button>

      {/* Upload - Instagram style square with plus */}
      <button
        id="nav-create"
        aria-label="Upload video"
        onClick={() => setShowUploadModal(true)}
        className="flex flex-col items-center justify-center p-2 group active:scale-90 transition-transform"
      >
        <PlusSquare size={26} strokeWidth={2} className="text-white" />
      </button>

      {/* Reels (Placeholder for now) */}
      <button
        aria-label="Reels"
        disabled
        className="flex flex-col items-center justify-center p-2 opacity-30"
      >
        <Film size={26} strokeWidth={1.8} className="text-white" />
      </button>

      {/* Profile */}
      <Link
        href="/profile"
        id="nav-profile"
        aria-label="Profile"
        className="flex flex-col items-center justify-center p-2 group"
      >
        <div className={`rounded-full p-[2px] transition-all duration-150 group-active:scale-95 ${isProfile ? "border-[1.5px] border-white" : "border-transparent"}`}>
           <User
            size={22}
            className={`${isProfile ? "text-white" : "text-white/60"}`}
            strokeWidth={isProfile ? 2.5 : 1.8}
            fill={isProfile ? "white" : "none"}
          />
        </div>
      </Link>
    </nav>
  );
}
