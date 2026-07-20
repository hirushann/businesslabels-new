"use client";

import * as React from "react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import MaterialCard from "@/components/materials/MaterialCard";

interface RecommendedMaterialsSliderProps {
  materials: any[];
  locale: string;
  title?: string;
}

export default function RecommendedMaterialsSlider({
  materials,
  locale,
  title = "Recommended Materials",
}: RecommendedMaterialsSliderProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  React.useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <Carousel
      setApi={setApi}
      opts={{
        align: "start",
        loop: false,
      }}
      className="w-full flex flex-col gap-12"
    >
      <div className="w-full flex justify-between items-center gap-4">
        <h2 className="text-neutral-800 text-3xl md:text-4xl font-bold leading-tight">{title}</h2>
        <div className="flex justify-start items-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            disabled={!canScrollPrev}
            className={`w-12 h-12 flex justify-center items-center rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] transition-all duration-300 ${
              canScrollPrev
                ? "bg-white outline-amber-500 hover:bg-brand-soft text-brand cursor-pointer"
                : "bg-gray-50 outline-gray-200 text-neutral-400 cursor-not-allowed opacity-50"
            }`}
          >
            <svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.231 0.999474L0.999815 8.23065L8.13517 15.366M18.5361 7.66497L1.20108 8.22916" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            disabled={!canScrollNext}
            className={`w-12 h-12 flex justify-center items-center rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] transition-all duration-300 ${
              canScrollNext
                ? "bg-white outline-amber-500 hover:bg-brand-soft text-brand cursor-pointer"
                : "bg-gray-50 outline-gray-200 text-neutral-400 cursor-not-allowed opacity-50"
            }`}
          >
            <svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180">
              <path d="M8.231 0.999474L0.999815 8.23065L8.13517 15.366M18.5361 7.66497L1.20108 8.22916" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <CarouselContent className="-ml-6">
        {materials.map((material) => (
          <CarouselItem key={material.id} className="pl-6 basis-full sm:basis-1/2 md:basis-1/3">
            <MaterialCard material={material} locale={locale} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
