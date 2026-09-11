import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import CategorySubnav from "@/components/CategorySubnav";
import ProductsListing from "@/components/ProductsListing";
import ReviewsSection from "@/components/ReviewsSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  archiveChildrenForNavigation,
  resolveCategoryArchive,
  type CategoryArchiveNode,
} from "@/lib/categories/archives";
import {
  categoryCanonicalUrlsById,
  categoryName,
  categorySlug,
  fetchCategoryGroups,
  findCategoryById,
  type CategoryGroup,
  type CategoryNode,
} from "@/lib/categories/tree";
import { getServerLocale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n/utils";
import {
  parseCatalogSearchParams,
  searchCatalogProducts,
} from "@/lib/search/products";
import type { CatalogSearchResponse } from "@/lib/search/types";
import { htmlToText } from "@/lib/utils";
import {
  getAccessoryCategoryPath,
  getAccessoryVirtualGroupForSegments,
  type AccessoryVirtualGroup,
} from "@/lib/routes/accessoryCategories";
import {
  getLabelCategoryPath,
  getLabelVirtualGroupForSegments,
  getLegacyLabelCategoryIdentityForSegments,
  type LabelVirtualGroup,
} from "@/lib/routes/labelCategories";

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

type CategoryImages = Pick<CategoryNode, "image" | "main_image">;

function categoryImagesByIdentity(groups: CategoryGroup[]): Map<number, CategoryImages> {
  const images = new Map<number, CategoryImages>();

  const visit = (categories: CategoryNode[]) => {
    categories.forEach((category) => {
      if (category.image || category.main_image) {
        images.set(category.id, {
          image: category.image,
          main_image: category.main_image,
        });
      }
      visit(category.children ?? []);
    });
  };

  groups.forEach((group) => visit(group.categories ?? []));
  return images;
}

function asCategoryNode(
  archive: CategoryArchiveNode,
  imagesByIdentity: Map<number, CategoryImages>,
): CategoryNode {
  const fallbackImages = archive.identity_id
    ? imagesByIdentity.get(archive.identity_id)
    : undefined;

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
    image: archive.image ?? fallbackImages?.image,
    main_image: archive.main_image ?? fallbackImages?.main_image,
    children: (archive.children ?? []).map((child) =>
      asCategoryNode(child, imagesByIdentity),
    ),
  };
}

type VirtualCategoryGroup = {
  group: AccessoryVirtualGroup | LabelVirtualGroup;
  paths: Record<"en" | "nl", string>;
};

function virtualCategoryGroup(
  segments: string[],
  locale: "en" | "nl",
): VirtualCategoryGroup | null {
  const accessory = getAccessoryVirtualGroupForSegments(segments, locale);
  if (accessory) {
    return {
      group: accessory,
      paths: {
        en: getAccessoryCategoryPath("en", accessory.key),
        nl: getAccessoryCategoryPath("nl", accessory.key),
      },
    };
  }

  const labels = getLabelVirtualGroupForSegments(segments, locale);
  if (!labels) return null;
  return {
    group: labels,
    paths: {
      en: getLabelCategoryPath("en", labels.key),
      nl: getLabelCategoryPath("nl", labels.key),
    },
  };
}

async function categoryRouteFor(params: ProductCategoryPageProps["params"]) {
  const [{ slug }, locale] = await Promise.all([params, getServerLocale()]);
  const segments = slug.map((segment) => decodeURIComponent(segment));
  const path = segments.join("/");

  return {
    locale,
    path,
    segments,
    virtual: virtualCategoryGroup(segments, locale),
  };
}

export async function generateMetadata({ params }: ProductCategoryPageProps): Promise<Metadata> {
  const route = await categoryRouteFor(params);
  if (route.virtual) {
    const title = route.virtual.group.title[route.locale];
    return {
      title,
      alternates: {
        canonical: route.virtual.paths[route.locale],
        languages: {
          ...route.virtual.paths,
          "x-default": route.virtual.paths.nl,
        },
      },
    };
  }

  const resolved = await resolveCategoryArchive(route.locale, route.path);
  if (!resolved) return {};

  return {
    title: htmlToText(resolved.archive.meta_title || resolved.archive.name || ""),
    description: htmlToText(resolved.archive.meta_description || resolved.archive.description || "") || undefined,
    alternates: {
      canonical: resolved.archive.canonical_url,
      languages: {
        ...resolved.archive.alternate_urls,
        "x-default": resolved.archive.alternate_urls.nl ?? resolved.archive.canonical_url,
      },
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
  const route = await categoryRouteFor(params);
  const [rawQuery, t, categoryGroups, resolved] = await Promise.all([
    searchParams,
    getTranslations(),
    fetchCategoryGroups(),
    route.virtual ? Promise.resolve(null) : resolveCategoryArchive(route.locale, route.path),
  ]);
  const { locale } = route;
  const canonicalUrls = categoryCanonicalUrlsById(categoryGroups);
  const query = toSearchParams(rawQuery);

  const legacyIdentityId = getLegacyLabelCategoryIdentityForSegments(route.segments, locale);
  const legacyDestination = legacyIdentityId === null
    ? null
    : canonicalUrls[legacyIdentityId]?.[locale];
  if (legacyDestination) {
    const queryString = query.toString();
    permanentRedirect(queryString ? `${legacyDestination}?${queryString}` : legacyDestination);
  }

  if (!resolved && !route.virtual) notFound();

  const expectedRouteBase = locale === "en" ? "product-category" : "product-categorie";
  if (route.virtual && requestedRouteBase !== expectedRouteBase) {
    const destination = route.virtual.paths[locale];
    const queryString = query.toString();
    permanentRedirect(queryString ? `${destination}?${queryString}` : destination);
  }
  if (resolved && (resolved.redirect_to || requestedRouteBase !== expectedRouteBase)) {
    const destination = resolved.redirect_to ?? resolved.archive.canonical_url;
    const queryString = query.toString();
    permanentRedirect(queryString ? `${destination}?${queryString}` : destination);
  }

  const virtualParent = route.virtual
    ? findCategoryById(categoryGroups, route.virtual.group.parentId)
    : null;
  const virtualChildren = route.virtual
    ? route.virtual.group.childIds
        .map((id) => findCategoryById(categoryGroups, id)?.category)
        .filter((category): category is CategoryNode => Boolean(category))
    : [];
  if (route.virtual && (!virtualParent || virtualChildren.length === 0)) notFound();

  const scopeQuery = new URLSearchParams();
  if (route.virtual) {
    virtualChildren.forEach((category) => scopeQuery.append("category_id", String(category.id)));
  } else if (resolved) {
    scopeQuery.set("category_term_id", String(resolved.archive.term_id));
  }
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
    console.error(`Failed to load category archive '${route.path}'.`, error);
  }

  const archiveChildren = resolved ? archiveChildrenForNavigation(resolved.archive) : [];
  const imagesByIdentity = categoryImagesByIdentity(categoryGroups);
  const childNodes = route.virtual
    ? virtualChildren
    : archiveChildren.map((child) => asCategoryNode(child, imagesByIdentity));
  const childUrls = new Map(
    route.virtual
      ? virtualChildren.flatMap((child) => {
          const path = child.canonical_urls?.[locale];
          return path ? [[child.id, path] as const] : [];
        })
      : archiveChildren.map((child) => [child.term_id, child.canonical_url] as const),
  );
  const ancestorNodes = route.virtual && virtualParent
    ? [...virtualParent.ancestors, virtualParent.category]
    : (resolved?.ancestors ?? []).map((ancestor) => asCategoryNode(ancestor, imagesByIdentity));
  const categoryTitle = route.virtual
    ? route.virtual.group.title[locale]
    : resolved?.archive.name ?? "";
  const breadcrumbs = [
    { label: t("common.products"), href: localePath("/product", locale) },
    ...(route.virtual && virtualParent
      ? [...virtualParent.ancestors, virtualParent.category].flatMap((category) => {
          const href = category.canonical_urls?.[locale];
          return href ? [{ label: categoryName(category, locale), href }] : [];
        })
      : (resolved?.ancestors ?? []).map((ancestor) => ({
          label: ancestor.name,
          href: ancestor.canonical_url,
        }))),
    { label: categoryTitle },
  ];

  return (
    <div className="bg-white">
      <div className="px-4 py-10 sm:px-6 lg:px-10">
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
              <Breadcrumbs className="text-white" items={breadcrumbs} />
              <h1 className="text-4xl font-bold leading-[48px] text-white">
                {categoryTitle}
              </h1>
            </div>
          </div>

          <CategorySubnav
            subcategories={childNodes}
            ancestors={ancestorNodes}
            locale={locale}
            hrefForCategory={(category) => childUrls.get(category.id) ?? route.virtual?.paths[locale] ?? resolved?.archive.canonical_url ?? "/product"}
          />

          <div className="flex flex-col gap-6">
            {childNodes.length > 0 ? (
              <h2 className="text-2xl font-semibold leading-8 text-neutral-800">
                {t("categoryArchive.productsTitle", { category: categoryTitle })}
              </h2>
            ) : null}

            <ProductsListing
              initialCatalog={initialCatalog}
              initialQueryString={query.toString()}
              scopeQueryString={scopeQuery.toString()}
              baselineRangeFilters={baselineCatalog.filters.ranges}
              validCategorySlugs={childNodes.map((child) => categorySlug(child, locale)).filter(Boolean)}
            />
          </div>
        </div>
      </div>

      <ReviewsSection />
    </div>
  );
}

export default ProductCategoryPage;
