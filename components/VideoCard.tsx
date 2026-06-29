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
} from "lucide-react";
import type { VideoPost } from "@/lib/storage";

// Nav height (52px) + small breathing room
const NAV_OFFSET = 68;

interface VideoCardProps {
  video: VideoPost;
  index: number;
  activeIndex: number;
  onLike: (id: string) => void;
}

export default function VideoCard({ video, index, activeIndex, onLike }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Playback
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
  // Keep next 3 cards mounted and preloading for instant swipe
  const shouldMount = isActive || (index > activeIndex && index <= activeIndex + 3);

  // ── Autoplay / pause when active index changes ────────────────────────────────
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      setIsLoaded(false);
      setProgress(0);
      el.currentTime = 0;
      el.play().catch(() => { /* autoplay policy */ });
    } else {
      el.pause();
    }
  }, [isActive]);

  // Sync muted attr when isMuted changes
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = isMuted;
  }, [isMuted]);

  // ── Tap: single = pause/play, double = like ───────────────────────────────────
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);

  const handleTap = useCallback(() => {
    if (!isActive) return;
    const now = Date.now();

    if (now - lastTap.current < 280) {
      // Double tap → like + heart
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
          el.play();
          setPlayIconState("play");
        } else {
          el.pause();
          setPlayIconState("pause");
        }
        setTimeout(() => setPlayIconState(null), 600);
      }, 220);
    }
  }, [isActive, onLike, video.id]);

  // ── Mute toggle ───────────────────────────────────────────────────────────────
  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((m) => {
      const next = !m;
      setShowMuteToast(true);
      setTimeout(() => setShowMuteToast(false), 1200);
      return next;
    });
  }, []);

  // ── Like / Share ──────────────────────────────────────────────────────────────
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

  // ── Video events ──────────────────────────────────────────────────────────────
  const onCanPlay  = useCallback(() => setIsLoaded(true), []);
  const onPlay     = useCallback(() => setIsPlaying(true), []);
  const onPause    = useCallback(() => setIsPlaying(false), []);
  const onError    = useCallback(() => setHasError(true), []);
  const onTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    if (el.duration) setProgress(el.currentTime / el.duration);
  }, []);

  const initials   = (video.author ?? "W").slice(0, 1).toUpperCase();
  const audioLabel = `Original Audio · @${video.author}`;

  return (
    <div
      className="relative w-full h-dvh overflow-hidden bg-black select-none"
      onClick={handleTap}
    >
      {/* ── Video ──────────────────────────────────────────────────────────── */}
      {shouldMount && (
        <video
          ref={videoRef}
          src={video.streamUrl}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          loop
          muted          /* always start muted — isMuted effect syncs after mount */
          playsInline
          preload={isActive ? "auto" : "metadata"}
          onCanPlay={onCanPlay}
          onPlay={onPlay}
          onPause={onPause}
          onTimeUpdate={onTimeUpdate}
          onError={onError}
        />
      )}

      {/* ── Loading spinner ────────────────────────────────────────────────── */}
      {isActive && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* ── Error fallback ─────────────────────────────────────────────────── */}
      {isActive && hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none px-8">
          <p className="text-white/60 text-sm text-center">
            Could not load video. Make sure the Drive file is set to{" "}
            <span className="text-white">"Anyone with the link"</span>.
          </p>
        </div>
      )}

      {/* ── Single-tap play/pause flash ────────────────────────────────────── */}
      {playIconState && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="play-flash w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            {playIconState === "play"
              ? <Play  size={28} className="text-white fill-white ml-1" />
              : <Pause size={28} className="text-white fill-white" />
            }
          </div>
        </div>
      )}

      {/* ── Double-tap heart burst ─────────────────────────────────────────── */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <Heart className="heart-burst drop-shadow-2xl" size={96} fill="white" color="white" />
        </div>
      )}

      {/* ── Mute/unmute toast ──────────────────────────────────────────────── */}
      {showMuteToast && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-40 fade-in">
          <div className="flex items-center gap-2 bg-black/70 rounded-full px-4 py-2 backdrop-blur-sm">
            {isMuted
              ? <VolumeX size={16} className="text-white" />
              : <Volume2 size={16} className="text-white" />
            }
            <span className="text-white text-xs font-medium">
              {isMuted ? "Muted" : "Sound on"}
            </span>
          </div>
        </div>
      )}

      {/* ── Top gradient (leaves room for FeedHeader) ─────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: "120px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)",
        }}
      />

      {/* ── Bottom gradient ────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: "60%",
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 35%, transparent 100%)",
        }}
      />

      {/* ── RIGHT sidebar (positioned above nav + breathing room) ──────────── */}
      <div
        className="absolute right-3 flex flex-col items-center gap-5 z-20"
        style={{ bottom: `${NAV_OFFSET}px` }}
      >
        {/* Avatar bubble */}
        <div className="relative">
          <div
            className="w-[42px] h-[42px] rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-base shadow-lg"
            style={{ background: "hsl(262, 83%, 58%)" }}
          >
            {initials}
          </div>
          {/* Follow + dot */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#e1306c] flex items-center justify-center shadow">
            <span className="text-white text-[10px] font-bold leading-none">+</span>
          </div>
        </div>

        {/* Like */}
        <button
          className="flex flex-col items-center gap-[3px]"
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

        {/* Comment */}
        <button
          className="flex flex-col items-center gap-[3px]"
          aria-label="Comment"
          id={`comment-${video.id}`}
        >
          <MessageCircle size={30} color="white" strokeWidth={1.8} className="drop-shadow-lg" />
          <span className="text-white text-[12px] font-semibold drop-shadow">0</span>
        </button>

        {/* Share */}
        <button
          className="flex flex-col items-center gap-[3px]"
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
            : <Volume2 size={26} color="white" strokeWidth={1.8} className="drop-shadow-lg" />
          }
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

      {/* ── BOTTOM-LEFT: author + caption + audio ──────────────────────────── */}
      <div
        className="absolute left-0 right-16 px-4 z-20 pointer-events-none"
        style={{ bottom: `${NAV_OFFSET}px` }}
      >
        <p className="text-white font-bold text-[15px] mb-1 drop-shadow-lg">
          @{video.author}
        </p>
        {video.caption && (
          <p className="text-white/90 text-[13px] leading-snug mb-2 drop-shadow line-clamp-2">
            {video.caption}
          </p>
        )}
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-white/90 text-[13px] flex-shrink-0">♪</span>
          <div className="overflow-hidden flex-1">
            <span className="text-white/75 text-[12px] marquee-text">
              {audioLabel}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{audioLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Progress bar (sits just above the nav) ─────────────────────────── */}
      <div
        className="absolute left-0 right-0 h-[2px] bg-white/20 z-30 pointer-events-none"
        style={{ bottom: `${NAV_OFFSET - 4}px` }}
      >
        <div
          className="h-full bg-white transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
