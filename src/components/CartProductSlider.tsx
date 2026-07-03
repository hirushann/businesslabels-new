'use client';

import React, { useRef, useState, useEffect } from 'react';
import ProductCard, { type ProductCardData } from '@/components/ProductCard';
import { useTranslations } from 'next-intl';

interface CartProductSliderProps {
  products: ProductCardData[];
}

export default function CartProductSlider({ products }: CartProductSliderProps) {
  const t = useTranslations();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 384;
      scrollRef.current.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 384;
      scrollRef.current.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="w-full bg-[#F7F9FA] py-16 md:py-24 border-t border-slate-100 mt-16 px-4 md:px-8 lg:px-10">
      <div className="max-w-360 mx-auto w-full flex flex-col gap-12">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 w-full">
          <h2 className="text-[#222222] text-3xl md:text-4xl font-bold font-['Segoe_UI'] leading-tight">
            {t('cart.youMayAlsoLike')}
          </h2>
          <div className="flex items-center gap-6 self-end sm:self-auto">
            {/* Left Button */}
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                canScrollLeft
                  ? 'bg-white border-[#F18800] text-[#F18800] hover:bg-amber-50/50 shadow-[4px_4px_20px_rgba(156.78,163.05,160.34,0.2)] cursor-pointer'
                  : 'bg-[#F7F9FA] border-[#E5E7EB] text-[#989898] cursor-not-allowed shadow-[4px_4px_20px_rgba(156.78,163.05,160.34,0.2)]'
              }`}
              aria-label="Previous products"
            >
              <svg width="20" height="17" viewBox="0 0 20 17" fill="none" className="rotate-180" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11.3051 0.999474L18.5363 8.23065L11.401 15.366M1.00007 7.66497L18.3351 8.22916"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {/* Right Button */}
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                canScrollRight
                  ? 'bg-white border-[#F18800] text-[#F18800] hover:bg-amber-50/50 shadow-[4px_4px_20px_rgba(156.78,163.05,160.34,0.2)] cursor-pointer'
                  : 'bg-[#F7F9FA] border-[#E5E7EB] text-[#989898] cursor-not-allowed shadow-[4px_4px_20px_rgba(156.78,163.05,160.34,0.2)]'
              }`}
              aria-label="Next products"
            >
              <svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11.3051 0.999474L18.5363 8.23065L11.401 15.366M1.00007 7.66497L18.3351 8.22916"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Products Scroll Area */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="w-full flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory hide-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => {
            const href = product.slug
              ? (product.type === 'simple' || product.type === 'variable')
                ? { pathname: `/product/${product.slug}`, query: { type: product.type } }
                : { pathname: `/product/${product.slug}` }
              : undefined;

            return (
              <div key={product.sku} className="shrink-0 w-[calc(100%-24px)] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-start flex">
                <ProductCard product={product} href={href} />
              </div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
