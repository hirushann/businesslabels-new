import type { ProductCardData } from "@/components/ProductCard";
import type { CartItem } from "@/components/CartProvider";

export type DemoProductDetail = {
  id: number;
  type: "simple";
  title: string;
  name: string;
  subtitle: string;
  description: string;
  excerpt: string;
  slug: string;
  sku: string;
  article_number: string;
  price: number;
  original_price: number;
  stock: number;
  in_stock: boolean;
  main_image: string;
  gallery_images: Array<{ id: number; url: string; name: string }>;
  material: {
    id: number;
    title: string;
    slug: string;
    subtitle: string;
    category: { id: number; name: string; slug: string };
  };
  meta: Record<string, string | number | boolean>;
  material_information: string;
  make: string;
  packaging_unit: number;
  jeritech_stock: number;
  delivery_dates_no_stock: number;
  delivery_dates_in_stock: number;
  packing_group: number;
  dimensions: {
    weight: string;
    width: string;
    height: string;
    length: string;
  };
  categories: Array<{ id: number; name: string; slug: string }>;
};

function demoImage(index: number): string {
  return `https://placehold.co/600x400?text=Demo+${index}`;
}

function createDemoProduct(index: number): DemoProductDetail {
  const slug = index === 1 ? "demo" : `demo-product-${index}`;
  const width = 50 + index;
  const height = 25 + (index % 10);
  const price = 19.5 + index * 2.75;
  const originalPrice = price + 8.5;
  const inStock = index % 5 !== 0;

  return {
    id: 9000 + index,
    type: "simple",
    title: `Demo Product ${index} Thermal Labels`,
    name: `Demo Product ${index} Thermal Labels`,
    subtitle: `Designed for barcode, warehouse and shipping workflows`,
    description: `<p>Demo product ${index} is a fully populated placeholder product used to preview the BusinessLabels product detail experience. It includes realistic product text, specification data, pricing, and image galleries.</p><p>Use it for visual QA, content layout checks, and interaction testing across the catalog, cart, and checkout flows.</p>`,
    excerpt: `Reliable matte label rolls for high-volume business printing and logistics operations.`,
    slug,
    sku: `DEMO-${String(index).padStart(3, "0")}`,
    article_number: `ART-DEMO-${String(index).padStart(4, "0")}`,
    price,
    original_price: originalPrice,
    stock: 25 + index,
    in_stock: inStock,
    main_image: demoImage(index),
    gallery_images: [
      { id: index * 10 + 1, name: `Demo ${index} Main`, url: demoImage(index) },
      { id: index * 10 + 2, name: `Demo ${index} Side`, url: `https://placehold.co/600x400?text=Demo+${index}+Side` },
      { id: index * 10 + 3, name: `Demo ${index} Pack`, url: `https://placehold.co/600x400?text=Demo+${index}+Pack` },
    ],
    material: {
      id: index,
      title: "Premium Thermal Paper",
      slug: "premium-thermal-paper",
      subtitle: "Matte coated paper stock",
      category: {
        id: 1,
        name: "Paper Materials",
        slug: "paper-materials",
      },
    },
    meta: {
      brand: "Citizen",
      printer_type: "industrial",
      glue: "permanent",
      finishing: "matte",
      meta_width: `${width}mm`,
      meta_height: `${height}mm`,
      detectie: "black_mark",
      packaging_unit: index % 4 === 0 ? 4 : 2,
    },
    material_information: "Premium Thermal Paper / matte / permanent",
    make: "CITIZEN",
    packaging_unit: index % 4 === 0 ? 4 : 2,
    jeritech_stock: 10 + index,
    delivery_dates_no_stock: 10,
    delivery_dates_in_stock: inStock ? 1 : 5,
    packing_group: 3,
    dimensions: {
      weight: `${(1.2 + index * 0.07).toFixed(2)}`,
      width: `${(3 + index * 0.08).toFixed(2)}`,
      height: `${(7 + index * 0.11).toFixed(2)}`,
      length: `${(10 + index * 0.14).toFixed(2)}`,
    },
    categories: [
      { id: 1, name: "Demo Labels", slug: "demo-labels" },
      { id: 2, name: `Demo Series ${Math.ceil(index / 6)}`, slug: `demo-series-${Math.ceil(index / 6)}` },
    ],
  };
}

export const demoProducts: DemoProductDetail[] = Array.from({ length: 24 }, (_, index) =>
  createDemoProduct(index + 1),
);

export const demoCheckoutItems: CartItem[] = demoProducts.slice(0, 5).map((product, index) => ({
  key: `demo-checkout-${product.slug}`,
  id: product.id,
  slug: product.slug,
  type: product.type,
  name: product.title,
  sku: product.sku,
  price: product.price,
  mainImage: product.main_image,
  quantity: index % 2 === 0 ? 1 : 2,
}));

export function getDemoProductBySlug(slug: string): DemoProductDetail | null {
  return demoProducts.find((product) => product.slug === slug) ?? null;
}

export function mapDemoProductToCard(product: DemoProductDetail): ProductCardData {
  return {
    id: product.id,
    sku: product.sku,
    name: product.title,
    subtitle: product.subtitle,
    excerpt: product.excerpt,
    materialTitle: product.material.title,
    price: product.price,
    originalPrice: product.original_price,
    inStock: product.in_stock,
    mainImage: product.main_image,
    categories: product.categories,
    slug: product.slug,
    type: product.type,
  };
}
