/**
 * Converts a remote image URL to use the media-proxy route.
 * Local paths, data URIs, and blob URIs are returned as-is.
 * 
 * @param url - The image URL to proxy
 * @returns Proxied URL or null if invalid
 */
export function toDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  if (url.startsWith("/") || url.startsWith("data:") || url.startsWith("blob:")) return url;

  return `/api/media-proxy?url=${encodeURIComponent(url)}`;
}
