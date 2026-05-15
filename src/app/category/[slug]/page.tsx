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
import ReviewsSection from "@/components/ReviewsSection";

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function categoryTitleForSlug(slug: string): string {
  return slugToTitle(slug);
}

function indexedCategorySlugForRoute(slug: string): string {
  if (slug === "labels-en-tickets") {
    return "labels-en-tickets-en";
  }

  return slug;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = `${categoryTitleForSlug(slug)} - Businesslabels`;

  return {
    title,
    description: `Browse our full range of ${categoryTitleForSlug(slug)} products.`,
  };
}

type CategoryPageSearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(query: CategoryPageSearchParams): URLSearchParams {
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

import { getServerLocale } from "@/lib/i18n";

export default async function CategoryArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CategoryPageSearchParams>;
}) {
  const { slug } = await params;
  const rawParams = await searchParams;
  const t = await getTranslations();
  const locale = await getServerLocale();
  const categoryTitle = categoryTitleForSlug(slug);
  const routeQuery = toUrlSearchParams(rawParams);
  const scopeQuery = new URLSearchParams({
    category: indexedCategorySlugForRoute(slug),
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
    console.error(`Failed to load category catalog for slug '${slug}'.`, error);
  }

  return (
    <div className="bg-white">
      <div className="px-10 py-10">
        <div className="mx-auto flex max-w-360 flex-col gap-12">
          <div className="relative h-56 w-full overflow-hidden rounded-xl shadow-md">
            <Image
              src="/images/archive-banner.jpg"
              alt={`${categoryTitle} banner`}
              fill
              sizes="100vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute left-6 top-6 flex flex-col gap-12">
              <Breadcrumbs
                className="text-white"
                items={[
                  { label: t("common.products"), href: "/products" },
                  { label: categoryTitle },
                ]}
              />
              <h1 className="text-4xl font-bold leading-[48px] text-white">
                {categoryTitle}
              </h1>
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

      <ReviewsSection />
    </div>
  );
}
