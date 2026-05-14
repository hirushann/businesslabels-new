import type { Metadata } from "next";
import ProductsListing from "@/components/ProductsListing";
import {
  parseCatalogSearchParams,
  searchCatalogProducts,
} from "@/lib/search/products";
import type { CatalogSearchResponse } from "@/lib/search/types";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("pages.productsMetadataTitle"),
    description: t("pages.productsMetadataDescription"),
  };
}

type ProductsPageSearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(query: ProductsPageSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsPageSearchParams>;
}) {
  const t = await getTranslations();
  const rawParams = await searchParams;
  const query = toUrlSearchParams(rawParams);
  let initialCatalog = emptyCatalogResponse;
  let baselineCatalog = emptyCatalogResponse;

  try {
    [initialCatalog, baselineCatalog] = await Promise.all([
      searchCatalogProducts(parseCatalogSearchParams(query)),
      searchCatalogProducts(parseCatalogSearchParams(new URLSearchParams())),
    ]);
  } catch (error) {
    console.error("Failed to load product catalog.", error);
  }

  return (
    <section className="bg-white px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-360 flex-col gap-10">
        <div className="border-b border-slate-200 pb-5">
          <div className="mb-4">
            <Breadcrumbs
              className="text-neutral-900"
              items={[
                { label: t("common.products"), href: "/products" },
                { label: t("common.allProducts") },
              ]}
            />
          </div>
          <div className="flex flex-col gap-5">
            <h1 className="text-3xl font-bold font-['Segoe_UI'] leading-8 text-neutral-800">
              {t("common.allProducts")}
            </h1>
            <ProductsListing
              initialCatalog={initialCatalog}
              initialQueryString={query.toString()}
              baselineRangeFilters={baselineCatalog.filters.ranges}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
