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
        setErrorMsg(
          "That doesn't look like a Google Drive link. Make sure it contains a file ID."
        );
        setState("error");
        return;
      }

      setState("loading");
      setErrorMsg("");

      // Simulate brief processing delay for UX feedback
      await new Promise((r) => setTimeout(r, 600));

      addVideo(trimmed, caption.trim() || "✨ New reel");
      setState("success");

      // Auto-close after success
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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal
      aria-label="Upload video"
    >
      {/* Sheet */}
      <div className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-2xl p-6 pb-10 sm:pb-6 slide-up border border-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-foreground text-lg font-semibold">Add a Video</h2>
            <p className="text-muted text-xs mt-0.5">Paste your Google Drive share link</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Close"
            id="upload-modal-close"
          >
            <X size={16} className="text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Drive URL input */}
          <div className="relative">
            <label className="text-muted text-xs font-medium mb-2 block tracking-wide uppercase">
              Google Drive Link
            </label>
            <div className="relative flex items-center gap-2">
              <div className="absolute left-3 flex items-center pointer-events-none">
                <LinkIcon size={15} className="text-muted" />
              </div>
              <input
                ref={inputRef}
                id="drive-url-input"
                type="url"
                value={driveUrl}
                onChange={(e) => {
                  setDriveUrl(e.target.value);
                  setState("idle");
                }}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full pl-9 pr-20 py-3 text-sm"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2 text-xs text-accent-light font-semibold px-2 py-1 rounded-lg hover:bg-accent/10 transition-colors"
                id="paste-drive-link"
              >
                Paste
              </button>
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="text-muted text-xs font-medium mb-2 block tracking-wide uppercase">
              Caption
            </label>
            <textarea
              id="video-caption-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption... ✨"
              rows={3}
              className="w-full px-4 py-3 text-sm resize-none"
              maxLength={200}
            />
            <p className="text-right text-muted text-xs mt-1">{caption.length}/200</p>
          </div>

          {/* Error message */}
          {state === "error" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800/30">
              <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-xs leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* Success message */}
          {state === "success" && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-950/40 border border-green-800/30">
              <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
              <p className="text-green-300 text-xs">Video added to your feed!</p>
            </div>
          )}

          {/* Submit */}
          <button
            id="upload-submit"
            type="submit"
            disabled={state === "loading" || state === "success"}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background:
                state === "loading" || state === "success"
                  ? "rgba(124,58,237,0.4)"
                  : "var(--accent)",
              color: "white",
            }}
          >
            {state === "loading" && (
              <Loader size={15} className="animate-spin" />
            )}
            {state === "success" && <CheckCircle size={15} />}
            {state === "loading"
              ? "Adding video..."
              : state === "success"
              ? "Added!"
              : "Add to Feed"}
          </button>
        </form>

        {/* Hint */}
        <p className="text-muted text-xs text-center mt-4 leading-relaxed">
          Make sure the file sharing is set to{" "}
          <span className="text-foreground">"Anyone with the link"</span> in Google Drive.
        </p>
      </div>
    </div>
  );
}
