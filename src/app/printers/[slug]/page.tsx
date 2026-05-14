import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Accordion from "@/components/Accordion";
import CTABanner from "@/components/CTABanner";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { getPrinterProducts } from "@/lib/api/compatibility";
import type { Printer } from "@/lib/types/printer";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

type PrinterResponse = {
  data: Printer;
};

type PrinterPageProps = {
  params: Promise<{ slug: string }>;
};

async function getPrinter(slug: string): Promise<Printer | null> {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  if (!baseUrl) return null;

  try {
    const locale = await getServerLocale();
    const response = await fetch(withLocaleParam(`${baseUrl}/api/printers/slug/${slug}`, locale), {
      cache: "no-store",
    });

    if (!response.ok) return null;

    const json = (await response.json()) as PrinterResponse;
    return json.data;
  } catch (error) {
    console.error("Error fetching printer:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PrinterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const printer = await getPrinter(slug);

  if (!printer) {
    return {
      title: "Printer — Businesslabels",
    };
  }

  return {
    title: `${printer.title} — Businesslabels`,
    description: printer.subtitle || undefined,
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

function HelpPanel({
  labels,
}: {
  labels: {
    title: string;
    callUs: string;
    email: string;
    whatsapp: string;
    availableProduct: string;
    customMade: string;
  };
}) {
  const actions = [
    { label: labels.callUs, type: "call" as const },
    { label: labels.email, type: "email" as const },
    { label: labels.whatsapp, type: "whatsapp" as const },
  ];

  return (
    <aside className="flex w-full flex-col gap-6 lg:sticky lg:top-24 lg:w-96">
      <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)]">
        <h2 className="text-lg font-bold leading-5 text-neutral-700">{labels.title}</h2>
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
          {labels.availableProduct}
        </Link>
        <Link
          href="/custom"
          className="flex h-12 items-center justify-center rounded-full border border-amber-500 bg-amber-500/20 px-4 text-lg font-semibold leading-6 text-amber-500 transition-colors hover:bg-amber-500/30"
        >
          {labels.customMade}
        </Link>
      </div>
    </aside>
  );
}

function CompatibilityPropertiesCard({ 
  printer, 
  labels 
}: { 
  printer: Printer; 
  labels: {
    title: string;
    printMethod: string;
    core: string;
    width: string;
    maxOuterDiameter: string;
    td: string;
    tt: string;
  };
}) {
  const props = printer.properties;
  
  // Format print methods
  const printMethods = props.printmethode || props.druktype || [];
  const printMethodDisplay = printMethods.map(method => {
    if (method === 'TD') return labels.td;
    if (method === 'TT') return labels.tt;
    return method;
  }).join(', ');
  
  // Format width range
  const minWidth = props['label-breedte-min']?.[0] || 
                   (props.breedte && Math.min(...props.breedte.map(Number)).toString());
  const maxWidth = props['label-breedte-max']?.[0] || 
                   (props.breedte && Math.max(...props.breedte.map(Number)).toString());
  const widthDisplay = minWidth && maxWidth ? `${minWidth} - ${maxWidth} mm` : 'N/A';
  
  // Format core diameters
  const cores = props.kern || [];
  const coreDisplay = cores.join(', ') + (cores.length > 0 ? ' mm' : '');
  
  // Format max outer diameter
  const maxOuterDiameter = props['max-buiten-diameter']?.[0] || props.max_buiten_diameter;
  const maxOuterDiameterDisplay = maxOuterDiameter ? `${maxOuterDiameter} mm` : 'N/A';

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6">
      <h3 className="mb-4 text-lg font-bold leading-6 text-neutral-800">{labels.title}</h3>
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-4">
          <span className="text-sm leading-5 text-neutral-700">{labels.printMethod}:</span>
          <span className="text-right text-sm font-semibold leading-5 text-neutral-800">
            {printMethodDisplay || 'N/A'}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <span className="text-sm leading-5 text-neutral-700">{labels.width}:</span>
          <span className="text-right text-sm font-semibold leading-5 text-neutral-800">
            {widthDisplay}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <span className="text-sm leading-5 text-neutral-700">{labels.core}:</span>
          <span className="text-right text-sm font-semibold leading-5 text-neutral-800">
            {coreDisplay || 'N/A'}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <span className="text-sm leading-5 text-neutral-700">{labels.maxOuterDiameter}:</span>
          <span className="text-right text-sm font-semibold leading-5 text-neutral-800">
            {maxOuterDiameterDisplay}
          </span>
        </div>
      </div>
    </div>
  );
}

function SpecsTable({ printer, labels }: { printer: Printer; labels: Record<string, string> }) {
  const props = printer.properties;
  
  const specs: Array<{ label: string; value: string }> = [];
  
  // Print method
  const printMethods = props.printmethode || props.druktype || [];
  if (printMethods.length > 0) {
    specs.push({ 
      label: labels.printMethod, 
      value: printMethods.map(m => {
        if (m === 'TD') return labels.td || 'Thermal Direct';
        if (m === 'TT') return labels.tt || 'Thermal Transfer';
        return m;
      }).join(', ')
    });
  }
  
  // Width range
  const minWidth = props['label-breedte-min']?.[0];
  const maxWidth = props['label-breedte-max']?.[0];
  if (minWidth && maxWidth) {
    specs.push({ label: labels.width, value: `${minWidth} - ${maxWidth} mm` });
  } else if (props.breedte && props.breedte.length > 0) {
    const widths = props.breedte.map(Number);
    specs.push({ label: labels.width, value: `${Math.min(...widths)} - ${Math.max(...widths)} mm` });
  }
  
  // Cores
  if (props.kern && props.kern.length > 0) {
    specs.push({ label: labels.core, value: props.kern.join(', ') + ' mm' });
  }
  
  // Outer diameters
  if (props['buiten-diameter'] && props['buiten-diameter'].length > 0) {
    specs.push({ label: labels.outerDiameter, value: props['buiten-diameter'].join(', ') + ' mm' });
  }
  
  // Max outer diameter
  const maxOD = props['max-buiten-diameter']?.[0] || props.max_buiten_diameter;
  if (maxOD) {
    specs.push({ label: labels.maxOuterDiameter, value: `${maxOD} mm` });
  }
  
  // Detection methods
  if (props.detectie && props.detectie.length > 0) {
    specs.push({ label: labels.detection, value: props.detectie.join(', ') });
  }
  
  // Label types
  if (props.labeltype && props.labeltype.length > 0) {
    specs.push({ label: labels.labelType, value: props.labeltype.join(', ') });
  }

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

function RelatedProductsSection({ title, products }: { title: string; products: ProductCardData[] }) {
  return (
    <section className="px-4 py-24 odd:bg-gray-50 even:bg-white sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-300 flex-col gap-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-4xl font-bold leading-12 text-neutral-800">{title}</h2>
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

export default async function PrinterDetailPage({ params }: PrinterPageProps) {
  const { slug } = await params;
  const t = await getTranslations();
  const printer = await getPrinter(slug);

  if (!printer) {
    notFound();
  }

  // Fetch compatible products
  let compatibleProducts: ProductCardData[] = [];
  try {
    const result = await getPrinterProducts(printer.id, {
      productType: 'labels',
      perPage: 12,
    });
    
    // Map products to ProductCardData format
    compatibleProducts = result.products.data.map((product) => {
      const locale = 'nl'; // TODO: Get from server locale
      return {
        id: product.id,
        sku: product.sku || '',
        name: typeof product.name === 'string' ? product.name : product.name[locale as keyof typeof product.name],
        slug: typeof product.slug === 'string' ? product.slug : product.slug[locale as keyof typeof product.slug],
        price: product.price,
        originalPrice: product.original_price || undefined,
        image: product.main_image || undefined,
        inStock: product.in_stock,
        type: product.type as 'simple' | 'variable' | 'group_product',
      };
    });
  } catch (error) {
    console.error("Error fetching compatible products:", error);
    // Continue without compatible products
  }

  const printerImage = printer.image || `https://placehold.co/1200x800?text=${encodeURIComponent(printer.title || 'Printer')}`;

  return (
    <div className="bg-white">
      <section className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-300 flex-col gap-4">
          <Breadcrumbs 
            className="text-neutral-900"
            items={[
              { label: t("common.printers"), href: "/printers" },
              { label: printer.title || 'Printer' }
            ]} 
          />

          <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-12">
              <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold leading-10 text-neutral-800">{printer.title}</h1>
                {printer.subtitle && (
                  <p className="text-lg leading-7 text-neutral-700">{printer.subtitle}</p>
                )}
                <div className="relative min-h-80 overflow-hidden rounded-xl bg-gray-100 sm:min-h-[509px]">
                  <Image
                    src={printerImage}
                    alt={t("printersPage.printerAlt", { title: printer.title || 'Printer' })}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 732px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>

              {/* Compatibility Properties Card */}
              <CompatibilityPropertiesCard 
                printer={printer} 
                labels={{
                  title: t("printer.compatibilityTitle"),
                  printMethod: t("printer.printMethod"),
                  core: t("printer.core"),
                  width: t("printer.width"),
                  maxOuterDiameter: t("printer.maxOuterDiameter"),
                  td: t("printer.thermalDirect"),
                  tt: t("printer.thermalTransfer"),
                }}
              />

              <div className="flex flex-col gap-6">
                {printer.content && (
                  <Accordion title={t("product.productDescription")}>
                    <div 
                      className="text-base leading-6 text-neutral-700"
                      dangerouslySetInnerHTML={{ __html: printer.content }}
                    />
                  </Accordion>
                )}

                <Accordion title={t("product.productSpecifications")}>
                  <SpecsTable
                    printer={printer}
                    labels={{
                      printMethod: t("printer.printMethod"),
                      width: t("printer.width"),
                      core: t("printer.core"),
                      outerDiameter: t("printer.outerDiameter"),
                      maxOuterDiameter: t("printer.maxOuterDiameter"),
                      detection: t("printer.detection"),
                      labelType: t("printer.labelType"),
                      td: t("printer.thermalDirect"),
                      tt: t("printer.thermalTransfer"),
                    }}
                  />
                </Accordion>
              </div>
            </div>

            <HelpPanel
              labels={{
                title: t("supportPanel.title"),
                callUs: t("supportPanel.callUs"),
                email: t("supportPanel.email"),
                whatsapp: t("supportPanel.whatsapp"),
                availableProduct: t("supportPanel.availableProduct"),
                customMade: t("supportPanel.customMade"),
              }}
            />
          </div>
        </div>
      </section>

      {compatibleProducts.length > 0 && (
        <RelatedProductsSection 
          title={t("printer.compatibleProducts")} 
          products={compatibleProducts} 
        />
      )}

      <CTABanner />
    </div>
  );
}
