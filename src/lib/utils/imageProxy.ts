/**
 * Converts a remote image URL to use the media-proxy route.
 * Local paths, data URIs, and blob URIs are returned as-is.
 * 
 * @param url - The image URL to proxy
 * @returns Proxied URL or null if invalid
 */
export function toDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  if (trimmed.includes("/api/media-proxy?url=")) {
    const idx = trimmed.indexOf("/api/media-proxy");
    return trimmed.slice(idx);
  }

  return `/api/media-proxy?url=${encodeURIComponent(trimmed)}`;
}
