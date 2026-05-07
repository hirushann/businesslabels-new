"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ProductRouteType } from "@/components/ProductCard";
import { buildCartItemKey, useCart } from "@/components/CartProvider";
import { type WarrantyRawData, type WarrantyOption } from "@/lib/utils/warranty";

const WISHLIST_STORAGE_KEY = "businesslabels-wishlist";

export type WishlistItem = {
  key: string;
  id: string | number;
  slug?: string | null;
  type?: ProductRouteType | null;
  name: string;
  sku: string;
  price?: number | null;
  mainImage?: string | null;
  subtitle?: string | null;
  excerpt?: string | null;
  materialTitle?: string | null;
  inStock: boolean;
  warranty?: WarrantyRawData | null;
};

export type WishlistInput = Omit<WishlistItem, "key">;

type WishlistContextValue = {
  items: WishlistItem[];
  uniqueItemCount: number;
  addItem: (item: WishlistInput) => void;
  removeItem: (key: string) => void;
  clearWishlist: () => void;
  moveToCart: (key: string, warrantyOption?: WarrantyOption) => void;
  hasItem: (item: Pick<WishlistInput, "id" | "slug" | "type">) => boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function wishlistItemKey(item: Pick<WishlistInput, "id" | "slug" | "type">): string {
  const slug = item.slug?.trim();
  const type = item.type?.trim();
  if (slug) {
    return type ? `${slug}::${type}` : slug;
  }

  return type ? `${item.id}::${type}` : String(item.id);
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WishlistItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load wishlist", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to persist wishlist", error);
    }
  }, [isHydrated, items]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      uniqueItemCount: items.length,
      addItem: (item) => {
        const key = wishlistItemKey(item);

        setItems((currentItems) => {
          if (currentItems.some((currentItem) => currentItem.key === key)) {
            return currentItems;
          }

          return [...currentItems, { ...item, key }];
        });
      },
      removeItem: (key) => {
        setItems((currentItems) => currentItems.filter((item) => item.key !== key));
      },
      clearWishlist: () => {
        setItems([]);
      },
      moveToCart: (key, warrantyOption) => {
        const item = items.find((entry) => entry.key === key);
        if (!item || !item.inStock) {
          return;
        }

        const parentInput = {
          id: item.id,
          slug: item.slug,
          type: item.type,
          name: item.name,
          sku: item.sku,
          price: item.price ?? null,
          mainImage: item.mainImage ?? null,
        };

        cart.addItem(parentInput);

        if (warrantyOption && warrantyOption.price > 0) {
          const parentKey = buildCartItemKey(parentInput);
          cart.addItem({
            id: `warranty-${parentKey}-${warrantyOption.id}`,
            name: warrantyOption.name,
            sku: `${item.sku}-WARRANTY`,
            price: warrantyOption.price,
            mainImage: item.mainImage ?? null,
            itemKind: "warranty",
            linkedToKey: parentKey,
            warranty: {
              optionId: warrantyOption.id,
              durationMonths: warrantyOption.durationMonths,
              parentSku: item.sku,
              parentName: item.name,
            },
          });
        }
      },
      hasItem: (item) => {
        const key = wishlistItemKey(item);
        return items.some((entry) => entry.key === key);
      },
    }),
    [cart, items],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }

  return context;
}
