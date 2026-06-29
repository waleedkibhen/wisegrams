/**
 * driveUtils.ts
 *
 * Utilities for working with Google Drive share links.
 *
 * URL strategy (in order of preference):
 *   1. getDriveProxyUrl()   → /api/proxy?id=FILE_ID
 *      Uses our own Next.js proxy, which solves CORS, enables native <video>,
 *      real preloading, Range-based seeking, and browser media caching.
 *
 *   2. getDrivePreviewUrl() → Google Drive /preview iframe embed
 *      Fallback: no CORS issues but no preloading control.
 *      Kept for reference / future iframe fallback mode.
 *
 *   3. getDriveStreamUrl()  → uc?export=download (DEPRECATED)
 *      CORS-blocked by browsers, HTML interstitial for large files.
 *      Do NOT use as a video src in the browser.
 */

/**
 * Extracts the file ID from a Google Drive share URL.
 * Supports:
 *  - https://drive.google.com/file/d/FILE_ID/view
 *  - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *  - https://drive.google.com/open?id=FILE_ID
 *  - https://docs.google.com/file/d/FILE_ID
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;

  const filePattern = /\/file\/d\/([a-zA-Z0-9_-]+)/;
  const fileMatch = url.match(filePattern);
  if (fileMatch) return fileMatch[1];

  const idPattern = /[?&]id=([a-zA-Z0-9_-]+)/;
  const idMatch = url.match(idPattern);
  if (idMatch) return idMatch[1];

  return null;
}

/**
 * Returns our own proxy URL for a Drive file.
 * This is the primary URL used for video playback — enables native <video>
 * with full preloading, seeking, and browser caching.
 */
export function getDriveProxyUrl(shareUrl: string): string | null {
  const fileId = extractDriveFileId(shareUrl);
  if (!fileId) return null;
  return `/api/proxy?id=${fileId}`;
}

/**
 * Returns the Google Drive embedded preview URL (iframe embed).
 * Used as a fallback when the proxy is unavailable.
 * autoplay=1 triggers Google's player to start without a click.
 */
export function getDrivePreviewUrl(shareUrl: string): string | null {
  const fileId = extractDriveFileId(shareUrl);
  if (!fileId) return null;
  return `https://drive.google.com/file/d/${fileId}/preview?autoplay=1&rm=minimal`;
}

/**
 * @deprecated CORS-blocked. Use getDriveProxyUrl() instead.
 */
export function getDriveStreamUrl(shareUrl: string): string | null {
  const fileId = extractDriveFileId(shareUrl);
  if (!fileId) return null;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Returns a thumbnail URL for a Google Drive file.
 */
export function getDriveThumbnailUrl(shareUrl: string): string | null {
  const fileId = extractDriveFileId(shareUrl);
  if (!fileId) return null;
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
}

/**
 * Validates whether a given string looks like a Google Drive share link.
 */
export function isValidDriveLink(url: string): boolean {
  return extractDriveFileId(url) !== null;
}
