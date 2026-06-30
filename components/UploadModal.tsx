"use client";

import { useState, useCallback, useRef } from "react";
import { Link as LinkIcon, AlertCircle, Loader } from "lucide-react";
import { isValidDriveLink } from "@/lib/driveUtils";
import { useVideoStore } from "@/hooks/useVideoStore";

interface UploadModalProps {
  onClose: () => void;
}

type UploadState = "idle" | "loading" | "error";

export default function UploadModal({ onClose }: UploadModalProps) {
  const [driveUrl, setDriveUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [state, setState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { addVideo } = useVideoStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = driveUrl.trim();

      if (!trimmed) {
        setErrorMsg("Please paste a Google Drive link.");
        setState("error");
        return;
      }
      if (!isValidDriveLink(trimmed)) {
        setErrorMsg("Doesn't look like a valid Google Drive link.");
        setState("error");
        return;
      }

      setState("loading");
      setErrorMsg("");
      await new Promise((r) => setTimeout(r, 600));
      addVideo(trimmed, caption.trim() || "✨ New reel");
      onClose();
    },
    [driveUrl, caption, addVideo, onClose]
  );

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setDriveUrl(text);
      setState("idle");
    } catch {
      inputRef.current?.focus();
    }
  }, []);

  return (
    /* Backdrop - sits absolute inside the mobile container */
    <div
      className="absolute inset-0 z-[100] flex flex-col justify-end fade-in"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal
      aria-label="Upload video"
    >
      {/* Sheet - takes up about 80% height, rounded at top */}
      <div
        className="w-full bg-[#262626] rounded-t-[20px] flex flex-col slide-up"
        style={{
          maxHeight: "85%",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header - Instagram style (Cancel, Title, Share) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#363636] shrink-0">
          <button
            onClick={onClose}
            className="text-white text-[15px] hover:opacity-70 transition-opacity"
            id="upload-modal-close"
          >
            Cancel
          </button>
          <h2 className="text-white text-[16px] font-semibold tracking-tight">New Reel</h2>
          <button
            onClick={handleSubmit}
            disabled={state === "loading" || !driveUrl.trim()}
            className="text-[#0095F6] font-semibold text-[15px] disabled:opacity-50 hover:text-white transition-colors"
            id="upload-submit-top"
          >
            {state === "loading" ? <Loader size={16} className="animate-spin inline" /> : "Share"}
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-8 flex flex-col gap-6">
          
          {/* Drive URL Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[#A8A8A8] text-[13px] font-medium ml-1">
              Google Drive Link
            </label>
            <div className="relative flex items-center">
              <LinkIcon size={18} className="absolute left-3.5 text-[#A8A8A8] pointer-events-none" />
              <input
                ref={inputRef}
                id="drive-url-input"
                type="url"
                value={driveUrl}
                onChange={(e) => { setDriveUrl(e.target.value); setState("idle"); }}
                placeholder="Paste link here..."
                className="w-full pl-10 pr-20 py-3.5 text-[15px] bg-[#121212] text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#363636]"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2 text-[#0095F6] text-[14px] font-semibold px-3 py-1.5 hover:bg-white/5 rounded-lg transition-colors"
                id="paste-drive-link"
              >
                Paste
              </button>
            </div>
          </div>

          {/* Caption Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[#A8A8A8] text-[13px] font-medium ml-1">
              Caption
            </label>
            <div className="bg-[#121212] rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-[#363636]">
              <textarea
                id="video-caption-input"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={5}
                className="w-full px-4 pt-4 pb-2 text-[15px] bg-transparent text-white resize-none outline-none leading-relaxed"
                maxLength={200}
              />
              <div className="flex justify-end px-3 pb-2">
                <span className="text-[#A8A8A8] text-[12px] font-medium">
                  {caption.length}/200
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {state === "error" && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-200 text-[14px] leading-snug">{errorMsg}</p>
            </div>
          )}

          {/* Hint */}
          <div className="mt-auto pt-6 text-center">
             <p className="text-[#A8A8A8] text-[13px] leading-relaxed">
              Ensure file sharing is set to <br/>
              <span className="text-white font-medium">"Anyone with the link"</span> in Google Drive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
