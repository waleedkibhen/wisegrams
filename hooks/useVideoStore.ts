/**
 * useVideoStore.ts
 * Zustand store — video list, profile, and global UI state.
 * Profile is persisted locally. Videos are fetched from the global DB API.
 */

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { VideoPost, UserProfile } from "@/lib/storage";
import { getDriveApiUrl, getDriveThumbnailUrl } from "@/lib/driveUtils";

// ─── Store Types ───────────────────────────────────────────────────────────────

interface VideoStore {
  videos: VideoPost[];
  profile: UserProfile;
  isInitializing: boolean;

  // Global UI state
  showUploadModal: boolean;
  setShowUploadModal: (v: boolean) => void;

  // Actions
  initVideos: () => Promise<void>;
  addVideo: (shareUrl: string, caption: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  removeVideo: (id: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      videos: [],
      isInitializing: true,
      profile: {
        username: "wisegrams_user",
        bio: "Capturing moments, one reel at a time. ✨",
        avatarColor: "hsl(262, 83%, 58%)",
      },

      showUploadModal: false,
      setShowUploadModal: (v) => set({ showUploadModal: v }),

      initVideos: async () => {
        try {
          const res = await fetch("/api/videos");
          if (res.ok) {
            const data = await res.json();
            // Dynamically upgrade any old proxy URLs to the new native API URL
            // on the fly so we don't have to rewrite the database.
            const upgradedVideos = data.videos.map((v: VideoPost) => {
              if (v.streamUrl.includes("/api/proxy") && v.driveShareUrl) {
                return { ...v, streamUrl: getDriveApiUrl(v.driveShareUrl) ?? v.streamUrl };
              }
              return v;
            });
            set({ videos: upgradedVideos, isInitializing: false });
          }
        } catch (e) {
          console.error("Failed to init videos", e);
          set({ isInitializing: false });
        }
      },

      addVideo: async (shareUrl, caption) => {
        const streamUrl = getDriveApiUrl(shareUrl);
        const thumbnailUrl = getDriveThumbnailUrl(shareUrl);
        if (!streamUrl) return;

        const newVideo: VideoPost = {
          id: `video-${Date.now()}`,
          driveShareUrl: shareUrl,
          streamUrl,
          thumbnailUrl: thumbnailUrl ?? "",
          caption,
          author: get().profile.username,
          likes: 0,
          liked: false,
          timestamp: Date.now(),
        };

        // Optimistic UI update
        set((state) => ({ videos: [newVideo, ...state.videos] }));

        // Sync to DB
        try {
          await fetch("/api/videos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ video: newVideo }),
          });
        } catch (e) {
          console.error("Failed to save video to DB", e);
        }
      },

      toggleLike: async (id) => {
        // Optimistic UI update
        set((state) => ({
          videos: state.videos.map((v) =>
            v.id === id
              ? { ...v, liked: !v.liked, likes: v.liked ? Math.max(0, v.likes - 1) : v.likes + 1 }
              : v
          ),
        }));

        // Sync to DB
        try {
          await fetch("/api/videos/like", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
        } catch (e) {
          console.error("Failed to toggle like in DB", e);
        }
      },

      removeVideo: async (id) => {
        // Optimistic UI update
        set((state) => ({ videos: state.videos.filter((v) => v.id !== id) }));

        // Sync to DB
        try {
          await fetch(`/api/videos?id=${id}`, {
            method: "DELETE",
          });
        } catch (e) {
          console.error("Failed to remove video from DB", e);
        }
      },

      updateProfile: (updates) => {
        set((state) => ({ profile: { ...state.profile, ...updates } }));
      },
    }),
    {
      name: "wisegrams-store",
      version: 5,
      storage: createJSONStorage(() => localStorage),
      // ONLY persist the profile locally. Videos are now global DB state!
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);
