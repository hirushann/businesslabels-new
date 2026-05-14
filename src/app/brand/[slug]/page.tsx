import type { Metadata } from "next";
import Image from "next/image";
import CategoryListing from "@/components/CategoryListing";
import type { CategoryCardData } from "@/components/CategoryListing";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { listProducts } from "@/lib/api/products";
import { mapLaravelProductToCardData } from "@/lib/mappings/product";
import { getServerLocale } from "@/lib/i18n/server";

const BRAND_TITLES: Record<string, string> = {
  epson: "EPSON",
  sii: "SII",
  godex: "GoDEX",
  diamondlabels: "diamondlabels",
  expo_badge: "EXPO BADGE",
};

function fallbackBrandTitle(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function brandTitleForSlug(slug: string): string {
  return BRAND_TITLES[slug] ?? fallbackBrandTitle(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brandTitle = brandTitleForSlug(slug);
  const t = await getTranslations();

  return {
    title: `${brandTitle} — Businesslabels`,
    description: t("pages.brandDescription", { brand: brandTitle }),
  };
}

export default async function BrandArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brandTitle = brandTitleForSlug(slug);
  const locale = await getServerLocale();
  const t = await getTranslations();

  let initialProducts: CategoryCardData[] = [];
  try {
    const response = await listProducts({ make: slug, per_page: 24 });
    if (response && response.data) {
      initialProducts = (response.data as Array<Parameters<typeof mapLaravelProductToCardData>[0]>).map((product) =>
        mapLaravelProductToCardData(product, locale),
      );
    }
  } catch (error) {
    console.error(`Failed to fetch products for brand ${slug}:`, error);
  }

  return (
    <div className="bg-white">
      <div className="px-10 py-10">
        <div className="max-w-360 mx-auto flex flex-col gap-12">
          <div className="relative w-full h-56 rounded-xl overflow-hidden shadow-md">
            <Image
              src="/images/archive-banner.jpg"
              alt={`${brandTitle} banner`}
              fill
              sizes="100vw"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute left-6 top-6 flex flex-col gap-12">
              <Breadcrumbs 
                className="text-white/70"
                items={[
                  { label: t("common.brands"), href: "/brand" },
                  { label: brandTitle }
                ]} 
              />
            <h1 className="text-white text-4xl font-bold leading-[48px]">{brandTitle}</h1>
          </div>
        </div>

        <CategoryListing products={initialProducts} brandSlug={slug} />
      </div>
    </div>
  </div>
  );
}
