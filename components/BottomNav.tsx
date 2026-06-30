"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, User } from "lucide-react";
import { useVideoStore } from "@/hooks/useVideoStore";

export default function BottomNav() {
  const pathname = usePathname();
  const setShowUploadModal = useVideoStore((s) => s.setShowUploadModal);
  const isProfile = pathname === "/profile";

  return (
    <nav
      className="w-full flex items-center justify-around shrink-0 border-t border-neutral-900"
      style={{
        height: "64px",
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
        className="flex flex-col items-center justify-center gap-1 min-w-[72px] group"
      >
        <Home
          size={24}
          className={`transition-all duration-150 group-active:scale-90 ${
            !isProfile ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"
          }`}
          strokeWidth={!isProfile ? 2.4 : 1.8}
          fill={!isProfile ? "white" : "none"}
        />
        <span className={`text-[10px] font-medium tracking-wide transition-colors ${!isProfile ? "text-white" : "text-neutral-600"}`}>
          Home
        </span>
      </Link>

      {/* Upload pill */}
      <button
        id="nav-create"
        aria-label="Upload video"
        onClick={() => setShowUploadModal(true)}
        className="flex items-center justify-center group"
      >
        <span
          className="flex items-center justify-center w-14 h-10 rounded-2xl transition-all duration-200 group-active:scale-90 group-hover:opacity-90 shadow-lg"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
            boxShadow: "0 4px 18px rgba(124, 58, 237, 0.4)",
          }}
        >
          <PlusCircle size={22} className="text-white" strokeWidth={2} />
        </span>
      </button>

      {/* Profile */}
      <Link
        href="/profile"
        id="nav-profile"
        aria-label="Profile"
        className="flex flex-col items-center justify-center gap-1 min-w-[72px] group"
      >
        <User
          size={24}
          className={`transition-all duration-150 group-active:scale-90 ${
            isProfile ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"
          }`}
          strokeWidth={isProfile ? 2.4 : 1.8}
          fill={isProfile ? "white" : "none"}
        />
        <span className={`text-[10px] font-medium tracking-wide transition-colors ${isProfile ? "text-white" : "text-neutral-600"}`}>
          Profile
        </span>
      </Link>
    </nav>
  );
}
