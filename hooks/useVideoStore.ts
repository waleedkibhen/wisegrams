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

// getDriveApiUrl returns:
//   - `https://www.googleapis.com/drive/v3/files/ID?alt=media&key=KEY`  when NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY is set
//     → browser streams DIRECTLY from Google (no proxy, no rate limiting, perfect Range support)
//   - `/api/proxy?id=ID`  when the key is not set
//     → falls back to server-side proxy with improved interstitial handling
//
// Set NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY in .env.local or your Netlify env vars
// to permanently fix the "video 2 stuck / video 3 blank" bug.

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
  addVideo: (shareUrl: string, caption: string, originalPlatform?: VideoPost["originalPlatform"], originalUrl?: string) => Promise<void>;
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
            // Always upgrade streamUrls to the best available format on load.
            // If API key is set  → googleapis.com URL (browser-direct, no proxy).
            // If no key         → /api/proxy URL (improved server proxy).
            // This means adding the API key later instantly improves all videos.
            const upgradedVideos = data.videos.map((v: VideoPost) => {
              if (v.driveShareUrl) {
                const upgraded = getDriveApiUrl(v.driveShareUrl);
                if (upgraded && upgraded !== v.streamUrl) {
                  return { ...v, streamUrl: upgraded };
                }
              }
              return v;
            });

            // Fisher-Yates Shuffle: Randomize the video feed so the user
            // sees a unique, non-repeating sequence every time they open the app.
            for (let i = upgradedVideos.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [upgradedVideos[i], upgradedVideos[j]] = [upgradedVideos[j], upgradedVideos[i]];
            }

            set({ videos: upgradedVideos, isInitializing: false });
          }
        } catch (e) {
          console.error("Failed to init videos", e);
          set({ isInitializing: false });
        }
      },

      addVideo: async (shareUrl, caption, originalPlatform, originalUrl) => {
        // getDriveApiUrl: uses googleapis.com if API key is set, else /api/proxy
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
          originalPlatform,
          originalUrl,
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
