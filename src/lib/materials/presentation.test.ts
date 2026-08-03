import { describe, expect, it } from "vitest";
import {
  MATERIAL_GRID_CLASS_NAME,
  MATERIAL_PLACEHOLDER_IMAGE,
  materialHeading,
  materialMeasurements,
  resolveMaterialImage,
} from "./presentation";

describe("material presentation", () => {
  it("uses three desktop columns and the quiet fallback without replacing valid images", () => {
    expect(MATERIAL_GRID_CLASS_NAME).toContain("lg:grid-cols-3");
    expect(MATERIAL_GRID_CLASS_NAME).not.toContain("lg:grid-cols-4");
    expect(resolveMaterialImage(null)).toBe(MATERIAL_PLACEHOLDER_IMAGE);
    expect(resolveMaterialImage("/uploads/dia010.png")).toBe("/uploads/dia010.png");
  });

  it("maps each material's persisted weight and normalizes thickness to µm", () => {
    expect(materialMeasurements({ material_specs: [
      { label: "Weight", value: "80 g/m²" },
      { label: "Thickness", value: "110 micron" },
    ] })).toEqual({ weight: "80 g/m²", thickness: "110 µm" });

    expect(materialMeasurements({ material_specs: [
      { label: "Grammage", value: "95 g/m²" },
      { label: "Dikte", value: "169 μm" },
    ] })).toEqual({ weight: "95 g/m²", thickness: "169 µm" });

    expect(materialMeasurements()).toEqual({ weight: "", thickness: "" });
  });

  it("uses the readable name once and only the dedicated material image", () => {
    expect(materialHeading({ title: "DIA010", subtitle: "Extra thin matte inkjet material", code: "DIA010" }))
      .toBe("Extra thin matte inkjet material");
    expect(materialHeading({ title: "Matte paper", subtitle: "Permanent adhesive", code: "DIA010" }))
      .toBe("Matte paper");
    expect(resolveMaterialImage(undefined)).toBe(MATERIAL_PLACEHOLDER_IMAGE);
  });
});
