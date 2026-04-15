"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type ProductImageGalleryProps = {
  productName: string;
  mainImage: string;
  galleryImages: string[];
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

export default function ProductImageGallery({
  productName,
  mainImage,
  galleryImages,
}: ProductImageGalleryProps) {
  const images = useMemo(() => normalizeImages(mainImage, galleryImages), [mainImage, galleryImages]);
  const [selectedImage, setSelectedImage] = useState(images[0] ?? mainImage);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-center items-center">
        <Image
          src={selectedImage}
          alt={`${productName} main image`}
          width={300}
          height={300}
          unoptimized
          className="w-auto h-fit object-contain"
        />
      </div>

      <div className="flex items-center gap-5 flex-wrap">
        {images.map((thumbnail, index) => {
          const isSelected = thumbnail === selectedImage;

          return (
            <button
              key={`${thumbnail}-${index}`}
              type="button"
              aria-label={`Show image ${index + 1} for ${productName}`}
              onClick={() => setSelectedImage(thumbnail)}
              className={`w-24 h-24 relative bg-slate-100 rounded-lg overflow-hidden hover:outline hover:outline-1 hover:outline-amber-500 transition-all ${
                isSelected ? "outline outline-1 outline-offset-[-1px] outline-amber-500" : ""
              }`}
            >
              <Image
                src={thumbnail}
                alt={`${productName} thumbnail ${index + 1}`}
                width={80}
                height={80}
                unoptimized
                className="w-20 h-20 absolute top-2 left-2 object-contain"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
