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
