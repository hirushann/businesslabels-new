"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type ProductImageProps = {
  productName: string;
  mainImage: string;
  galleryImages: string[];
};

type ResponsiveImageProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

function normalizeImages(mainImage: string, galleryImages: string[]): string[] {
  const seen = new Set<string>();
  const orderedImages = [mainImage, ...galleryImages].filter((image): image is string => Boolean(image?.trim()));

  return orderedImages.filter((image) => {
    const normalized = image.trim();
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

function ResponsiveProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  imageClassName = "",
}: ResponsiveImageProps) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        className={`object-contain object-center ${imageClassName}`}
      />
    </div>
  );
}

export default function ProductImage({
  productName,
  mainImage,
  galleryImages,
}: ProductImageProps) {
  const images = useMemo(() => normalizeImages(mainImage, galleryImages), [mainImage, galleryImages]);
  const [selectedImage, setSelectedImage] = useState(images[0] ?? mainImage);

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      {selectedImage ? (
        <ResponsiveProductImage
          src={selectedImage}
          alt={`${productName} main image`}
          sizes="(max-width: 1024px) calc(100vw - 32px), calc(100vw - 560px)"
          priority
          className="aspect-[732/509] w-full rounded-xl bg-white"
          imageClassName="p-0"
        />
      ) : null}

      {images.length > 1 ? (
        <div className="flex w-full items-center gap-3 overflow-x-auto pb-1 sm:gap-4">
          {images.map((thumbnail, index) => {
            const isSelected = thumbnail === selectedImage;

            return (
              <button
                key={`${thumbnail}-${index}`}
                type="button"
                aria-label={`Show image ${index + 1} for ${productName}`}
                onClick={() => setSelectedImage(thumbnail)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-neutral-50 transition-all hover:border-brand sm:h-24 sm:w-24 ${
                  isSelected ? "border-brand ring-1 ring-brand" : "border-neutral-100"
                }`}
              >
                <ResponsiveProductImage
                  src={thumbnail}
                  alt={`${productName} thumbnail ${index + 1}`}
                  sizes="96px"
                  className="h-full w-full bg-neutral-50"
                  imageClassName="p-2"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
