"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ProductRouteType } from "@/components/ProductCard";

const CART_STORAGE_KEY = "businesslabels-cart";

export type CartItem = {
  key: string;
  id: string | number;
  slug?: string | null;
  type?: ProductRouteType | null;
  name: string;
  sku: string;
  price?: number | null;
  mainImage?: string | null;
  quantity: number;
  itemKind?: "product" | "warranty";
  linkedToKey?: string | null;
  warranty?: {
    optionId: number;
    durationMonths?: number | null;
    parentSku?: string | null;
    parentName?: string | null;
  } | null;
};

type CartInput = Omit<CartItem, "key" | "quantity">;

type CartContextValue = {
  items: CartItem[];
  uniqueItemCount: number;
  totalAmount: number;
  addItem: (item: CartInput, quantity?: number) => void;
  removeItem: (key: string) => void;
  incrementItemQuantity: (key: string) => void;
  decrementItemQuantity: (key: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function buildCartItemKey(item: Pick<CartInput, "id" | "slug" | "type">): string {
  const slug = item.slug?.trim();
  const type = item.type?.trim();
  if (slug) {
    return type ? `${slug}::${type}` : slug;
  }
  return type ? `${item.id}::${type}` : String(item.id);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load cart", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to persist cart", error);
    }
  }, [isHydrated, items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      uniqueItemCount: items.length,
      totalAmount: items.reduce((sum, item) => {
        const price = typeof item.price === "number" && Number.isFinite(item.price) ? item.price : 0;
        return sum + price * item.quantity;
      }, 0),
      addItem: (item, quantity = 1) => {
        const normalizedQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
        const key = buildCartItemKey(item);

        setItems((currentItems) => {
          const existingItem = currentItems.find((currentItem) => currentItem.key === key);

          if (existingItem) {
            return currentItems.map((currentItem) =>
              currentItem.key === key
                ? { ...currentItem, quantity: currentItem.quantity + normalizedQuantity }
                : currentItem,
            );
          }

          return [
            ...currentItems,
            {
              ...item,
              key,
              quantity: normalizedQuantity,
            },
          ];
        });
      },
      removeItem: (key) => {
        setItems((currentItems) => {
          const target = currentItems.find((item) => item.key === key);
          if (!target) {
            return currentItems;
          }

          if (target.itemKind === "warranty") {
            return currentItems.filter((item) => item.key !== key);
          }

          return currentItems.filter((item) => item.key !== key && item.linkedToKey !== key);
        });
      },
      incrementItemQuantity: (key) => {
        setItems((currentItems) => {
          const target = currentItems.find((item) => item.key === key);
          if (!target) {
            return currentItems;
          }

          return currentItems.map((item) => {
            if (item.key === key) {
              return { ...item, quantity: item.quantity + 1 };
            }

            if (target.itemKind !== "warranty" && item.linkedToKey === key) {
              return { ...item, quantity: item.quantity + 1 };
            }

            return item;
          });
        });
      },
      decrementItemQuantity: (key) => {
        setItems((currentItems) => {
          const target = currentItems.find((item) => item.key === key);
          if (!target) {
            return currentItems;
          }

          return currentItems.map((item) => {
            if (item.key === key) {
              return {
                ...item,
                quantity: item.quantity > 1 ? item.quantity - 1 : 1,
              };
            }

            if (target.itemKind !== "warranty" && item.linkedToKey === key) {
              return {
                ...item,
                quantity: item.quantity > 1 ? item.quantity - 1 : 1,
              };
            }

            return item;
          });
        });
      },
      clearCart: () => {
        setItems([]);
      },
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
    }),
    [items, isCartOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
