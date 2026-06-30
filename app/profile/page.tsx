"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Menu,
  ChevronDown,
  Grid3X3,
  Film,
  UserSquare2,
  Lock,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useVideoStore } from "@/hooks/useVideoStore";

const AVATAR_COLORS = [
  "hsl(262, 83%, 58%)",
  "hsl(330, 81%, 60%)",
  "hsl(200, 82%, 50%)",
  "hsl(160, 70%, 45%)",
  "hsl(38, 90%, 55%)",
];

export default function ProfilePage() {
  const { videos, profile, updateProfile, setShowUploadModal } = useVideoStore();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const [showColorPicker, setShowColorPicker] = useState(false);

  const allVideos = videos;

  return (
    <div
      className="flex flex-col bg-black text-white w-full h-full"
    >
      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center justify-between px-4 border-b border-[#262626]"
        style={{ height: "44px", background: "#000" }}
      >
        <div className="flex items-center gap-1.5 active:opacity-70 transition-opacity">
          <Lock size={12} className="text-white" />
          <span className="text-white font-bold text-[16px] tracking-tight">{profile.username}</span>
          <ChevronDown size={16} className="text-white mt-0.5" />
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={() => setShowUploadModal(true)}
            aria-label="Add video"
            id="header-add-btn"
            className="active:opacity-50 transition-opacity"
          >
            <Plus size={24} className="text-white" strokeWidth={2} />
          </button>
          <button aria-label="Menu" id="header-menu-btn" className="active:opacity-50 transition-opacity">
            <Menu size={24} className="text-white" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ── Profile Header ─────────────────────────────────────────────────── */}
        <div className="px-4 pt-3 pb-3">

          {/* Avatar + stats */}
          <div className="flex items-center justify-between mb-3">

            {/* Avatar with IG Story Ring */}
            <div className="relative shrink-0 mr-6">
              <div className="w-[86px] h-[86px] rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600">
                <button
                  onClick={() => setShowColorPicker((v) => !v)}
                  aria-label="Change avatar colour"
                  id="avatar-btn"
                  className="w-full h-full rounded-full border-[3px] border-black flex items-center justify-center text-white text-3xl font-bold active:scale-95 transition-transform bg-neutral-800"
                  style={{ background: profile.avatarColor }}
                >
                  {profile.username[0]?.toUpperCase() ?? "W"}
                </button>
              </div>

              {showColorPicker && (
                <div className="absolute top-full mt-2 left-0 bg-[#262626] border border-[#363636] rounded-xl p-3 flex gap-2 z-20 shadow-2xl">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95"
                      style={{
                        background: color,
                        borderColor: profile.avatarColor === color ? "white" : "transparent",
                      }}
                      onClick={() => { updateProfile({ avatarColor: color }); setShowColorPicker(false); }}
                      aria-label="Select colour"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-1 items-center justify-between pr-2">
              {[
                { label: "posts",     value: hydrated ? allVideos.length : "—" },
                { label: "followers", value: "10" },
                { label: "following", value: "14" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="text-white font-bold text-[16px]">{value}</span>
                  <span className="text-white text-[13px]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Name + bio */}
          <div className="mb-4 flex flex-col gap-0.5">
            <p className="text-white font-semibold text-[14px]">{profile.username}</p>
            <p className="text-white text-[14px] leading-tight whitespace-pre-wrap">{profile.bio}</p>
          </div>

          {/* Action buttons (Instagram style) */}
          <div className="flex gap-2">
            <button
              className="flex-1 py-1.5 text-[14px] font-semibold rounded-lg bg-[#363636] text-white active:bg-[#262626] transition-colors"
              id="edit-profile-btn"
            >
              Edit profile
            </button>
            <button
              className="flex-1 py-1.5 text-[14px] font-semibold rounded-lg bg-[#363636] text-white active:bg-[#262626] transition-colors"
              id="share-profile-btn"
            >
              Share profile
            </button>
            <button
              className="py-1.5 px-3 rounded-lg bg-[#363636] text-white active:bg-[#262626] transition-colors flex items-center justify-center"
              id="discover-people-btn"
            >
               <UserSquare2 size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* ── Tabs (Grid / Reels / Tagged) ─────────────────────────────────── */}
        <div className="flex border-t border-[#262626]">
          <div className="flex-1 py-2.5 flex justify-center border-b-[1.5px] border-white">
            <Grid3X3 size={24} className="text-white" strokeWidth={1.5} />
          </div>
          <div className="flex-1 py-2.5 flex justify-center opacity-40">
            <Film size={24} className="text-white" strokeWidth={1.5} />
          </div>
          <div className="flex-1 py-2.5 flex justify-center opacity-40">
            <UserSquare2 size={24} className="text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* ── Video grid ───────────────────────────────────────────────────── */}
        {!hydrated ? (
          <div className="grid grid-cols-3 gap-[1px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-[#262626] animate-pulse" />
            ))}
          </div>
        ) : allVideos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center px-8">
            <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center bg-transparent">
              <Film size={32} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-[20px]">Share Photos and Videos</p>
              <p className="text-white text-[14px] mt-2 leading-relaxed">
                When you share photos and videos, they will appear on your profile.
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-[#0095F6] font-semibold text-[14px] mt-2 active:opacity-70 transition-opacity"
              id="empty-grid-upload-btn"
            >
              Share your first photo or video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[1px]">
            {allVideos.map((video) => (
              <div
                key={video.id}
                className="relative aspect-square group bg-[#262626] overflow-hidden"
              >
                {video.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnailUrl}
                    alt={video.caption}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film size={24} className="text-white/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
