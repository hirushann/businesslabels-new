export function toDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();

  if (trimmed.includes("/api/media-proxy?url=")) {
    const idx = trimmed.indexOf("/api/media-proxy");
    const proxyUrl = trimmed.slice(idx);
    try {
      const target = new URL(proxyUrl, "http://localhost").searchParams.get("url");
      if (target?.trim()) {
        return target.trim();
      }
    } catch {
      // fallback
    }
  }

  return trimmed;
}
