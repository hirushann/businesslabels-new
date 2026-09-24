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
 * Raw customer details used for Google Ads Enhanced Conversions.
 * Values are normalized by buildEnhancedConversionUserData before being pushed.
 */
export type PurchaseCustomerData = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
};

export type EnhancedConversionUserData = {
  email?: string;
  phone_number?: string;
  address?: {
    first_name?: string;
    last_name?: string;
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
};

const COUNTRY_DIAL_CODES: Record<string, string> = { NL: "31", BE: "32", DE: "49", FR: "33", LU: "352" };

function clean(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Normalize a phone number to E.164 (+31612345678). Returns "" when the number
 * can't be converted with confidence — Google rejects non-E.164 numbers.
 */
function normalizePhone(phone: string | undefined, countryCode: string): string {
  let digits = clean(phone).replace(/[\s\-().\/]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = "+" + digits.slice(2);
  if (!digits.startsWith("+")) {
    const dialCode = COUNTRY_DIAL_CODES[countryCode];
    if (!dialCode || !digits.startsWith("0")) return "";
    digits = `+${dialCode}${digits.slice(1)}`;
  }
  return /^\+\d{8,15}$/.test(digits) ? digits : "";
}

/**
 * Build the `user_data` object expected by the GTM "User-Provided Data" variable.
 * Only includes fields that are present and valid; returns null when nothing usable remains.
 */
export function buildEnhancedConversionUserData(customer: PurchaseCustomerData | undefined): EnhancedConversionUserData | null {
  if (!customer) return null;

  const rawCountry = clean(customer.country).toUpperCase();
  const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : "";
  const email = clean(customer.email).toLowerCase();
  const phone = normalizePhone(customer.phone, country || "NL");

  const address: NonNullable<EnhancedConversionUserData["address"]> = {};
  if (clean(customer.firstName)) address.first_name = clean(customer.firstName);
  if (clean(customer.lastName)) address.last_name = clean(customer.lastName);
  if (clean(customer.street)) address.street = clean(customer.street);
  if (clean(customer.city)) address.city = clean(customer.city);
  if (clean(customer.postalCode)) address.postal_code = clean(customer.postalCode);
  if (country) address.country = country;

  const userData: EnhancedConversionUserData = {};
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) userData.email = email;
  if (phone) userData.phone_number = phone;
  // Google requires first name, last name, postal code and country for address matching
  if (address.first_name && address.last_name && address.postal_code && address.country) {
    userData.address = address;
  }

  return Object.keys(userData).length > 0 ? userData : null;
}

/**
 * Trigger 'purchase' event on the order confirmation / thank you page.
 * When `customer` is given, a normalized `user_data` object is added for
 * Google Ads Enhanced Conversions (read in GTM via a User-Provided Data variable).
 */
export function trackPurchase(params: {
  transactionId: string;
  totalValue: number;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items: GA4Item[];
  currency?: string;
  customer?: PurchaseCustomerData;
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

  const userData = buildEnhancedConversionUserData(params.customer);

  resetEcommerce();
  pushToDataLayer({
    event: "purchase",
    ecommerce: payload,
    ...(userData ? { user_data: userData } : {}),
  });
}
