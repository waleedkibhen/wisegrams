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
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import type { VideoPost } from "@/lib/storage";

// ─────────────────────────────────────────────────────────────────────────────
// We keep videos mounted in a sliding window (current +/- 2) to preserve
// the downloaded buffer and ensure instant scrolling. To prevent exhausting
// Chrome's concurrent media limits (which causes subsequent videos to stall),
// we dynamically set preload="none" on distant videos.
// ─────────────────────────────────────────────────────────────────────────────
interface VideoCardProps {
  video: VideoPost;
  index: number;
  activeIndex: number;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function VideoCard({
  video,
  index,
  activeIndex,
  onLike,
  onDelete,
}: VideoCardProps) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);     // outer div — observed by IntersectionObserver
  const loadedSrcRef   = useRef<string>("");            // tracks which URL is actually loaded
  const isMountedRef   = useRef(true);
  // pendingPlay: set to true when the IntersectionObserver fires (video is visible)
  // but el.src wasn't loaded yet. Effect 1 checks this flag when it sets src
  // and calls play() immediately so the video isn't stuck blank.
  const pendingPlay = useRef(false);

  const [isPlaying,    setIsPlaying]    = useState(false);
  const [isMuted,      setIsMuted]      = useState(true);
  const [progress,     setProgress]     = useState(0);
  const [isLoaded,     setIsLoaded]     = useState(false);
  const [hasError,     setHasError]     = useState(false);
  const [showHeart,    setShowHeart]    = useState(false);
  const [playIconState,setPlayIconState]= useState<"play" | "pause" | null>(null);
  const [showMuteToast,setShowMuteToast]= useState(false);
  const [showMenu,     setShowMenu]     = useState(false);

  const isActive    = index === activeIndex;
  
  // Keep a sliding window of videos mounted so they don't lose their downloaded buffer.
  const shouldMount = Math.abs(index - activeIndex) <= 2;
  
  // Only aggressively preload the current and immediate next video.
  const isNearby = index === activeIndex || index === activeIndex + 1;

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Effect 1: Auto-play and state reset when video mounts ───────────────
  useEffect(() => {
    if (isActive && isMountedRef.current) {
      // If the user scrolls back to this video, clear any lingering network abort errors
      setHasError(false);
    }

    const el = videoRef.current;
    if (!el) return;

    if (pendingPlay.current) {
      el.play().catch(() => {});
    }
  }, [isActive]);

  // ── Effect 2: IntersectionObserver — owns all play/pause decisions ───────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!isMountedRef.current) return;
        
        if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
          pendingPlay.current = true;
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        } else {
          pendingPlay.current = false;
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.75 }
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 3: Mute sync ───────────────────────────────────────────────────
  useEffect(() => {
    const el = videoRef.current;
    if (el) el.muted = isMuted;
  }, [isMuted]);

  // ── Effect 4: Recover playback when app returns from background ───────────
  useEffect(() => {
    if (!isActive) return;
    const handleVisibility = () => {
      const el = videoRef.current;
      if (!el || !isMountedRef.current || document.hidden) return;
      if (el.paused && el.src) el.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isActive]);

  // ── Tap: single = play/pause toggle, double = like ───────────────────────
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap  = useRef(0);

  const handleTap = useCallback(() => {
    if (!isActive) return;
    setShowMenu(false); // Close menu on any tap
    const now = Date.now();

    if (now - lastTap.current < 280) {
      // ── Double tap → like ──
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = null;
      lastTap.current  = 0;
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

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(video.id);
  }, [onDelete, video.id]);

  const onCanPlay     = useCallback(() => { if (isMountedRef.current) setIsLoaded(true); }, []);
  const onPlay        = useCallback(() => { if (isMountedRef.current) setIsPlaying(true); }, []);
  const onPause       = useCallback(() => { if (isMountedRef.current) setIsPlaying(false); }, []);
  const onPlaying     = useCallback(() => { 
    if (isMountedRef.current) {
      setIsPlaying(true);
      setIsLoaded(true); // Backup in case onCanPlay missed it
    }
  }, []);
  const onError       = useCallback(() => { 
    if (isMountedRef.current) setHasError(true); 
    
    // Advanced Debug Logging: Ping the URL to see EXACTLY why it failed
    fetch(video.streamUrl)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          console.error(`[Video Error] ID: ${video.id} | Status: ${res.status} | Response:`, text);
        } else {
          console.error(`[Video Error] ID: ${video.id} | Status: ${res.status} OK (Browser might be blocking the media format or cross-site tracking)`);
        }
      })
      .catch((err) => {
        console.error(`[Video Error] ID: ${video.id} | Network Fetch Failed:`, err);
      });
  }, [video.streamUrl, video.id]);
  const onTimeUpdate  = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    if (el.duration && isMountedRef.current) setProgress(el.currentTime / el.duration);
  }, []);

  const initials = (video.author ?? "W")[0].toUpperCase();

  const getPlatformLabel = (platform?: string) => {
    switch (platform) {
      case "instagram": return "Instagram";
      case "tiktok": return "TikTok";
      case "x": return "X";
      case "facebook": return "Facebook";
      case "youtube": return "YouTube";
      default: return "Original Source";
    }
  };

  const getPlatformColor = (platform?: string) => {
    switch (platform) {
      case "instagram": return "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";
      case "tiktok": return "#25F4EE";
      case "x": return "#000000";
      case "facebook": return "#1877F2";
      case "youtube": return "#FF0000";
      default: return "rgba(255,255,255,0.2)";
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full overflow-hidden bg-black select-none"
    >
      {/* Full-screen tap target */}
      <div className="absolute inset-0 z-0" onClick={handleTap} />

      {/* ── Native <video> — zero iframes, ever ── */}
      {shouldMount && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
          style={{ objectFit: "contain" }}
          loop
          muted
          playsInline
          preload={isNearby ? "auto" : "none"}
          src={video.streamUrl}
          onCanPlay={onCanPlay}
          onPlay={onPlay}
          onPlaying={onPlaying}
          onPause={onPause}
          onTimeUpdate={onTimeUpdate}
          onError={onError}
        />
      )}

      {/* Gradient scrim — extremely light, just barely enough for text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 15,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 15%, rgba(0,0,0,0) 30%)",
        }}
      />

      {/* ── Loading spinner ── */}
      {isActive && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-10 h-10 rounded-full border-[3px] border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* ── Error state ── */}
      {isActive && hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none px-8">
          <div className="bg-black/80 p-5 rounded-2xl text-center">
            <p className="text-white text-sm leading-relaxed">
              Could not load video. Make sure Google Drive sharing is set to{" "}
              <strong>"Anyone with the link"</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Play/pause flash ── */}
      {playIconState && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="play-flash w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            {playIconState === "play"
              ? <Play  size={30} className="text-white fill-white ml-1" />
              : <Pause size={30} className="text-white fill-white" />}
          </div>
        </div>
      )}

      {/* ── Double-tap heart ── */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <Heart className="heart-burst" size={96} fill="#FF3040" color="#FF3040" strokeWidth={0} />
        </div>
      )}

      {/* ── Mute toast ── */}
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

      {/* ── Progress bar — top of screen ── */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/20 z-30 pointer-events-none">
        <div
          className="h-full bg-white"
          style={{ width: `${progress * 100}%`, transition: "none" }}
        />
      </div>

      {/* ── Right sidebar ── */}
      <div
        className="absolute right-3 flex flex-col items-center gap-5"
        style={{ zIndex: 25, bottom: "100px" }}
      >
        {/* Like */}
        <button className="flex flex-col items-center gap-1" onClick={handleLike} aria-label="Like">
          <Heart
            size={28}
            color={video.liked ? "#FF3040" : "white"}
            fill={video.liked ? "#FF3040" : "none"}
            strokeWidth={2}
            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
          />
          <span className="text-white text-[11px] font-semibold" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
            {video.likes > 0 ? video.likes : ""}
          </span>
        </button>

        {/* Comment (visual only) */}
        <button className="flex flex-col items-center gap-1" onClick={e => e.stopPropagation()} aria-label="Comments">
          <MessageCircle
            size={28} color="white" strokeWidth={2}
            className="scale-x-[-1]"
            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
          />
          <span className="text-white text-[11px] font-semibold" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>0</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1" onClick={handleShare} aria-label="Share">
          <Send size={26} color="white" strokeWidth={2}
            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
          />
          <span className="text-white text-[11px] font-semibold" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>Share</span>
        </button>

        {/* More */}
        <div className="relative">
          <button 
            className="flex flex-col items-center" 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} 
            aria-label="More options"
          >
            <MoreHorizontal size={26} color="white" strokeWidth={2}
              style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
            />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div 
              className="absolute right-8 bottom-0 bg-neutral-900/90 backdrop-blur-md rounded-xl p-2 min-w-[120px] shadow-lg border border-white/10 z-50 animate-in fade-in slide-in-from-right-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 hover:bg-white/10 transition-colors"
              >
                <Trash2 size={16} />
                <span className="text-sm font-semibold">Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Spinning disc */}
        <div
          className="w-9 h-9 rounded-full border-[2.5px] border-white/80 bg-neutral-800 flex items-center justify-center spin-disc mt-1"
          style={{ animationPlayState: isPlaying ? "running" : "paused" }}
        >
          <span className="text-white text-[11px] font-bold">{initials}</span>
        </div>
      </div>

      {/* ── Mute/unmute button — top right ── */}
      <button
        onClick={handleMuteToggle}
        className="absolute top-14 right-4 z-30 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted
          ? <VolumeX size={18} color="white" strokeWidth={2} />
          : <Volume2 size={18} color="white" strokeWidth={2} />}
      </button>

      {/* ── Bottom-left: username + caption + audio marquee ── */}
      <div
        className="absolute left-0 right-16 pl-4 flex flex-col gap-2"
        style={{ zIndex: 25, bottom: "28px" }}
      >
        <div className="flex items-center gap-2 pointer-events-auto">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0"
            style={{ background: "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)" }}
          >
            {initials}
          </div>
          <span
            className="text-white font-bold text-[15px]"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
          >
            @{video.author}
          </span>
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
          <div className="overflow-hidden max-w-[200px]">
            <span className="text-white/80 text-[12px] whitespace-nowrap inline-block marquee-text">
              Original audio · @{video.author}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Original audio · @{video.author}
            </span>
          </div>
        </div>

        {video.originalUrl && (
          <a
            href={video.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 mt-1 rounded-full pointer-events-auto active:opacity-70 transition-opacity w-fit"
            style={{ 
              background: video.originalPlatform === "instagram" ? undefined : getPlatformColor(video.originalPlatform),
              backgroundImage: video.originalPlatform === "instagram" ? getPlatformColor(video.originalPlatform) : undefined,
              border: video.originalPlatform === "tiktok" || video.originalPlatform === "x" ? "1px solid rgba(255,255,255,0.2)" : "none",
            }}
            onClick={(e) => e.stopPropagation()} // Prevent video pause when clicking the link
          >
            <span className="text-[12px] font-bold" style={{
              color: video.originalPlatform === "tiktok" ? "black" : "white",
              textShadow: video.originalPlatform === "tiktok" ? "none" : "0 1px 2px rgba(0,0,0,0.5)"
            }}>
              Watch on {getPlatformLabel(video.originalPlatform)}
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
