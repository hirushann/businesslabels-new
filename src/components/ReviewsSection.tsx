import React from 'react';
import ReviewsSlider from './ReviewsSlider';

const FALLBACK_REVIEWS = [
  {
    text: '"Excellent fast delivery and great support. Highly recommend their label printers and accessories!"',
    author_name: 'David Tui',
    relative_time_description: 'a month ago',
    rating: 5,
  },
  {
    text: '"Quality of the products is super. Happy with the custom form submission procedure as well."',
    author_name: 'Sarah Mitchell',
    relative_time_description: '2 months ago',
    rating: 5,
  },
  {
    text: '"Great team to work with. They helped me find the perfect Epson printer for my business."',
    author_name: 'Priya Sharma',
    relative_time_description: '3 months ago',
    rating: 5,
  },
];

async function getGoogleReviews() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  
  if (!apiKey || !placeId) {
    console.warn("Missing GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID in environment variables.");
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
  const reviews = googleData?.reviews?.length ? googleData.reviews : FALLBACK_REVIEWS;
  const totalRatings = googleData?.user_ratings_total || "1000";

  return (
    <section className="relative w-full px-10 py-24 overflow-hidden" style={{ background: "linear-gradient(135deg, #FFFDF8 0%, #FFFFFF 100%)" }}>
      {/* Decorative blobs matching the softer design background */}
      <div className="w-[600px] h-[600px] absolute -right-20 -bottom-20 bg-orange-50/60 rounded-full blur-[100px] pointer-events-none" />
      <div className="w-[600px] h-[600px] absolute -left-20 -top-20 bg-amber-50/60 rounded-full blur-[100px] pointer-events-none" />

      <ReviewsSlider reviews={reviews} totalRatings={totalRatings} />
    </section>
  );
}
