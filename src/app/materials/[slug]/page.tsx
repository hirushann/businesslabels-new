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
      <svg width="38" height="38" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><g filter="url(#filter0_d_1507_1198)"><path d="M1 8C1 3.58172 4.58172 0 9 0H25C29.4183 0 33 3.58172 33 8V24C33 28.4183 29.4183 32 25 32H9C4.58172 32 1 28.4183 1 24V8Z" fill="#FFF7ED" shapeRendering="crispEdges"/><mask id="mask0_1507_1198" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="9" y="8" width="16" height="16"><rect x="9" y="8" width="16" height="16" fill="#D9D9D9"/></mask><g mask="url(#mask0_1507_1198)"><path d="M21.9623 21.6624C20.7059 21.6624 19.4438 21.3703 18.1758 20.7861C16.9079 20.2019 15.7429 19.3778 14.6809 18.3138C13.6191 17.2497 12.796 16.0847 12.2118 14.8188C11.6276 13.553 11.3354 12.2919 11.3354 11.0356C11.3354 10.8337 11.4021 10.6655 11.5354 10.5309C11.6688 10.3964 11.8354 10.3291 12.0354 10.3291H14.2098C14.3781 10.3291 14.5266 10.384 14.6553 10.4939C14.7839 10.6037 14.8658 10.7394 14.9008 10.9009L15.2829 12.8624C15.3094 13.0444 15.3038 13.2008 15.2663 13.3316C15.2286 13.4624 15.1611 13.5722 15.0636 13.6611L13.5239 15.1599C13.7717 15.6137 14.0548 16.043 14.3733 16.4478C14.6916 16.8524 15.0363 17.2389 15.4073 17.6073C15.7731 17.9732 16.1619 18.3129 16.5739 18.6266C16.9859 18.9403 17.4308 19.2322 17.9086 19.5023L19.4046 17.9933C19.509 17.8847 19.6353 17.8086 19.7836 17.7649C19.9318 17.7214 20.0859 17.7107 20.2458 17.7329L22.097 18.1099C22.2653 18.1544 22.4027 18.2403 22.5091 18.3676C22.6156 18.4949 22.6688 18.6394 22.6688 18.8009V20.9624C22.6688 21.1624 22.6015 21.3291 22.467 21.4624C22.3324 21.5958 22.1642 21.6624 21.9623 21.6624ZM13.0508 14.2138L14.2406 13.0753C14.2619 13.0582 14.2758 13.0347 14.2823 13.0048C14.2887 12.9749 14.2877 12.9471 14.2791 12.9214L13.9893 11.4316C13.9807 11.3975 13.9658 11.3719 13.9444 11.3548C13.9231 11.3377 13.8953 11.3291 13.8611 11.3291H12.4354C12.4098 11.3291 12.3884 11.3377 12.3713 11.3548C12.3543 11.3719 12.3458 11.3933 12.3458 11.4189C12.3799 11.8745 12.4544 12.3373 12.5694 12.8073C12.6843 13.2774 12.8448 13.7462 13.0508 14.2138ZM18.8508 19.9753C19.2927 20.1813 19.7536 20.3388 20.2334 20.4478C20.7135 20.5567 21.162 20.6214 21.5789 20.6419C21.6046 20.6419 21.626 20.6334 21.6431 20.6163C21.6602 20.5992 21.6688 20.5778 21.6688 20.5521V19.1496C21.6688 19.1154 21.6602 19.0876 21.6431 19.0663C21.626 19.0449 21.6004 19.03 21.5663 19.0214L20.1663 18.7368C20.1406 18.7282 20.1182 18.7272 20.099 18.7336C20.0797 18.74 20.0594 18.7539 20.038 18.7753L18.8508 19.9753Z" fill="#F18800"/></g></g><defs><filter id="filter0_d_1507_1198" x="0" y="0" width="34" height="34" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect1_dropShadow_1507_1198"/><feOffset dy="1"/><feGaussianBlur stdDeviation="1"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1507_1198"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1507_1198" result="shape"/></filter></defs></svg>
    );
  }
  if (type === "email") {
    return (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><g filter="url(#filter0_d_1507_1205)"><path d="M1 8C1 3.58172 4.58172 0 9 0H25C29.4183 0 33 3.58172 33 8V24C33 28.4183 29.4183 32 25 32H9C4.58172 32 1 28.4183 1 24V8Z" fill="#FFF7ED" shapeRendering="crispEdges"/><mask id="mask0_1507_1205" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="9" y="8" width="16" height="16"><rect x="9" y="8" width="16" height="16" fill="#D9D9D9"/></mask><g mask="url(#mask0_1507_1205)"><path d="M11.8717 21C11.5349 21 11.2498 20.8833 11.0165 20.65C10.7832 20.4167 10.6665 20.1316 10.6665 19.7948V12.2052C10.6665 11.8684 10.7832 11.5833 11.0165 11.35C11.2498 11.1167 11.5349 11 11.8717 11H22.128C22.4648 11 22.7498 11.1167 22.9832 11.35C23.2165 11.5833 23.3332 11.8684 23.3332 12.2052V19.7948C23.3332 20.1316 23.2165 20.4167 22.9832 20.65C22.7498 20.8833 22.4648 21 22.128 21H11.8717ZM22.3332 12.9615L17.3242 16.168C17.2729 16.197 17.2199 16.2198 17.1652 16.2365C17.1105 16.2532 17.0554 16.2615 16.9998 16.2615C16.9443 16.2615 16.8892 16.2532 16.8345 16.2365C16.7797 16.2198 16.7267 16.197 16.6755 16.168L11.6665 12.9615V19.7948C11.6665 19.8547 11.6857 19.9039 11.7242 19.9423C11.7626 19.9808 11.8118 20 11.8717 20H22.128C22.1879 20 22.2371 19.9808 22.2755 19.9423C22.3139 19.9039 22.3332 19.8547 22.3332 19.7948V12.9615ZM16.9998 15.3333L22.2307 12H11.769L16.9998 15.3333ZM11.6665 13.1153V12.3532V12.373V12.3518V13.1153Z" fill="#F18800"/></g></g><defs><filter id="filter0_d_1507_1205" x="0" y="0" width="34" height="34" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect1_dropShadow_1507_1205"/><feOffset dy="1"/><feGaussianBlur stdDeviation="1"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1507_1205"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1507_1205" result="shape"/></filter></defs></svg>
    );
  }
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><g filter="url(#filter0_d_1507_1212)"><path d="M1 8C1 3.58172 4.58172 0 9 0H25C29.4183 0 33 3.58172 33 8V24C33 28.4183 29.4183 32 25 32H9C4.58172 32 1 28.4183 1 24V8Z" fill="#FFF7ED" shapeRendering="crispEdges"/><path d="M9 24L10.1247 19.8913C9.43067 18.6887 9.066 17.3253 9.06667 15.9273C9.06867 11.5567 12.6253 8 16.9953 8C19.116 8.00067 21.1066 8.82667 22.604 10.3253C24.1006 11.824 24.9246 13.816 24.924 15.9347C24.922 20.306 21.3653 23.8627 16.9953 23.8627C15.6687 23.862 14.3613 23.5293 13.2033 22.8973L9 24ZM13.398 21.462C14.5153 22.1253 15.582 22.5227 16.9926 22.5233C20.6246 22.5233 23.5833 19.5673 23.5853 15.9333C23.5866 12.292 20.642 9.34 16.998 9.33867C13.3633 9.33867 10.4067 12.2947 10.4053 15.928C10.4047 17.4113 10.8393 18.522 11.5693 19.684L10.9033 22.116L13.398 21.462ZM20.9893 17.8193C20.94 17.7367 20.808 17.6873 20.6093 17.588C20.4113 17.4887 19.4373 17.0093 19.2553 16.9433C19.074 16.8773 18.942 16.844 18.8093 17.0427C18.6773 17.2407 18.2973 17.6873 18.182 17.8193C18.0666 17.9513 17.9506 17.968 17.7526 17.8687C17.5546 17.7693 16.916 17.5607 16.1593 16.8853C15.5707 16.36 15.1727 15.7113 15.0573 15.5127C14.942 15.3147 15.0453 15.2073 15.144 15.1087C15.2333 15.02 15.342 14.8773 15.4413 14.7613C15.542 14.6467 15.5747 14.564 15.6413 14.4313C15.7073 14.2993 15.6747 14.1833 15.6247 14.084C15.5747 13.9853 15.1787 13.01 15.014 12.6133C14.8527 12.2273 14.6893 12.2793 14.568 12.2733L14.188 12.2667C14.056 12.2667 13.8413 12.316 13.66 12.5147C13.4787 12.7133 12.9667 13.192 12.9667 14.1673C12.9667 15.1427 13.6767 16.0847 13.7753 16.2167C13.8747 16.3487 15.172 18.35 17.1593 19.208C17.632 19.412 18.0013 19.534 18.2886 19.6253C18.7633 19.776 19.1953 19.7547 19.5366 19.704C19.9173 19.6473 20.7086 19.2247 20.874 18.762C21.0393 18.2987 21.0393 17.902 20.9893 17.8193Z" fill="#F18800"/></g><defs><filter id="filter0_d_1507_1212" x="0" y="0" width="34" height="34" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect1_dropShadow_1507_1212"/><feOffset dy="1"/><feGaussianBlur stdDeviation="1"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1507_1212"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1507_1212" result="shape"/></filter></defs></svg>
  );
}


function DetailTable({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <div className="overflow-hidden">
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
    <div className="flex flex-col gap-4 rounded-xl border border-[#EDF2F7] bg-white p-6 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-[24px] font-bold leading-9 font-semibold text-neutral-800">{title}</h2>
        <p className="text-base leading-7 text-neutral-500">{description}</p>
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
      <h2 className="text-lg font-semibold leading-6 text-neutral-800">{labels.title}</h2>
      <div className="grid grid-cols-3 gap-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-100 bg-[slate-100/30] p-3 text-center transition-colors hover:border-amber-200 hover:bg-orange-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 shadow-sm">
              <ContactIcon type={action.type} />
            </span>
            <span className="text-sm font-bold leading-5 text-neutral-800">{action.label}</span>
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
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8">
        <h2 className="text-4xl font-semibold leading-12 text-neutral-800">{title}</h2>
        <ProductsListing
          initialCatalog={initialCatalog}
          initialQueryString={initialQueryString}
          scopeQueryString={scopeQueryString}
          baselineRangeFilters={baselineCatalog.filters.ranges}
          hideSearchInput={true}
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
          // downloadLabel={t("materialsPage.downloadSpecSheet")}
          downloadLabel={(material.brand ? material.brand + "-" : "") + material.code + ".pdf"}
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
            {material.code ? <span className="text-base font-bold uppercase tracking-wide text-[#479EF5]">{material.code}</span> : null}
            <h1 className="text-[32px] font-semibold leading-10 text-[#222222]">{material.title}</h1>
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
                  <div className="flex flex-col gap-5 -mx-10 px-5">
                    <DetailTable rows={aboutRows} />
                    {material.description ? (
                      <div
                        className="text-base px-5 leading-7 text-neutral-600 [&_a]:text-[#f08500] [&_a]:underline hover:[&_a]:text-[#d97706] [&_a]:transition-colors"
                        dangerouslySetInnerHTML={{ __html: material.description }}
                      />
                    ) : null}
                  </div>
                </Accordion>

                <Accordion title={t("materialDetail.specifications")}>
                  {specRows.length > 0 ? (
                    <div className="flex flex-col gap-5 -mx-10 px-5">
                    <DetailTable rows={specRows} />
                    </div>
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
                <Link href={`/custom-made-form?materialId=${material.code}`} className="flex h-12 items-center justify-center rounded-full border border-amber-500 bg-white px-4 text-base font-bold leading-6 text-amber-500 transition-colors hover:bg-amber-500/20">
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
              <div className="flex flex-col gap-4 rounded-xl border-2 border-[#FFEDD4] bg-[linear-gradient(135deg,#FFF7ED_0%,#FFFFFF_100%)] p-6">
                <div className="flex flex-col gap-2">
                  <h2 className="text-[24px] font-semibold leading-9 text-[#222222]">
                    {t("materialDetail.iccProfilesTitle")}
                  </h2>
                  <p className="text-base leading-[26px] text-[#4F4F4F]">
                    {isNl
                      ? "Download ICC-profielen om te zorgen voor een nauwkeurige en precieze kleurweergave van de printer."
                      : "Download ICC profiles to ensure precise and accurate printer color reproduction."}
                  </p>
                </div>
                <IccProfileModal materialTitle={material.title} isNl={isNl} />
              </div>

              {/* {material.spec_sheet_url && (
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
              )} */}
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
