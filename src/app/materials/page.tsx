import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import ReviewsSection from "@/components/ReviewsSection";
import { getServerLocale } from "@/lib/i18n/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import MaterialsCatalogClient from "@/components/materials/MaterialsCatalogClient";
import { parseMaterialSearchParams, searchMaterials } from "@/lib/search/materials";
import type { MaterialSearchResponse } from "@/lib/search/materials";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("materialsPage.metadataTitle"),
    description: t("materialsPage.metadataDescription"),
  };
}

type MaterialsPageSearchParams = Record<string, string | string[] | undefined>;

const emptyMaterialsResponse: MaterialSearchResponse = {
  materials: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 12,
};

function toUrlSearchParams(query: MaterialsPageSearchParams): URLSearchParams {
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

export default async function MaterialPage({
  searchParams,
}: {
  searchParams?: Promise<MaterialsPageSearchParams>;
}) {
  const t = await getTranslations();
  const locale = await getServerLocale();
  const rawParams = (await searchParams) ?? {};
  const routeQuery = toUrlSearchParams(rawParams);
  let initialCatalog = emptyMaterialsResponse;

  try {
    initialCatalog = await searchMaterials(parseMaterialSearchParams(routeQuery, locale));
  } catch (error) {
    console.error("Failed to load material catalog.", error);
  }

  return (
    <>
      <div className="relative overflow-hidden bg-[#fafbfe]">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute left-0 top-64 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-500/10 blur-[132px]" />
        <div className="pointer-events-none absolute right-0 top-225 h-72 w-72 translate-x-1/2 rounded-full bg-amber-500/10 blur-[132px]" />

        {/* Hero Section */}
        <section className="px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-10 w-full">
            
            {/* Hero banner */}
            <div className="relative min-h-[260px] overflow-hidden rounded-2xl bg-neutral-900 shadow-[0_15px_40px_rgba(0,0,0,0.06)]">
              <Image
                src="/images/archive-banner.jpg"
                alt="Material Banner"
                fill
                priority
                sizes="(max-width: 1440px) 100vw, 1440px"
                className="object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
              <div className="relative z-10 flex min-h-[260px] flex-col justify-between p-6 sm:p-10">
                <Breadcrumbs 
                  className="text-white/60 hover:text-white/80"
                  items={[
                    { label: t("common.categories"), href: "/categories" },
                    { label: t("common.materials") }
                  ]} 
                />
                <div className="max-w-[768px] mt-6 sm:mt-10">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
                    {t("materialsPage.title")}
                  </h1>
                  <p className="text-sm sm:text-base leading-relaxed text-slate-200">
                    {t("materialsPage.subtitle")}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Materials Catalog Container */}
            <MaterialsCatalogClient
              initialCatalog={initialCatalog}
              initialQueryString={routeQuery.toString()}
              locale={locale}
            />

          </div>
        </section>
      </div>
      <ReviewsSection />
    </>
  );
}
