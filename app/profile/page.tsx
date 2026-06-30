"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  Settings,
  Grid3X3,
  Clapperboard,
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
  const { videos, profile, updateProfile, removeVideo, setShowUploadModal } =
    useVideoStore();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const [editingBio, setEditingBio] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [localBio, setLocalBio] = useState("");
  const [localUsername, setLocalUsername] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    setLocalBio(profile.bio);
    setLocalUsername(profile.username);
  }, [profile.bio, profile.username]);

  const allVideos = videos;
  const totalLikes = allVideos.reduce((s, v) => s + v.likes, 0);

  const saveBio = () => {
    updateProfile({ bio: localBio.trim() || profile.bio });
    setEditingBio(false);
  };

  const saveUsername = () => {
    const trimmed = localUsername.trim();
    if (trimmed) updateProfile({ username: trimmed });
    setEditingUsername(false);
  };

  return (
    <div
      className="flex flex-col bg-black text-white"
      style={{ height: "100dvh" }}
    >
      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center justify-between px-5 border-b border-neutral-900"
        style={{ height: "56px", background: "#000" }}
      >
        {editingUsername ? (
          <div className="flex items-center gap-3">
            <input
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
              className="text-white font-bold text-[17px] bg-transparent border-b border-white/40 outline-none w-44 pb-0.5"
              onKeyDown={(e) => e.key === "Enter" && saveUsername()}
              autoFocus
              id="username-input"
            />
            <button onClick={saveUsername} className="text-purple-400 active:scale-90 transition-transform" id="save-username-btn">
              <Check size={20} />
            </button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1.5 active:opacity-70 transition-opacity"
            onClick={() => setEditingUsername(true)}
            id="header-username-btn"
          >
            <span className="text-white font-bold text-[18px]">{profile.username}</span>
          </button>
        )}

        <div className="flex items-center gap-5">
          <button
            onClick={() => setShowUploadModal(true)}
            aria-label="Add video"
            id="header-add-btn"
            className="active:scale-90 transition-transform"
          >
            <Plus size={26} className="text-white" strokeWidth={1.8} />
          </button>
          <button aria-label="Settings" id="header-settings-btn" className="active:scale-90 transition-transform">
            <Settings size={22} className="text-white" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ── Profile card ─────────────────────────────────────────────────── */}
        <div className="px-5 pt-6 pb-5">

          {/* Avatar + stats */}
          <div className="flex items-center gap-8 mb-6">

            {/* Avatar */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowColorPicker((v) => !v)}
                aria-label="Change avatar colour"
                id="avatar-btn"
                className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-white text-4xl font-bold ring-[3px] ring-neutral-800 active:scale-95 transition-transform shadow-lg"
                style={{ background: profile.avatarColor }}
              >
                {profile.username[0]?.toUpperCase() ?? "W"}
              </button>

              {showColorPicker && (
                <div className="absolute top-full mt-3 left-0 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex gap-2.5 z-20 fade-in shadow-2xl">
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
            <div className="flex flex-1 items-center justify-around">
              {[
                { label: "Posts",     value: hydrated ? allVideos.length : "—" },
                { label: "Followers", value: 0 },
                { label: "Following", value: 0 },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <span className="text-white font-bold text-[22px] leading-tight">{value}</span>
                  <span className="text-neutral-500 text-[13px]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Name + bio */}
          <div className="mb-5">
            <p className="text-white font-semibold text-[15px]">{profile.username}</p>

            {editingBio ? (
              <div className="mt-3 flex flex-col gap-3">
                <textarea
                  value={localBio}
                  onChange={(e) => setLocalBio(e.target.value)}
                  rows={3}
                  maxLength={150}
                  className="w-full text-[14px] px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl resize-none leading-relaxed"
                  autoFocus
                  id="bio-textarea"
                />
                <div className="flex gap-2.5">
                  <button
                    onClick={saveBio}
                    className="flex-1 py-2.5 text-[14px] font-semibold rounded-xl bg-white text-black hover:bg-neutral-100 transition-colors"
                    id="save-bio-btn"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingBio(false)}
                    className="flex-1 py-2.5 text-[14px] font-semibold rounded-xl border border-neutral-700 text-white hover:bg-neutral-900 transition-colors"
                    id="cancel-bio-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p
                className="text-neutral-400 text-[14px] leading-relaxed mt-1.5 cursor-pointer hover:text-white/80 transition-colors"
                onClick={() => setEditingBio(true)}
              >
                {profile.bio}
              </p>
            )}

            {totalLikes > 0 && (
              <p className="text-neutral-600 text-[13px] mt-2">❤ {totalLikes} likes</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setEditingBio(true)}
              className="flex-1 py-2.5 text-[14px] font-semibold rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors border border-neutral-800"
              id="edit-profile-btn"
            >
              <Edit3 size={14} className="inline mr-2 mb-0.5" />
              Edit profile
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex-1 py-2.5 text-[14px] font-semibold rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors border border-neutral-800"
              id="add-video-profile-btn"
            >
              <Plus size={15} className="inline mr-1.5 mb-0.5" />
              Add video
            </button>
          </div>
        </div>

        {/* ── Grid header ──────────────────────────────────────────────────── */}
        <div className="border-t border-neutral-900 flex items-center justify-center py-3">
          <Grid3X3 size={22} className="text-white" strokeWidth={2} />
        </div>

        {/* ── Video grid ───────────────────────────────────────────────────── */}
        {!hydrated ? (
          <div className="grid grid-cols-3 gap-[1px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[9/16] bg-neutral-900 animate-pulse" />
            ))}
          </div>
        ) : allVideos.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-24 text-center px-8">
            <div className="w-20 h-20 rounded-2xl border border-neutral-800 flex items-center justify-center bg-neutral-950">
              <Clapperboard size={32} className="text-neutral-600" />
            </div>
            <div>
              <p className="text-white font-bold text-[17px]">Share reels</p>
              <p className="text-neutral-500 text-[14px] mt-1.5 max-w-[220px] leading-relaxed mx-auto">
                Videos you add will appear on your profile.
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-7 py-3 rounded-full border border-neutral-700 text-white text-[14px] font-semibold hover:bg-neutral-900 transition-colors"
              id="empty-grid-upload-btn"
            >
              Share your first reel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[1px]">
            {allVideos.map((video) => (
              <div
                key={video.id}
                className="relative aspect-[9/16] group bg-neutral-900 overflow-hidden"
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
                    <Clapperboard size={28} className="text-neutral-700" />
                  </div>
                )}

                {/* Hover/tap overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end justify-start p-2.5">
                  <button
                    onClick={() => removeVideo(video.id)}
                    className="w-8 h-8 rounded-full bg-red-600/90 flex items-center justify-center hover:bg-red-500 transition-colors"
                    aria-label="Delete video"
                    id={`delete-${video.id}`}
                  >
                    <Trash2 size={14} className="text-white" />
                  </button>
                  {video.caption && (
                    <p className="text-white text-[11px] text-center line-clamp-3 leading-tight mt-auto w-full">
                      {video.caption}
                    </p>
                  )}
                </div>

                {/* Like count */}
                <div className="absolute bottom-1.5 left-2 pointer-events-none">
                  <span className="text-white text-[11px] font-semibold drop-shadow">
                    ❤ {video.likes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom padding so last row isn't flush against nav */}
        <div style={{ height: "16px" }} />
      </div>

      {/* Nav sits at the bottom of the flex column */}
      <BottomNav />
    </div>
  );
}
