import { localePath } from "@/lib/i18n/utils";

export function getPrinterPath(locale: string, slug?: string | null): string {
  const trimmedSlug = slug?.trim();
  const path = trimmedSlug
    ? `/printers/${encodeURIComponent(trimmedSlug)}/`
    : "/printers";

  return localePath(path, locale);
}
