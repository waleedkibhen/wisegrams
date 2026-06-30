"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, User } from "lucide-react";
import { useVideoStore } from "@/hooks/useVideoStore";

const NAV = [
  { id: "home",    href: "/feed",    Icon: Home, label: "Home"    },
  { id: "profile", href: "/profile", Icon: User, label: "Profile" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const setShowUploadModal = useVideoStore((s) => s.setShowUploadModal);

  return (
    <nav
      className="ig-nav fixed bottom-0 inset-x-0 z-50 flex items-center justify-around"
      style={{
        height: "var(--nav-height, 64px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Main navigation"
    >
      {/* Home */}
      <Link
        href="/feed"
        id="nav-home"
        aria-label="Home"
        className="flex flex-col items-center justify-center gap-1 min-w-[56px] group"
      >
        <Home
          size={24}
          className={`transition-all duration-150 group-active:scale-90 ${
            pathname === "/feed" ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"
          }`}
          strokeWidth={pathname === "/feed" ? 2.4 : 1.8}
          fill={pathname === "/feed" ? "white" : "none"}
        />
        <span
          className={`text-[10px] font-medium tracking-wide transition-colors ${
            pathname === "/feed" ? "text-white" : "text-neutral-600"
          }`}
        >
          Home
        </span>
      </Link>

      {/* Upload — centre pill button */}
      <button
        id="nav-create"
        aria-label="Upload video"
        onClick={() => setShowUploadModal(true)}
        className="flex items-center justify-center group"
        style={{ marginBottom: "2px" }}
      >
        <span
          className="flex items-center justify-center w-14 h-10 rounded-2xl transition-all duration-200 group-active:scale-90 group-hover:opacity-90 shadow-lg"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
            boxShadow: "0 4px 18px rgba(124, 58, 237, 0.45)",
          }}
          aria-hidden
        >
          <PlusCircle size={22} className="text-white" strokeWidth={2} />
        </span>
      </button>

      {/* Profile */}
      <Link
        href="/profile"
        id="nav-profile"
        aria-label="Profile"
        className="flex flex-col items-center justify-center gap-1 min-w-[56px] group"
      >
        <User
          size={24}
          className={`transition-all duration-150 group-active:scale-90 ${
            pathname === "/profile" ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"
          }`}
          strokeWidth={pathname === "/profile" ? 2.4 : 1.8}
          fill={pathname === "/profile" ? "white" : "none"}
        />
        <span
          className={`text-[10px] font-medium tracking-wide transition-colors ${
            pathname === "/profile" ? "text-white" : "text-neutral-600"
          }`}
        >
          Profile
        </span>
      </Link>
    </nav>
  );
}
