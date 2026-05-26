import MyAccountClient from "@/components/MyAccountClient";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Script from "next/script";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("pages.myAccountMetadataTitle"),
    description: t("pages.myAccountMetadataDescription"),
  };
}

export default async function MyAccountPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;
  const authSession = cookieStore.get("auth_session")?.value;

  if (!authToken && !authSession) {
    redirect("/login?redirect=/my-account");
  }

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
