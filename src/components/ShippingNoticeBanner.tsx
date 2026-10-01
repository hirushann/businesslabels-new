"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { getShippingNotice, type ShippingNoticeParams } from "@/lib/utils/shippingNotice";

type ShippingNoticeBannerProps = {
  stock?: ShippingNoticeParams["stock"];
  inStock?: ShippingNoticeParams["inStock"];
  delivery_dates_in_stock?: ShippingNoticeParams["delivery_dates_in_stock"];
  delivery_dates_no_stock?: ShippingNoticeParams["delivery_dates_no_stock"];
  /** Compact variant for product cards, default for single product/cart/checkout. */
  variant?: "default" | "compact" | "inline";
  className?: string;
};

export default function ShippingNoticeBanner({
  stock,
  inStock,
  delivery_dates_in_stock,
  delivery_dates_no_stock,
  variant = "default",
  className = "",
}: ShippingNoticeBannerProps) {
  const locale = useLocale();

  const notice = useMemo(() => {
    return getShippingNotice({
      stock,
      inStock,
      delivery_dates_in_stock,
      delivery_dates_no_stock,
      locale: locale === "nl" ? "nl" : "en",
    });
  }, [stock, inStock, delivery_dates_in_stock, delivery_dates_no_stock, locale]);

  if (!notice) return null;

  const isNl = locale === "nl";

  if (variant === "inline") {
    return (
      <p className={`text-xs text-green-700 font-medium flex items-center gap-1.5 ${className}`}>
        <svg
          className="w-3.5 h-3.5 text-green-600 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </svg>
        <span>
          {isNl ? (
            <>
              Bestel nu,{" "}
              <span className="font-bold">{notice.shipLabel}</span>{" "}
              verstuurd
            </>
          ) : notice.isInStock ? (
            <>
              Order now, we ship{" "}
              <span className="font-bold">{notice.shipLabel}</span>
            </>
          ) : (
            <>
              Order now,{" "}
              <span className="font-bold">{notice.shipLabel}</span>{" "}
              shipped
            </>
          )}
        </span>
      </p>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <svg
          className="w-3.5 h-3.5 text-green-600 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </svg>
        <span className="text-xs text-green-700 font-medium leading-tight">
          {isNl ? (
            <>
              Bestel nu,{" "}
              <span className="font-bold">{notice.shipLabel}</span>{" "}
              verstuurd
            </>
          ) : notice.isInStock ? (
            <>
              Order now, we ship{" "}
              <span className="font-bold">{notice.shipLabel}</span>
            </>
          ) : (
            <>
              Order now,{" "}
              <span className="font-bold">{notice.shipLabel}</span>{" "}
              shipped
            </>
          )}
        </span>
      </div>
    );
  }

  // Default variant — full banner (product page, cart, checkout)
  return (
    <div className={`p-3 bg-green-600/10 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-green-600/20 ${className}`}>
      <div className="flex items-center gap-2.5">
        <svg
          className="w-5 h-5 text-green-600 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.67}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </svg>
        <p className="text-sm text-neutral-800 font-medium leading-5">
          {isNl ? (
            <>
              Bestel nu,{" "}
              <span className="text-green-600 font-bold">{notice.shipLabel}</span>{" "}
              verstuurd
            </>
          ) : notice.isInStock ? (
            <>
              Order now, we ship{" "}
              <span className="text-green-600 font-bold">{notice.shipLabel}</span>
            </>
          ) : (
            <>
              Order now,{" "}
              <span className="text-green-600 font-bold">{notice.shipLabel}</span>{" "}
              shipped
            </>
          )}
        </p>
      </div>
    </div>
  );
}
