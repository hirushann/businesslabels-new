// Standard GA4 Ecommerce DataLayer Utility

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export type GA4Item = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_variant?: string;
  discount?: number;
  coupon?: string;
};

/**
 * Safely push an object to window.dataLayer
 */
export function pushToDataLayer(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  } catch (error) {
    console.error("[DataLayer] Error pushing payload:", error);
  }
}

/**
 * Clear the ecommerce object before pushing a new ecommerce event.
 * Recommended by Google Analytics 4 documentation to prevent stale parameters.
 */
export function resetEcommerce(): void {
  pushToDataLayer({ ecommerce: null });
}

/**
 * Helper to ensure numeric value
 */
function toNumeric(val: unknown): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}

/**
 * Trigger 'view_item' event when a user views a single product details page.
 */
export function trackViewItem(params: {
  item: GA4Item;
  currency?: string;
}): void {
  const currency = params.currency || "EUR";
  const itemPrice = toNumeric(params.item.price);
  const normalizedItem: GA4Item = {
    ...params.item,
    price: itemPrice,
    quantity: params.item.quantity ?? 1,
    item_brand: params.item.item_brand || "Businesslabels",
  };

  resetEcommerce();
  pushToDataLayer({
    event: "view_item",
    ecommerce: {
      currency,
      value: itemPrice,
      items: [normalizedItem],
    },
  });
}

/**
 * Trigger 'add_to_cart' event when a user adds a product to the cart.
 */
export function trackAddToCart(params: {
  item: GA4Item;
  quantity?: number;
  currency?: string;
}): void {
  const currency = params.currency || "EUR";
  const qty = Math.max(1, params.quantity ?? params.item.quantity ?? 1);
  const itemPrice = toNumeric(params.item.price);
  const normalizedItem: GA4Item = {
    ...params.item,
    price: itemPrice,
    quantity: qty,
    item_brand: params.item.item_brand || "Businesslabels",
  };

  resetEcommerce();
  pushToDataLayer({
    event: "add_to_cart",
    ecommerce: {
      currency,
      value: +(itemPrice * qty).toFixed(2),
      items: [normalizedItem],
    },
  });
}

/**
 * Trigger 'remove_from_cart' event when an item is removed.
 */
export function trackRemoveFromCart(params: {
  item: GA4Item;
  quantity?: number;
  currency?: string;
}): void {
  const currency = params.currency || "EUR";
  const qty = Math.max(1, params.quantity ?? params.item.quantity ?? 1);
  const itemPrice = toNumeric(params.item.price);
  const normalizedItem: GA4Item = {
    ...params.item,
    price: itemPrice,
    quantity: qty,
  };

  resetEcommerce();
  pushToDataLayer({
    event: "remove_from_cart",
    ecommerce: {
      currency,
      value: +(itemPrice * qty).toFixed(2),
      items: [normalizedItem],
    },
  });
}

/**
 * Trigger 'view_cart' event when viewing the cart drawer or /winkelmand page.
 */
export function trackViewCart(params: {
  items: GA4Item[];
  totalValue?: number;
  currency?: string;
}): void {
  const currency = params.currency || "EUR";
  const calculatedTotal =
    params.totalValue !== undefined
      ? toNumeric(params.totalValue)
      : params.items.reduce(
          (sum, item) => sum + toNumeric(item.price) * (item.quantity ?? 1),
          0
        );

  resetEcommerce();
  pushToDataLayer({
    event: "view_cart",
    ecommerce: {
      currency,
      value: +calculatedTotal.toFixed(2),
      items: params.items,
    },
  });
}

/**
 * Trigger 'begin_checkout' event when a user initiates the checkout process.
 */
export function trackBeginCheckout(params: {
  items: GA4Item[];
  totalValue?: number;
  coupon?: string;
  currency?: string;
}): void {
  const currency = params.currency || "EUR";
  const calculatedTotal =
    params.totalValue !== undefined
      ? toNumeric(params.totalValue)
      : params.items.reduce(
          (sum, item) => sum + toNumeric(item.price) * (item.quantity ?? 1),
          0
        );

  const payload: Record<string, unknown> = {
    currency,
    value: +calculatedTotal.toFixed(2),
    items: params.items,
  };

  if (params.coupon) {
    payload.coupon = params.coupon;
  }

  resetEcommerce();
  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: payload,
  });
}

/**
 * Trigger 'purchase' event on the order confirmation / thank you page.
 */
export function trackPurchase(params: {
  transactionId: string;
  totalValue: number;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items: GA4Item[];
  currency?: string;
}): void {
  const currency = params.currency || "EUR";
  const payload: Record<string, unknown> = {
    transaction_id: params.transactionId,
    value: +toNumeric(params.totalValue).toFixed(2),
    tax: +toNumeric(params.tax).toFixed(2),
    shipping: +toNumeric(params.shipping).toFixed(2),
    currency,
    items: params.items,
  };

  if (params.coupon) {
    payload.coupon = params.coupon;
  }

  resetEcommerce();
  pushToDataLayer({
    event: "purchase",
    ecommerce: payload,
  });
}
