import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CheckoutPageClient from "@/components/CheckoutPageClient";
import { demoCheckoutItems } from "@/lib/demoCatalog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("pages.demoCheckoutMetadataTitle"),
    description: t("pages.demoCheckoutMetadataDescription"),
  };
}

export default function DemoCheckoutPage() {
  return <CheckoutPageClient mode="demo" demoItems={demoCheckoutItems} />;
}
