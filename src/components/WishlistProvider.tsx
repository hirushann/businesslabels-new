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
  packingGroup?: number | null;
  allowSingulars?: boolean | null;
};

export type WishlistInput = Omit<WishlistItem, "key">;

type WishlistContextValue = {
  items: WishlistItem[];
  uniqueItemCount: number;
  addItem: (item: WishlistInput) => void;
  removeItem: (key: string, backendInfo?: { id: string | number; type?: ProductRouteType | null }) => void;
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

        if (typeof window !== 'undefined' && localStorage.getItem('auth_user')) {
          fetch('/api/account/favorites', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: item.type || 'simple',
              id: item.id,
            }),
          })
            .then((res) => {
              if (res.ok) {
                window.dispatchEvent(new Event('favorites-updated'));
              }
            })
            .catch((err) => console.error('Failed to sync favorite product add:', err));
        }
      },
      removeItem: (key, backendInfo) => {
        const itemToRemove = items.find((entry) => entry.key === key);
        setItems((currentItems) => currentItems.filter((item) => item.key !== key));

        const deleteId = backendInfo?.id ?? itemToRemove?.id;
        const deleteType = backendInfo?.type ?? itemToRemove?.type;

        if (deleteId && typeof window !== 'undefined' && localStorage.getItem('auth_user')) {
          fetch('/api/account/favorites', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: deleteType || 'simple',
              id: deleteId,
            }),
          })
            .then((res) => {
              if (res.ok) {
                window.dispatchEvent(new Event('favorites-updated'));
              }
            })
            .catch((err) => console.error('Failed to sync favorite product remove:', err));
        }
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
          packingGroup: item.packingGroup ?? null,
          allowSingulars: item.allowSingulars ?? null,
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
