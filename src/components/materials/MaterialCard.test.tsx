// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MaterialCard from "./MaterialCard";
import type { Material } from "@/lib/search/materials";

vi.mock("next/image", () => ({
  default: (props: any) => <img alt={props.alt} src={props.src} data-testid="material-image" />,
}));

const sampleMaterial: Material = {
  id: 101,
  title: "Glossy PP Film",
  subtitle: "High gloss synthetic label",
  slug: "glossy-pp-film",
  code: "DIA020",
  brand: "Diamondlabels",
  status: "active",
  categories: [],
  specifications: null,
  print_method: "Inkjet",
  base_material: "PP (polypropylene)",
  finish: "Glossy",
  adhesive: "Permanent",
};

describe("MaterialCard", () => {
  afterEach(() => {
    cleanup();
  });
  it("hides the image when hidePlaceholderImage is true and material has no image", () => {
    const { container } = render(
      <MaterialCard
        material={{ ...sampleMaterial, main_image: undefined }}
        locale="nl"
        hidePlaceholderImage={true}
      />
    );

    // Image element should not exist
    expect(screen.queryByTestId("material-image")).toBeNull();
    // Material details should still be displayed
    expect(screen.getByText("DIA020")).toBeDefined();
    expect(screen.getAllByText("High gloss synthetic label").length).toBeGreaterThan(0);
    // Print tech badge should be visible in details
    expect(screen.getByText("Inkjet")).toBeDefined();
  });

  it("renders the image when hidePlaceholderImage is true and material has a valid image", () => {
    render(
      <MaterialCard
        material={{ ...sampleMaterial, main_image: "https://example.com/mat.jpg" }}
        locale="nl"
        hidePlaceholderImage={true}
      />
    );

    const img = screen.getByTestId("material-image");
    expect(img).toBeDefined();
    expect(screen.getByText("DIA020")).toBeDefined();
  });

  it("shows placeholder image when hidePlaceholderImage is false and material has no image", () => {
    render(
      <MaterialCard
        material={{ ...sampleMaterial, main_image: undefined }}
        locale="nl"
        hidePlaceholderImage={false}
      />
    );

    const img = screen.getByTestId("material-image");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toContain("material-placeholder.svg");
  });
});
