import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import CategorySection from "@/components/CategorySection";
import WhyChooseUs from "@/components/WhyChooseUs";
import PopularProducts from "@/components/PopularProducts";
import FeatureSections from "@/components/FeatureSections";
import ReviewsSection from "@/components/ReviewsSection";
import CTABanner from "@/components/CTABanner";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations();

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://businesslabels.nl";

  return {
    title: t("pages.homeMetadataTitle"),
    description: t("pages.homeMetadataDescription"),
    alternates: {
      canonical: siteUrl,
      languages: {
        en: `${siteUrl}/en`,
        nl: `${siteUrl}/nl`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <CategorySection />
      <WhyChooseUs />
      <PopularProducts />
      <FeatureSections />
      <ReviewsSection />
      <CTABanner />
    </>
  );
}
