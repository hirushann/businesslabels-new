import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Accordion from "@/components/Accordion";
import CTABanner from "@/components/CTABanner";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { demoProducts, mapDemoProductToCard } from "@/lib/demoCatalog";

type Material = {
  id: number;
  title: string;
  subtitle: string;
  slug: string;
  code: string;
  brand: string;
  status: string;
  description: string;
  specifications: Record<string, string>;
  print_method: string;
  base_material: string;
  finish: string;
  adhesive: string;
  supplier: string;
  price_per_sq_meter: number;
  certificate: string;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

type MaterialResponse = {
  data: Material;
};

type MaterialPageProps = {
  params: Promise<{ slug: string }>;
};

const relatedSections = [
  {
    title: "Ink & Maintenance",
    products: demoProducts.slice(0, 3).map(mapDemoProductToCard),
  },
];

async function getMaterial(slug: string): Promise<Material | null> {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/api/materials/slug/${slug}`, {
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
    { label: "Price per m²", value: `€${material.price_per_sq_meter}` },
    { label: "Certificate", value: material.certificate },
    ...Object.entries(material.specifications || {}).map(([label, value]) => ({ label, value })),
  ];

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

function productHref(product: ProductCardData): { pathname: string; query?: { type: "simple" | "variable" } } | undefined {
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

function RelatedProductsSection({ title, products }: { title: string; products: ProductCardData[] }) {
  return (
    <section className="px-4 py-24 odd:bg-gray-50 even:bg-white sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-4xl font-bold leading-[48px] text-neutral-800">{title}</h2>
          <div className="flex items-center gap-6">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-neutral-700 shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)]"
              aria-label={`Previous ${title}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500 bg-white text-amber-500 shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)]"
              aria-label={`Next ${title}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} href={productHref(product)} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function SingleMaterialPage({ params }: MaterialPageProps) {
  const { slug } = await params;
  const material = await getMaterial(slug);

  if (!material) {
    notFound();
  }

  const materialImage = `https://placehold.co/1200x800?text=${encodeURIComponent(material.title)}`;

  return (
    <div className="bg-white">
      <section className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4">
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
                <div className="relative min-h-[320px] overflow-hidden rounded-xl bg-gray-100 sm:min-h-[509px]">
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

      {relatedSections.map((section) => (
        <RelatedProductsSection key={section.title} title={section.title} products={section.products} />
      ))}

      <CTABanner />
    </div>
  );
}
