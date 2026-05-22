import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import CategorySubnav from "@/components/CategorySubnav";
import ProductsListing from "@/components/ProductsListing";
import {
  parseCatalogSearchParams,
  searchCatalogProducts,
} from "@/lib/search/products";
import type { CatalogSearchResponse } from "@/lib/search/types";
import ReviewsSection from "@/components/ReviewsSection";
import {
  categoryRouteSlug,
  fetchCategoryGroups,
  findCategoryBySlug,
  flattenCategorySlugs,
  resolveLocalized,
  type CategoryNode,
} from "@/lib/categories/tree";

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
  const routeQuery = toUrlSearchParams(rawParams);
<<<<<<< HEAD
  const scopeQuery = new URLSearchParams({
    scope_category: indexedCategorySlugForRoute(slug),
  });
=======

  // Resolve the category tree first so we can scope the catalog by the
  // looked-up category's ID. `category_ids` on each product includes the full
  // ancestor chain, so an ID filter on the current taxon returns both its
  // direct products and every descendant's — without double-counting.
  let categoryGroups: Awaited<ReturnType<typeof fetchCategoryGroups>> = [];
  try {
    categoryGroups = await fetchCategoryGroups(locale);
  } catch (error) {
    console.error(`Failed to load category tree for slug '${slug}'.`, error);
  }

  const lookup = findCategoryBySlug(categoryGroups, slug, locale);
  const currentCategory = lookup?.category;
  const ancestors = lookup?.ancestors ?? [];
  const subcategories: CategoryNode[] = currentCategory?.children ?? [];
  const hasSubcategories = subcategories.length > 0;

  const scopeQuery = new URLSearchParams();
  if (currentCategory) {
    scopeQuery.set("category_id", String(currentCategory.id));
  } else {
    // Fallback when the slug isn't in the tree (stale cache, etc.) — keep the
    // old slug-based scoping so the page still renders something useful.
    scopeQuery.set("category", indexedCategorySlugForRoute(slug));
  }
>>>>>>> hasan
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

  const categoryTitle = currentCategory
    ? resolveLocalized(currentCategory.name, locale)
    : categoryTitleForSlug(slug);

  const breadcrumbItems = [
    { label: t("common.products"), href: "/products" },
    ...ancestors.map((ancestor) => ({
      label: resolveLocalized(ancestor.name, locale),
      href: `/category/${encodeURIComponent(categoryRouteSlug(ancestor, locale))}`,
    })),
    { label: categoryTitle },
  ];

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
              <Breadcrumbs className="text-white" items={breadcrumbItems} />
              <h1 className="text-4xl font-bold leading-[48px] text-white">
                {categoryTitle}
              </h1>
            </div>
          </div>

          {/* Direct subcategories of the current level — always above the
              products. Drilling into one re-renders this section for the
              next level down; the deepest level renders nothing here. */}
          {hasSubcategories ? (
            <CategorySubnav subcategories={subcategories} locale={locale} />
          ) : null}

          {/* Products for the currently selected category. The heading only
              appears when subcategories are present, so the deepest level
              keeps the unchanged product-grid layout. */}
          <div className="flex flex-col gap-6">
            {hasSubcategories ? (
              <h2 className="text-2xl font-bold leading-8 text-neutral-800">
                {t("categoryArchive.productsTitle", { category: categoryTitle })}
              </h2>
            ) : null}

            <ProductsListing
              initialCatalog={initialCatalog}
              initialQueryString={routeQuery.toString()}
              scopeQueryString={scopeQuery.toString()}
              baselineRangeFilters={baselineCatalog.filters.ranges}
              validCategorySlugs={
                currentCategory
                  ? // Facet offers the current category's direct children,
                    // letting the user multi-select to narrow into one or
                    // more subcategories. Leaf categories produce an empty
                    // list and the facet auto-hides.
                    subcategories
                        .map((child) => resolveLocalized(child.slug, locale).trim())
                        .filter((s) => s.length > 0)
                  : // Lookup failed; fall back to the whole tree so the
                    // sidebar still offers something to filter by.
                    flattenCategorySlugs(categoryGroups, locale)
              }
            />
          </div>
        </div>
      </div>

      <ReviewsSection />
    </div>
  );
}
