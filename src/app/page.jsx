import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import CategorySection from "@/components/CategorySection";
import WhyChooseUs from "@/components/WhyChooseUs";
import PopularProducts from "@/components/PopularProducts";
import FeatureSections from "@/components/FeatureSections";
import ReviewsSection from "@/components/ReviewsSection";
import CTABanner from "@/components/CTABanner";
import { getTranslations } from "next-intl/server";
import { getHomeData } from "@/lib/api/home";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: t("pages.homeMetadataTitle"),
    description: t("pages.homeMetadataDescription"),
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function Home() {
  const homeData = await getHomeData();

  return (
    <>
      <HeroSection heroBanner={homeData?.hero_banner} />
      <StatsBar />
      <CategorySection />
      <WhyChooseUs images={homeData?.why_choose_business_label} />
      <PopularProducts />
      <FeatureSections quickLinks={homeData?.quick_links} />
      <ReviewsSection />
      <CTABanner footerBanner={homeData?.footer_banner} />
    </>
  );
}

