import { localePath } from "@/lib/i18n/utils";
import type { Printer, PrinterTranslation } from "@/lib/types/printer";

export function getPrinterPath(locale: string, slug?: string | null): string {
  const trimmedSlug = slug?.trim();
  const path = trimmedSlug
    ? `/printers/${encodeURIComponent(trimmedSlug)}/`
    : "/printers";

  return localePath(path, locale);
}

export function getPrinterLocaleSlugs(
  printer: Printer,
  fallbackSlug?: string,
): { en: string; nl: string } {
  let enSlug = printer.slug || fallbackSlug || "";
  let nlSlug = printer.slug || fallbackSlug || "";

  const translations = (
    Array.isArray(printer.translations)
      ? printer.translations
      : Object.values(printer.translations ?? {})
  ) as Array<Record<string, any> & { language?: string; slug?: string }>;

  for (const entry of translations) {
    if (entry.en?.slug) enSlug = entry.en.slug;
    if (entry.nl?.slug) nlSlug = entry.nl.slug;
    if (entry.language === "en" && entry.slug) enSlug = entry.slug;
    if (entry.language === "nl" && entry.slug) nlSlug = entry.slug;
  }

  return {
    en: enSlug,
    nl: nlSlug,
  };
}

export function getPrinterTranslation(
  printer: Printer,
  locale: string,
): PrinterTranslation | null {
  const translations = (
    Array.isArray(printer.translations)
      ? printer.translations
      : Object.values(printer.translations ?? {})
  ) as Array<Record<string, any> & { language?: string }>;

  for (const entry of translations) {
    if (entry[locale]) return entry[locale] as PrinterTranslation;
    if (entry.language === locale) return entry as unknown as PrinterTranslation;
  }
  return null;
}

