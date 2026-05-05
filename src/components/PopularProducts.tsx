import Link from 'next/link';
import EmptyState from "@/components/EmptyState";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";

type Product = {
  id: number;
  type: "simple" | "variable" | string;
  slug?: string | null;
  name: string;
  sku: string;
  subtitle: string;
  excerpt: string;
  price: number;
  original_price: number;
  in_stock: boolean;
  main_image: string;
  material?: {
    title: string;
  };
  categories?: Array<{
    id?: number;
    name?: string | null;
  }>;
};

type ProductsResponse = {
  data: Product[];
};

function normalizeType(raw: string | undefined): "simple" | "variable" | null {
  if (raw === "simple" || raw === "variable") {
    return raw;
  }
  return null;
}

export default async function PopularProducts() {
  const baseUrl = process.env.BBNL_API_BASE_URL;

  if (!baseUrl) {
    throw new Error('BBNL_API_BASE_URL is not configured');
  }

  let products: Product[] = [];
  try {
    const response = await fetch(`${baseUrl}/api/products`, {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const json = (await response.json()) as ProductsResponse;
      products = json.data.slice(0, 6);
    } else {
      console.error(`Failed to fetch products: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }

  return (
    <section className="relative w-full px-10 py-28 overflow-hidden">
      {/* Decorative blobs */}
      <div className="w-48 h-48 absolute right-52 top-0 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />
      <div className="w-48 h-48 absolute left-0 top-0 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />

      <div className="max-w-360 mx-auto w-full flex flex-col gap-12">
        {/* Header row */}
        <div className="flex justify-between items-center">
          <h2 className="text-neutral-800 text-4xl font-bold font-['Segoe_UI'] leading-[48px]">
            Popular Products
          </h2>
          <Link
            href="/products"
            className="px-6 py-4 rounded-full border border-amber-500 flex items-center gap-2.5 text-amber-500 text-base font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-50 transition-colors"
          >
            View All Products
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-3 gap-8">
          {products.length === 0 ? (
            <EmptyState
              className="col-span-3"
              title="No products found"
              description="There are currently no popular products available."
            />
          ) : (
            products.map((product) => {
              const cardProduct: ProductCardData = {
                id: product.id,
                sku: product.sku,
                name: product.name,
                subtitle: product.subtitle,
                excerpt: product.excerpt,
                materialTitle: product.material?.title ?? null,
                price: product.price,
                originalPrice: product.original_price,
                inStock: product.in_stock,
                mainImage: product.main_image,
                categories: product.categories,
                slug: product.slug,
                type: normalizeType(product.type),
              };

              const href = product.slug
                ? normalizeType(product.type)
                  ? { pathname: `/products/${product.slug}`, query: { type: normalizeType(product.type) } }
                  : { pathname: `/products/${product.slug}` }
                : undefined;

              return <ProductCard key={product.sku} product={cardProduct} href={href} />;
            })
          )}
        </div>
      </div>
    </section>
  );
}
