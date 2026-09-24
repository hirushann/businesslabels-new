// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  trackViewItem,
  trackAddToCart,
  trackRemoveFromCart,
  trackViewCart,
  trackBeginCheckout,
  trackPurchase,
  buildEnhancedConversionUserData,
} from "./dataLayer";

describe("GA4 Ecommerce DataLayer", () => {
  beforeEach(() => {
    // Reset window.dataLayer
    window.dataLayer = [];
  });

  it("pushes view_item event with ecommerce reset", () => {
    trackViewItem({
      item: {
        item_id: "SKU-100",
        item_name: "Test Label Printer",
        price: 499.0,
        item_brand: "Epson",
        item_category: "Printers",
      },
    });

    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer[0]).toEqual({ ecommerce: null });
    expect(window.dataLayer[1]).toEqual({
      event: "view_item",
      ecommerce: {
        currency: "EUR",
        value: 499.0,
        items: [
          {
            item_id: "SKU-100",
            item_name: "Test Label Printer",
            price: 499.0,
            quantity: 1,
            item_brand: "Epson",
            item_category: "Printers",
          },
        ],
      },
    });
  });

  it("pushes add_to_cart event with correct total value", () => {
    trackAddToCart({
      item: {
        item_id: "SKU-200",
        item_name: "Glossy Paper Labels",
        price: 25.5,
      },
      quantity: 4,
    });

    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer[0]).toEqual({ ecommerce: null });
    expect(window.dataLayer[1]).toEqual({
      event: "add_to_cart",
      ecommerce: {
        currency: "EUR",
        value: 102.0,
        items: [
          {
            item_id: "SKU-200",
            item_name: "Glossy Paper Labels",
            price: 25.5,
            quantity: 4,
            item_brand: "Businesslabels",
          },
        ],
      },
    });
  });

  it("pushes remove_from_cart event", () => {
    trackRemoveFromCart({
      item: {
        item_id: "SKU-200",
        item_name: "Glossy Paper Labels",
        price: 25.5,
      },
      quantity: 2,
    });

    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer[0]).toEqual({ ecommerce: null });
    expect(window.dataLayer[1]).toEqual({
      event: "remove_from_cart",
      ecommerce: {
        currency: "EUR",
        value: 51.0,
        items: [
          {
            item_id: "SKU-200",
            item_name: "Glossy Paper Labels",
            price: 25.5,
            quantity: 2,
          },
        ],
      },
    });
  });

  it("pushes view_cart event", () => {
    trackViewCart({
      items: [
        { item_id: "SKU-1", item_name: "Item 1", price: 10, quantity: 2 },
        { item_id: "SKU-2", item_name: "Item 2", price: 30, quantity: 1 },
      ],
      totalValue: 50,
    });

    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer[0]).toEqual({ ecommerce: null });
    expect(window.dataLayer[1].event).toBe("view_cart");
    expect(window.dataLayer[1].ecommerce.value).toBe(50);
    expect(window.dataLayer[1].ecommerce.items).toHaveLength(2);
  });

  it("pushes begin_checkout event with coupon", () => {
    trackBeginCheckout({
      items: [{ item_id: "SKU-1", item_name: "Item 1", price: 100, quantity: 1 }],
      totalValue: 90,
      coupon: "SAVE10",
    });

    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer[0]).toEqual({ ecommerce: null });
    expect(window.dataLayer[1]).toEqual({
      event: "begin_checkout",
      ecommerce: {
        currency: "EUR",
        value: 90,
        coupon: "SAVE10",
        items: [{ item_id: "SKU-1", item_name: "Item 1", price: 100, quantity: 1 }],
      },
    });
  });

  it("pushes purchase event with transaction details", () => {
    trackPurchase({
      transactionId: "ORD-999",
      totalValue: 121.0,
      tax: 21.0,
      shipping: 5.0,
      coupon: "PROMO",
      items: [
        {
          item_id: "SKU-1",
          item_name: "Item 1",
          price: 95.0,
          quantity: 1,
        },
      ],
    });

    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer[0]).toEqual({ ecommerce: null });
    expect(window.dataLayer[1]).toEqual({
      event: "purchase",
      ecommerce: {
        transaction_id: "ORD-999",
        value: 121.0,
        tax: 21.0,
        shipping: 5.0,
        currency: "EUR",
        coupon: "PROMO",
        items: [
          {
            item_id: "SKU-1",
            item_name: "Item 1",
            price: 95.0,
            quantity: 1,
          },
        ],
      },
    });
  });

  it("adds normalized user_data to purchase for Enhanced Conversions", () => {
    trackPurchase({
      transactionId: "ORD-1000",
      totalValue: 50,
      items: [],
      customer: {
        email: "  Jan@Example.NL ",
        phone: "06 12 34 56 78",
        firstName: "Jan",
        lastName: "Jansen",
        street: "Dorpsstraat 1",
        city: "Utrecht",
        postalCode: "1234 AB",
        country: "nl",
      },
    });

    expect(window.dataLayer[1].user_data).toEqual({
      email: "jan@example.nl",
      phone_number: "+31612345678",
      address: {
        first_name: "Jan",
        last_name: "Jansen",
        street: "Dorpsstraat 1",
        city: "Utrecht",
        postal_code: "1234 AB",
        country: "NL",
      },
    });
  });

  it("omits user_data when no customer data is usable", () => {
    trackPurchase({ transactionId: "ORD-1001", totalValue: 10, items: [], customer: { email: "not-an-email", country: "151" } });
    expect(window.dataLayer[1]).not.toHaveProperty("user_data");
  });
});

describe("buildEnhancedConversionUserData", () => {
  it("returns null without customer data", () => {
    expect(buildEnhancedConversionUserData(undefined)).toBeNull();
    expect(buildEnhancedConversionUserData({})).toBeNull();
  });

  it("normalizes phone numbers to E.164 and drops ones it cannot convert", () => {
    expect(buildEnhancedConversionUserData({ phone: "0031 6-1234-5678" })).toEqual({ phone_number: "+31612345678" });
    expect(buildEnhancedConversionUserData({ phone: "+32 470 12 34 56", country: "BE" })).toEqual({ phone_number: "+32470123456", });
    expect(buildEnhancedConversionUserData({ phone: "0470 12 34 56", country: "BE" })).toEqual({ phone_number: "+32470123456" });
    expect(buildEnhancedConversionUserData({ phone: "612345678" })).toBeNull();
    expect(buildEnhancedConversionUserData({ phone: "0612", })).toBeNull();
  });

  it("only includes the address when Google's required fields are present", () => {
    expect(buildEnhancedConversionUserData({ email: "a@b.nl", firstName: "Jan", city: "Utrecht" })).toEqual({ email: "a@b.nl" });
    expect(buildEnhancedConversionUserData({ firstName: "Jan", lastName: "J", postalCode: "1234AB", country: "Netherlands" })).toBeNull();
  });
});
