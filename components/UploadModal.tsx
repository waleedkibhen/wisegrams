"use client";

import { useState, useCallback, useRef } from "react";
import { X, Link as LinkIcon, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { isValidDriveLink } from "@/lib/driveUtils";
import { useVideoStore } from "@/hooks/useVideoStore";

interface UploadModalProps {
  onClose: () => void;
}

type UploadState = "idle" | "loading" | "success" | "error";

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
        setErrorMsg("That doesn't look like a Google Drive link. Make sure it contains a file ID.");
        setState("error");
        return;
      }

      setState("loading");
      setErrorMsg("");
      await new Promise((r) => setTimeout(r, 600));
      addVideo(trimmed, caption.trim() || "✨ New reel");
      setState("success");
      setTimeout(onClose, 1200);
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
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center fade-in"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal
      aria-label="Upload video"
    >
      {/* Sheet */}
      <div
        className="w-full sm:max-w-lg slide-up"
        style={{
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "28px 28px 0 0",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-4 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-700" />
        </div>

        <div className="px-6 pb-10 sm:pb-8 pt-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-white text-[22px] font-bold tracking-tight">Add a Video</h2>
              <p className="text-neutral-500 text-[14px] mt-1">Paste your Google Drive share link</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors mt-0.5"
              aria-label="Close"
              id="upload-modal-close"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <X size={18} className="text-neutral-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Drive URL */}
            <div className="flex flex-col gap-2.5">
              <label className="text-neutral-400 text-[12px] font-semibold uppercase tracking-widest">
                Google Drive Link
              </label>
              <div className="relative flex items-center">
                <LinkIcon size={16} className="absolute left-4 text-neutral-500 pointer-events-none shrink-0" />
                <input
                  ref={inputRef}
                  id="drive-url-input"
                  type="url"
                  value={driveUrl}
                  onChange={(e) => { setDriveUrl(e.target.value); setState("idle"); }}
                  placeholder="https://drive.google.com/file/d/…"
                  className="w-full pl-11 pr-20 py-4 text-[15px] rounded-2xl"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-3 text-[13px] font-semibold px-3 py-1.5 rounded-xl transition-colors"
                  style={{ color: "var(--accent-light)", background: "rgba(124,58,237,0.12)" }}
                  id="paste-drive-link"
                >
                  Paste
                </button>
              </div>
            </div>

            {/* Caption */}
            <div className="flex flex-col gap-2.5">
              <label className="text-neutral-400 text-[12px] font-semibold uppercase tracking-widest">
                Caption
              </label>
              <textarea
                id="video-caption-input"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption… ✨"
                rows={4}
                className="w-full px-4 py-4 text-[15px] rounded-2xl resize-none leading-relaxed"
                maxLength={200}
              />
              <p className="text-right text-neutral-600 text-[12px] -mt-1">{caption.length}/200</p>
            </div>

            {/* Error */}
            {state === "error" && (
              <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-300 text-[14px] leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Success */}
            {state === "success" && (
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <CheckCircle size={16} className="text-green-400 shrink-0" />
                <p className="text-green-300 text-[14px]">Video added to your feed!</p>
              </div>
            )}

            {/* Submit */}
            <button
              id="upload-submit"
              type="submit"
              disabled={state === "loading" || state === "success"}
              className="w-full py-4 rounded-2xl font-bold text-[16px] transition-all duration-200 flex items-center justify-center gap-2.5"
              style={{
                background: state === "loading" || state === "success"
                  ? "rgba(124,58,237,0.45)"
                  : "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                color: "white",
                boxShadow: state === "idle" ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
              }}
            >
              {state === "loading" && <Loader size={16} className="animate-spin" />}
              {state === "success" && <CheckCircle size={16} />}
              {state === "loading" ? "Adding video…" : state === "success" ? "Added!" : "Add to Feed"}
            </button>
          </form>

          {/* Hint */}
          <p className="text-neutral-600 text-[13px] text-center mt-6 leading-relaxed">
            Set file sharing to{" "}
            <span className="text-neutral-400 font-medium">"Anyone with the link"</span>{" "}
            in Google Drive.
          </p>
        </div>
      </div>
    </div>
  );
}
