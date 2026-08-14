import { describe, expect, it } from "vitest";
import { calculateUnitPrice, type CartItem } from "./CartProvider";

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
