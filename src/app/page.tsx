import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import CategorySection from "@/components/CategorySection";
import WhyChooseUs from "@/components/WhyChooseUs";
import PopularProducts from "@/components/PopularProducts";
import FeatureSections from "@/components/FeatureSections";
import ReviewsSection from "@/components/ReviewsSection";
import CTABanner from "@/components/CTABanner";

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
