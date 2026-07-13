"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

type Review = {
  author_name: string;
  profile_photo_url?: string;
  relative_time_description: string;
  rating: number;
  text: string;
};

type ReviewsSliderProps = {
  reviews: Review[];
  totalRatings: string | number;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          width="21"
          height="20"
          viewBox="0 0 21 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.94208 0.340975C10.0944 -0.11398 10.738 -0.113979 10.8903 0.340975L13.0538 6.80111C13.1216 7.00337 13.3102 7.14038 13.5235 7.1423L20.336 7.20365C20.8157 7.20797 21.0146 7.81997 20.629 8.10547L15.1536 12.1594C14.9822 12.2863 14.9101 12.508 14.9742 12.7115L17.0211 19.2095C17.1652 19.6671 16.6446 20.0454 16.2539 19.7669L10.7064 15.8122C10.5328 15.6884 10.2996 15.6884 10.126 15.8122L4.57846 19.7669C4.18778 20.0454 3.66717 19.6671 3.81132 19.2095L5.85817 12.7115C5.92225 12.508 5.85022 12.2863 5.67879 12.1594L0.203404 8.10547C-0.1822 7.81997 0.016654 7.20797 0.496425 7.20365L7.30894 7.1423C7.52223 7.14038 7.71082 7.00337 7.77856 6.80111L9.94208 0.340975Z"
            fill={i < rating ? "#FFC107" : "#E5E7EB"}
          />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSlider({ reviews, totalRatings }: ReviewsSliderProps) {
  const t = useTranslations();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [reviews]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 300;
      scrollRef.current.scrollBy({ left: -(cardWidth + 24), behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 300;
      scrollRef.current.scrollBy({ left: cardWidth + 24, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col gap-10 relative z-10 w-full max-w-360 mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <h2 className="text-neutral-900 text-3xl md:text-[40px] font-bold leading-tight">
          {t('reviews.title', { count: totalRatings })}
        </h2>
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${canScrollLeft
              ? "bg-white border-brand text-brand hover:bg-brand-soft cursor-pointer"
              : "bg-neutral-50 border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            <svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.23124 0.999474L1.00006 8.23065L8.13542 15.366M18.5363 7.66497L1.20132 8.22916" stroke="#989898" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${canScrollRight
              ? "bg-white border-brand text-brand hover:bg-brand-soft cursor-pointer"
              : "bg-neutral-50 border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            <svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.3051 0.999474L18.5363 8.23065L11.401 15.366M1.00007 7.66497L18.3351 8.22916" stroke="var(--brand)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      {/* Slider Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory hide-scrollbar scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {reviews.map((r, idx) => (
          <div
            key={idx}
            className="shrink-0 w-[calc(100%-24px)] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] bg-white rounded-2xl p-8 flex flex-col justify-between border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] snap-start"
          >
            <div className="flex flex-col">
              {/* Reviewer Info */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
                  {r.profile_photo_url ? (
                    <img src={r.profile_photo_url} alt={r.author_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-amber-100 text-brand font-bold text-lg">
                      {r.author_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-neutral-900 text-[17px] font-bold leading-tight">
                    {r.author_name}
                  </span>
                  <span className="text-zinc-400 text-[14px] font-normal leading-tight mt-1">
                    {r.relative_time_description}
                  </span>
                </div>
              </div>

              {/* Stars */}
              <StarRating rating={r.rating || 5} />

              {/* Review Text */}
              <p className="text-zinc-500 text-[15px] font-normal leading-[1.6] line-clamp-6">
                {r.text}
              </p>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-1 mt-8">
              <span className="text-zinc-400 text-xs font-normal">{t("reviews.postedOn")}</span>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
                alt="Google"
                className="h-5 object-contain object-left"
              />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
