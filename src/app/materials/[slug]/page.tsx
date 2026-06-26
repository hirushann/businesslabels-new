import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Accordion from "@/components/Accordion";
import CTABanner from "@/components/CTABanner";
import IccProfileModal from "@/components/materials/IccProfileModal";
import ScrollToMaterialProductsButton from "@/components/materials/ScrollToMaterialProductsButton";
import ProductsListing from "@/components/ProductsListing";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";
import DownloadSpecSheetButton from "@/components/materials/DownloadSpecSheetButton";
import { parseCatalogSearchParams, searchCatalogProducts } from "@/lib/search/products";
import type { CatalogSearchResponse } from "@/lib/search/types";

type MaterialProduct = {
  id: number;
  name: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  sku: string | null;
  article_number: string | null;
  state: "draft" | "active" | "inactive" | "retired";
  price: number | null;
  stock: number;
  in_stock: boolean;
  main_image: string | null;
  updated_at: string;
  packing_group?: number | null;
};

type MaterialSpec = {
  label: string;
  value: string;
};

type Material = {
  id: number;
  title: string;
  subtitle: string;
  slug: string;
  code: string;
  brand: string;
  brand_label: string | null;
  status: string;
  description: string;
  main_image?: string | null;
  specifications: { material_specs?: MaterialSpec[] } | null;
  print_method: string | null;
  print_method_label: string | null;
  base_material: string | null;
  base_material_label: string | null;
  finish: string | null;
  finish_label: string | null;
  adhesive: string | null;
  adhesive_label: string | null;
  supplier: string | null;
  supplier_label: string | null;
  supplier_reference: string | null;
  price_per_sq_meter: number | null;
  certificate: string | null;
  spec_sheet_url: string;
  has_uploaded_spec_sheet?: boolean;
  categories: {
    id: number;
    name: string;
    slug: string;
  }[];
  products: MaterialProduct[];
  products_count: number;
};

type MaterialResponse = {
  data: Material;
};

type MaterialPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const emptyCatalogResponse: CatalogSearchResponse = {
  products: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 12,
  filters: { ranges: [], options: [] },
};

const MATERIAL_PRODUCTS_SECTION_ID = "products-from-this-material";

function toUrlSearchParams(query: Record<string, string | string[] | undefined>): URLSearchParams {
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

// Data fetching
async function getMaterial(slug: string): Promise<Material | null> {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  if (!baseUrl) return null;
  try {
    const locale = await getServerLocale();
    const response = await fetch(
      withLocaleParam(`${baseUrl}/api/materials/slug/${slug}`, locale),
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const json = (await response.json()) as MaterialResponse;
    return json.data;
  } catch (error) {
    console.error("Error fetching material:", error);
    return null;
  }
}

export async function generateMetadata({ params }: MaterialPageProps): Promise<Metadata> {
  const { slug } = await params;
  const material = await getMaterial(slug);
  if (!material) return { title: "Material — Businesslabels" };
  return {
    title: `${material.title} — Businesslabels`,
    description: material.subtitle,
  };
}

// Sub-components
function ContactIcon({ type }: { type: "call" | "email" | "whatsapp" }) {
  if (type === "call") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92V20A2 2 0 0 1 19.82 22A19.8 19.8 0 0 1 3.08 5.18A2 2 0 0 1 5.06 3H8.15A2 2 0 0 1 10.15 4.72C10.28 5.68 10.5 6.62 10.82 7.52A2 2 0 0 1 10.37 9.63L9.06 10.94A16 16 0 0 0 13.06 14.94L14.37 13.63A2 2 0 0 1 16.48 13.18C17.38 13.5 18.32 13.72 19.28 13.85A2 2 0 0 1 22 16.92Z" />
      </svg>
    );
  }
  if (type === "email") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M2 7l10 7 10-7" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}


function DetailTable({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/5">
      {rows.map((row, index) => (
        <div
          key={`${row.label}-${index}`}
          className={`flex items-center justify-between gap-6 px-4 py-3 ${index % 2 === 0 ? "bg-white/70" : "bg-transparent"}`}
        >
          <span className="text-base leading-6 text-neutral-500">{row.label}</span>
          <span className="text-right text-base font-semibold leading-6 text-neutral-800">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function SidebarCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold leading-6 text-neutral-800">{title}</h2>
        <p className="text-sm leading-5 text-neutral-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function HelpPanel({
  labels,
  materialCode,
}: {
  labels: { title: string; callUs: string; email: string; whatsapp: string };
  materialCode?: string;
}) {
  const actions = [
    {
      label: labels.callUs,
      type: "call" as const,
      href: "tel:+31318590465",
    },
    {
      label: labels.email,
      type: "email" as const,
      href: "mailto:verkoop@businesslabels.nl?&subject=Business%20Labels&body=" + encodeURIComponent(materialCode ?? ""),
    },
    {
      label: labels.whatsapp,
      type: "whatsapp" as const,
      href: "https://wa.me/31318590212?text=" + encodeURIComponent(materialCode ?? ""),
    },
  ];
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)]">
      <h2 className="text-lg font-bold leading-6 text-neutral-800">{labels.title}</h2>
      <div className="grid grid-cols-3 gap-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-100 bg-slate-100/30 p-3 text-center transition-colors hover:border-amber-200 hover:bg-orange-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 shadow-sm">
              <ContactIcon type={action.type} />
            </span>
            <span className="text-sm font-semibold leading-5 text-neutral-800">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MaterialProductsSection({
  title,
  initialCatalog,
  baselineCatalog,
  initialQueryString,
  scopeQueryString,
}: {
  title: string;
  initialCatalog: CatalogSearchResponse;
  baselineCatalog: CatalogSearchResponse;
  initialQueryString: string;
  scopeQueryString: string;
}) {
  return (
    <section id={MATERIAL_PRODUCTS_SECTION_ID} className="scroll-mt-24 bg-gray-50 px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-300 flex-col gap-8">
        <h2 className="text-4xl font-bold leading-12 text-neutral-800">{title}</h2>
        <ProductsListing
          initialCatalog={initialCatalog}
          initialQueryString={initialQueryString}
          scopeQueryString={scopeQueryString}
          baselineRangeFilters={baselineCatalog.filters.ranges}
        />
      </div>
    </section>
  );
}

// Page
export default async function SingleMaterialPage({ params, searchParams }: MaterialPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const t = await getTranslations();
  const locale = await getServerLocale();
  const material = await getMaterial(slug);

  if (!material) notFound();

  const isNl = locale === "nl";
  const category = material.categories?.[0] ?? null;
  const routeQuery = toUrlSearchParams(query);
  const scopeQuery = new URLSearchParams({
    material_id: String(material.id),
    per_page: "12",
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
    console.error("Failed to load material products from Elasticsearch.", error);
  }

  const materialImage =
    toDisplayImageUrl(material.main_image) ||
    toDisplayImageUrl(material.products?.[0]?.main_image) ||
    "/images/labelrolls.png";

  const aboutRows = [
    { label: t("materialSpecs.code"), value: material.code },
    { label: t("materialSpecs.brand"), value: material.brand_label || material.brand },
    { label: t("materialSpecs.printMethod"), value: material.print_method_label || material.print_method },
    { label: t("materialSpecs.baseMaterial"), value: material.base_material_label || material.base_material },
    { label: t("materialSpecs.finish"), value: material.finish_label || material.finish },
    { label: t("materialSpecs.adhesive"), value: material.adhesive_label || material.adhesive },
    { label: t("materialSpecs.supplier"), value: material.supplier_label || material.supplier },
    { label: t("materialSpecs.supplierReference"), value: material.supplier_reference },
    { label: t("materialSpecs.certificate"), value: material.certificate && material.certificate !== "none" ? material.certificate : null },
  ].filter((row): row is { label: string; value: string } => row.value != null && row.value !== "");

  const specEntries = material.specifications?.material_specs ?? [];
  const specRows: { label: string; value: ReactNode }[] = specEntries
    .filter((spec) => spec.label && spec.value)
    .map((spec) => ({ label: spec.label, value: spec.value }));

  const rawSpecRows = specEntries
    .filter((spec) => spec.label && spec.value)
    .map((spec) => ({ label: spec.label, value: spec.value }));

  if (material.spec_sheet_url) {
    specRows.push({
      label: t("materialDetail.specSheet"),
      value: (
        <DownloadSpecSheetButton
          materialId={material.id}
          materialTitle={material.title}
          materialCode={material.code}
          materialSubtitle={material.subtitle || undefined}
          hasUploadedSpecSheet={!!material.has_uploaded_spec_sheet}
          specSheetUrl={material.spec_sheet_url}
          aboutRows={aboutRows}
          specRows={rawSpecRows}
          variant="link"
          downloadLabel={t("materialsPage.downloadSpecSheet")}
          materialImage={materialImage}
          description={material.description}
          pdfTitleLabel={t("materialDetail.specSheet")}
          aboutThisMaterialLabel={t("materialDetail.aboutThisMaterial")}
          specificationsLabel={t("materialDetail.specifications")}
          pageLabel={locale === "nl" ? "Pagina" : "Page"}
          ofLabel={locale === "nl" ? "van" : "of"}
        />
      ),
    });
  }

  return (
    <div className="bg-white">
      <section className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
          <Breadcrumbs
            items={[
              { label: t("common.materials"), href: "/materials" },
              ...(category ? [{ label: category.name, href: `/category/${category.slug || category.id}` }] : []),
              { label: material.title },
            ]}
          />

          <div className="flex flex-col gap-2">
            {material.code ? <span className="text-sm font-semibold uppercase tracking-wide text-amber-500">{material.code}</span> : null}
            <h1 className="text-3xl font-bold leading-10 text-neutral-800">{material.title}</h1>
            {material.subtitle ? <p className="text-lg leading-7 text-neutral-600">{material.subtitle}</p> : null}
          </div>

          <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
            {/* Left column */}
            <div className="flex min-w-0 flex-1 flex-col gap-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={materialImage}
                  alt={t("materialsPage.materialAlt", { title: material.title })}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 720px"
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="flex flex-col gap-6">
                <Accordion title={t("materialDetail.aboutThisMaterial")}>
                  <div className="flex flex-col gap-5">
                    <DetailTable rows={aboutRows} />
                    {material.description ? (
                      <div
                        className="text-base leading-7 text-neutral-600 [&_a]:font-medium [&_a]:text-amber-600 [&_a:hover]:text-amber-700"
                        dangerouslySetInnerHTML={{ __html: material.description }}
                      />
                    ) : null}
                  </div>
                </Accordion>

                <Accordion title={t("materialDetail.specifications")}>
                  {specRows.length > 0 ? (
                    <DetailTable rows={specRows} />
                  ) : (
                    <p className="text-base leading-6 text-neutral-500">{t("materialDetail.noSpecifications")}</p>
                  )}
                </Accordion>
              </div>
            </div>

            {/* Right sidebar */}
            <aside className="flex w-full flex-col gap-6 lg:sticky lg:top-24 lg:w-96">
              <SidebarCard title={t("materialDetail.availableStockItemsTitle")} description={t("materialDetail.availableStockItemsDesc")}>
                <ScrollToMaterialProductsButton targetId={MATERIAL_PRODUCTS_SECTION_ID}>
                  {t("materialDetail.viewStockItems")}
                </ScrollToMaterialProductsButton>
              </SidebarCard>

              <SidebarCard title={t("materialDetail.customSizeTitle")} description={t("materialDetail.customSizeDesc")}>
                <Link href="/custom" className="flex h-12 items-center justify-center rounded-full border border-amber-500 bg-amber-500/10 px-4 text-base font-semibold leading-6 text-amber-600 transition-colors hover:bg-amber-500/20">
                  {t("materialDetail.requestCustomMade")}
                </Link>
              </SidebarCard>

              <HelpPanel
                labels={{
                  title: t("supportPanel.title"),
                  callUs: t("supportPanel.callUs"),
                  email: t("supportPanel.email"),
                  whatsapp: t("supportPanel.whatsapp"),
                }}
                materialCode={material.code || material.title || ""}
              />

              {/* ICC Color Profiles */}
              <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-6">
                <h2 className="text-lg font-bold leading-6 text-neutral-800">
                  {t("materialDetail.iccProfilesTitle")}
                </h2>
                <p className="text-sm leading-5 text-neutral-600">
                  {isNl
                    ? "Download ICC-profielen om te zorgen voor een nauwkeurige en precieze kleurweergave van de printer."
                    : "Download ICC profiles to ensure precise and accurate printer color reproduction."}
                </p>
                <IccProfileModal materialTitle={material.title} isNl={isNl} />
              </div>

              {material.spec_sheet_url && (
                <DownloadSpecSheetButton
                  materialId={material.id}
                  materialTitle={material.title}
                  materialCode={material.code}
                  materialSubtitle={material.subtitle || undefined}
                  hasUploadedSpecSheet={!!material.has_uploaded_spec_sheet}
                  specSheetUrl={material.spec_sheet_url}
                  aboutRows={aboutRows}
                  specRows={rawSpecRows}
                  variant="button"
                  downloadLabel={t("materialsPage.downloadSpecSheet")}
                  materialImage={materialImage}
                  description={material.description}
                  pdfTitleLabel={t("materialDetail.specSheet")}
                  aboutThisMaterialLabel={t("materialDetail.aboutThisMaterial")}
                  specificationsLabel={t("materialDetail.specifications")}
                  pageLabel={locale === "nl" ? "Pagina" : "Page"}
                  ofLabel={locale === "nl" ? "van" : "of"}
                />
              )}
            </aside>
          </div>
        </div>
      </section>

      <MaterialProductsSection
        title={t("materialsPage.productsFromThisMaterial")}
        initialCatalog={initialCatalog}
        baselineCatalog={baselineCatalog}
        initialQueryString={routeQuery.toString()}
        scopeQueryString={scopeQuery.toString()}
      />

      <CTABanner />
    </div>
  );
}
