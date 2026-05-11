import MyAccountClient from "@/components/MyAccountClient";
import { Metadata } from "next";
import Script from "next/script";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("pages.myAccountMetadataTitle"),
    description: t("pages.myAccountMetadataDescription"),
  };
}

export default function MyAccountPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <>
      <Script
        id="google-maps-api"
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        strategy="afterInteractive"
      />
      <MyAccountClient />
    </>
  );
}
