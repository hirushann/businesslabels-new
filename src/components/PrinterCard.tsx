"use client";

import Image from "next/image";
import Link from "next/link";
import type { LinkProps } from "next/link";
import { useTranslations } from "next-intl";

export type PrinterCardData = {
  id: string | number;
  sku: string;
  name: string;
  subtitle?: string | null;
  excerpt?: string | null;
  mainImage?: string | null;
  slug?: string | null;
  properties?: Record<string, string[]>;
};

type PrinterCardProps = {
  printer: PrinterCardData;
  href?: LinkProps["href"];
};

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export default function PrinterCard({ printer, href }: PrinterCardProps) {
  const t = useTranslations();
  const printerName = printer.name ?? "";
  const subtitle = normalizeText(printer.subtitle);
  const imageSrc = normalizeText(printer.mainImage) || "https://placehold.co/600x400";

  const cardContent = (
    <div className="bg-white rounded-xl border border-[#EDF0F4] shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] flex flex-col overflow-hidden hover:shadow-[2px_8px_28px_0px_rgba(109,109,120,0.18)] transition-shadow duration-200">
      {/* Image area */}
      <div className="relative h-[220px] bg-white border-b border-[#EDF0F4] flex items-center justify-center overflow-hidden">
        <Image
          src={imageSrc}
          alt={printerName}
          width={320}
          height={220}
          className="h-full w-auto object-contain py-6 px-6"
          unoptimized
        />
      </div>

      {/* Content area */}
      <div className="flex flex-col gap-4 p-4 flex-1">
        <div className="flex flex-col gap-2 flex-1">
          <h3
            className="text-[#222222] text-xl font-bold leading-[120%]"
            style={{ fontFamily: "Segoe UI, sans-serif" }}
          >
            {printerName}
          </h3>
          {subtitle && (
            <p
              className="text-[#444444] text-base font-normal leading-[130%] line-clamp-2"
              style={{ fontFamily: "Segoe UI, sans-serif" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Divider */}
        <hr className="border-t border-[#EDF0F4]" />

        {/* Action row */}
        <div className="flex items-center gap-3">
          {/* View button */}
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 h-[38px] rounded-full bg-[#F18800] text-white font-semibold text-base leading-6 hover:bg-[#d97a00] transition-colors duration-150"
            style={{ fontFamily: "Segoe UI, sans-serif" }}
          >
            {/* Eye icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1.5 9C1.5 9 4 3.75 9 3.75C14 3.75 16.5 9 16.5 9C16.5 9 14 14.25 9 14.25C4 14.25 1.5 9 1.5 9Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="9"
                cy="9"
                r="2.25"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t('common.view')}
          </button>

          {/* Bookmark / save icon button */}
          <button
            type="button"
            aria-label={t('finder.savePrinter')}
            className="w-[38px] h-[38px] flex items-center justify-center rounded-full border border-[#EDF0F4] text-[#666666] hover:border-[#F18800] hover:text-[#F18800] transition-colors duration-150 shrink-0"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3.75 2.25H14.25C14.6642 2.25 15 2.58579 15 3V16.125L9 13.125L3 16.125V3C3 2.58579 3.33579 2.25 3.75 2.25Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full w-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

