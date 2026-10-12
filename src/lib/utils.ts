import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function unescapeHtml(html: string) {
  if (!html) return '';
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
    ndash: '–',
    mdash: '—',
    hellip: '…',
    bull: '•',
    euro: '€',
    copy: '©',
    reg: '®',
    trade: '™',
  };
  return html.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (entity, decimal: string, hex: string, name: string) => {
    if (name) return named[name.toLowerCase()] ?? entity;
    const codePoint = Number.parseInt(decimal || hex, decimal ? 10 : 16);
    return Number.isInteger(codePoint) && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
  });
}

export function htmlToText(html: string) {
  return unescapeHtml(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function altTextFromSrc(src: string): string {
  const file = src.split(/[?#]/)[0].split('/').pop() ?? '';
  let name = file;
  try {
    name = decodeURIComponent(file);
  } catch {
    // keep the raw filename when it is not valid percent-encoding
  }
  return name
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/-\d+x\d+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Adds alt text to CMS `<img>` tags that have none (or an empty one), derived
 * from the image filename, so editor-uploaded images are not reported as
 * missing alt text. Existing non-empty alt text is left untouched.
 */
export function ensureImgAlt(html: string | null | undefined): string {
  if (!html) return '';

  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const alt = tag.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (alt && (alt[1] ?? alt[2] ?? '').trim()) return tag;

    const src = tag.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const text = src ? altTextFromSrc(src[1] ?? src[2] ?? '') : '';
    if (!text) return tag;

    const escaped = text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    if (alt) return tag.replace(alt[0], `alt="${escaped}"`);
    return tag.replace(/<img\b/i, `<img alt="${escaped}"`);
  });
}

/**
 * Normalizes media and PDF links in CMS HTML so that:
 * 1. Links to /wp-content/uploads/ point to the local domain (which rewrites to media proxy)
 * 2. Remote storage images point to /api/media-proxy
 */
export function sanitizeCmsHtml(html: string | null | undefined): string {
  if (!html) return '';

  return ensureImgAlt(html)
    .replace(
      /https?:\/\/(?:dashboard\.businesslabels\.nl|bbnl\.dayzsolutions\.com|businesslabels\.test)\/wp-content\/uploads\//gi,
      '/wp-content/uploads/'
    )
    .replace(
      /(<img[^>]+src=["'])(https?:\/\/(?:dashboard\.businesslabels\.nl|bbnl\.dayzsolutions\.com|businesslabels\.test)\/storage\/[^"']+)(["'])/gi,
      (_match, p1, p2, p3) => `${p1}/api/media-proxy?url=${encodeURIComponent(p2)}${p3}`
    );
}

