import MyAccountClient from "@/components/MyAccountClient";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("pages.myAccountMetadataTitle"),
    description: t("pages.myAccountMetadataDescription"),
  };
}

export default function MyAccountPage() {
  return <MyAccountClient />;
}
