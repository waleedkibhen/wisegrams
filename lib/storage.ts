/**
 * storage.ts
 * LocalStorage helpers for persisting video posts and profile data.
 */

export interface VideoPost {
  id: string;
  driveShareUrl: string;
  streamUrl: string;
  thumbnailUrl: string;
  caption: string;
  author: string;
  likes: number;
  liked: boolean;
  timestamp: number;
}

export interface UserProfile {
  username: string;
  bio: string;
  avatarColor: string; // CSS HSL string used as avatar background
}

const VIDEOS_KEY = "wisegrams_videos";
const PROFILE_KEY = "wisegrams_profile";

// ─── Video Posts ─────────────────────────────────────────────────────────────

export function loadVideos(): VideoPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VIDEOS_KEY);
    return raw ? (JSON.parse(raw) as VideoPost[]) : [];
  } catch {
    return [];
  }
}

export function saveVideos(videos: VideoPost[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
}

// ─── User Profile ─────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  username: "wisegrams_user",
  bio: "Capturing moments, one reel at a time. ✨",
  avatarColor: "hsl(262, 83%, 58%)",
};

export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<UserProfile>) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
