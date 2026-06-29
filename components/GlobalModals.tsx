"use client";

import UploadModal from "@/components/UploadModal";
import { useVideoStore } from "@/hooks/useVideoStore";

/**
 * GlobalModals renders app-wide modals driven by Zustand state.
 * Mounted in the root layout so modals can be triggered from any component
 * (e.g., the bottom nav's + button) without prop-drilling.
 */
export default function GlobalModals() {
  const showUploadModal = useVideoStore((s) => s.showUploadModal);
  const setShowUploadModal = useVideoStore((s) => s.setShowUploadModal);

  if (!showUploadModal) return null;

  return <UploadModal onClose={() => setShowUploadModal(false)} />;
}
