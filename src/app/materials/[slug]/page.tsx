import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Accordion from "@/components/Accordion";
import CTABanner from "@/components/CTABanner";
import IccProfileModal from "@/components/materials/IccProfileModal";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";

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

// Pagination helper
function buildVisiblePages(currentPage: number, lastPage: number): Array<number | "ellipsis"> {
  if (lastPage <= 1) return [1];
  const pages = new Set<number>();
  pages.add(1);
  pages.add(lastPage);
  const start = Math.max(1, currentPage - 3);
  const end = Math.min(lastPage, currentPage + 3);
  for (let page = start; page <= end; page += 1) pages.add(page);
  const sortedPages = [...pages].sort((a, b) => a - b);
  const visible: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sortedPages.length; i += 1) {
    const page = sortedPages[i];
    const prev = sortedPages[i - 1];
    if (prev && page - prev > 1) visible.push("ellipsis");
    visible.push(page);
  }
  return visible;
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

function PdfIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 3H7A2 2 0 0 0 5 5V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V8L14 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3V8H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5H17" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.5 10H14.5" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 15H12" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
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

function HelpPanel({ labels }: { labels: { title: string; callUs: string; email: string; whatsapp: string } }) {
  const actions = [
    { label: labels.callUs, type: "call" as const },
    { label: labels.email, type: "email" as const },
    { label: labels.whatsapp, type: "whatsapp" as const },
  ];
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)]">
      <h2 className="text-lg font-bold leading-6 text-neutral-800">{labels.title}</h2>
      <div className="grid grid-cols-3 gap-4">
        {actions.map((action) => (
          <button key={action.label} type="button" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-100 bg-slate-100/30 p-3 text-center transition-colors hover:border-amber-200 hover:bg-orange-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 shadow-sm">
              <ContactIcon type={action.type} />
            </span>
            <span className="text-sm font-semibold leading-5 text-neutral-800">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

type ProductCardData = {
  id: number;
  sku: string;
  name: string;
  subtitle: string | null;
  excerpt: string | null;
  materialTitle: string | null;
  price: number;
  originalPrice: number | null;
  inStock: boolean;
  mainImage: string | null;
  categories: { id: number; name: string; slug: string }[];
  slug: string;
  type: string | null;
  createdAt: number;
  packing_group: number | null;
};

function ProductCard({ product, href }: { product: ProductCardData; href?: { pathname: string; query?: { type: string } } }) {
  const imageUrl = toDisplayImageUrl(product.mainImage) || "/images/labelrolls.png";
  const linkHref = href ?? { pathname: `/products/${product.slug}` };
  return (
    <Link href={linkHref} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
        <Image src={imageUrl} alt={product.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-contain p-4 transition-transform duration-300 group-hover:scale-105" unoptimized />
        {!product.inStock && (
          <span className="absolute left-3 top-3 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">Out of stock</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-base font-semibold leading-6 text-neutral-800 transition-colors group-hover:text-amber-600">{product.name}</p>
        {product.subtitle && <p className="text-sm leading-5 text-neutral-500">{product.subtitle}</p>}
        {Number(product.price) > 0 && (
          <p className="mt-auto pt-2 text-base font-bold text-neutral-900">
            €{Number(product.price).toFixed(2)}
          </p>
        )}
      </div>
    </Link>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <svg className="h-7 w-7 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M9 9h6M9 13h4" />
        </svg>
      </div>
      <p className="text-base font-semibold text-neutral-700">{title}</p>
      <p className="max-w-xs text-sm text-neutral-500">{description}</p>
    </div>
  );
}

function productHref(product: ProductCardData): { pathname: string; query?: { type: "simple" | "variable" | "group_product" } } | undefined {
  if (!product.slug) return undefined;
  if (product.type) return { pathname: `/products/${product.slug}`, query: { type: product.type as "simple" | "variable" | "group_product" } };
  return { pathname: `/products/${product.slug}` };
}

function MaterialProductsSection({
  title, products, currentPage, lastPage, materialSlug, labels,
}: {
  title: string;
  products: ProductCardData[];
  currentPage: number;
  lastPage: number;
  materialSlug: string;
  labels: { noProductsTitle: string; noProductsDescription: string; previous: string; next: string; filters: string; sortNameAsc: string };
}) {
  const visiblePages = buildVisiblePages(currentPage, lastPage);
  return (
    <section className="bg-gray-50 px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-300 flex-col gap-8">
        <h2 className="text-4xl font-bold leading-12 text-neutral-800">{title}</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" className="inline-flex h-10 w-fit items-center gap-2 rounded-[42px] border border-slate-200 px-5 text-neutral-800 transition-colors hover:bg-slate-50">
            <FilterIcon />
            <span className="text-base font-semibold leading-6">{labels.filters}</span>
          </button>
          <label className="flex h-10 w-fit items-center gap-3 rounded-[42px] border border-slate-200 px-5 text-neutral-800">
            <span className="sr-only">{labels.sortNameAsc}</span>
            <select defaultValue="name_asc" disabled className="bg-transparent text-base leading-5 outline-none disabled:opacity-100">
              <option value="name_asc">{labels.sortNameAsc}</option>
            </select>
          </label>
        </div>
        {products.length === 0 ? (
          <EmptyState title={labels.noProductsTitle} description={labels.noProductsDescription} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} href={productHref(product)} />
              ))}
            </div>
            {lastPage > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href={{ pathname: `/materials/${materialSlug}`, query: { page: Math.max(1, currentPage - 1) } }} className={`rounded-[50px] border border-slate-100 bg-white px-6 py-2.5 text-base font-medium text-neutral-800 transition-colors hover:bg-slate-50 ${currentPage <= 1 ? "pointer-events-none opacity-50" : ""}`}>
                  {labels.previous}
                </Link>
                {visiblePages.map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-sm font-semibold text-zinc-500">...</span>
                  ) : (
                    <Link key={item} href={{ pathname: `/materials/${materialSlug}`, query: { page: item } }} className={`flex h-10 min-w-10 items-center justify-center rounded-[50px] border border-slate-100 px-3 text-sm font-semibold transition-colors ${item === currentPage ? "border-amber-500 bg-amber-500 text-white" : "bg-white text-neutral-700 hover:bg-slate-50"}`} aria-current={item === currentPage ? "page" : undefined}>
                      {item}
                    </Link>
                  ),
                )}
                <Link href={{ pathname: `/materials/${materialSlug}`, query: { page: Math.min(lastPage, currentPage + 1) } }} className={`rounded-[50px] border border-slate-100 bg-white px-6 py-2.5 text-base font-semibold text-neutral-800 transition-colors hover:bg-slate-50 ${currentPage >= lastPage ? "pointer-events-none opacity-50" : ""}`}>
                  {labels.next}
                </Link>
              </div>
            )}
          </>
        )}
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

  const products: ProductCardData[] = (material.products || []).map((product) => ({
    id: product.id,
    sku: product.sku || "",
    name: product.name,
    subtitle: product.subtitle,
    excerpt: product.excerpt,
    materialTitle: null,
    price: product.price ? Number(product.price) : 0,
    originalPrice: null,
    inStock: product.in_stock,
    mainImage: product.main_image,
    categories: [],
    slug: product.slug,
    type: null,
    createdAt: Date.parse(product.updated_at),
    packing_group: product.packing_group || null,
  }));

  const requestedPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const normalizedPage = Number.parseInt(requestedPage ?? "1", 10);
  const currentPage = Number.isFinite(normalizedPage) && normalizedPage > 0 ? normalizedPage : 1;
  const perPage = 9;
  const lastPage = Math.ceil(products.length / perPage) || 1;
  const paginatedProducts = products.slice((currentPage - 1) * perPage, currentPage * perPage);

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
    { label: t("materialSpecs.pricePerSquareMeter"), value: material.price_per_sq_meter != null ? `\u20ac${material.price_per_sq_meter}` : null },
  ].filter((row): row is { label: string; value: string } => row.value != null && row.value !== "");

  const specEntries = material.specifications?.material_specs ?? [];
  const specRows: { label: string; value: ReactNode }[] = specEntries
    .filter((spec) => spec.label && spec.value)
    .map((spec) => ({ label: spec.label, value: spec.value }));

  if (material.spec_sheet_url) {
    specRows.push({
      label: t("materialDetail.specSheet"),
      value: (
        <a href={material.spec_sheet_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-amber-600 transition-colors hover:text-amber-700">
          <PdfIcon />
          {t("materialsPage.downloadSpecSheet")}
        </a>
      ),
    });
  }

  return (
    <div className="bg-white">
      <section className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-300 flex-col gap-6">
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
                <Link href="/products" className="flex h-12 items-center justify-center rounded-full bg-amber-500 px-4 text-base font-semibold leading-6 text-white transition-colors hover:bg-amber-600">
                  {t("materialDetail.viewStockItems")}
                </Link>
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
                <a href={material.spec_sheet_url} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-base font-semibold leading-6 text-neutral-700 transition-colors hover:border-amber-200 hover:bg-orange-50">
                  <PdfIcon />
                  {t("materialsPage.downloadSpecSheet")}
                </a>
              )}
            </aside>
          </div>
        </div>
      </section>

      <MaterialProductsSection
        title={t("materialsPage.productsFromThisMaterial")}
        products={paginatedProducts}
        currentPage={currentPage}
        lastPage={lastPage}
        materialSlug={slug}
        labels={{
          noProductsTitle: t("common.noProductsFound"),
          noProductsDescription: t("materialsPage.noProductsForMaterial"),
          previous: t("common.previous"),
          next: t("common.next"),
          filters: t("common.filters"),
          sortNameAsc: t("materialDetail.sortNameAsc"),
        }}
      />

      <CTABanner />
    </div>
  );
}
