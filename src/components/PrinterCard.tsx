"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LinkProps } from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorite_printers') || '[]');
    setIsFavorite(favorites.some((p: PrinterCardData) => p.id === printer.id));

    const handleUpdate = () => {
      const updatedFavorites = JSON.parse(localStorage.getItem('favorite_printers') || '[]');
      setIsFavorite(updatedFavorites.some((p: PrinterCardData) => p.id === printer.id));
    };
    window.addEventListener('favorites-updated', handleUpdate);
    return () => window.removeEventListener('favorites-updated', handleUpdate);
  }, [printer.id]);

  const printerName = printer.name ?? "";
  const subtitle = normalizeText(printer.subtitle);
  const imageSrc = normalizeText(printer.mainImage) || "https://placehold.co/600x400";

  const cardContent = (
    <div className="bg-white rounded-xl border border-line shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] flex flex-col overflow-hidden hover:shadow-[2px_8px_28px_0px_rgba(109,109,120,0.18)] transition-shadow duration-200">
      {/* Image area */}
      <div className="relative h-[220px] border-b border-line flex items-center justify-center overflow-hidden bg-line">
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
            className="text-ink text-xl font-bold leading-[120%]"
            style={{ fontFamily: "Segoe UI, sans-serif" }}
          >
            {printerName}
          </h3>
          {subtitle && (
            <p
              className="text-copy text-base font-normal leading-[130%] line-clamp-2"
              style={{ fontFamily: "Segoe UI, sans-serif" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Divider */}
        <hr className="border-t border-line" />

        {/* Action row */}
        <div className="flex items-center gap-3">
          {/* View button */}
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 h-[38px] rounded-full bg-brand text-white font-semibold text-base leading-6 hover:bg-brand-hover transition-colors duration-150"
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('auth_user');
              if (isLoggedIn) {
                const favorites = JSON.parse(localStorage.getItem('favorite_printers') || '[]');
                const isCurrentlyFav = favorites.some((p: PrinterCardData) => p.id === printer.id);
                if (isCurrentlyFav) {
                    const updated = favorites.filter((p: PrinterCardData) => p.id !== printer.id);
                    localStorage.setItem('favorite_printers', JSON.stringify(updated));
                    setIsFavorite(false);
                    toast.success(t('finder.printerRemoved', { fallback: 'Printer removed from favorites!' }));
                } else {
                    favorites.push(printer);
                    localStorage.setItem('favorite_printers', JSON.stringify(favorites));
                    setIsFavorite(true);
                    toast.success(t('finder.printerSaved', { fallback: 'Printer saved to favorites!' }));
                }
                window.dispatchEvent(new Event('favorites-updated'));
              } else {
                setIsDialogOpen(true);
              }
            }}
            className={`w-[38px] h-[38px] flex items-center justify-center rounded-full border transition-colors duration-150 shrink-0 ${
              isFavorite 
                ? 'border-brand text-brand bg-brand-soft' 
                : 'border-line text-[#666666] hover:border-brand hover:text-brand'
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={isFavorite ? "currentColor" : "none"}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                stroke="currentColor"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  const dialogContent = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent 
        className="sm:max-w-[425px]"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{t('finder.bookmarkDialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('finder.bookmarkDialogDesc')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Link
            href="/register"
            className="flex-1 flex items-center justify-center h-10 rounded-full border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {t('register.registerButton')}
          </Link>
          <Link
            href="/login"
            className="flex-1 flex items-center justify-center h-10 rounded-full bg-brand font-semibold text-white hover:bg-brand-hover transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {t('login.loginButton')}
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (href) {
    return (
      <>
        <Link href={href} className="block h-full w-full">
          {cardContent}
        </Link>
        {dialogContent}
      </>
    );
  }

  return (
    <>
      {cardContent}
      {dialogContent}
    </>
  );
}

