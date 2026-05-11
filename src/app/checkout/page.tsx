import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CheckoutPageClient from "@/components/CheckoutPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("pages.checkoutMetadataTitle"),
    description: t("pages.checkoutMetadataDescription"),
  };
}

export default function CheckoutPage() {
  return <CheckoutPageClient mode="live" />;
}
