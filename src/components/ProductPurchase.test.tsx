// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProductPurchase from "./ProductPurchase";

const mockAddItem = vi.fn();
const mockOpenCart = vi.fn();

vi.mock("@/components/CartProvider", () => ({
  useCart: () => ({
    addItem: mockAddItem,
    openCart: mockOpenCart,
    isCartOpen: false,
  }),
  buildCartItemKey: () => "test-key",
}));

vi.mock("@/components/WishlistProvider", () => ({
  useWishlist: () => ({
    hasItem: () => false,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    items: [],
  }),
}));

vi.mock("@/hooks/useDeliveryAvailability", () => ({
  useDeliveryAvailability: () => [],
}));

vi.mock("next-intl", () => ({
  useLocale: () => "nl",
  useTranslations: () => {
    const messages: Record<string, string> = {
      "product.rollsStack": "Rollen",
      "product.rolls": "Rollen",
      "product.stack": "Stapel",
      "product.addToCart": "In winkelwagen",
      "product.unnamedProduct": "Product",
      "product.inStock": "Op voorraad",
      "product.selectQuantity": "Selecteer aantal",
      "product.chooseMultipleOf": "Kies een veelvoud van {pack}:",
      "product.enterValidQuantity": "Vul een geldig aantal in.",
      "product.orderRollsButton": "{count} rollen bestellen",
      "product.orderRollButton": "{count} rol bestellen",
      "product.orderStacksButton": "{count} stapels bestellen",
      "product.orderStackButton": "{count} stapel bestellen",
      "common.total": "Totaal",
      "product.exVat": "excl. btw",
    };
    return (key: string, params?: Record<string, any>) => {
      let msg = messages[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          msg = msg.replace(`{${k}}`, String(v));
        });
      }
      return msg;
    };
  },
}));

describe("ProductPurchase packaging & quantity component tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    window.IntersectionObserver = MockIntersectionObserver as any;
  });

  afterEach(cleanup);

  it("Example 1: No packaging (Printer) allows 1-by-1 stepping and normal Add to Cart", () => {
    render(
      <ProductPurchase
        id="printer-1"
        name="Desktop Labelprinter"
        price={249}
        inStock={true}
        packingGroup={null}
        allowSingulars={false}
        isLabelProduct={false}
      />
    );

    const input = screen.getAllByRole("spinbutton")[0] as HTMLInputElement;
    expect(input.value).toBe("1");

    const plusBtn = screen.getAllByLabelText("Increase quantity")[0];
    fireEvent.click(plusBtn);
    expect(input.value).toBe("2");

    const cartBtn = screen.getAllByText("In winkelwagen")[0];
    expect(cartBtn).toBeDefined();

    fireEvent.click(cartBtn);
    expect(mockAddItem).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Desktop Labelprinter", price: 249 }),
      2
    );
    expect(mockOpenCart).toHaveBeenCalled();
  });

  it("Example 2: Seiko SLP-2RL (pack 2, strict) displays suggestion buttons when typing 11", () => {
    render(
      <ProductPurchase
        id="seiko-1"
        name="Seiko SLP-2RL"
        price={13.33}
        inStock={true}
        packingGroup="2"
        allowSingulars={false}
        isLabelProduct={true}
      />
    );

    const input = screen.getAllByRole("spinbutton")[0] as HTMLInputElement;
    expect(input.value).toBe("2");

    // Type 11
    fireEvent.change(input, { target: { value: "11" } });

    // Normal Add to Cart button disappears
    expect(screen.queryByText("11 rollen bestellen")).toBeNull();
    expect(screen.queryByText("In winkelwagen")).toBeNull();

    // Prompt and choice buttons appear
    expect(screen.getAllByText("Kies een veelvoud van 2:")[0]).toBeDefined();
    const btn10 = screen.getAllByText("10 rollen bestellen")[0];
    const btn12 = screen.getAllByText("12 rollen bestellen")[0];
    expect(btn10).toBeDefined();
    expect(btn12).toBeDefined();

    // Clicking 10 adds 10 rolls to cart and opens drawer
    fireEvent.click(btn10);
    expect(mockAddItem).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Seiko SLP-2RL" }),
      10
    );
    expect(mockOpenCart).toHaveBeenCalled();
  });

  it("Example 3: Diamondlabels (pack 6, loose allowed) allows 14 rolls with breakdown label and jumps on +/-", () => {
    render(
      <ProductPurchase
        id="diamond-1"
        name="Diamondlabels DIA050"
        price={13.33}
        inStock={true}
        packingGroup="6"
        allowSingulars={true}
        moq={1}
        isLabelProduct={true}
      />
    );

    const input = screen.getAllByRole("spinbutton")[0] as HTMLInputElement;
    expect(input.value).toBe("1");

    // Stepping up: 1 -> 2
    const plusBtn = screen.getAllByLabelText("Increase quantity")[0];
    fireEvent.click(plusBtn);
    expect(input.value).toBe("2");

    // Type 14 directly
    fireEvent.change(input, { target: { value: "14" } });
    expect(input.value).toBe("14");

    // 14 is orderable!
    const order14Btn = screen.getAllByText("14 rollen bestellen")[0];
    expect(order14Btn).toBeDefined();

    // Breakdown label displayed
    expect(screen.getAllByText("14 rollen · 2 verpakkingen + 2 losse rollen")[0]).toBeDefined();

    // Press + jumps to 18
    fireEvent.click(plusBtn);
    expect(input.value).toBe("18");
    expect(screen.getAllByText("18 rollen · 3 verpakkingen")[0]).toBeDefined();

    // Press - jumps to 12
    const minusBtn = screen.getAllByLabelText("Decrease quantity")[0];
    fireEvent.click(minusBtn);
    expect(input.value).toBe("12");
    expect(screen.getAllByText("12 rollen · 2 verpakkingen")[0]).toBeDefined();
  });

  it("Example 4: Zebra labels (pack 6, strict, moq 6) suggests 6 & 12 when typing 8, and 12 & 18 when typing 14", () => {
    render(
      <ProductPurchase
        id="zebra-1"
        name="Zebra labels"
        price={13.33}
        inStock={true}
        packingGroup="6"
        allowSingulars={false}
        moq={6}
        isLabelProduct={true}
      />
    );

    const input = screen.getAllByRole("spinbutton")[0] as HTMLInputElement;
    expect(input.value).toBe("6");

    // Type 8
    fireEvent.change(input, { target: { value: "8" } });
    expect(screen.getAllByText("Kies een veelvoud van 6:")[0]).toBeDefined();
    expect(screen.getAllByText("6 rollen bestellen")[0]).toBeDefined();
    expect(screen.getAllByText("12 rollen bestellen")[0]).toBeDefined();

    // Type 14
    fireEvent.change(input, { target: { value: "14" } });
    expect(screen.getAllByText("12 rollen bestellen")[0]).toBeDefined();
    expect(screen.getAllByText("18 rollen bestellen")[0]).toBeDefined();

    // Clicking 18 adds 18 rolls to cart and opens drawer
    fireEvent.click(screen.getAllByText("18 rollen bestellen")[0]);
    expect(mockAddItem).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Zebra labels" }),
      18
    );
    expect(mockOpenCart).toHaveBeenCalled();
  });
});
