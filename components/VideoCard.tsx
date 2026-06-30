"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Heart,
  Send,
  Play,
  Pause,
  VolumeX,
  Volume2,
} from "lucide-react";
import type { VideoPost } from "@/lib/storage";

// Height of the solid header bar — must match FeedHeader
const HEADER_H = 56;
// Height of the solid bottom nav — must match BottomNav
const NAV_H = 64;
// Extra breathing room above the nav for bottom-left text / sidebar buttons
const CONTENT_BOTTOM = NAV_H + 12;

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

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Overlay animations
  const [showHeart, setShowHeart] = useState(false);
  const [playIconState, setPlayIconState] = useState<"play" | "pause" | null>(null);
  const [showMuteToast, setShowMuteToast] = useState(false);

  const isActive = index === activeIndex;
  // Pre-buffer the next 3 cards so they're ready for instant swipe
  const shouldMount =
    isActive || (index > activeIndex && index <= activeIndex + 3);

  // ── Autoplay / pause when active index changes ───────────────────────────
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isActive) {
      setIsLoaded(false);
      setHasError(false);
      setProgress(0);
      el.currentTime = 0;
      // Simple fire-and-forget — fastest path to playback
      el.play().catch(() => { /* autoplay policy */ });
    } else {
      el.pause();
    }
  }, [isActive]);

  // ── Sync muted attribute ─────────────────────────────────────────────────
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = isMuted;
  }, [isMuted]);

  // ── Tap: single = pause/play, double = like ──────────────────────────────
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);

  const handleTap = useCallback(() => {
    if (!isActive) return;
    const now = Date.now();

    if (now - lastTap.current < 280) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = null;
      lastTap.current = 0;
      onLike(video.id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
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
        setTimeout(() => setPlayIconState(null), 600);
      }, 220);
    }
  }, [isActive, onLike, video.id]);

  // ── Mute toggle ──────────────────────────────────────────────────────────
  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((m) => {
      setShowMuteToast(true);
      setTimeout(() => setShowMuteToast(false), 1200);
      return !m;
    });
  }, []);

  // ── Like ─────────────────────────────────────────────────────────────────
  const handleLike = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onLike(video.id);
    },
    [onLike, video.id]
  );

  // ── Share ────────────────────────────────────────────────────────────────
  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.share({ url: video.driveShareUrl, title: video.caption });
      } catch {
        try { await navigator.clipboard.writeText(video.driveShareUrl); } catch { /* ignore */ }
      }
    },
    [video]
  );

  // ── Video event handlers ─────────────────────────────────────────────────
  const onCanPlay   = useCallback(() => setIsLoaded(true), []);
  const onPlay      = useCallback(() => setIsPlaying(true), []);
  const onPause     = useCallback(() => setIsPlaying(false), []);
  const onError     = useCallback(() => setHasError(true), []);
  const onTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    if (el.duration) setProgress(el.currentTime / el.duration);
  }, []);

  const initials   = (video.author ?? "W").slice(0, 1).toUpperCase();
  const audioLabel = `Original Audio · @${video.author}`;

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black select-none"
      onClick={handleTap}
    >
      {/* ── Video — fills the bounded card area (between header and nav) ──── */}
      {shouldMount && (
        <video
          ref={videoRef}
          src={video.streamUrl}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          loop
          muted
          playsInline
          preload={isActive ? "auto" : "metadata"}
          onCanPlay={onCanPlay}
          onPlay={onPlay}
          onPause={onPause}
          onTimeUpdate={onTimeUpdate}
          onError={onError}
        />
      )}

      {/* ── Loading spinner ───────────────────────────────────────────────── */}
      {isActive && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* ── Error fallback ────────────────────────────────────────────────── */}
      {isActive && hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none px-8">
          <div
            className="flex flex-col items-center gap-3 p-6 rounded-2xl text-center"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
          >
            <p className="text-white/70 text-sm leading-snug">
              Could not load video. Make sure the Drive file is set to{" "}
              <span className="text-white font-semibold">"Anyone with the link"</span>.
            </p>
          </div>
        </div>
      )}

      {/* ── Single-tap play/pause flash ───────────────────────────────────── */}
      {playIconState && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="play-flash w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            {playIconState === "play"
              ? <Play size={28} className="text-white fill-white ml-1" />
              : <Pause size={28} className="text-white fill-white" />}
          </div>
        </div>
      )}

      {/* ── Double-tap heart burst ────────────────────────────────────────── */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <Heart className="heart-burst drop-shadow-2xl" size={96} fill="white" color="white" />
        </div>
      )}

      {/* ── Mute / unmute toast ───────────────────────────────────────────── */}
      {showMuteToast && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-40 fade-in">
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2"
            style={{
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {isMuted
              ? <VolumeX size={15} className="text-white" />
              : <Volume2 size={15} className="text-white" />}
            <span className="text-white text-xs font-medium">
              {isMuted ? "Muted" : "Sound on"}
            </span>
          </div>
        </div>
      )}

      {/* ── RIGHT sidebar ─────────────────────────────────────────────────── */}
      <div
        className="absolute right-3 flex flex-col items-center gap-6 z-20"
        style={{ bottom: `${CONTENT_BOTTOM}px` }}
      >
        {/* Avatar bubble */}
        <div className="relative">
          <div
            className="w-[44px] h-[44px] rounded-full border-2 border-white/80 flex items-center justify-center text-white font-bold text-base shadow-lg"
            style={{ background: "hsl(262, 83%, 58%)" }}
          >
            {initials}
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#e1306c] flex items-center justify-center shadow-md">
            <span className="text-white text-[10px] font-bold leading-none">+</span>
          </div>
        </div>

        {/* Like */}
        <button
          className="flex flex-col items-center gap-1"
          onClick={handleLike}
          aria-label="Like"
          id={`like-${video.id}`}
        >
          <Heart
            size={30}
            className={`drop-shadow-lg transition-all duration-150 ${video.liked ? "scale-110" : "scale-100"}`}
            color="white"
            fill={video.liked ? "#e1306c" : "none"}
            strokeWidth={video.liked ? 0 : 1.8}
          />
          <span className="text-white text-[12px] font-semibold drop-shadow">{video.likes}</span>
        </button>

        {/* Share */}
        <button
          className="flex flex-col items-center gap-1"
          onClick={handleShare}
          aria-label="Share"
          id={`share-${video.id}`}
        >
          <Send size={27} color="white" strokeWidth={1.8} className="drop-shadow-lg -rotate-12" />
          <span className="text-white text-[12px] font-semibold drop-shadow">Share</span>
        </button>

        {/* Mute / unmute */}
        <button
          className="flex flex-col items-center"
          onClick={handleMuteToggle}
          aria-label={isMuted ? "Unmute" : "Mute"}
          id={`mute-${video.id}`}
        >
          {isMuted
            ? <VolumeX size={26} color="white" strokeWidth={1.8} className="drop-shadow-lg" />
            : <Volume2 size={26} color="white" strokeWidth={1.8} className="drop-shadow-lg" />}
        </button>

        {/* Spinning music disc */}
        <div
          className="w-[42px] h-[42px] rounded-full border-[3px] border-neutral-600 bg-neutral-900 flex items-center justify-center overflow-hidden spin-disc"
          style={{ animationPlayState: isPlaying ? "running" : "paused" }}
          aria-hidden
        >
          <div className="w-[14px] h-[14px] rounded-full bg-neutral-500 flex items-center justify-center">
            <span className="text-white text-[7px] font-bold">{initials}</span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM-LEFT: author + caption + audio ─────────────────────────── */}
      <div
        className="absolute left-0 right-16 px-4 z-20 pointer-events-none"
        style={{ bottom: `${CONTENT_BOTTOM}px` }}
      >
        <p
          className="text-white font-bold text-[15px] mb-1"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}
        >
          @{video.author}
        </p>
        {video.caption && (
          <p
            className="text-white/95 text-[13px] leading-snug mb-2.5 line-clamp-2"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.85)" }}
          >
            {video.caption}
          </p>
        )}
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-white/80 text-[13px] flex-shrink-0" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>♪</span>
          <div className="overflow-hidden flex-1">
            <span className="text-white/65 text-[12px] marquee-text" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>
              {audioLabel}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{audioLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <div
        className="absolute left-0 right-0 h-[2px] bg-white/15 z-30 pointer-events-none"
        style={{ bottom: `${CONTENT_BOTTOM - 4}px` }}
      >
        <div className="h-full bg-white transition-none" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
