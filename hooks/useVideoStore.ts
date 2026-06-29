/**
 * useVideoStore.ts
 * Zustand store — video list, profile, and global UI state.
 * Persisted to localStorage via the persist middleware.
 *
 * Version history:
 *  v1 → initial (uc?export=download URLs)
 *  v2 → switched to /preview iframe URL (CORS fix)
 *  v3 → added autoplay=1 to preview URL
 *  v4 → switched to /api/proxy URL (enables native <video> preloading)
 */

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { VideoPost, UserProfile } from "@/lib/storage";
import { getDriveProxyUrl, getDriveThumbnailUrl } from "@/lib/driveUtils";

// ─── Store Types ───────────────────────────────────────────────────────────────

interface VideoStore {
  videos: VideoPost[];
  profile: UserProfile;

  // Global UI state (not persisted)
  showUploadModal: boolean;
  setShowUploadModal: (v: boolean) => void;

  // Actions
  addVideo: (shareUrl: string, caption: string) => void;
  toggleLike: (id: string) => void;
  removeVideo: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      videos: [],
      profile: {
        username: "wisegrams_user",
        bio: "Capturing moments, one reel at a time. ✨",
        avatarColor: "hsl(262, 83%, 58%)",
      },

      // Non-persisted UI flag
      showUploadModal: false,
      setShowUploadModal: (v) => set({ showUploadModal: v }),

      addVideo: (shareUrl, caption) => {
        const proxyUrl = getDriveProxyUrl(shareUrl);
        const thumbnailUrl = getDriveThumbnailUrl(shareUrl);
        if (!proxyUrl) return;

        const newVideo: VideoPost = {
          id: `video-${Date.now()}`,
          driveShareUrl: shareUrl,
          streamUrl: proxyUrl,
          thumbnailUrl: thumbnailUrl ?? "",
          caption,
          author: get().profile.username,
          likes: 0,
          liked: false,
          timestamp: Date.now(),
        };

        set((state) => ({ videos: [newVideo, ...state.videos] }));
      },

      toggleLike: (id) => {
        set((state) => ({
          videos: state.videos.map((v) =>
            v.id === id
              ? { ...v, liked: !v.liked, likes: v.liked ? v.likes - 1 : v.likes + 1 }
              : v
          ),
        }));
      },

      removeVideo: (id) => {
        set((state) => ({ videos: state.videos.filter((v) => v.id !== id) }));
      },

      updateProfile: (updates) => {
        set((state) => ({ profile: { ...state.profile, ...updates } }));
      },
    }),
    {
      name: "wisegrams-store",
      version: 4,
      storage: createJSONStorage(() => localStorage),
      // Only persist data — not ephemeral UI state like showUploadModal
      partialize: (state) => ({
        videos: state.videos,
        profile: state.profile,
      }),
      // Migrate all stored videos to use the new proxy URL format
      migrate: (persistedState: unknown, fromVersion: number) => {
        const state = persistedState as { videos?: VideoPost[]; profile?: UserProfile };
        if (fromVersion < 4 && Array.isArray(state.videos)) {
          state.videos = state.videos.map((v) => ({
            ...v,
            streamUrl: getDriveProxyUrl(v.driveShareUrl) ?? v.streamUrl,
          }));
        }
        return state;
      },
    }
  )
);
