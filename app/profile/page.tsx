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

  // ── Hydration guard ───────────────────────────────────────────────────────────
  // Prevents showing a flash of empty content before Zustand rehydrates from
  // localStorage on the client.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const [editingBio, setEditingBio] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [localBio, setLocalBio] = useState("");
  const [localUsername, setLocalUsername] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Keep editing state in sync after hydration
  useEffect(() => {
    setLocalBio(profile.bio);
    setLocalUsername(profile.username);
  }, [profile.bio, profile.username]);

  // ── BUG FIX: show ALL videos, not just those matching profile.username.
  // This is a single-user app — every video belongs to the profile owner.
  // The author filter was causing newly-uploaded videos to disappear when
  // the stored username didn't exactly match what was written into the video.
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
    <div className="min-h-dvh bg-black text-white overflow-y-auto pb-20">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-black flex items-center justify-between px-4 py-3 border-b border-neutral-900">

        {/* Username (tap to edit) */}
        {editingUsername ? (
          <div className="flex items-center gap-2">
            <input
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
              className="text-white font-bold text-[17px] bg-transparent border-b border-white/50 outline-none w-40"
              onKeyDown={(e) => e.key === "Enter" && saveUsername()}
              autoFocus
              id="username-input"
            />
            <button onClick={saveUsername} className="text-white" id="save-username-btn">
              <Check size={18} />
            </button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1 active:opacity-70"
            onClick={() => setEditingUsername(true)}
            id="header-username-btn"
          >
            <span className="text-white font-bold text-[17px]">
              {profile.username}
            </span>
          </button>
        )}

        {/* Right icons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowUploadModal(true)}
            aria-label="Add video"
            id="header-add-btn"
          >
            <Plus size={24} className="text-white" strokeWidth={1.8} />
          </button>
          <button aria-label="Settings" id="header-settings-btn">
            <Settings size={22} className="text-white" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* ── Profile card ────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3">

        {/* Avatar + stats row */}
        <div className="flex items-center gap-6 mb-4">

          {/* Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker((v) => !v)}
              aria-label="Change avatar colour"
              id="avatar-btn"
              className="w-[82px] h-[82px] rounded-full flex items-center justify-center text-white text-3xl font-bold ring-[3px] ring-neutral-800 active:scale-95 transition-transform"
              style={{ background: profile.avatarColor }}
            >
              {profile.username[0]?.toUpperCase() ?? "W"}
            </button>

            {/* Colour picker */}
            {showColorPicker && (
              <div className="absolute top-full mt-2 left-0 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex gap-2 z-20 fade-in shadow-2xl">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 active:scale-95"
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
              { label: "Posts",     value: hydrated ? allVideos.length : 0 },
              { label: "Followers", value: 0 },
              { label: "Following", value: 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-white font-bold text-[18px] leading-tight">{value}</span>
                <span className="text-neutral-400 text-[12px] mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Name + bio */}
        <div className="mb-3">
          <p className="text-white font-semibold text-[13px]">{profile.username}</p>

          {editingBio ? (
            <div className="mt-1.5 flex flex-col gap-2">
              <textarea
                value={localBio}
                onChange={(e) => setLocalBio(e.target.value)}
                rows={3}
                maxLength={150}
                className="w-full text-[13px] px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl resize-none leading-snug"
                autoFocus
                id="bio-textarea"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveBio}
                  className="flex-1 py-1.5 text-[13px] font-semibold rounded-lg bg-white text-black"
                  id="save-bio-btn"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingBio(false)}
                  className="flex-1 py-1.5 text-[13px] font-semibold rounded-lg border border-neutral-700 text-white"
                  id="cancel-bio-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              className="text-neutral-400 text-[13px] leading-snug mt-1 cursor-pointer hover:text-white/80 transition-colors"
              onClick={() => setEditingBio(true)}
            >
              {profile.bio}
            </p>
          )}

          {totalLikes > 0 && (
            <p className="text-neutral-500 text-[12px] mt-1.5">❤ {totalLikes} likes</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setEditingBio(true)}
            className="flex-1 py-1.5 text-[13px] font-semibold rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
            id="edit-profile-btn"
          >
            <Edit3 size={13} className="inline mr-1.5 mb-0.5" />
            Edit profile
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex-1 py-1.5 text-[13px] font-semibold rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
            id="add-video-profile-btn"
          >
            <Plus size={14} className="inline mr-1 mb-0.5" />
            Add video
          </button>
        </div>
      </div>

      {/* ── Grid header ─────────────────────────────────────────────────────── */}
      <div className="border-t border-neutral-800 flex items-center justify-center py-2.5">
        <Grid3X3 size={22} className="text-white" strokeWidth={2} />
      </div>

      {/* ── Video grid ──────────────────────────────────────────────────────── */}
      {!hydrated ? (
        // Skeleton shimmer while rehydrating
        <div className="grid grid-cols-3 gap-[1px]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[9/16] bg-neutral-900 animate-pulse" />
          ))}
        </div>
      ) : allVideos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center px-8">
          <div className="w-20 h-20 rounded-full border-2 border-neutral-800 flex items-center justify-center">
            <Clapperboard size={32} className="text-neutral-600" />
          </div>
          <div>
            <p className="text-white font-bold text-base">Share reels</p>
            <p className="text-neutral-500 text-sm mt-1 max-w-[200px] leading-snug mx-auto">
              Videos you add will appear on your profile.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2.5 rounded-full border border-neutral-700 text-white text-sm font-semibold hover:bg-neutral-900 transition-colors"
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
              {/* Thumbnail or fallback */}
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

              {/* Hover/tap overlay with delete */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end justify-start p-2">
                <button
                  onClick={() => removeVideo(video.id)}
                  className="w-8 h-8 rounded-full bg-red-600/90 flex items-center justify-center hover:bg-red-500 transition-colors"
                  aria-label="Delete video"
                  id={`delete-${video.id}`}
                >
                  <Trash2 size={13} className="text-white" />
                </button>
                {video.caption && (
                  <p className="text-white text-[10px] text-center line-clamp-3 leading-tight mt-auto w-full">
                    {video.caption}
                  </p>
                )}
              </div>

              {/* Like count badge */}
              <div className="absolute bottom-1 left-1.5 pointer-events-none">
                <span className="text-white text-[11px] font-semibold drop-shadow">
                  ❤ {video.likes}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
