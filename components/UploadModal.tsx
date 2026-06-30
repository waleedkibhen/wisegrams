"use client";

import { useState, useCallback, useRef } from "react";
import { AlertCircle, Loader, Check, Link2 } from "lucide-react";
import { isValidDriveLink } from "@/lib/driveUtils";
import { useVideoStore } from "@/hooks/useVideoStore";

interface UploadModalProps {
  onClose: () => void;
}

type State = "idle" | "loading" | "error";

export default function UploadModal({ onClose }: UploadModalProps) {
  const [driveUrl, setDriveUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { addVideo } = useVideoStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const canShare = driveUrl.trim().length > 0 && state !== "loading";

  const handleShare = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = driveUrl.trim();

    if (!trimmed) {
      setErrorMsg("Please paste a Google Drive link.");
      setState("error");
      return;
    }
    if (!isValidDriveLink(trimmed)) {
      setErrorMsg("That doesn't look like a valid Google Drive link. It should contain a file ID.");
      setState("error");
      return;
    }

    setState("loading");
    setErrorMsg("");
    await new Promise(r => setTimeout(r, 400));
    addVideo(trimmed, caption.trim() || "✨");
    onClose();
  }, [driveUrl, caption, addVideo, onClose]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setDriveUrl(text);
        setState("idle");
      }
    } catch {
      inputRef.current?.focus();
    }
  }, []);

  return (
    /* 
      Uses `fixed` not `absolute` — this ensures the modal fills the FULL
      screen on every device (phone, tablet, iPad) regardless of any 
      parent container width constraints.
    */
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal
      aria-label="New Reel"
    >
      {/* Sheet */}
      <div
        className="w-full slide-up flex flex-col"
        style={{
          background: "#1c1c1e",
          borderRadius: "16px 16px 0 0",
          maxHeight: "92dvh",
          // Respect safe area (notch / home bar on iPhone/iPad)
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* ── Top bar ───────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: "16px 20px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <button
            onClick={onClose}
            id="upload-modal-close"
            className="text-white text-[17px] active:opacity-50 transition-opacity min-w-[60px]"
          >
            Cancel
          </button>

          <h2 className="text-white font-semibold text-[17px] tracking-tight">
            New Reel
          </h2>

          <button
            onClick={() => handleShare()}
            disabled={!canShare}
            id="upload-submit-top"
            className="text-[17px] font-semibold transition-opacity min-w-[60px] text-right"
            style={{ color: canShare ? "#0A84FF" : "rgba(10,132,255,0.4)" }}
          >
            {state === "loading"
              ? <Loader size={18} className="animate-spin inline" />
              : "Share"}
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "28px 20px 24px" }}>
          <form onSubmit={handleShare} className="flex flex-col gap-7">

            {/* Drive link */}
            <div className="flex flex-col gap-3">
              <label
                htmlFor="drive-url-input"
                className="text-[13px] font-semibold uppercase tracking-widest"
                style={{ color: "#8E8E93" }}
              >
                Google Drive Link
              </label>
              <div
                className="flex items-center gap-3 rounded-xl"
                style={{
                  background: "#2c2c2e",
                  padding: "14px 16px",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Link2 size={18} style={{ color: "#8E8E93", flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  id="drive-url-input"
                  type="url"
                  value={driveUrl}
                  onChange={e => { setDriveUrl(e.target.value); setState("idle"); }}
                  placeholder="Paste your Drive share link…"
                  className="flex-1 bg-transparent text-white text-[16px] outline-none placeholder:text-[#636366] min-w-0"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  // Override the global input styles so this looks clean
                  style={{ border: "none", boxShadow: "none", borderRadius: 0, padding: 0 }}
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  id="paste-drive-link"
                  className="text-[16px] font-semibold shrink-0 active:opacity-50 transition-opacity"
                  style={{ color: "#0A84FF" }}
                >
                  Paste
                </button>
              </div>
              {driveUrl && isValidDriveLink(driveUrl) && (
                <div className="flex items-center gap-2 pl-1">
                  <Check size={14} className="text-green-400" />
                  <span className="text-green-400 text-[13px]">Valid Drive link detected</span>
                </div>
              )}
            </div>

            {/* Caption */}
            <div className="flex flex-col gap-3">
              <label
                htmlFor="video-caption-input"
                className="text-[13px] font-semibold uppercase tracking-widest"
                style={{ color: "#8E8E93" }}
              >
                Caption
              </label>
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: "#2c2c2e",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <textarea
                  id="video-caption-input"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Write a caption…"
                  rows={5}
                  maxLength={200}
                  className="w-full bg-transparent text-white text-[16px] leading-relaxed outline-none resize-none placeholder:text-[#636366]"
                  style={{
                    padding: "16px",
                    border: "none",
                    boxShadow: "none",
                    borderRadius: 0,
                  }}
                />
                <div
                  className="flex justify-end px-4 pb-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span className="text-[13px]" style={{ color: "#636366" }}>
                    {caption.length}/200
                  </span>
                </div>
              </div>
            </div>

            {/* Error */}
            {state === "error" && (
              <div
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: "rgba(255,59,48,0.12)", border: "1px solid rgba(255,59,48,0.25)" }}
              >
                <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-[15px] leading-snug">{errorMsg}</p>
              </div>
            )}
          </form>

          {/* Hint */}
          <p
            className="text-center text-[13px] leading-relaxed mt-8"
            style={{ color: "#636366" }}
          >
            Set file sharing to{" "}
            <span style={{ color: "#8E8E93" }}>"Anyone with the link"</span>{" "}
            in Google Drive before sharing.
          </p>
        </div>
      </div>
    </div>
  );
}
