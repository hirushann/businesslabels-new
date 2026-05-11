import MyAccountClient from "@/components/MyAccountClient";
import { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "My Account | BusinessLabels",
  description: "Manage your account, orders, addresses and profile details.",
};

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
