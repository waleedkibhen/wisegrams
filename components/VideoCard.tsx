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
  MoreVertical,
  Play,
  Pause,
  VolumeX,
  Volume2,
  Music,
} from "lucide-react";
import type { VideoPost } from "@/lib/storage";

// Height of the solid header bar
const HEADER_H = 56;
// Height of the solid bottom nav
const NAV_H = 50;
// Content bottom offset
const CONTENT_BOTTOM = NAV_H + 16;

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
  const shouldMount =
    isActive || (index > activeIndex && index <= activeIndex + 3);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isActive) {
      setIsLoaded(false);
      setHasError(false);
      setProgress(0);
      el.currentTime = 0;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isActive]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = isMuted;
  }, [isMuted]);

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
  }, [isActive, onLike, video]);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((m) => {
      setShowMuteToast(true);
      setTimeout(() => setShowMuteToast(false), 1200);
      return !m;
    });
  }, []);

  const handleLike = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onLike(video.id);
    },
    [onLike, video.id]
  );

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

  const onCanPlay   = useCallback(() => setIsLoaded(true), []);
  const onPlay      = useCallback(() => setIsPlaying(true), []);
  const onPause     = useCallback(() => setIsPlaying(false), []);
  const onError     = useCallback(() => setHasError(true), []);
  const onTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    if (el.duration) setProgress(el.currentTime / el.duration);
  }, []);

  const initials   = (video.author ?? "W").slice(0, 1).toUpperCase();
  const audioLabel = `Original audio`;

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black select-none"
      onClick={handleTap}
    >
      {/* Video */}
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

      {/* Play/Pause indicator */}
      {playIconState && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="play-flash w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
            {playIconState === "play"
              ? <Play size={32} className="text-white fill-white ml-1" />
              : <Pause size={32} className="text-white fill-white" />}
          </div>
        </div>
      )}

      {/* Double tap heart */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <Heart className="heart-burst drop-shadow-2xl" size={100} fill="#FF3040" color="#FF3040" strokeWidth={0} />
        </div>
      )}

      {/* Mute Toast */}
      {showMuteToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 fade-in">
          <div className="bg-black/70 rounded-full px-4 py-2 flex items-center gap-2 backdrop-blur-md">
            {isMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
            <span className="text-white text-[13px] font-medium">{isMuted ? "Video muted" : "Video sound on"}</span>
          </div>
        </div>
      )}

      {/* Loading & Error */}
      {isActive && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-8 h-8 rounded-full border-[3px] border-white/20 border-t-white animate-spin" />
        </div>
      )}
      {isActive && hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none px-8">
          <div className="bg-black/70 backdrop-blur-md p-6 rounded-2xl text-center">
            <p className="text-white/80 text-sm">Failed to load video.</p>
          </div>
        </div>
      )}

      {/* ── RIGHT Sidebar (Instagram Reels Style) ───────────────────────── */}
      <div
        className="absolute right-3 flex flex-col items-center gap-[22px] z-20"
        style={{ bottom: `${CONTENT_BOTTOM}px` }}
      >
        <button className="flex flex-col items-center gap-1.5" onClick={handleLike}>
          <Heart
            size={28}
            className={`drop-shadow-lg transition-transform ${video.liked ? "scale-110" : "scale-100"}`}
            color={video.liked ? "#FF3040" : "white"}
            fill={video.liked ? "#FF3040" : "none"}
            strokeWidth={video.liked ? 0 : 2}
          />
          <span className="text-white text-[12px] font-semibold drop-shadow">{video.likes}</span>
        </button>

        <button className="flex flex-col items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <MessageCircle size={28} color="white" strokeWidth={2} className="drop-shadow-lg scale-x-[-1]" />
          <span className="text-white text-[12px] font-semibold drop-shadow">3</span>
        </button>

        <button className="flex flex-col items-center gap-1.5" onClick={handleShare}>
          <Send size={28} color="white" strokeWidth={2} className="drop-shadow-lg" />
          <span className="text-white text-[12px] font-semibold drop-shadow">Share</span>
        </button>

        <button className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
          <MoreVertical size={24} color="white" strokeWidth={2} className="drop-shadow-lg" />
        </button>

        {/* Audio Track Record Icon */}
        <div
          className="w-8 h-8 rounded-md border-[2px] border-white/80 bg-neutral-800 flex items-center justify-center overflow-hidden spin-disc mt-2"
          style={{ animationPlayState: isPlaying ? "running" : "paused" }}
        >
          <span className="text-white text-[10px] font-bold">{initials}</span>
        </div>
      </div>

      {/* ── BOTTOM LEFT (Instagram Reels Style) ─────────────────────────── */}
      <div
        className="absolute left-0 right-16 pl-3 pr-2 z-20 pointer-events-none flex flex-col gap-2.5"
        style={{ bottom: `${CONTENT_BOTTOM}px` }}
      >
        {/* Author row */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white font-bold text-xs bg-gradient-to-tr from-purple-500 to-pink-500 shadow-md">
            {initials}
          </div>
          <span className="text-white font-semibold text-[14px] drop-shadow-md">
            {video.author}
          </span>
          <div className="w-1 h-1 rounded-full bg-white/70 mx-0.5" />
          <button className="text-white font-semibold text-[14px] drop-shadow-md border border-white/30 rounded-md px-2 py-0.5 backdrop-blur-sm pointer-events-auto">
            Follow
          </button>
        </div>

        {/* Caption */}
        {video.caption && (
          <p className="text-white text-[14px] leading-snug drop-shadow-md line-clamp-2">
            {video.caption}
          </p>
        )}

        {/* Audio Track */}
        <div className="flex items-center gap-2 mt-0.5 bg-black/20 self-start px-2.5 py-1 rounded-full backdrop-blur-sm">
          <Music size={12} className="text-white" />
          <div className="overflow-hidden max-w-[120px]">
            <span className="text-white text-[12px] whitespace-nowrap inline-block marquee-text">
              {audioLabel} · {video.author}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{audioLabel} · {video.author}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="absolute left-0 right-0 h-[2px] bg-white/20 z-30 pointer-events-none"
        style={{ bottom: `${NAV_H}px` }}
      >
        <div className="h-full bg-white transition-none" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
