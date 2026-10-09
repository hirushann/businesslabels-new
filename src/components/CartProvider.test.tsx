// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { buildCartItemKey, calculateUnitPrice, CartProvider, type CartItem, useCart } from "./CartProvider";

describe("re-order pricing", () => {
  it("reapplies the current quantity discount when an order item returns to the cart", () => {
    const reorderedItem: CartItem = {
      key: "diamondlabels-10600317-69x10mm::simple",
      id: 570,
      slug: "diamondlabels-10600317-69x10mm",
      type: "simple",
      name: "DTT04, Jewelry labels tip left",
      sku: "10600317",
      price: 36.07,
      basePrice: 36.07,
      discounts: [{ quantity: 4, discount: 20 }],
      quantity: 4,
    };

    expect(calculateUnitPrice(reorderedItem)).toBeCloseTo(28.856, 4);
  });
});

describe("buildCartItemKey", () => {
  it("builds standard keys without warranty", () => {
    expect(buildCartItemKey({ id: 10, slug: "test-product", type: "simple" })).toBe("test-product::simple");
    expect(buildCartItemKey({ id: 10, slug: "test-product" })).toBe("test-product");
    expect(buildCartItemKey({ id: 10 })).toBe("10");
  });

  it("appends warranty option id when provided", () => {
    expect(
      buildCartItemKey({ id: 10, slug: "test-product", type: "simple", warrantyOptionId: 101 })
    ).toBe("test-product::simple::warranty-101");
    expect(
      buildCartItemKey({ id: 10, slug: "test-product", type: "simple", warrantyOptionId: "202" })
    ).toBe("test-product::simple::warranty-202");
  });

  it("returns id as-is for warranty items", () => {
    expect(
      buildCartItemKey({ id: "warranty-key-101", itemKind: "warranty", warrantyOptionId: 101 })
    ).toBe("warranty-key-101");
  });
});

describe("CartProvider warranty-separated product lines", () => {
  const store: Record<string, string> = {};
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => {
          Object.keys(store).forEach((k) => delete store[k]);
        },
      },
      writable: true,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => <CartProvider>{children}</CartProvider>;

  it("creates separate product lines for different warranties, and merges same warranty", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    // 1. Add product A with Warranty A (option id: 101)
    act(() => {
      const parentKey = buildCartItemKey({
        id: 1,
        slug: "product-a",
        type: "simple",
        warrantyOptionId: 101,
      });
      result.current.addItem({
        id: 1,
        slug: "product-a",
        type: "simple",
        name: "Product A",
        sku: "PROD-A",
        price: 500,
        warrantyOptionId: 101,
      }, 1);
      result.current.addItem({
        id: `warranty-${parentKey}-101`,
        name: "Warranty A (2 Years)",
        sku: "PROD-A-WARRANTY",
        price: 50,
        itemKind: "warranty",
        linkedToKey: parentKey,
        warranty: {
          optionId: 101,
          typeName: "2 Years",
          durationMonths: 24,
          parentSku: "PROD-A",
          parentName: "Product A",
        },
      }, 1);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.find((i) => i.key === "product-a::simple::warranty-101")?.quantity).toBe(1);

    // 2. Add product A with Warranty B (option id: 202) -> separate line!
    act(() => {
      const parentKey = buildCartItemKey({
        id: 1,
        slug: "product-a",
        type: "simple",
        warrantyOptionId: 202,
      });
      result.current.addItem({
        id: 1,
        slug: "product-a",
        type: "simple",
        name: "Product A",
        sku: "PROD-A",
        price: 500,
        warrantyOptionId: 202,
      }, 1);
      result.current.addItem({
        id: `warranty-${parentKey}-202`,
        name: "Warranty B (3 Years)",
        sku: "PROD-A-WARRANTY",
        price: 90,
        itemKind: "warranty",
        linkedToKey: parentKey,
        warranty: {
          optionId: 202,
          typeName: "3 Years",
          durationMonths: 36,
          parentSku: "PROD-A",
          parentName: "Product A",
        },
      }, 1);
    });

    // We now have 2 distinct products + 2 distinct warranties = 4 items
    expect(result.current.items).toHaveLength(4);
    const prodItems = result.current.items.filter((i) => i.itemKind !== "warranty");
    expect(prodItems).toHaveLength(2);
    expect(prodItems[0].key).toBe("product-a::simple::warranty-101");
    expect(prodItems[0].quantity).toBe(1);
    expect(prodItems[1].key).toBe("product-a::simple::warranty-202");
    expect(prodItems[1].quantity).toBe(1);

    // 3. Add product A with Warranty A again (option id: 101) -> merges into first line!
    act(() => {
      const parentKey = buildCartItemKey({
        id: 1,
        slug: "product-a",
        type: "simple",
        warrantyOptionId: 101,
      });
      result.current.addItem({
        id: 1,
        slug: "product-a",
        type: "simple",
        name: "Product A",
        sku: "PROD-A",
        price: 500,
        warrantyOptionId: 101,
      }, 1);
      result.current.addItem({
        id: `warranty-${parentKey}-101`,
        name: "Warranty A (2 Years)",
        sku: "PROD-A-WARRANTY",
        price: 50,
        itemKind: "warranty",
        linkedToKey: parentKey,
        warranty: {
          optionId: 101,
          typeName: "2 Years",
          durationMonths: 24,
          parentSku: "PROD-A",
          parentName: "Product A",
        },
      }, 1);
    });

    // Still 4 items total, but Warranty A product line and warranty item both incremented to 2!
    expect(result.current.items).toHaveLength(4);
    const updatedProdA = result.current.items.find((i) => i.key === "product-a::simple::warranty-101");
    expect(updatedProdA?.quantity).toBe(2);
    const updatedWarrantyA = result.current.items.find(
      (i) => i.key === "warranty-product-a::simple::warranty-101-101"
    );
    expect(updatedWarrantyA?.quantity).toBe(2);

    // Warranty B remains quantity 1
    const prodB = result.current.items.find((i) => i.key === "product-a::simple::warranty-202");
    expect(prodB?.quantity).toBe(1);
  });

  it("removes both product and linked warranty when product is removed", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      const parentKey = buildCartItemKey({
        id: 1,
        slug: "product-a",
        type: "simple",
        warrantyOptionId: 101,
      });
      result.current.addItem({
        id: 1,
        slug: "product-a",
        type: "simple",
        name: "Product A",
        sku: "PROD-A",
        price: 500,
        warrantyOptionId: 101,
      }, 1);
      result.current.addItem({
        id: `warranty-${parentKey}-101`,
        name: "Warranty A",
        sku: "PROD-A-WARRANTY",
        price: 50,
        itemKind: "warranty",
        linkedToKey: parentKey,
        warranty: { optionId: 101 },
      }, 1);
    });

    expect(result.current.items).toHaveLength(2);

    act(() => {
      result.current.removeItem("product-a::simple::warranty-101");
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("removes warranty and updates parent product to base key when warranty is removed", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      const parentKey = buildCartItemKey({
        id: 1,
        slug: "product-a",
        type: "simple",
        warrantyOptionId: 101,
      });
      result.current.addItem({
        id: 1,
        slug: "product-a",
        type: "simple",
        name: "Product A",
        sku: "PROD-A",
        price: 500,
        warrantyOptionId: 101,
      }, 1);
      result.current.addItem({
        id: `warranty-${parentKey}-101`,
        name: "Warranty A",
        sku: "PROD-A-WARRANTY",
        price: 50,
        itemKind: "warranty",
        linkedToKey: parentKey,
        warranty: { optionId: 101 },
      }, 1);
    });

    expect(result.current.items).toHaveLength(2);

    act(() => {
      result.current.removeItem("warranty-product-a::simple::warranty-101-101");
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].key).toBe("product-a::simple");
    expect(result.current.items[0].warrantyOptionId).toBeNull();
  });
});
