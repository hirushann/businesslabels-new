import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CheckoutPageClient from "@/components/CheckoutPageClient";
import Script from "next/script";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("pages.checkoutMetadataTitle"),
    description: t("pages.checkoutMetadataDescription"),
  };
}

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
