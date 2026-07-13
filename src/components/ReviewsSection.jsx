import React from 'react';
import { getTranslations } from 'next-intl/server';
import ReviewsSlider from './ReviewsSlider';

async function getFallbackReviews() {
  const t = await getTranslations();
  return [
    {
      text: t('reviews.fallback1Text'),
      author_name: t('reviews.fallback1Author'),
      relative_time_description: t('reviews.fallback1Time'),
      rating: 5,
    },
    {
      text: t('reviews.fallback2Text'),
      author_name: t('reviews.fallback2Author'),
      relative_time_description: t('reviews.fallback2Time'),
      rating: 5,
    },
    {
      text: t('reviews.fallback3Text'),
      author_name: t('reviews.fallback3Author'),
      relative_time_description: t('reviews.fallback3Time'),
      rating: 5,
    },
  ];
}

async function getGoogleReviews() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  
  if (!apiKey || !placeId) {
    console.warn("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY or GOOGLE_PLACE_ID in environment variables.");
    return null;
  }
  
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}&reviews_sort=newest`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.result ?? null;
  } catch (error) {
    console.error("Failed to fetch Google Reviews:", error);
    return null;
  }
}

export default async function ReviewsSection() {
  const googleData = await getGoogleReviews();
  const fallbackReviews = await getFallbackReviews();
  const reviews = googleData?.reviews?.length ? googleData.reviews : fallbackReviews;
  const totalRatings = googleData?.user_ratings_total || "1000";

  return (
    // <section className="relative w-full px-4 md:px-8 lg:px-10 py-16 lg:py-24 overflow-hidden" style={{ background: "linear-gradient(135deg, #FFFDF8 0%, #FFFFFF 100%)" }}>
    <section className="relative w-full px-4 md:px-8 lg:px-10 py-16 lg:py-24 overflow-hidden bg-surface">
      {/* Decorative blobs matching the softer design background */}
      <div className="w-48 h-48 absolute left-0 top-0 bg-[#F188004D] rounded-full blur-[132px] pointer-events-none" />
      <div className="w-48 h-48 absolute right-0 bottom-0 bg-[#F188004D] rounded-full blur-[132px] pointer-events-none" />

      <ReviewsSlider reviews={reviews} totalRatings={totalRatings} />
    </section>
  );
}
