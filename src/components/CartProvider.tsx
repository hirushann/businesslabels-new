"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ProductRouteType } from "@/components/ProductCard";

const CART_STORAGE_KEY = "businesslabels-cart";
const PURCHASE_REFERENCE_STORAGE_KEY = "businesslabels-purchase-reference";
const COUPON_CODE_STORAGE_KEY = "businesslabels-coupon-code";

type CartDiscountTier = {
  discount?: string | number | null;
  quantity?: string | number | null;
};

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
  packingGroup?: number | null;
  allowSingulars?: boolean | null;
  isLabelProduct?: boolean | null;
  itemKind?: "product" | "warranty";
  linkedToKey?: string | null;
  componentCount?: number | null;
  basePrice?: number | null;
  discounts?: string | CartDiscountTier[] | null;
  warranty?: {
    optionId: number;
    type?: string | null;
    typeName?: string | null;
    type_name?: string | null;
    warranty_type_name?: string | null;
    durationMonths?: number | null;
    parentSku?: string | null;
    parentName?: string | null;
    description?: string | null;
  } | null;
};

type CartInput = Omit<CartItem, "key" | "quantity">;

type CartContextValue = {
  items: CartItem[];
  uniqueItemCount: number;
  totalItemCount: number;
  totalAmount: number;
  addItem: (item: CartInput, quantity?: number) => void;
  removeItem: (key: string) => void;
  incrementItemQuantity: (key: string) => void;
  decrementItemQuantity: (key: string) => void;
  setItemQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  purchaseReference: string;
  setPurchaseReference: (value: string) => void;
  couponCode: string;
  setCouponCode: (value: string) => void;
  appliedCoupon: any | null;
  couponDiscountAmount: number;
  couponError: string | null;
  isApplyingCoupon: boolean;
  applyCouponCode: (code: string) => Promise<void>;
  removeCoupon: () => void;
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

function normalizePackingGroup(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
}

function nextQuantityForItem(item: CartItem): number {
  const packingGroup = normalizePackingGroup(item.packingGroup);
  if (!packingGroup) {
    return item.quantity + 1;
  }

  if (item.allowSingulars && item.quantity < packingGroup) {
    return item.quantity + 1;
  }

  if (item.quantity < packingGroup) {
    return packingGroup;
  }

  return Math.ceil((item.quantity + 1) / packingGroup) * packingGroup;
}

function previousQuantityForItem(item: CartItem): number {
  const packingGroup = normalizePackingGroup(item.packingGroup);
  if (!packingGroup) {
    return item.quantity > 1 ? item.quantity - 1 : 1;
  }

  if (item.quantity <= 1) {
    return 1;
  }

  if (item.allowSingulars && item.quantity <= packingGroup) {
    return item.quantity - 1;
  }

  if (item.quantity <= packingGroup) {
    return packingGroup;
  }

  return Math.max(packingGroup, Math.floor((item.quantity - 1) / packingGroup) * packingGroup);
}

function isCartDiscountTier(value: unknown): value is CartDiscountTier {
  return typeof value === "object" && value !== null;
}

function calculateUnitPrice(item: CartItem): number | null | undefined {
  if (item.itemKind === "warranty") return item.price;
  const priceToUse = item.basePrice ?? item.price;
  if (typeof priceToUse !== "number") return item.price;
  if (!item.discounts) return priceToUse;

  let parsedDiscounts: CartDiscountTier[] = [];
  if (typeof item.discounts === "string") {
    try {
      const parsed = JSON.parse(item.discounts) as unknown;
      parsedDiscounts = Array.isArray(parsed) ? parsed.filter(isCartDiscountTier) : [];
    } catch {
      return priceToUse;
    }
  } else if (Array.isArray(item.discounts)) {
    parsedDiscounts = item.discounts;
  }

  if (!Array.isArray(parsedDiscounts) || parsedDiscounts.length === 0) return priceToUse;

  const bulkDiscounts = parsedDiscounts
    .map((d) => {
      const q = Number(d?.quantity);
      const p = Number(d?.discount);
      if (Number.isFinite(q) && q > 0 && Number.isFinite(p) && p > 0) {
        return { quantity: q, discountPct: p };
      }
      return null;
    })
    .filter((d): d is { quantity: number; discountPct: number } => d !== null)
    .sort((a, b) => a.quantity - b.quantity);

  const activeTier = [...bulkDiscounts].reverse().find((tier) => item.quantity >= tier.quantity);

  if (activeTier) {
    return priceToUse * (1 - activeTier.discountPct / 100);
  }

  return priceToUse;
}

function normalizeCartQuantity(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [purchaseReference, setPurchaseReference] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Cart is hydrated from localStorage after mount to avoid SSR/client mismatches.
          setItems(parsed);
        }
      }

      const storedReference = window.localStorage.getItem(PURCHASE_REFERENCE_STORAGE_KEY);
      if (storedReference) {
        setPurchaseReference(storedReference);
      }

      const storedCouponCode = window.localStorage.getItem(COUPON_CODE_STORAGE_KEY);
      if (storedCouponCode) {
        setCouponCode(storedCouponCode);
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

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(PURCHASE_REFERENCE_STORAGE_KEY, purchaseReference);
    } catch (error) {
      console.error("Failed to persist purchase reference", error);
    }
  }, [isHydrated, purchaseReference]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(COUPON_CODE_STORAGE_KEY, couponCode);
    } catch (error) {
      console.error("Failed to persist coupon code", error);
    }
  }, [isHydrated, couponCode]);

  const addItem = useCallback((item: CartInput, quantity = 1) => {
    const normalizedQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
    const key = buildCartItemKey(item);

    setItems((currentItems) => {
      const existingItem = currentItems.find((currentItem) => currentItem.key === key);

      if (existingItem) {
        return currentItems.map((currentItem) => {
          if (currentItem.key === key) {
            const updatedItem = {
              ...currentItem,
              packingGroup: item.packingGroup ?? currentItem.packingGroup,
              allowSingulars: item.allowSingulars ?? currentItem.allowSingulars,
              isLabelProduct: item.isLabelProduct ?? currentItem.isLabelProduct,
              quantity: currentItem.quantity + normalizedQuantity,
            };
            return {
              ...updatedItem,
              price: calculateUnitPrice(updatedItem) ?? updatedItem.price,
            };
          }
          return currentItem;
        });
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
  }, []);

  const removeItem = useCallback((key: string) => {
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
  }, []);

  const incrementItemQuantity = useCallback((key: string) => {
    setItems((currentItems) => {
      const target = currentItems.find((item) => item.key === key);
      if (!target) {
        return currentItems;
      }

      return currentItems.map((item) => {
        const nextQuantity = nextQuantityForItem(item);

        if (item.key === key) {
          const updatedItem = { ...item, quantity: nextQuantity };
          return { ...updatedItem, price: calculateUnitPrice(updatedItem) ?? updatedItem.price };
        }

        if (target.itemKind !== "warranty" && item.linkedToKey === key) {
          const updatedItem = { ...item, quantity: nextQuantity };
          return { ...updatedItem, price: calculateUnitPrice(updatedItem) ?? updatedItem.price };
        }

        return item;
      });
    });
  }, []);

  const decrementItemQuantity = useCallback((key: string) => {
    setItems((currentItems) => {
      const target = currentItems.find((item) => item.key === key);
      if (!target) {
        return currentItems;
      }

      return currentItems.map((item) => {
        const previousQuantity = previousQuantityForItem(item);

        if (item.key === key) {
          const updatedItem = { ...item, quantity: previousQuantity };
          return { ...updatedItem, price: calculateUnitPrice(updatedItem) ?? updatedItem.price };
        }

        if (target.itemKind !== "warranty" && item.linkedToKey === key) {
          const updatedItem = { ...item, quantity: previousQuantity };
          return { ...updatedItem, price: calculateUnitPrice(updatedItem) ?? updatedItem.price };
        }

        return item;
      });
    });
  }, []);

  const setItemQuantity = useCallback((key: string, quantity: number) => {
    const normalizedQuantity = normalizeCartQuantity(quantity);
    if (!normalizedQuantity) {
      return;
    }

    setItems((currentItems) => {
      const target = currentItems.find((item) => item.key === key);
      if (!target) {
        return currentItems;
      }

      return currentItems.map((item) => {
        if (item.key === key) {
          const updatedItem = { ...item, quantity: normalizedQuantity };
          return { ...updatedItem, price: calculateUnitPrice(updatedItem) ?? updatedItem.price };
        }

        if (target.itemKind !== "warranty" && item.linkedToKey === key) {
          const updatedItem = { ...item, quantity: normalizedQuantity };
          return { ...updatedItem, price: calculateUnitPrice(updatedItem) ?? updatedItem.price };
        }

        return item;
      });
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPurchaseReference("");
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError(null);
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const applyCouponCode = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      const currentTotal = items.reduce((sum, item) => sum + ((typeof item.price === "number" && Number.isFinite(item.price) ? item.price : 0) * item.quantity), 0);
      
      const res = await fetch(`/api/coupons/${encodeURIComponent(code)}?cart_total=${currentTotal}`);
      const data = await res.json();
      
      if (!res.ok) {
        const error: any = new Error(data.message || "Invalid coupon code");
        error.response = { status: res.status, data };
        throw error;
      }
      
      setAppliedCoupon(data.data || data); // Laravel resources often wrap in 'data'
      setCouponCode(code);
    } catch (err: any) {
      setAppliedCoupon(null);
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;

      if (status === 404) {
        setCouponError(serverMessage && serverMessage !== "Not Found." ? serverMessage : "invalid_coupon");
      } else {
        setCouponError(serverMessage || err?.message || "invalid_coupon");
      }
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [items]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponCode("");
  }, []);

  const value = useMemo<CartContextValue>(
    () => {
      const rawTotalAmount = items.reduce((sum, item) => {
        const price = typeof item.price === "number" && Number.isFinite(item.price) ? item.price : 0;
        return sum + price * item.quantity;
      }, 0);
      
      let couponDiscountAmount = 0;
      if (appliedCoupon && appliedCoupon.amount) {
        const amount = Number(appliedCoupon.amount) || 0;
        const type = String(appliedCoupon.discount_type).toLowerCase();
        
        if (type.includes("percent")) {
          couponDiscountAmount = rawTotalAmount * (amount / 100);
        } else {
          couponDiscountAmount = Math.min(rawTotalAmount, amount);
        }
      }

      return {
        items,
        uniqueItemCount: items.length,
        totalItemCount: items.reduce((sum, item) => {
          const countPerUnit = item.type === 'group_product' && item.componentCount ? item.componentCount : 1;
          if (item.itemKind === 'warranty') return sum;
          return sum + (countPerUnit * item.quantity);
        }, 0),
        totalAmount: rawTotalAmount,
        couponDiscountAmount,
        addItem,
        removeItem,
        incrementItemQuantity,
        decrementItemQuantity,
        setItemQuantity,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        purchaseReference,
        setPurchaseReference,
        couponCode,
        setCouponCode,
        appliedCoupon,
        couponError,
        isApplyingCoupon,
        applyCouponCode,
        removeCoupon,
      };
    },
    [
      items,
      isCartOpen,
      addItem,
      removeItem,
      incrementItemQuantity,
      decrementItemQuantity,
      setItemQuantity,
      clearCart,
      openCart,
      closeCart,
      purchaseReference,
      couponCode,
      appliedCoupon,
      couponError,
      isApplyingCoupon,
      applyCouponCode,
      removeCoupon,
    ],
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
