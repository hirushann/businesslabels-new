import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function unescapeHtml(html: string) {
  if (!html) return '';
  const named: Record<string, string> = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"' };
  return html.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (entity, decimal: string, hex: string, name: string) => {
    if (name) return named[name.toLowerCase()] ?? entity;
    const codePoint = Number.parseInt(decimal || hex, decimal ? 10 : 16);
    return Number.isInteger(codePoint) && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
  });
}

export function htmlToText(html: string) {
  return unescapeHtml(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

/**
 * Normalizes media and PDF links in CMS HTML so that:
 * 1. Links to /wp-content/uploads/ point to the local domain (which rewrites to media proxy)
 * 2. Remote storage images point to /api/media-proxy
 */
export function sanitizeCmsHtml(html: string | null | undefined): string {
  if (!html) return '';

  return html
    .replace(
      /https?:\/\/(?:dashboard\.businesslabels\.nl|bbnl\.dayzsolutions\.com|businesslabels\.test)\/wp-content\/uploads\//gi,
      '/wp-content/uploads/'
    )
    .replace(
      /(<img[^>]+src=["'])(https?:\/\/(?:dashboard\.businesslabels\.nl|bbnl\.dayzsolutions\.com|businesslabels\.test)\/storage\/[^"']+)(["'])/gi,
      (_match, p1, p2, p3) => `${p1}/api/media-proxy?url=${encodeURIComponent(p2)}${p3}`
    );
}

