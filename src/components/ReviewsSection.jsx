import React from 'react';
import ReviewsSlider from './ReviewsSlider';
import { ALL_GOOGLE_REVIEWS } from '@/data/googleReviews';

async function getGoogleReviews() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  let totalRatings = 25;
  const liveReviews = [];

  if (apiKey && placeId) {
    // 1. Fetch from Places API (New) with languageCode=nl and FORCE originalText
    try {
      const resNew = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?languageCode=nl`,
        {
          headers: {
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "reviews,rating,userRatingCount",
          },
          next: { revalidate: 3600 },
        }
      );

      if (resNew.ok) {
        const newData = await resNew.json();
        if (newData.userRatingCount) {
          totalRatings = newData.userRatingCount;
        }
        if (Array.isArray(newData.reviews)) {
          for (const r of newData.reviews) {
            // FORCE the original untranslated review text!
            const text = r.originalText?.text || r.text?.text || "";
            if (text.trim()) {
              liveReviews.push({
                text: text.trim(),
                author_name: r.authorAttribution?.displayName || "Google Customer",
                profile_photo_url: r.authorAttribution?.photoUri || "",
                relative_time_description: r.relativePublishTimeDescription || "",
                rating: r.rating || 5,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Places API (New) fetch error:", error);
    }

    // 2. Also try Legacy Places API with language=nl & translated=false
    try {
      const resLegacy = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}&language=nl&reviews_sort=newest&translated=false`,
        { next: { revalidate: 3600 } }
      );

      if (resLegacy.ok) {
        const legacyData = await resLegacy.json();
        if (legacyData.status === "OK" && legacyData.result) {
          if (legacyData.result.user_ratings_total) {
            totalRatings = legacyData.result.user_ratings_total;
          }
          if (Array.isArray(legacyData.result.reviews)) {
            for (const r of legacyData.result.reviews) {
              if (r.text && !r.translated) {
                liveReviews.push({
                  text: r.text.trim(),
                  author_name: r.author_name || "Google Customer",
                  profile_photo_url: r.profile_photo_url || "",
                  relative_time_description: r.relative_time_description || "",
                  rating: r.rating || 5,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Legacy Places API fetch error:", error);
    }
  }

  // Combine and deduplicate: start with all 25+ verified original Google reviews
  const reviewMap = new Map();
  ALL_GOOGLE_REVIEWS.forEach((r) => {
    reviewMap.set(r.author_name.toLowerCase().trim(), { ...r });
  });

  // Overlay live Google API reviews (updating photos, relative time, and adding any new ones)
  liveReviews.forEach((r) => {
    const key = r.author_name.toLowerCase().trim();
    const existing = reviewMap.get(key);
    if (existing) {
      reviewMap.set(key, {
        ...existing,
        ...r,
        // Always preserve original text
        text: r.text || existing.text,
        profile_photo_url: r.profile_photo_url || existing.profile_photo_url,
      });
    } else {
      // New review not in baseline: insert at the beginning
      reviewMap.set(key, r);
    }
  });

  return {
    reviews: Array.from(reviewMap.values()),
    user_ratings_total: totalRatings,
  };
}

export default async function ReviewsSection() {
  const googleData = await getGoogleReviews();
  const reviews = googleData?.reviews?.length ? googleData.reviews : ALL_GOOGLE_REVIEWS;
  const totalRatings = googleData?.user_ratings_total || 25;

  return (
    <section className="relative w-full px-4 md:px-8 lg:px-10 py-16 lg:py-24 overflow-hidden bg-surface">
      {/* Decorative blobs matching the softer design background */}
      <div className="w-48 h-48 absolute left-0 top-0 bg-[#F188004D] rounded-full blur-[132px] pointer-events-none" />
      <div className="w-48 h-48 absolute right-0 bottom-0 bg-[#F188004D] rounded-full blur-[132px] pointer-events-none" />

      <ReviewsSlider reviews={reviews} totalRatings={totalRatings} />
    </section>
  );
}
