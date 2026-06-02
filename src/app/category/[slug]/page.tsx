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
import { getServerLocale } from "@/lib/i18n";
import ReviewsSection from "@/components/ReviewsSection";
import {
  categoryRouteSlug,
  fetchCategoryGroups,
  findCategoryByPath,
  findCategoryBySlug,
  flattenCategorySlugs,
  resolveLocalized,
  type CategoryNode,
} from "@/lib/categories/tree";
import { localePath } from "@/lib/i18n/utils";
import {
  getAccessoryCategoryPath,
  getAccessoryCategoryRouteSegments,
  getAccessoryVirtualGroupForSegments,
} from "@/lib/routes/accessoryCategories";
import {
  getLabelCategoryLookupSegments,
  getLabelCategoryLookupSegmentsForSegments,
  getLabelCategoryPath,
  getLabelVirtualGroupForSegments,
} from "@/lib/routes/labelCategories";
import { getPrinterCategoryLookupSlug } from "@/lib/routes/printerCategories";

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
  return generateCategoryArchiveMetadata(slug);
}

export async function generateCategoryArchiveMetadata(slug: string): Promise<Metadata> {
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

type CategoryArchiveRouteMode = "legacy" | "productCategory";

function liveProductCategoryPath(locale: string, segments: string[]): string {
  const basePath = locale === "nl" ? "/product-categorie" : "/product-category";
  const encodedSegments = segments.map((segment) => encodeURIComponent(segment));
  return localePath(`${basePath}/${encodedSegments.join("/")}`, locale);
}

function lastSegment(segments: string[]): string {
  return segments.at(-1) ?? "";
}

function visibleSubcategories({
  currentCategory,
  children,
  locale,
  virtualChildSlugs,
}: {
  currentCategory?: CategoryNode;
  children: CategoryNode[];
  locale: string;
  virtualChildSlugs: Set<string> | null;
}): CategoryNode[] {
  const currentSlug = currentCategory ? categoryRouteSlug(currentCategory, locale) : "";

  return children.filter((child) => {
    const childSlug = categoryRouteSlug(child, locale);
    if (child.count <= 0) return false;
    if (virtualChildSlugs) return virtualChildSlugs.has(childSlug);
    if (currentSlug === "labelprinters" && (childSlug === "accessoires" || childSlug === "accessories-1")) {
      return false;
    }
    return true;
  });
}

export async function renderCategoryArchivePage({
  slug,
  routeSegments,
  searchParams,
  routeMode = "legacy",
}: {
  slug: string;
  routeSegments?: string[];
  searchParams: Promise<CategoryPageSearchParams>;
  routeMode?: CategoryArchiveRouteMode;
}) {
  const rawParams = await searchParams;
  const t = await getTranslations();
  const locale = await getServerLocale();
  const categoryLookupSlug = routeMode === "productCategory"
    ? getPrinterCategoryLookupSlug(slug, locale)
    : slug;
  const categoryLookupSegments = routeMode === "productCategory" && routeSegments?.length
    ? getLabelCategoryLookupSegmentsForSegments(routeSegments, locale) ?? [
      ...routeSegments.slice(0, -1),
      getPrinterCategoryLookupSlug(routeSegments.at(-1) ?? slug, locale),
    ]
    : undefined;
  const routeQuery = toUrlSearchParams(rawParams);


  // Resolve the category tree first so we can scope the catalog by the
  // looked-up category's ID. `category_ids` on each product includes the full
  // ancestor chain, so an ID filter on the current taxon returns both its
  // direct products and every descendant's — without double-counting.
  let categoryGroups: Awaited<ReturnType<typeof fetchCategoryGroups>> = [];
  try {
    categoryGroups = await fetchCategoryGroups(locale);
  } catch (error) {
    console.error(`Failed to load category tree for slug '${categoryLookupSlug}'.`, error);
  }

  const virtualAccessoryGroup = routeMode === "productCategory" && routeSegments?.length
    ? getAccessoryVirtualGroupForSegments(routeSegments, locale)
    : null;
  const virtualLabelGroup = routeMode === "productCategory" && routeSegments?.length
    ? getLabelVirtualGroupForSegments(routeSegments, locale)
    : null;
  const virtualAccessoryParentSegments = virtualAccessoryGroup
    ? getAccessoryCategoryRouteSegments(locale, virtualAccessoryGroup.parentKey)
    : null;
  const virtualLabelParentSegments = virtualLabelGroup
    ? getLabelCategoryLookupSegments(locale, virtualLabelGroup.parentKey)
    : null;

  const lookup = virtualAccessoryParentSegments
    ? findCategoryByPath(categoryGroups, virtualAccessoryParentSegments, locale)
    : virtualLabelParentSegments
    ? findCategoryByPath(categoryGroups, virtualLabelParentSegments, locale)
    : categoryLookupSegments
    ? findCategoryByPath(categoryGroups, categoryLookupSegments, locale)
      ?? findCategoryBySlug(categoryGroups, categoryLookupSlug, locale)
    : findCategoryBySlug(categoryGroups, categoryLookupSlug, locale);
  const currentCategory = lookup?.category;
  const ancestors = lookup?.ancestors ?? [];
  const virtualChildSlugs = virtualAccessoryGroup
    ? new Set(
        virtualAccessoryGroup.childKeys.map((key) =>
          lastSegment(getAccessoryCategoryRouteSegments(locale, key)),
        ),
      )
    : virtualLabelGroup
    ? new Set(
        virtualLabelGroup.childKeys.map((key) =>
          lastSegment(getLabelCategoryLookupSegments(locale, key)),
        ),
      )
    : null;
  const virtualLabelSubcategories = virtualLabelGroup
    ? virtualLabelGroup.childKeys
        .map((key) => findCategoryByPath(categoryGroups, getLabelCategoryLookupSegments(locale, key), locale)?.category)
        .filter((category): category is CategoryNode => Boolean(category))
    : null;
  const subcategories = visibleSubcategories({
    currentCategory,
    children: virtualLabelSubcategories ?? currentCategory?.children ?? [],
    locale,
    virtualChildSlugs,
  });
  const hasSubcategories = subcategories.length > 0;

  const scopeQuery = new URLSearchParams();
  if (virtualChildSlugs && subcategories.length > 0) {
    subcategories.forEach((subcategory) => {
      scopeQuery.append("category_id", String(subcategory.id));
    });
  } else if (currentCategory) {
    scopeQuery.set("category_id", String(currentCategory.id));
  } else {
    // Fallback when the slug isn't in the tree (stale cache, etc.) — keep the
    // old slug-based scoping so the page still renders something useful.
    scopeQuery.set("category", indexedCategorySlugForRoute(categoryLookupSlug));
  }
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
    console.error(`Failed to load category catalog for slug '${categoryLookupSlug}'.`, error);
  }

  const categoryTitle = virtualAccessoryGroup
    ? virtualAccessoryGroup.title[locale as "en" | "nl"] ?? virtualAccessoryGroup.title.en
    : virtualLabelGroup
    ? virtualLabelGroup.title[locale as "en" | "nl"] ?? virtualLabelGroup.title.en
    : currentCategory
    ? resolveLocalized(currentCategory.name, locale)
    : categoryTitleForSlug(categoryLookupSlug);
  const currentSegments = currentCategory
    ? [...ancestors, currentCategory].map((category) => categoryRouteSlug(category, locale))
    : [categoryLookupSlug];

  const hrefForCategory =
    routeMode === "productCategory"
      ? (category: CategoryNode) => {
          if (virtualAccessoryGroup) {
            const childKey = virtualAccessoryGroup.childKeys.find((key) => {
              return lastSegment(getAccessoryCategoryRouteSegments(locale, key)) === categoryRouteSlug(category, locale);
            });

            if (childKey) return getAccessoryCategoryPath(locale, childKey);
          }

          if (virtualLabelGroup) {
            const childKey = virtualLabelGroup.childKeys.find((key) => {
              return lastSegment(getLabelCategoryLookupSegments(locale, key)) === categoryRouteSlug(category, locale);
            });

            if (childKey) return getLabelCategoryPath(locale, childKey);
          }

          return liveProductCategoryPath(locale, [
            ...currentSegments,
            categoryRouteSlug(category, locale),
          ]);
        }
      : undefined;

  const breadcrumbItems = [
    { label: t("common.products"), href: "/products" },
    ...ancestors.map((ancestor, index) => {
      const ancestorSlug = categoryRouteSlug(ancestor, locale);
      const href =
        routeMode === "productCategory"
          ? liveProductCategoryPath(
              locale,
              ancestors.slice(0, index + 1).map((item) => categoryRouteSlug(item, locale)),
            )
          : `/category/${encodeURIComponent(ancestorSlug)}`;

      return {
        label: resolveLocalized(ancestor.name, locale),
        href,
      };
    }),
    ...((virtualAccessoryGroup || virtualLabelGroup) && currentCategory
      ? [{
          label: resolveLocalized(currentCategory.name, locale),
          href: virtualAccessoryGroup ? getAccessoryCategoryPath(locale) : getLabelCategoryPath(locale),
        }]
      : []),
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
            <CategorySubnav
              subcategories={subcategories}
              ancestors={ancestors}
              locale={locale}
              hrefForCategory={hrefForCategory}
            />
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

export default async function CategoryArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CategoryPageSearchParams>;
}) {
  const { slug } = await params;

  return renderCategoryArchivePage({ slug, searchParams });
}
