import type { Metadata } from "next";
import Accordion from "@/components/Accordion";
import ProductPurchase from "@/components/ProductPurchase";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import ProductImageGallery from "@/components/ProductImageGallery";
import { getDemoProductBySlug } from "@/lib/demoCatalog";
import { notFound } from "next/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const baseUrl = process.env.BBNL_API_BASE_URL;

  if (!slug || !baseUrl) {
    return { title: "Product — BusinessLabels" };
  }

  const selectedType = normalizeType(query.type);
  const tryTypes: Array<"simple" | "variable"> = selectedType
    ? [selectedType]
    : ["simple", "variable"];

  let product: ProductDetail | null = null;
  for (const type of tryTypes) {
    product = await fetchProductByType(baseUrl, type, slug);
    if (product) break;
  }

  if (!product) {
    return { title: "Product Not Found — BusinessLabels" };
  }

  const title = product.meta_title || `${product.title || product.name} — BusinessLabels`;
  const description = product.meta_description || product.description || product.excerpt || "Premium product from BusinessLabels";
  const mainImage = product.main_image || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: mainImage ? [mainImage] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: mainImage ? [mainImage] : [],
    },
  };
}

type UpsellProduct = {
  id: number;
  title: string;
  slug: string;
  sku: string;
  price: number;
  original_price: number;
  main_image: string;
};

type ProductDetail = {
  id?: number;
  type?: string;
  title?: string | null;
  name?: string | null;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  slug?: string | null;
  sku?: string | null;
  article_number?: string | null;
  price?: number | null;
  original_price?: number | null;
  stock?: number | null;
  in_stock?: boolean | null;
  main_image?: string | null;
  gallery_images?: Array<{ id?: number; url?: string | null; name?: string | null }>;
  product_information?: Record<string, unknown> | string | null;
  material?: {
    id?: number;
    title?: string | null;
    slug?: string | null;
    subtitle?: string | null;
    category?: { id?: number; name?: string | null; slug?: string | null } | null;
  } | null;
  meta?: Record<string, string | number | boolean | null> | null;
  meta_title?: string | null;
  meta_description?: string | null;
  material_information?: string | null;
  make?: string | null;
  packaging_unit?: number | null;
  jeritech_stock?: number | null;
  delivery_dates_in_stock?: number | null;
  delivery_dates_no_stock?: number | null;
  packing_group?: number | null;
  dimensions?: {
    weight?: string | number | null;
    width?: string | number | null;
    height?: string | number | null;
    length?: string | number | null;
  } | null;
  categories?: Array<{ id?: number; name?: string | null }>;
  up_sells?: UpsellProduct[];
  cross_sells?: UpsellProduct[];
};

function normalizeType(raw: string | string[] | undefined): "simple" | "variable" | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "simple" || value === "variable") {
    return value;
  }
  return null;
}

function normalizeValue(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  return String(value).trim() || null;
}

function normalizeDisplayValue(value: unknown): string | null {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return null;
  }

  return toTitleCaseFromSlug(normalized);
}

function specsFromProduct(product: ProductDetail | null): Array<{ label: string; value: string }> {
  const missing = "-";
  const meta = product?.meta ?? {};
  const categoryNames = (product?.categories ?? [])
    .map((category) => normalizeDisplayValue(category.name))
    .filter((name): name is string => Boolean(name))
    .join(", ");
  const specRows: Array<{ label: string; value: string }> = [
    { label: "SKU", value: normalizeDisplayValue(product?.sku) || missing },
    { label: "Category", value: categoryNames || missing },
  ];

  const metaRows = Object.entries(meta)
    .map(([key, value]) => {
      const normalizedValue = normalizeDisplayValue(value);
      if (!normalizedValue) {
        return null;
      }

      return {
        label: toTitleCaseFromSlug(key),
        value: normalizedValue,
      };
    })
    .filter((entry): entry is { label: string; value: string } => Boolean(entry));

  return [...specRows, ...metaRows];
}

async function fetchProductByType(baseUrl: string, type: "simple" | "variable", slug: string): Promise<ProductDetail | null> {
  try {
    const response = await fetch(`${baseUrl}/api/products/${type}/slug/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { data?: ProductDetail };
    return json.data ?? null;
  } catch (error) {
    console.error(`Failed to fetch product details for type '${type}' and slug '${slug}'`, error);
    return null;
  }
}



function toTitleCaseFromSlug(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapUpsellToProductCard(upsell: UpsellProduct): ProductCardData {
  return {
    id: upsell.id,
    name: upsell.title,
    sku: upsell.sku,
    subtitle: null,
    excerpt: null,
    materialTitle: null,
    price: upsell.price,
    originalPrice: upsell.original_price,
    inStock: true,
    mainImage: upsell.main_image,
    categories: [],
    slug: upsell.slug,
    type: "simple",
  };
}

function productHref(product: ProductCardData): { pathname: string; query?: { type: "simple" | "variable" } } | null {
  if (!product.slug) {
    return null;
  }

  if (product.type) {
    return {
      pathname: `/products/${product.slug}`,
      query: { type: product.type },
    };
  }

  return { pathname: `/products/${product.slug}` };
}

export default async function SingleProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const baseUrl = process.env.BBNL_API_BASE_URL;

  if (!slug) {
    notFound();
  }

  let product: ProductDetail | null = null;
  const selectedType = normalizeType(query.type);
  const demoProduct = getDemoProductBySlug(slug);

  if (demoProduct) {
    product = demoProduct;
  }

  if (!product && baseUrl) {
    const tryTypes: Array<"simple" | "variable"> = selectedType
      ? [selectedType]
      : ["simple", "variable"];

    for (const type of tryTypes) {
      const result = await fetchProductByType(baseUrl, type, slug);
      if (result) {
        product = result;
        console.log(`Fetched product details for slug '${slug}' with type '${type}'`);
        console.log("Product details:", product);
        break;
      }
    }
  } else {
    console.error("BBNL_API_BASE_URL is not configured");
  }

  if (!product) {
    notFound();
  }

  const productName = product.title || product.name || "";
  const productDescription = product.description || product.excerpt || "";
  const mainImage = product.main_image || "";
  const galleryImages = (product.gallery_images ?? [])
    .map((item) => item.url)
    .filter((url): url is string => Boolean(url));
  const specs = specsFromProduct(product);
  const relatedProducts = (product.up_sells ?? []).map(mapUpsellToProductCard);

  return (
    <div className="bg-white">


      {/* Main Product Section */}
      <div className="px-10 py-10">
        {/* Breadcrumb */}
        <div className="pb-8">
          <div className="max-w-360 mx-auto flex items-center gap-2 text-sm text-zinc-500">
            <span>Home</span>
            <span>/</span>
            <span>Products</span>
            <span>/</span>
            <span className="text-neutral-700 font-semibold">{productName}</span>
          </div>
        </div>
        <div className="max-w-360 mx-auto flex gap-12 items-start">
          {/* LEFT: Images + Description + Specs */}
          <div className="flex-1 flex flex-col gap-12">
            {/* Title & Description */}
            <div className="flex flex-col gap-4">
              {productName ? (
                <h1 className="text-neutral-800 text-3xl font-bold leading-10">
                  {productName}
                </h1>
              ) : null}
              {productDescription ? (
                <div className="text-neutral-700 text-lg font-normal leading-7" dangerouslySetInnerHTML={{ __html: productDescription }}>
                </div>
              ) : null}
            </div>

            {/* Image Gallery */}
            <ProductImageGallery
              productName={productName}
              mainImage={mainImage}
              galleryImages={galleryImages}
            />

            <div className="flex flex-col gap-6">
              <Accordion
                title="Product Description"
              >
                {productDescription ? (
                  <div
                    className="text-neutral-700 text-base font-normal leading-6"
                    dangerouslySetInnerHTML={{ __html: productDescription }}
                  />
                ) : (
                  <div className="text-neutral-500 text-base font-normal leading-6">
                    No product description available.
                  </div>
                )}
              </Accordion>

              <Accordion
                title="Product specifications"
              >
                <div className="rounded-lg overflow-hidden flex flex-col gap-2">
                  {specs.map((spec, i) => (
                    <div
                      key={spec.label}
                      className={`flex py-3 justify-between items-center ${i % 2 === 0 ? "bg-white/50" : ""}`}
                    >
                      <span className="text-neutral-500 text-base font-normal">{spec.label}</span>
                      <span className="text-neutral-700 text-base font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </Accordion>

              {/* Compatibility CTA */}
              <div className="p-6 bg-gradient-to-br from-orange-50 to-white rounded-xl outline outline-2 outline-offset-[-2px] outline-orange-100">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 p-2 bg-white rounded-lg shadow-sm flex-shrink-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                    </svg>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-neutral-700 text-2xl font-bold leading-7">Does this fit my printer?</h3>
                      <p className="text-neutral-700 text-base font-normal leading-6">
                        Use our product finder to check compatibility with your specific printer model.
                      </p>
                    </div>
                    <button className="text-amber-500 text-base font-semibold underline text-left">
                      Check Compatibility
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Purchase Card */}
          <div className="flex flex-col gap-6 w-96 sticky top-24">
            <ProductPurchase
              id={product?.id}
              slug={product?.slug}
              type={normalizeType(product?.type)}
              name={productName}
              sku={product?.sku}
              subtitle={normalizeValue(product?.subtitle)}
              excerpt={normalizeValue(product?.excerpt)}
              materialTitle={normalizeValue(product?.material?.title)}
              inStock={product?.in_stock}
              price={product?.price}
              originalPrice={product?.original_price}
              mainImage={product?.main_image}
              packingGroup={(product?.packing_group?.toFixed(2))}
              stock={product?.stock}
              deliveryDatesInStock={product?.delivery_dates_in_stock}
              deliveryDatesNoStock={product?.delivery_dates_no_stock}
            />

            {/* Consumable Items */}
            <div className="flex flex-col gap-3">
              <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Consumable Items:
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {["Hardwares", "Ink & Maintenance", "Badges / Media"].map((item) => (
                  <button
                    key={item}
                    className="px-4 py-2.5 bg-blue-400/10 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-blue-400/50 text-blue-400 text-base font-bold text-left hover:bg-blue-400/20 transition-colors"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="px-10 py-10 bg-gray-50">
          <div className="mx-auto flex flex-col gap-12">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <div className="flex justify-between items-center px-20">
                <h2 className="text-neutral-800 text-4xl font-bold leading-[48px]">Related Products</h2>
                <div className="flex items-center gap-6">
                  <CarouselPrevious className="static translate-y-0 w-12 h-12 p-3 bg-gray-50 rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-gray-200 hover:bg-white transition-colors" />
                  <CarouselNext className="static translate-y-0 w-12 h-12 p-3 bg-white rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-amber-500 hover:bg-amber-50 transition-colors" />
                </div>
              </div>
              <CarouselContent className="-ml-6 mt-6">
                {relatedProducts.map((product) => {
                  const href = productHref(product);
                  return (
                    <CarouselItem key={product.id} className="pl-6 basis-1/3">
                      <ProductCard product={product} href={href ?? undefined} />
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      )}
    </div>
  );
}
