import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import ProductsListing from "@/components/ProductsListing";
import { parseCatalogSearchParams, searchCatalogProducts } from "@/lib/search/products";
import type { CatalogSearchResponse } from "@/lib/search/types";

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

const reviews = [
  {
    text: "\u201cLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\u2019s standard dummy text ever since the 1500s, when an unknown printer took\u201d",
    name: "David Tui",
    role: "Marketing Manager, HubSync",
    featured: false,
  },
  {
    text: "\u201cLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\u2019s standard dummy text ever since the 1500s, when an unknown printer took\u201d",
    name: "Sarah Mitchell",
    role: "Software Engineer, Anydesk",
    featured: true,
  },
  {
    text: "\u201cLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\u2019s standard dummy text ever since the 1500s, when an unknown printer took\u201d",
    name: "Priya Sharma",
    role: "Product Designer, Designdot",
    featured: false,
  },
];

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
      searchCatalogProducts(parseCatalogSearchParams(initialSearchQuery)),
      searchCatalogProducts(parseCatalogSearchParams(scopeQuery)),
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
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12.6667H6.23083V9.30765C6.23083 9.13699 6.28856 8.99388 6.404 8.87832C6.51956 8.76288 6.66267 8.70516 6.83333 8.70516H9.16667C9.33733 8.70516 9.48044 8.76288 9.596 8.87832C9.71144 8.99388 9.76917 9.13699 9.76917 9.30765V12.6667H12V6.76916C12 6.73504 11.9925 6.7041 11.9775 6.67632C11.9626 6.64854 11.9423 6.62393 11.9167 6.60249L8.12183 3.74999C8.08761 3.7201 8.047 3.70515 8 3.70515C7.953 3.70515 7.91239 3.7201 7.87817 3.74999L4.08333 6.60249C4.05767 6.62393 4.03739 6.64854 4.0225 6.67632C4.0075 6.7041 4 6.73504 4 6.76916V12.6667ZM3 12.6667V6.76916C3 6.57838 3.04267 6.39766 3.128 6.22699C3.21344 6.05621 3.33144 5.9156 3.482 5.80515L7.277 2.94615C7.48756 2.78549 7.72822 2.70515 7.999 2.70515C8.26978 2.70515 8.51111 2.78549 8.723 2.94615L12.518 5.80515C12.6686 5.9156 12.7866 6.05621 12.872 6.22699C12.9573 6.39766 13 6.57838 13 6.76916V12.6667C13 12.9393 12.9015 13.1742 12.7045 13.3712C12.5075 13.5682 12.2727 13.6667 12 13.6667H9.37183C9.20106 13.6667 9.05794 13.6089 8.9425 13.4933C8.82694 13.3779 8.76917 13.2348 8.76917 13.064V9.70516H7.23083V13.064C7.23083 13.2348 7.17306 13.3779 7.0575 13.4933C6.94206 13.6089 6.79894 13.6667 6.62817 13.6667H4C3.72733 13.6667 3.4925 13.5682 3.2955 13.3712C3.0985 13.1742 3 12.9393 3 12.6667Z" fill="white" fillOpacity="0.7" />
                </svg>
                <span className="text-sm font-normal leading-5 text-white/70">/</span>
                <span className="text-sm font-semibold leading-5 text-white">{t("common.products")}</span>
              </div>
              <h1 className="text-4xl font-bold leading-[48px] text-white">{categoryTitle}</h1>
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

      <div className="relative overflow-hidden bg-white px-10 py-24">
        <div className="absolute right-0 top-0 h-48 w-48 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-500/30 blur-[132px]" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-amber-500/30 blur-[132px]" />

        <div className="mx-auto flex max-w-360 flex-col gap-12">
          <div className="flex items-start justify-between">
            <h2 className="text-4xl font-bold leading-[48px] text-neutral-800">{t("reviewsSection.title")}</h2>
            <div className="flex items-center gap-6">
              <button className="flex h-12 w-12 items-center justify-center rounded-[100px] bg-white p-3 shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-gray-200 transition-colors hover:bg-gray-50">
                <svg className="h-4 w-4 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-[100px] bg-white p-3 shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-amber-500 transition-colors hover:bg-amber-50">
                <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.name}
                className={`flex flex-col gap-8 rounded-xl p-6 ${
                  review.featured
                    ? "bg-gradient-to-br from-orange-50 to-white outline outline-2 outline-offset-[-2px] outline-orange-100"
                    : "bg-white outline outline-1 outline-offset-[-1px] outline-zinc-100"
                }`}
              >
                <p className="text-lg font-normal leading-7 text-neutral-700">{review.text}</p>
                <div className="flex items-center gap-4">
                  <div className="w-1 self-stretch rounded-[32px] bg-amber-500" />
                  <div className="flex flex-col gap-2">
                    <span className="text-xl font-bold leading-6 text-neutral-800">{review.name}</span>
                    <span className="text-base font-normal leading-6 text-zinc-500">{review.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
