"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";

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
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill={i < rating ? "#FBBF24" : "#E5E7EB"}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSlider({ reviews, totalRatings }: ReviewsSliderProps) {
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
    <div className="flex flex-col gap-10 relative z-10 w-full max-w-[1440px] mx-auto">
      {/* Header & Controls */}
      <div className="flex justify-between items-end">
        <h2 className="text-neutral-900 text-[40px] font-bold font-['Segoe_UI'] leading-tight">
          Over {totalRatings} Positive Reviews
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${
              canScrollLeft
                ? "bg-white border-amber-500 text-amber-500 hover:bg-amber-50 cursor-pointer"
                : "bg-neutral-50 border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${
              canScrollRight
                ? "bg-white border-amber-500 text-amber-500 hover:bg-amber-50 cursor-pointer"
                : "bg-neutral-50 border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
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
                    <div className="w-full h-full flex items-center justify-center bg-amber-100 text-amber-600 font-bold text-lg">
                      {r.author_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-neutral-900 text-[17px] font-bold font-['Segoe_UI'] leading-tight">
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
              <p className="text-zinc-500 text-[15px] font-normal font-['Segoe_UI'] leading-[1.6] line-clamp-6">
                {r.text}
              </p>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-1 mt-8">
              <span className="text-zinc-400 text-xs font-normal">Posted on</span>
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
