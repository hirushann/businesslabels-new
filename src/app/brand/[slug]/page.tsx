import type { Metadata } from "next";
import Image from "next/image";
import CategoryListing from "@/components/CategoryListing";

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

  return {
    title: `${brandTitle} — BusinessLabels`,
    description: `Browse ${brandTitle} products from BusinessLabels.`,
  };
}

import { listProducts } from "@/lib/api/products";
import { mapLaravelProductToCardData } from "@/lib/mappings/product";
import { getServerLocale } from "@/lib/i18n/server";

export default async function BrandArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brandTitle = brandTitleForSlug(slug);
  const locale = await getServerLocale();

  let initialProducts: any[] = [];
  try {
    const response = await listProducts({ make: slug, per_page: 24 });
    if (response && response.data) {
      initialProducts = response.data.map((p: any) => mapLaravelProductToCardData(p, locale));
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
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12.6667H6.23083V9.30765C6.23083 9.13699 6.28856 8.99388 6.404 8.87832C6.51956 8.76288 6.66267 8.70516 6.83333 8.70516H9.16667C9.33733 8.70516 9.48044 8.76288 9.596 8.87832C9.71144 8.99388 9.76917 9.13699 9.76917 9.30765V12.6667H12V6.76916C12 6.73504 11.9925 6.7041 11.9775 6.67632C11.9626 6.64854 11.9423 6.62393 11.9167 6.60249L8.12183 3.74999C8.08761 3.7201 8.047 3.70515 8 3.70515C7.953 3.70515 7.91239 3.7201 7.87817 3.74999L4.08333 6.60249C4.05767 6.62393 4.03739 6.64854 4.0225 6.67632C4.0075 6.7041 4 6.73504 4 6.76916V12.6667ZM3 12.6667V6.76916C3 6.57838 3.04267 6.39766 3.128 6.22699C3.21344 6.05621 3.33144 5.9156 3.482 5.80515L7.277 2.94615C7.48756 2.78549 7.72822 2.70515 7.999 2.70515C8.26978 2.70515 8.51111 2.78549 8.723 2.94615L12.518 5.80515C12.6686 5.9156 12.7866 6.05621 12.872 6.22699C12.9573 6.39766 13 6.57838 13 6.76916V12.6667C13 12.9393 12.9015 13.1742 12.7045 13.3712C12.5075 13.5682 12.2727 13.6667 12 13.6667H9.37183C9.20106 13.6667 9.05794 13.6089 8.9425 13.4933C8.82694 13.3779 8.76917 13.2348 8.76917 13.064V9.70516H7.23083V13.064C7.23083 13.2348 7.17306 13.3779 7.0575 13.4933C6.94206 13.6089 6.79894 13.6667 6.62817 13.6667H4C3.72733 13.6667 3.4925 13.5682 3.2955 13.3712C3.0985 13.1742 3 12.9393 3 12.6667Z" fill="white" fillOpacity="0.7" />
              </svg>
              <span className="text-white/70 text-sm font-normal leading-5">Home</span>
              <span className="text-white/70 text-sm font-normal leading-5">/</span>
              <span className="text-white/70 text-sm font-normal leading-5">Brands</span>
              <span className="text-white/70 text-sm font-normal leading-5">/</span>
              <span className="text-white text-sm font-semibold leading-5">{brandTitle}</span>
            </div>
            <h1 className="text-white text-4xl font-bold leading-[48px]">{brandTitle}</h1>
          </div>
        </div>

        <CategoryListing products={initialProducts} brandSlug={slug} />
      </div>
    </div>
  </div>
  );
}
