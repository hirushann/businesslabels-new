"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

type PrinterActionButtonsProps = {
  printer: {
    id: number | string;
    title: string;
    subtitle?: string | null;
    slug: string;
    image?: string | null;
    properties?: Record<string, string[]>;
  };
  productUrl: string | null;
};

export default function PrinterActionButtons({
  printer,
  productUrl,
}: PrinterActionButtonsProps) {
  const t = useTranslations();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const normalizedPrinter = {
    id: String(printer.id),
    sku: "",
    name: printer.title,
    subtitle: printer.subtitle,
    slug: printer.slug,
    mainImage: printer.image,
    properties: printer.properties,
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkFavorite = () => {
        const favorites = JSON.parse(
          localStorage.getItem("favorite_printers") || "[]"
        );
        setIsFavorite(
          favorites.some((p: any) => String(p.id) === String(printer.id))
        );
      };

      checkFavorite();
      window.addEventListener("favorites-updated", checkFavorite);
      return () => {
        window.removeEventListener("favorites-updated", checkFavorite);
      };
    }
  }, [printer.id]);

  const handleFavoriteToggle = () => {
    const isLoggedIn =
      typeof window !== "undefined" && localStorage.getItem("auth_user");
    if (isLoggedIn) {
      const favorites = JSON.parse(
        localStorage.getItem("favorite_printers") || "[]"
      );
      const isCurrentlyFav = favorites.some(
        (p: any) => String(p.id) === String(printer.id)
      );
      if (isCurrentlyFav) {
        const updated = favorites.filter(
          (p: any) => String(p.id) !== String(printer.id)
        );
        localStorage.setItem("favorite_printers", JSON.stringify(updated));
        setIsFavorite(false);
        toast.success(
          t("finder.printerRemoved", {
            fallback: "Printer removed from favorites!",
          })
        );
      } else {
        favorites.push(normalizedPrinter);
        localStorage.setItem("favorite_printers", JSON.stringify(favorites));
        setIsFavorite(true);
        toast.success(
          t("finder.printerSaved", {
            fallback: "Printer saved to favorites!",
          })
        );
      }
      window.dispatchEvent(new Event("favorites-updated"));
    } else {
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
        {productUrl ? (
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full sm:w-auto px-8 h-[52px] bg-[#f08500] hover:bg-[#d97706] text-white font-bold rounded-full transition-colors font-['Segoe_UI'] shadow-sm text-[18px] text-center whitespace-nowrap"
          >
            {t("finder.viewPrinter")}
          </a>
        ) : null}

        <button
          type="button"
          onClick={handleFavoriteToggle}
          className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 h-[52px] font-bold rounded-full transition-colors font-['Segoe_UI'] shadow-sm text-[18px] border whitespace-nowrap ${
            isFavorite
              ? "border-[#f08500] text-[#f08500] bg-orange-50 hover:bg-orange-100/50"
              : "border-slate-300 text-neutral-700 hover:border-[#f08500] hover:text-[#f08500] bg-white hover:bg-orange-50/20"
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isFavorite ? "currentColor" : "none"}
            className="transition-colors duration-150"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              stroke="currentColor"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          {isFavorite ? t("finder.addedToFavorites") : t("finder.addToFavorites")}
        </button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("finder.bookmarkDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("finder.bookmarkDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Link
              href="/register"
              className="flex-1 flex items-center justify-center h-10 rounded-full border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {t("register.registerButton") || "Register"}
            </Link>
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center h-10 rounded-full bg-[#f08500] font-semibold text-white hover:bg-[#d97706] transition-colors"
            >
              {t("login.loginButton")}
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
