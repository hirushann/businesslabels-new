"use client";

import Image from "next/image";
import Link from "next/link";
import type { LinkProps } from "next/link";
import { useCart } from "@/components/CartProvider";

export type ProductRouteType = "simple" | "variable";

export type ProductCardData = {
  id: string | number;
  sku: string;
  name: string;
  subtitle?: string | null;
  excerpt?: string | null;
  materialTitle?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  inStock: boolean;
  mainImage?: string | null;
  categories?: Array<{ id?: number; name?: string | null }>;
  slug?: string | null;
  type?: ProductRouteType | null;
};

type ProductCardProps = {
  product: ProductCardData;
  href?: LinkProps["href"];
  onClick?: () => void;
};

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function featureLines(product: ProductCardData): string[] {
  return [product.subtitle, product.materialTitle, product.excerpt]
    .map((value) => normalizeText(value))
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
}

export function lastCategoryLabel(categories: ProductCardData["categories"]): string {
  const label = categories?.[categories.length - 1]?.name?.trim();
  return label || "N/A";
}

export default function ProductCard({ product, href, onClick }: ProductCardProps) {
  const { addItem, openCart } = useCart();
  const categoryBadge = lastCategoryLabel(product.categories);
  const features = featureLines(product);
  const hasPrice = typeof product.price === "number" && Number.isFinite(product.price);
  const hasOriginalPrice =
    typeof product.originalPrice === "number" &&
    Number.isFinite(product.originalPrice) &&
    (!hasPrice || (hasPrice && (product.price !== undefined && product.price !== null) && product.originalPrice > product.price));
  const imageSrc = normalizeText(product.mainImage) || "https://placehold.co/600x400";

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    addItem({
      id: product.id,
      slug: product.slug,
      type: product.type,
      name: product.name,
      sku: product.sku,
      price: product.price ?? null,
      mainImage: product.mainImage ?? null,
    });
    
    openCart();
  };

  const cardContent = (
    <div className="mx-auto h-full w-full max-w-[22rem] bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] border border-slate-100 flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-56 bg-slate-100 overflow-hidden">
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <div className="px-2.5 py-1 bg-white rounded-full flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_757_440)">
                <path d="M3 9H2C1.73478 9 1.48043 8.89464 1.29289 8.70711C1.10536 8.51957 1 8.26522 1 8V5.5C1 5.23478 1.10536 4.98043 1.29289 4.79289C1.48043 4.60536 1.73478 4.5 2 4.5H10C10.2652 4.5 10.5196 4.60536 10.7071 4.79289C10.8946 4.98043 11 5.23478 11 5.5V8C11 8.26522 10.8946 8.51957 10.7071 8.70711C10.5196 8.89464 10.2652 9 10 9H9" stroke="#444444" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 4.5V1.5C3 1.36739 3.05268 1.24021 3.14645 1.14645C3.24021 1.05268 3.36739 1 3.5 1H8.5C8.63261 1 8.75979 1.05268 8.85355 1.14645C8.94732 1.24021 9 1.36739 9 1.5V4.5" stroke="#444444" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.5 7H3.5C3.22386 7 3 7.22386 3 7.5V10.5C3 10.7761 3.22386 11 3.5 11H8.5C8.77614 11 9 10.7761 9 10.5V7.5C9 7.22386 8.77614 7 8.5 7Z" stroke="#444444" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <defs>
                <clipPath id="clip0_757_440">
                  <rect width="12" height="12" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <span className="text-neutral-700 text-xs font-normal font-['Segoe_UI'] leading-4">{categoryBadge}</span>
          </div>
          {product.inStock ? (
            <div className="px-2.5 py-1 bg-green-600 rounded-full flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-white text-xs font-normal font-['Segoe_UI'] leading-4">In Stock</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 bg-gray-200 rounded-full flex items-center gap-1.5">
              <span className="text-gray-600 text-xs font-normal font-['Segoe_UI'] leading-4">Out of Stock</span>
            </div>
          )}
        </div>
        <Image
          src={imageSrc}
          alt={product.name}
          width={600}
          height={400}
          className="h-full w-auto object-contain mx-auto py-5"
          unoptimized
        />
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-blue-400 text-sm font-normal font-['Segoe_UI'] leading-5">SKU: {product.sku}</span>
            <h3 className="text-neutral-800 text-xl font-semibold font-['Segoe_UI'] leading-6">{product.name}</h3>
          </div>
          {features.length > 0 && (
            <div className="flex flex-col gap-4">
              {features.map((feature, index) => (
                <div key={`${feature}-${index}`} className="flex items-start gap-2">
                  <svg className="shrink-0 mt-1" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_757_364)">
                      <path d="M10.9013 4.99975C11.1296 6.1204 10.9669 7.28546 10.4402 8.30065C9.91352 9.31583 9.05473 10.1198 8.00704 10.5784C6.95935 11.037 5.7861 11.1226 4.68293 10.8209C3.57977 10.5192 2.61338 9.84845 1.94492 8.92046C1.27646 7.99247 0.946343 6.86337 1.00961 5.72144C1.07289 4.57952 1.52572 3.4938 2.29261 2.64534C3.05949 1.79688 4.09407 1.23697 5.22381 1.05898C6.35356 0.880989 7.51017 1.09568 8.50078 1.66725" stroke="#00C950" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4.5 5.5L6 7L11 2" stroke="#00C950" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs>
                      <clipPath id="clip0_757_364">
                        <rect width="12" height="12" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <span className="line-clamp-2 break-words text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-5">{feature}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 mt-auto">
          <div className="bg-slate-100" />
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <div className="flex items-end gap-2">
                <span className="text-neutral-800 text-2xl font-bold font-['Segoe_UI'] leading-7">
                  {hasPrice ? `€${product.price?.toFixed(2)}` : "-"}
                </span>
                {hasOriginalPrice ? (
                  <span className="text-zinc-400 text-sm font-normal font-['Segoe_UI'] leading-5 line-through">
                    €{product.originalPrice?.toFixed(2)}
                  </span>
                ) : null}
              </div>
              <span className="text-zinc-500 text-xs font-normal font-['Segoe_UI'] leading-4">ex. VAT</span>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="px-4 py-2.5 bg-amber-500 rounded-full flex items-center gap-2 text-white text-base font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors"
              aria-label={`Add ${product.name} to cart`}
            >
              Add
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.33268 14.6663C7.83894 14.6663 8.24935 14.3679 8.24935 13.9997C8.24935 13.6315 7.83894 13.333 7.33268 13.333C6.82642 13.333 6.41602 13.6315 6.41602 13.9997C6.41602 14.3679 6.82642 14.6663 7.33268 14.6663Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17.4167 14.6663C17.9229 14.6663 18.3333 14.3679 18.3333 13.9997C18.3333 13.6315 17.9229 13.333 17.4167 13.333C16.9104 13.333 16.5 13.6315 16.5 13.9997C16.5 14.3679 16.9104 14.6663 17.4167 14.6663Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1.87891 1.36621H3.71224L6.15057 9.64621C6.24002 9.94945 6.47202 10.2205 6.80664 10.4128C7.14126 10.605 7.55757 10.7064 7.9839 10.6995H16.9489C17.3661 10.6991 17.7707 10.5951 18.0957 10.4048C18.4207 10.2145 18.6467 9.94923 18.7364 9.65288L20.2489 4.69954H4.69307" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!href) {
    return <div>{cardContent}</div>;
  }

  return (
    <Link href={href} className="block h-full w-full" onClick={onClick}>
      {cardContent}
    </Link>
  );
}
