import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import CategorySubnav from "@/components/CategorySubnav";
import ProductsListing from "@/components/ProductsListing";
import ReviewsSection from "@/components/ReviewsSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  resolveCategoryArchive,
  type CategoryArchiveNode,
} from "@/lib/categories/archives";
import type { CategoryNode } from "@/lib/categories/tree";
import { getServerLocale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n/utils";
import {
  parseCatalogSearchParams,
  searchCatalogProducts,
} from "@/lib/search/products";
import type { CatalogSearchResponse } from "@/lib/search/types";

type ProductCategoryPageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const emptyCatalogResponse: CatalogSearchResponse = {
  products: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 24,
  filters: { ranges: [], options: [] },
};

function toSearchParams(query: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.append(key, value);
  });
  return params;
}

function asCategoryNode(archive: CategoryArchiveNode): CategoryNode {
  return {
    id: archive.term_id,
    name: archive.name,
    slug: archive.slug,
    meta_title: archive.meta_title,
    meta_description: archive.meta_description,
    translations: {
      [archive.locale]: {
        name: archive.name,
        slug: archive.slug,
        meta_title: archive.meta_title,
        meta_description: archive.meta_description,
      },
    },
    parent_id: archive.parent_term_id,
    count: archive.count,
    children: (archive.children ?? []).map(asCategoryNode),
  };
}

async function archiveFor(params: ProductCategoryPageProps["params"]) {
  const [{ slug }, locale] = await Promise.all([params, getServerLocale()]);
  const path = slug.map((segment) => decodeURIComponent(segment)).join("/");

  return {
    locale,
    path,
    resolved: await resolveCategoryArchive(locale, path),
  };
}

export async function generateMetadata({ params }: ProductCategoryPageProps): Promise<Metadata> {
  const { resolved } = await archiveFor(params);
  if (!resolved) return {};

  return {
    title: resolved.archive.meta_title || resolved.archive.name,
    description: resolved.archive.meta_description || resolved.archive.description || undefined,
    alternates: {
      canonical: resolved.archive.canonical_url,
      languages: resolved.archive.alternate_urls,
    },
  };
}

export async function ProductCategoryPage({
  params,
  searchParams,
  requestedRouteBase = "product-category",
}: ProductCategoryPageProps & {
  requestedRouteBase?: "product-category" | "product-categorie";
}) {
  const [{ locale, resolved }, rawQuery, t] = await Promise.all([
    archiveFor(params),
    searchParams,
    getTranslations(),
  ]);

  if (!resolved) notFound();

  const expectedRouteBase = locale === "en" ? "product-category" : "product-categorie";
  const query = toSearchParams(rawQuery);
  if (resolved.redirect_to || requestedRouteBase !== expectedRouteBase) {
    const destination = resolved.redirect_to ?? resolved.archive.canonical_url;
    const queryString = query.toString();
    permanentRedirect(queryString ? `${destination}?${queryString}` : destination);
  }

  const scopeQuery = new URLSearchParams();
  scopeQuery.set("category_term_id", String(resolved.archive.term_id));
  const initialQuery = new URLSearchParams(scopeQuery);
  query.forEach((value, key) => initialQuery.append(key, value));

  let initialCatalog = emptyCatalogResponse;
  let baselineCatalog = emptyCatalogResponse;
  try {
    [initialCatalog, baselineCatalog] = await Promise.all([
      searchCatalogProducts(parseCatalogSearchParams(initialQuery, locale)),
      searchCatalogProducts(parseCatalogSearchParams(scopeQuery, locale)),
    ]);
  } catch (error) {
    console.error(`Failed to load category archive '${resolved.archive.path}'.`, error);
  }

  const archiveChildren = resolved.archive.children ?? [];
  const childNodes = archiveChildren.map(asCategoryNode);
  const childUrls = new Map(
    archiveChildren.map((child) => [child.term_id, child.canonical_url]),
  );
  const ancestorNodes = resolved.ancestors.map(asCategoryNode);
  const breadcrumbs = [
    { label: t("common.products"), href: localePath("/product", locale) },
    ...resolved.ancestors.map((ancestor) => ({
      label: ancestor.name,
      href: ancestor.canonical_url,
    })),
    { label: resolved.archive.name },
  ];

  return (
    <div className="bg-white">
      <div className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-360 flex-col gap-12">
          <div className="relative h-56 w-full overflow-hidden rounded-xl shadow-md">
            <Image
              src="/images/archive-banner.jpg"
              alt={`${resolved.archive.name} banner`}
              fill
              sizes="100vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute left-6 top-6 flex flex-col gap-12">
              <Breadcrumbs className="text-white" items={breadcrumbs} />
              <h1 className="text-4xl font-bold leading-[48px] text-white">
                {resolved.archive.name}
              </h1>
            </div>
          </div>

          <CategorySubnav
            subcategories={childNodes}
            ancestors={ancestorNodes}
            locale={locale}
            hrefForCategory={(category) => childUrls.get(category.id) ?? resolved.archive.canonical_url}
          />

          <div className="flex flex-col gap-6">
            {childNodes.length > 0 ? (
              <h2 className="text-2xl font-semibold leading-8 text-neutral-800">
                {t("categoryArchive.productsTitle", { category: resolved.archive.name })}
              </h2>
            ) : null}

            <ProductsListing
              initialCatalog={initialCatalog}
              initialQueryString={query.toString()}
              scopeQueryString={scopeQuery.toString()}
              baselineRangeFilters={baselineCatalog.filters.ranges}
              validCategorySlugs={archiveChildren.map((child) => child.slug)}
            />
          </div>
        </div>
      </div>

      <ReviewsSection />
    </div>
  );
}

export default ProductCategoryPage;
