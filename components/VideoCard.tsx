"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Play,
  Pause,
  VolumeX,
  Volume2,
  Music,
} from "lucide-react";
import type { VideoPost } from "@/lib/storage";

const NAV_H = 50;
const CONTENT_BOTTOM = NAV_H + 16;

// iOS Safari hard limit on concurrent media connections is 4.
// Keeping only 1 lookahead means max 2 connections at any time:
// the active video and the next one. This prevents the "stuck on
// first frame after returning to the app" bug entirely.
const LOOKAHEAD = 1;

interface VideoCardProps {
  video: VideoPost;
  index: number;
  activeIndex: number;
  onLike: (id: string) => void;
}

export default function VideoCard({
  video,
  index,
  activeIndex,
  onLike,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Track which URL is currently loaded to avoid the absolute-vs-relative URL
  // comparison bug: el.src is always absolute (https://host/api/proxy?id=x)
  // but video.streamUrl is relative (/api/proxy?id=x). They never match via
  // string comparison, causing el.load() to fire on every effect run.
  const loadedSrcRef = useRef<string>("");
  const isMountedRef = useRef(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [playIconState, setPlayIconState] = useState<"play" | "pause" | null>(null);
  const [showMuteToast, setShowMuteToast] = useState(false);

  const isActive = index === activeIndex;
  // Only keep this card's media pipeline alive if it's active or immediately next
  const shouldHaveSrc = isActive || index === activeIndex + LOOKAHEAD;

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Core media management ────────────────────────────────────────────────
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (shouldHaveSrc) {
      // Bypass the proxy to avoid Vercel rate limits and static generation bugs.
      // Fetch directly from Google Drive.
      let directUrl = video.streamUrl;
      if (directUrl.includes("/api/proxy?id=")) {
        const fileId = directUrl.split("id=")[1];
        directUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
      }

      // Only set src + load() when it's actually a different video.
      if (loadedSrcRef.current !== directUrl) {
        loadedSrcRef.current = directUrl;
        el.src = directUrl;
        el.load();
      }

      if (isActive) {
        el.preload = "auto";
        el.currentTime = 0;
        if (isMountedRef.current) {
          setIsLoaded(false);
          setHasError(false);
          setProgress(0);
        }
        el.play().catch(() => {
          // Autoplay blocked — this is fine, user can tap to play
        });
      } else {
        el.preload = "metadata";
        el.pause();
      }
    } else {
      // ── Release media pipeline ────────────────────────────────────────────────
      // Only release if there's actually something loaded. Setting src="" and
      // calling load() flushes the hardware decoder slot on iOS Safari.
      if (loadedSrcRef.current !== "") {
        loadedSrcRef.current = "";
        el.pause();
        el.src = "";
        el.load();
      }
    }
  }, [isActive, shouldHaveSrc, video.streamUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recover playback when app returns from background ────────────────────
  useEffect(() => {
    if (!isActive) return;

    const handleVisibility = () => {
      const el = videoRef.current;
      if (!el || !isMountedRef.current) return;

      if (!document.hidden && el.paused) {
        // Re-attach src if it was cleared (can happen on some mobile browsers)
        if (!el.src || el.src === window.location.href) {
          let directUrl = video.streamUrl;
          if (directUrl.includes("/api/proxy?id=")) {
            const fileId = directUrl.split("id=")[1];
            directUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
          }
          el.src = directUrl;
          el.load();
        }
        el.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isActive, video.streamUrl]);

  // ── Mute sync ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = videoRef.current;
    if (el) el.muted = isMuted;
  }, [isMuted]);

  // ── Tap handler (single = play/pause, double = like) ─────────────────────
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);

  const handleTap = useCallback(() => {
    if (!isActive) return;
    const now = Date.now();

    if (now - lastTap.current < 280) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = null;
      lastTap.current = 0;
      if (!video.liked) onLike(video.id);
      setShowHeart(true);
      setTimeout(() => { if (isMountedRef.current) setShowHeart(false); }, 900);
    } else {
      lastTap.current = now;
      tapTimer.current = setTimeout(() => {
        tapTimer.current = null;
        const el = videoRef.current;
        if (!el) return;
        if (el.paused) {
          el.play().catch(() => {});
          setPlayIconState("play");
        } else {
          el.pause();
          setPlayIconState("pause");
        }
        setTimeout(() => { if (isMountedRef.current) setPlayIconState(null); }, 600);
      }, 220);
    }
  }, [isActive, onLike, video]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(video.id);
  }, [onLike, video.id]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.share({ url: video.driveShareUrl, title: video.caption });
    } catch {
      try { await navigator.clipboard.writeText(video.driveShareUrl); } catch { /* ignore */ }
    }
  }, [video]);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(m => {
      setShowMuteToast(true);
      setTimeout(() => { if (isMountedRef.current) setShowMuteToast(false); }, 1400);
      return !m;
    });
  }, []);

  const onCanPlay = useCallback(() => { if (isMountedRef.current) setIsLoaded(true); }, []);
  const onPlay = useCallback(() => { if (isMountedRef.current) setIsPlaying(true); }, []);
  const onPause = useCallback(() => { if (isMountedRef.current) setIsPlaying(false); }, []);
  const onError = useCallback(() => { if (isMountedRef.current) setHasError(true); }, []);
  const onTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    if (el.duration && isMountedRef.current) setProgress(el.currentTime / el.duration);
  }, []);

  const initials = (video.author ?? "W")[0].toUpperCase();

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black select-none"
      onClick={handleTap}
    >
      {/* ── The single video element — always in DOM, src is managed imperatively ── */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        loop
        muted
        playsInline
        onCanPlay={onCanPlay}
        onPlay={onPlay}
        onPause={onPause}
        onTimeUpdate={onTimeUpdate}
        onError={onError}
      />

      {/* Loading spinner */}
      {isActive && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-10 h-10 rounded-full border-[3px] border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* Error */}
      {isActive && hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none px-8">
          <div className="bg-black/80 p-5 rounded-2xl text-center">
            <p className="text-white text-sm leading-relaxed">
              Could not load video. Make sure Drive sharing is set to&nbsp;
              <strong>"Anyone with the link"</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Play/pause flash */}
      {playIconState && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="play-flash w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            {playIconState === "play"
              ? <Play size={30} className="text-white fill-white ml-1" />
              : <Pause size={30} className="text-white fill-white" />}
          </div>
        </div>
      )}

      {/* Double-tap heart */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <Heart className="heart-burst" size={96} fill="#FF3040" color="#FF3040" strokeWidth={0} />
        </div>
      )}

      {/* Mute toast */}
      {showMuteToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 fade-in">
          <div className="bg-black/70 rounded-full px-5 py-2.5 flex items-center gap-2.5">
            {isMuted
              ? <VolumeX size={17} className="text-white" />
              : <Volume2 size={17} className="text-white" />}
            <span className="text-white text-sm font-medium">
              {isMuted ? "Muted" : "Sound on"}
            </span>
          </div>
        </div>
      )}

      {/* ── Right sidebar ─────────────────────────────────────────────────── */}
      <div
        className="absolute right-3 flex flex-col items-center gap-6 z-20"
        style={{ bottom: `${CONTENT_BOTTOM}px` }}
      >
        {/* Like */}
        <button className="flex flex-col items-center gap-1" onClick={handleLike}>
          <Heart
            size={30}
            color={video.liked ? "#FF3040" : "white"}
            fill={video.liked ? "#FF3040" : "none"}
            strokeWidth={2}
            className="drop-shadow-lg"
          />
          <span className="text-white text-[12px] font-semibold drop-shadow">{video.likes}</span>
        </button>

        {/* Comment (visual only) */}
        <button className="flex flex-col items-center gap-1" onClick={e => e.stopPropagation()}>
          <MessageCircle size={30} color="white" strokeWidth={2} className="drop-shadow-lg scale-x-[-1]" />
          <span className="text-white text-[12px] font-semibold drop-shadow">0</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1" onClick={handleShare}>
          <Send size={28} color="white" strokeWidth={2} className="drop-shadow-lg" />
          <span className="text-white text-[12px] font-semibold drop-shadow">Share</span>
        </button>

        {/* Mute */}
        <button onClick={handleMuteToggle} className="mt-1">
          {isMuted
            ? <VolumeX size={26} color="white" strokeWidth={2} className="drop-shadow-lg" />
            : <Volume2 size={26} color="white" strokeWidth={2} className="drop-shadow-lg" />}
        </button>

        {/* Spinning disc */}
        <div
          className="w-9 h-9 rounded-full border-[2.5px] border-white/80 bg-neutral-800 flex items-center justify-center spin-disc mt-1"
          style={{ animationPlayState: isPlaying ? "running" : "paused" }}
        >
          <span className="text-white text-[11px] font-bold">{initials}</span>
        </div>
      </div>

      {/* ── Bottom left ───────────────────────────────────────────────────── */}
      <div
        className="absolute left-0 right-16 pl-4 z-20 flex flex-col gap-2"
        style={{ bottom: `${CONTENT_BOTTOM}px` }}
      >
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[13px] bg-gradient-to-tr from-purple-500 to-pink-500 border border-white/20">
            {initials}
          </div>
          <span className="text-white font-semibold text-[15px] drop-shadow-lg">
            {video.author}
          </span>
          <span className="text-white/60 text-xs">·</span>
          <button
            className="text-white text-[13px] font-semibold border border-white/50 rounded px-2 py-0.5"
            onClick={e => e.stopPropagation()}
          >
            Follow
          </button>
        </div>

        {video.caption && (
          <p
            className="text-white text-[14px] leading-snug line-clamp-2 pointer-events-none"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
          >
            {video.caption}
          </p>
        )}

        <div className="flex items-center gap-1.5 pointer-events-none">
          <Music size={12} className="text-white shrink-0" />
          <div className="overflow-hidden max-w-[180px]">
            <span className="text-white/80 text-[12px] whitespace-nowrap inline-block marquee-text">
              Original audio · @{video.author}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Original audio · @{video.author}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="absolute left-0 right-0 h-[2px] bg-white/15 z-30 pointer-events-none"
        style={{ bottom: `${NAV_H}px` }}
      >
        <div className="h-full bg-white" style={{ width: `${progress * 100}%`, transition: "none" }} />
      </div>
    </div>
  );
}
