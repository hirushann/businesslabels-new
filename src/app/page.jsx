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

  return {
    title: t("pages.homeMetadataTitle"),
    description: t("pages.homeMetadataDescription"),
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
