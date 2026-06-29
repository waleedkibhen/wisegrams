"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, Heart, User } from "lucide-react";
import { useVideoStore } from "@/hooks/useVideoStore";

const NAV = [
  { id: "home",    href: "/feed",    Icon: Home,       label: "Home"   },
  { id: "search",  href: "/feed",    Icon: Search,      label: "Search" },
  { id: "create",  href: null,       Icon: PlusSquare,  label: "New"    },
  { id: "liked",   href: "/feed",    Icon: Heart,       label: "Liked"  },
  { id: "profile", href: "/profile", Icon: User,        label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const setShowUploadModal = useVideoStore((s) => s.setShowUploadModal);

  return (
    <nav
      className="ig-nav fixed bottom-0 inset-x-0 z-50 flex items-center justify-around"
      style={{ height: "52px", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      {NAV.map(({ id, href, Icon, label }) => {
        const isCreate = id === "create";
        const active = !isCreate && href === pathname;

        if (isCreate) {
          return (
            <button
              key={id}
              id="nav-create"
              aria-label="Create new post"
              onClick={() => setShowUploadModal(true)}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] group"
            >
              <Icon
                size={26}
                className="text-white group-active:scale-90 transition-transform duration-100"
                strokeWidth={1.6}
              />
            </button>
          );
        }

        return (
          <Link
            key={id}
            href={href!}
            id={`nav-${id}`}
            aria-label={label}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] group"
          >
            <Icon
              size={26}
              className={`transition-all duration-150 group-active:scale-90 ${
                active ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"
              }`}
              strokeWidth={active ? 2.2 : 1.6}
              fill={active && (id === "home" || id === "profile") ? "white" : "none"}
            />
          </Link>
        );
      })}
    </nav>
  );
}
