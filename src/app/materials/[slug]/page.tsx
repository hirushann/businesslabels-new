import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Accordion from "@/components/Accordion";
import CTABanner from "@/components/CTABanner";
import ProductsListing from "@/components/ProductsListing";
import IccProfileModal from "@/components/materials/IccProfileModal";
import { parseCatalogSearchParams, searchCatalogProducts } from "@/lib/search/products";
import type { CatalogSearchResponse } from "@/lib/search/types";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";

type MaterialProduct = {
  id: number;
  name: string;
  slug: string;
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

type Material = {
  id: number;
  title: string;
  subtitle: string;
  slug: string;
  code: string;
  brand: string;
  status: string;
  description: string;
  main_image?: string | null;
  specifications: Record<string, unknown> | null;
  print_method: string | null;
  base_material: string | null;
  finish: string | null;
  adhesive: string | null;
  supplier: string | null;
  price_per_sq_meter: number | null;
  certificate: string | null;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
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

async function getMaterial(slug: string): Promise<Material | null> {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  if (!baseUrl) return null;

  try {
    const locale = await getServerLocale();
    const response = await fetch(withLocaleParam(`${baseUrl}/api/materials/slug/${slug}`, locale), {
      cache: "no-store",
    });

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

  if (!material) {
    return { title: "Material — Businesslabels" };
  }

  return {
    title: `${material.title} — Businesslabels`,
    description: material.subtitle,
  };
}

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

function SpecRow({ label, value, hasBorder = true }: { label: string; value: string; hasBorder?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-3 ${hasBorder ? "border-b border-slate-100" : ""}`}>
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right">{value}</span>
    </div>
  );
}

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

const emptyCatalogResponse: CatalogSearchResponse = {
  products: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 24,
  filters: { ranges: [], options: [] },
};

export default async function SingleMaterialPage({ params, searchParams }: MaterialPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const t = await getTranslations();
  const material = await getMaterial(slug);

  if (!material) {
    notFound();
  }

  const baseUrl = process.env.BBNL_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("BBNL_API_BASE_URL is not configured");
  }

  const locale = await getServerLocale();
  const routeQuery = toUrlSearchParams(query);
  const scopeQuery = new URLSearchParams({ material_id: String(material.id) });
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
    console.error("Failed to load catalog for material:", error);
  }

  // Derive print method
  let printTech = material.print_method || "";
  if (!printTech && material.category) {
    const catSlug = material.category.slug.toLowerCase();
    if (catSlug.includes("inkjet")) printTech = "Inkjet";
    else if (catSlug.includes("thermal-transfer") || catSlug.includes("ttr")) printTech = "Thermal Transfer";
    else if (catSlug.includes("thermal-direct") || catSlug.includes("dt")) printTech = "Thermal Direct";
    else printTech = "Inkjet";
  } else if (!printTech) {
    printTech = "Inkjet";
  }

  const baseMat = material.base_material || "Paper";
  const finish = material.finish || "Matte";
  const adhesive = material.adhesive || "Permanent";

  // Parse technical specs from specifications object
  let weight = "165 g/m²";
  let thickness = "169 µm";
  let adhesiveType = "Rubber based hot-melt, pressure sensitive";
  let serviceTemp = "- 25 to +60 °C (apply at >5°C)";
  let specSheet = "";

  if (material.specifications && typeof material.specifications === "object") {
    const specsObj = material.specifications as Record<string, unknown>;
    const specsArray = specsObj.material_specs;
    if (Array.isArray(specsArray)) {
      for (const spec of specsArray) {
        if (!spec || typeof spec !== "object") continue;
        const specItem = spec as Record<string, unknown>;
        const label = String(specItem.label || "").toLowerCase();
        const val = String(specItem.value || "");
        if (label.includes("weight") || label.includes("gewicht")) {
          weight = val;
        } else if (label.includes("thickness") || label.includes("dikte")) {
          thickness = val;
        } else if (label.includes("adhesive type") || label.includes("lijmtype") || label.includes("type adhesive")) {
          adhesiveType = val;
        } else if (label.includes("temperature") || label.includes("temperatuur")) {
          serviceTemp = val;
        } else if (label.includes("spec sheet") || label.includes("fiche") || label.includes("sheet")) {
          specSheet = val;
        }
      }
    }
  }

  if (!specSheet && material.certificate) {
    specSheet = material.certificate;
  }

  // Related materials
  let relatedMaterials: Material[] = [];
  try {
    const materialsUrl = `${baseUrl}/api/materials?per_page=1000`;
    const response = await fetch(withLocaleParam(materialsUrl, locale), { cache: "no-store" });
    if (response.ok) {
      const json = await response.json();
      const allMaterials = (json.data || []) as Material[];

      relatedMaterials = allMaterials
        .filter((m: Material) => m.id !== material.id)
        .filter((m: Material) => {
          if (m.print_method && material.print_method && m.print_method.toLowerCase() === material.print_method.toLowerCase()) return true;
          if (m.category && material.category && m.category.id === material.category.id) return true;
          return false;
        })
        .slice(0, 3);

      if (relatedMaterials.length < 3) {
        const remaining = allMaterials
          .filter((m: Material) => m.id !== material.id && !relatedMaterials.some((r: Material) => r.id === m.id))
          .slice(0, 3 - relatedMaterials.length);
        relatedMaterials = [...relatedMaterials, ...remaining];
      }
    }
  } catch (error) {
    console.error("Error fetching related materials:", error);
  }

  // Use material's own image first, fall back to first product image, then placeholder
  const materialImage =
    toDisplayImageUrl(material.main_image) ||
    toDisplayImageUrl(material.products?.[0]?.main_image) ||
    "/images/labelrolls.png";

  const isNl = locale === "nl";

  const aboutSpecs = [
    { label: isNl ? "Code:" : "Code:", value: material.code },
    { label: isNl ? "Merk:" : "Brand:", value: material.brand || "Diamondlabels" },
    { label: isNl ? "Printmethode:" : "Print method:", value: printTech },
    { label: isNl ? "Basismateriaal (vereenvoudigd):" : "Base Material (simplified):", value: baseMat },
    { label: isNl ? "Afwerking:" : "Finish:", value: finish },
    { label: isNl ? "Lijm (vereenvoudigd):" : "Adhesive (simplified):", value: adhesive },
  ].filter((s) => s.value);

  const techSpecs = [
    { label: isNl ? "Gewicht:" : "Weight:", value: weight },
    { label: isNl ? "Dikte:" : "Thickness:", value: thickness },
    { label: isNl ? "Lijmtype:" : "Adhesive type:", value: adhesiveType },
    { label: isNl ? "Bedrijfstemperatuur:" : "Service temperature:", value: serviceTemp },
  ];

  return (
    <div className="bg-white">
      {/* Page content */}
      <section className="px-4 pt-8 pb-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: t("common.materials"), href: "/materials" },
              ...(material.category
                ? [{ label: material.category.name, href: `/category/${material.category.slug || material.category.id}` }]
                : []),
              { label: material.title },
            ]}
          />

          {/* Title block */}
          <div className="mt-4 mb-8 max-w-2xl">
            <span className="text-sm font-semibold text-sky-600 tracking-wide uppercase">{material.code}</span>
            <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl leading-tight">{material.title}</h1>
            <p className="mt-2 text-base text-slate-500 leading-relaxed">{material.subtitle}</p>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-8">

            {/* LEFT: image + accordions */}
            <div className="min-w-0 flex-1 flex flex-col gap-6">

              {/* Hero image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100">
                <Image
                  src={materialImage}
                  alt={t("materialsPage.materialAlt", { title: material.title })}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* About accordion */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Accordion
                  title="About this material"
                  defaultOpen={true}
                  className="!bg-white !rounded-none !outline-none"
                  headerClassName="!px-6 !py-5 border-b border-slate-100"
                  contentClassName="!px-6 !pb-6"
                >
                  <div className="mt-2">
                    {/* Spec rows */}
                    {aboutSpecs.map((spec, i) => (
                      <SpecRow
                        key={spec.label}
                        label={spec.label}
                        value={spec.value}
                        hasBorder={i < aboutSpecs.length - 1}
                      />
                    ))}

                    {/* Description */}
                    {material.description && (
                      <div
                        className="mt-5 pt-5 border-t border-slate-100 text-sm leading-relaxed text-slate-600 [&_a]:text-[#f08500] [&_a]:underline [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3"
                        dangerouslySetInnerHTML={{ __html: material.description }}
                      />
                    )}

                    {/* Related material links */}
                    {relatedMaterials.length > 0 && (
                      <div className="mt-4 flex flex-col gap-1.5">
                        {relatedMaterials.map((m) => (
                          <Link
                            key={m.id}
                            href={`/materials/${m.slug}`}
                            className="text-[#f08500] hover:text-orange-700 underline text-sm transition-colors w-fit"
                          >
                            {m.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </Accordion>
              </div>

              {/* Specifications accordion */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Accordion
                  title={t("product.productSpecifications")}
                  defaultOpen={true}
                  className="!bg-white !rounded-none !outline-none"
                  headerClassName="!px-6 !py-5 border-b border-slate-100"
                  contentClassName="!px-6 !pb-6"
                >
                  <div className="mt-2">
                    {techSpecs.map((spec, i) => (
                      <SpecRow
                        key={spec.label}
                        label={spec.label}
                        value={spec.value}
                        hasBorder={i < techSpecs.length - 1 || !!specSheet}
                      />
                    ))}

                    {specSheet && (
                      <div className="flex items-baseline justify-between gap-4 py-3">
                        <span className="text-sm text-slate-500 shrink-0">
                          {isNl ? "Technisch informatieblad" : "Spec sheet"}
                        </span>
                        <a
                          href={specSheet}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm font-semibold text-[#f08500] hover:text-orange-700 underline transition-colors"
                        >
                          <svg className="h-3.5 w-3.5 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          {specSheet.split("/").pop() || "Spec Sheet"}
                        </a>
                      </div>
                    )}
                  </div>
                </Accordion>
              </div>

            </div>

            {/* RIGHT: sidebar cards */}
            <aside className="flex w-full shrink-0 flex-col gap-5 lg:sticky lg:top-6 lg:w-[360px]">

              {/* Available Stock Items */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-800">
                  {t("supportPanel.availableProduct")}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {isNl ? "Blader door kant-en-klare labels in verschillende maten." : "Browse pre-made labels in various sizes."}
                </p>
                <a
                  href="#products-section"
                  className="mt-4 block w-full rounded-full bg-[#f08500] py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#d97706]"
                >
                  {isNl ? "Bekijk voorraadartikelen" : "View Stock Items"}
                </a>
              </div>

              {/* Need a custom size? */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-800">
                  {t("supportPanel.customMade")}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {isNl ? "Laat labels maken volgens uw exacte specificaties." : "Get labels made to your exact specs."}
                </p>
                <Link
                  href="/custom"
                  className="mt-4 block w-full rounded-full border border-[#f08500] py-3 text-center text-sm font-semibold text-[#f08500] transition-colors hover:bg-orange-50"
                >
                  {isNl ? "Vraag maatwerk aan" : "Request Custom Made"}
                </Link>
              </div>

              {/* Need help or advice? */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-800">
                  {t("supportPanel.title")}
                </h3>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {(
                    [
                      { type: "call" as const, href: "tel:+31000000000", label: t("supportPanel.callUs") },
                      { type: "email" as const, href: "mailto:info@businesslabels.nl", label: t("supportPanel.email") },
                      { type: "whatsapp" as const, href: "https://wa.me/31000000000", label: t("supportPanel.whatsapp"), external: true },
                    ] as { type: "call" | "email" | "whatsapp"; href: string; label: string; external?: boolean }[]
                  ).map(({ type, href, label, external }) => (
                    <a
                      key={type}
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 py-4 text-center text-[#f08500] transition-colors hover:border-orange-200 hover:bg-orange-50"
                    >
                      <ContactIcon type={type} />
                      <span className="text-xs font-semibold text-slate-700">{label}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* ICC Color Profiles */}
              <div className="rounded-2xl border border-orange-100 bg-orange-50/30 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-800">ICC Color Profiles</h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  {isNl
                    ? "Download ICC-profielen om te zorgen voor een nauwkeurige en precieze kleurweergave van de printer."
                    : "Download ICC profiles to ensure precise and accurate printer color reproduction."}
                </p>
                <IccProfileModal materialTitle={material.title} isNl={isNl} />
              </div>

            </aside>
          </div>
        </div>
      </section>

      {/* Products section */}
      <section id="products-section" className="border-t border-slate-100 bg-slate-50/40 px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1280px] flex flex-col gap-8">
          <h2 className="text-3xl font-bold text-slate-900">
            {t("materialsPage.productsFromThisMaterial")}
          </h2>

          <ProductsListing
            initialCatalog={initialCatalog}
            initialQueryString={routeQuery.toString()}
            scopeQueryString={scopeQuery.toString()}
            baselineRangeFilters={baselineCatalog.filters.ranges}
          />
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
