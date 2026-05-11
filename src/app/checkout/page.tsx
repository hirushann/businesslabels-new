import type { Metadata } from "next";
import CheckoutPageClient from "@/components/CheckoutPageClient";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Checkout — BusinessLabels",
  description: "Complete your BusinessLabels order with delivery and payment details.",
};

export default function CheckoutPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <>
      <Script
        id="google-maps-api"
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        strategy="afterInteractive"
      />
      <CheckoutPageClient mode="live" />
    </>
  );
}
