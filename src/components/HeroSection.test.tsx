// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => navigation.searchParams,
}));
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/hooks/useLocalePath", () => ({ useLocalePath: () => (path: string) => `/en${path}` }));
vi.mock("./HelpProvider", () => ({ useHelp: () => ({ openHelp: vi.fn() }) }));
vi.mock("@/components/PrinterModelSelect", () => ({
  default: ({ onValueChange }: { onValueChange: (printer: { id: number; title: string }) => void }) => (
    <button type="button" onClick={() => onValueChange({ id: 42, title: "Test printer" })}>
      Select test printer
    </button>
  ),
}));

import HeroSection from "./HeroSection";

describe("HeroSection compatible product navigation", () => {
  afterEach(cleanup);

  beforeEach(() => {
    navigation.push.mockClear();
    navigation.searchParams = new URLSearchParams();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [],
        total: 0,
        currentPage: 1,
        lastPage: 1,
        perPage: 1,
        filters: {
          ranges: [],
          options: [{
            key: "category",
            title: "Product Type",
            options: [
              { value: "inkt-cartridges-nl", label: "Ink", count: 1 },
              { value: "labels-en-tickets", label: "Labels", count: 1 },
            ],
          }],
        },
      }),
    }));
  });

  it("opens compatible products with the selected category, or without one from the main CTA", async () => {
    render(<HeroSection />);
    fireEvent.click(screen.getByRole("button", { name: "Select test printer" }));

    const ink = (await screen.findByText("Ink")).closest("button");
    const labels = screen.getByText("Labels").closest("button");

    expect(ink).not.toBeNull();
    expect(labels).not.toBeNull();

    fireEvent.click(ink!);
    expect(navigation.push).toHaveBeenLastCalledWith(
      "/en/printers?printer_id=42&category=inkt-cartridges-nl",
    );

    fireEvent.click(labels!);
    expect(navigation.push).toHaveBeenLastCalledWith(
      "/en/printers?printer_id=42&category=labels-en-tickets",
    );

    fireEvent.click(screen.getByRole("button", { name: /hero.showProducts/ }));
    await waitFor(() => {
      expect(navigation.push).toHaveBeenLastCalledWith("/en/printers?printer_id=42");
    });
  });
});
