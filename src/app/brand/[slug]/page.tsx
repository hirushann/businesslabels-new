import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import ProductsListing from "@/components/ProductsListing";
import {
  parseCatalogSearchParams,
  searchCatalogProducts,
} from "@/lib/search/products";
import type { CatalogSearchResponse } from "@/lib/search/types";
import { getServerLocale } from "@/lib/i18n";

const BRAND_TITLES: Record<string, string> = {
  epson: "Epson",
  sii: "Seiko",
  godex: "Godex",
  diamondlabels: "Diamondlabels",
  expo_badge: "ExpoBadge",
  zebra: "Zebra",
  botlr: "Botlr",
  creative: "Creative",
};

function fallbackBrandTitle(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function brandTitleForSlug(slug: string): string {
  return BRAND_TITLES[slug.toLowerCase()] ?? fallbackBrandTitle(slug);
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

type BrandPageSearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(query: BrandPageSearchParams): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined) {
      params.append(key, value);
    }
  });

  return params;
}

const emptyCatalogResponse: CatalogSearchResponse = {
  products: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 24,
  filters: { ranges: [], options: [] },
};

export default async function BrandArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<BrandPageSearchParams>;
}) {
  const { slug } = await params;
  const rawParams = await searchParams;
  const brandTitle = brandTitleForSlug(slug);
  const locale = await getServerLocale();
  const t = await getTranslations();
  const routeQuery = toUrlSearchParams(rawParams);
  
  // Scope the search to the exact brand name in ES
  const scopeQuery = new URLSearchParams({
    brand: brandTitle,
  });
  
  const initialSearchQuery = new URLSearchParams(scopeQuery);
  routeQuery.forEach((value, key) => {
    initialSearchQuery.append(key, value);
  });

  let initialCatalog = emptyCatalogResponse;
  let baselineCatalog = emptyCatalogResponse;

  try {
    [initialCatalog, baselineCatalog] = await Promise.all([
      searchCatalogProducts(parseCatalogSearchParams(initialSearchQuery, locale)),
      searchCatalogProducts(parseCatalogSearchParams(scopeQuery, locale)),
    ]);
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

          <ProductsListing 
            initialCatalog={initialCatalog} 
            initialQueryString={routeQuery.toString()}
            scopeQueryString={scopeQuery.toString()}
            baselineRangeFilters={baselineCatalog.filters.ranges}
          />
        </div>
      </div>
    </div>
  );
}
