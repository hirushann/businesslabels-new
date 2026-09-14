export function toDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  const mediaPublicUrl = process.env.NEXT_PUBLIC_MEDIA_PUBLIC_URL?.replace(/\/$/, "");
  if (mediaPublicUrl && trimmed.startsWith(`${mediaPublicUrl}/`)) return trimmed;

  if (trimmed.includes("/api/media-proxy?url=")) {
    const idx = trimmed.indexOf("/api/media-proxy");
    const proxyUrl = trimmed.slice(idx);
    const target = new URL(proxyUrl, "http://localhost").searchParams.get("url");

    if (mediaPublicUrl && target?.startsWith(`${mediaPublicUrl}/`)) return target;

    return proxyUrl;
  }

  if (trimmed.startsWith("/") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;

  return `/api/media-proxy?url=${encodeURIComponent(trimmed)}`;
}
