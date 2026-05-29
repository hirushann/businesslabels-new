import React from 'react';
import { getTranslations } from 'next-intl/server';
import ReviewsSlider from './ReviewsSlider';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';

const REVIEWS_PER_PAGE = 100;

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

function formatReviewDate(dateValue, locale) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(locale === "nl" ? "nl-NL" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

function mapCustomerReview(review, locale) {
  return {
    author_name: review.name || "",
    profile_photo_url: review.avatar || undefined,
    relative_time_description: formatReviewDate(review.reviewed_at || review.created_at, locale),
    rating: review.rating || 5,
    text: review.comment || "",
    source: review.source,
  };
}

async function getCustomerReviews() {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;

  if (!apiBaseUrl) {
    console.warn("Missing BBNL_API_BASE_URL in environment variables.");
    return null;
  }

  try {
    const locale = DEFAULT_LOCALE;
    const reviews = [];
    let totalRatings = 0;
    let page = 1;
    let lastPage = 1;

    do {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(REVIEWS_PER_PAGE),
        lang: locale,
      });
      const url = `${apiBaseUrl}/api/reviews?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      });

      if (!res.ok) return null;

      const data = await res.json();
      const pageReviews = Array.isArray(data?.data) ? data.data : [];
      reviews.push(...pageReviews.map((review) => mapCustomerReview(review, locale)));

      totalRatings = Number(data?.meta?.total) || reviews.length;
      lastPage = Number(data?.meta?.last_page) || page;
      page += 1;
    } while (page <= lastPage);

    return reviews.length ? { reviews, totalRatings } : null;
  } catch (error) {
    console.error("Failed to fetch customer reviews:", error);
    return null;
  }
}

export default async function ReviewsSection() {
  const customerData = await getCustomerReviews();
  const googleData = customerData ? null : await getGoogleReviews();
  const fallbackReviews = await getFallbackReviews();
  const reviews = customerData?.reviews?.length
    ? customerData.reviews
    : googleData?.reviews?.length
      ? googleData.reviews
      : fallbackReviews;
  const totalRatings = customerData?.totalRatings || googleData?.user_ratings_total || "1000";

  return (
    <section className="relative w-full px-4 md:px-8 lg:px-10 py-16 lg:py-24 overflow-hidden" style={{ background: "linear-gradient(135deg, #FFFDF8 0%, #FFFFFF 100%)" }}>
      {/* Decorative blobs matching the softer design background */}
      <div className="w-[600px] h-[600px] absolute -right-20 -bottom-20 bg-orange-50/60 rounded-full blur-[100px] pointer-events-none" />
      <div className="w-[600px] h-[600px] absolute -left-20 -top-20 bg-amber-50/60 rounded-full blur-[100px] pointer-events-none" />

      <ReviewsSlider reviews={reviews} totalRatings={totalRatings} />
    </section>
  );
}
