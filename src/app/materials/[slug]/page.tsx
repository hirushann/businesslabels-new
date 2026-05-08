import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Accordion from "@/components/Accordion";
import CTABanner from "@/components/CTABanner";
import EmptyState from "@/components/EmptyState";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";

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
  specifications: Record<string, string | number | boolean> | null;
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
  searchParams: Promise<{ page?: string | string[] }>;
};

function buildVisiblePages(currentPage: number, lastPage: number): Array<number | "ellipsis"> {
  if (lastPage <= 1) {
    return [1];
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(lastPage);

  const start = Math.max(1, currentPage - 3);
  const end = Math.min(lastPage, currentPage + 3);

  for (let page = start; page <= end; page += 1) {
    pages.add(page);
  }

  const sortedPages = [...pages].sort((left, right) => left - right);
  const visible: Array<number | "ellipsis"> = [];

  for (let index = 0; index < sortedPages.length; index += 1) {
    const page = sortedPages[index];
    const previous = sortedPages[index - 1];

    if (previous && page - previous > 1) {
      visible.push("ellipsis");
    }

    visible.push(page);
  }

  return visible;
}

// relatedSections is deprecated in favor of server-fetched products

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
    return {
      title: "Material — BusinessLabels",
    };
  }

  return {
    title: `${material.title} — BusinessLabels`,
    description: material.subtitle,
  };
}

function ContactIcon({ type }: { type: "call" | "email" | "whatsapp" }) {
  if (type === "call") {
    return (
      <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M22 16.92V20A2 2 0 0 1 19.82 22A19.8 19.8 0 0 1 3.08 5.18A2 2 0 0 1 5.06 3H8.15A2 2 0 0 1 10.15 4.72C10.28 5.68 10.5 6.62 10.82 7.52A2 2 0 0 1 10.37 9.63L9.06 10.94A16 16 0 0 0 13.06 14.94L14.37 13.63A2 2 0 0 1 16.48 13.18C17.38 13.5 18.32 13.72 19.28 13.85A2 2 0 0 1 22 16.92Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "email") {
    return (
      <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 6H20V18H4V6Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 7L12 13L20 7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 19L6.2 15.6A7 7 0 1 1 8.4 17.8L5 19Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 9.5C10.2 12 12 13.8 14.5 14.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HelpPanel() {
  const actions = [
    { label: "Call Us", type: "call" as const },
    { label: "Email", type: "email" as const },
    { label: "WhatsApp", type: "whatsapp" as const },
  ];

  return (
    <aside className="flex w-full flex-col gap-6 lg:sticky lg:top-24 lg:w-96">
      <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)]">
        <h2 className="text-lg font-bold leading-5 text-neutral-700">Need help or advice?</h2>
        <div className="grid grid-cols-3 gap-4">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-100 bg-slate-100/30 p-3 text-center transition-colors hover:border-amber-200 hover:bg-orange-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 shadow-sm">
                <ContactIcon type={action.type} />
              </span>
              <span className="text-base font-semibold leading-5 text-neutral-800">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/products"
          className="flex h-12 items-center justify-center rounded-full bg-amber-500 px-4 text-lg font-semibold leading-6 text-white transition-colors hover:bg-amber-600"
        >
          Available Product
        </Link>
        <Link
          href="/custom"
          className="flex h-12 items-center justify-center rounded-full border border-amber-500 bg-amber-500/20 px-4 text-lg font-semibold leading-6 text-amber-500 transition-colors hover:bg-amber-500/30"
        >
          Custom Made
        </Link>
      </div>
    </aside>
  );
}

function SpecsTable({ material }: { material: Material }) {
  const specs = [
    { label: "Brand", value: material.brand },
    { label: "Code", value: material.code },
    { label: "Print Method", value: material.print_method },
    { label: "Base Material", value: material.base_material },
    { label: "Finish", value: material.finish },
    { label: "Adhesive", value: material.adhesive },
    { label: "Price per m²", value: material.price_per_sq_meter != null ? `€${material.price_per_sq_meter}` : null },
    { label: "Certificate", value: material.certificate },
    ...Object.entries(material.specifications || {}).map(([label, value]) => ({
      label,
      value: typeof value === "string" ? value : String(value),
    })),
  ].filter((spec) => spec.value != null && spec.value !== "" && spec.value !== "null");

  return (
    <div className="overflow-hidden rounded-lg">
      {specs.map((spec, index) => (
        <div
          key={spec.label}
          className={`flex items-center justify-between gap-6 px-6 py-3 ${
            index % 2 === 0 ? "border-x border-black/10 bg-white/50" : "bg-transparent"
          }`}
        >
          <span className="text-base leading-6 text-neutral-700">{spec.label}</span>
          <span className="text-right text-base font-semibold leading-6 text-neutral-700">{spec.value}</span>
        </div>
      ))}
    </div>
  );
}

function productHref(product: ProductCardData): { pathname: string; query?: { type: "simple" | "variable" | "group_product" } } | undefined {
  if (!product.slug) {
    return undefined;
  }

  if (product.type) {
    return {
      pathname: `/products/${product.slug}`,
      query: { type: product.type },
    };
  }

  return { pathname: `/products/${product.slug}` };
}

function MaterialProductsSection({
  title,
  products,
  currentPage,
  lastPage,
  materialSlug,
}: {
  title: string;
  products: ProductCardData[];
  currentPage: number;
  lastPage: number;
  materialSlug: string;
}) {
  const visiblePages = buildVisiblePages(currentPage, lastPage);

  return (
    <section className="px-4 py-24 odd:bg-gray-50 even:bg-white sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-300 flex-col gap-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-4xl font-bold leading-12 text-neutral-800">{title}</h2>
        </div>

        {products.length === 0 ? (
          <EmptyState 
            title="No products found" 
            description="We couldn't find any products associated with this material at the moment." 
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} href={productHref(product)} />
              ))}
            </div>

            {lastPage > 1 && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={{ pathname: `/materials/${materialSlug}`, query: { page: Math.max(1, currentPage - 1) } }}
                  className={`rounded-[50px] border border-slate-100 px-6 py-2.5 text-base font-medium text-neutral-800 transition-colors hover:bg-slate-50 ${
                    currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Previous
                </Link>

                {visiblePages.map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-sm font-semibold text-zinc-500">
                      ...
                    </span>
                  ) : (
                    <Link
                      key={item}
                      href={{ pathname: `/materials/${materialSlug}`, query: { page: item } }}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-[50px] border border-slate-100 px-3 text-sm font-semibold transition-colors ${
                        item === currentPage 
                          ? "bg-amber-500 text-white border-amber-500" 
                          : "text-neutral-700 hover:bg-slate-50"
                      }`}
                      aria-current={item === currentPage ? "page" : undefined}
                    >
                      {item}
                    </Link>
                  ),
                )}

                <Link
                  href={{ pathname: `/materials/${materialSlug}`, query: { page: Math.min(lastPage, currentPage + 1) } }}
                  className={`rounded-[50px] border border-slate-100 px-6 py-2.5 text-base font-semibold text-neutral-800 transition-colors hover:bg-slate-50 ${
                    currentPage >= lastPage ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Next
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default async function SingleMaterialPage({ params, searchParams }: MaterialPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const material = await getMaterial(slug);

  if (!material) {
    notFound();
  }

  // Transform MaterialProduct[] to ProductCardData[]
  const products: ProductCardData[] = (material.products || []).map((product) => ({
    id: product.id,
    sku: product.sku || "",
    name: product.name,
    subtitle: null,
    excerpt: null,
    materialTitle: material.title,
    price: product.price || 0,
    originalPrice: null,
    inStock: product.in_stock,
    mainImage: product.main_image,
    categories: [],
    slug: product.slug,
    type: null,
    createdAt: Date.parse(product.updated_at),
  }));

  // Client-side pagination for products
  const requestedPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const normalizedPage = Number.parseInt(requestedPage ?? "1", 10);
  const currentPage = Number.isFinite(normalizedPage) && normalizedPage > 0 ? normalizedPage : 1;
  const perPage = 9;
  const totalProducts = products.length;
  const lastPage = Math.ceil(totalProducts / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedProducts = products.slice(startIndex, endIndex);

  const materialImage = `https://placehold.co/1200x800?text=${encodeURIComponent(material.title)}`;

  return (
    <div className="bg-white">
      <section className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-300 flex-col gap-4">
          <nav className="flex flex-wrap items-center gap-2 text-sm leading-5 text-zinc-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-800">
              Home
            </Link>
            <span>/</span>
            <span>Category</span>
            <span>/</span>
            <Link href="/materials" className="hover:text-neutral-800">
              Materials
            </Link>
            <span>/</span>
            <span className="font-semibold text-neutral-700">{material.title}</span>
          </nav>

          <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-12">
              <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold leading-10 text-neutral-800">{material.title}</h1>
                <p className="text-lg leading-7 text-neutral-700">{material.subtitle}</p>
                <div className="relative min-h-80 overflow-hidden rounded-xl bg-gray-100 sm:min-h-127.25">
                  <Image
                    src={materialImage}
                    alt={`${material.title} material`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 732px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <Accordion title="Product Description">
                  <div 
                    className="text-base leading-6 text-neutral-700"
                    dangerouslySetInnerHTML={{ __html: material.description }}
                  />
                </Accordion>

                <Accordion title="Product specifications">
                  <SpecsTable material={material} />
                </Accordion>
              </div>
            </div>

            <HelpPanel />
          </div>
        </div>
      </section>

      <MaterialProductsSection 
        title="Products from This Material" 
        products={paginatedProducts} 
        currentPage={currentPage}
        lastPage={lastPage}
        materialSlug={slug}
      />

      <CTABanner />
    </div>
  );
}
