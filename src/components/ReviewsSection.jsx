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
  
  // Try Legacy Places API first
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}&reviews_sort=newest`,
      { next: { revalidate: 86400 } }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK" && data.result?.reviews?.length) {
        return data.result;
      }
    }
  } catch (error) {
    console.error("Legacy Places API fetch error:", error);
  }

  // Fallback to Places API (New)
  try {
    const resNew = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "reviews,rating,userRatingCount",
        },
        next: { revalidate: 86400 },
      }
    );

    if (resNew.ok) {
      const newData = await resNew.json();
      if (newData.reviews?.length) {
        return {
          reviews: newData.reviews.map((r) => ({
            text: r.text?.text || r.originalText?.text || "",
            author_name: r.authorAttribution?.displayName || "Google Customer",
            profile_photo_url: r.authorAttribution?.photoUri || "",
            relative_time_description: r.relativePublishTimeDescription || "",
            rating: r.rating || 5,
          })),
          user_ratings_total: newData.userRatingCount || "1000",
        };
      }
    }
  } catch (error) {
    console.error("Places API (New) fetch error:", error);
  }

  return null;
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
