"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ProductRouteType } from "@/components/ProductCard";
import { useCart } from "@/components/CartProvider";

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
};

export type WishlistInput = Omit<WishlistItem, "key">;

type WishlistContextValue = {
  items: WishlistItem[];
  uniqueItemCount: number;
  addItem: (item: WishlistInput) => void;
  removeItem: (key: string) => void;
  clearWishlist: () => void;
  moveToCart: (key: string) => void;
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
      moveToCart: (key) => {
        const item = items.find((entry) => entry.key === key);
        if (!item || !item.inStock) {
          return;
        }

        cart.addItem({
          id: item.id,
          slug: item.slug,
          type: item.type,
          name: item.name,
          sku: item.sku,
          price: item.price ?? null,
          mainImage: item.mainImage ?? null,
        });
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
