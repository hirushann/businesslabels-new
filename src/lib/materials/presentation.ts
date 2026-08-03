import { htmlToText } from "@/lib/utils";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";

export const MATERIAL_PLACEHOLDER_IMAGE = "/images/material-placeholder.svg";
export const MATERIAL_GRID_CLASS_NAME = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

export function resolveMaterialImage(image?: string | null): string {
  return toDisplayImageUrl(image) || MATERIAL_PLACEHOLDER_IMAGE;
}

export function normalizeMicronUnit(value: string): string {
  return value.trim().replace(/\bmicrons?\b|\bmu\b|[µμ]m/giu, "µm");
}

function normalizeWeightUnit(value: string): string {
  return value.trim().replace(/\b(?:g|grams?)\s*(?:\/\s*m(?:2|²)|m\s*\/\s*2|m²)/giu, "g/m²");
}

export function materialMeasurements(
  specifications?: { material_specs?: { label: string; value: string }[] } | null,
): { weight: string; thickness: string } {
  let weight = "";
  let thickness = "";

  for (const spec of specifications?.material_specs ?? []) {
    const label = spec.label.toLowerCase();
    if (!weight && (label.includes("weight") || label.includes("gewicht") || label.includes("grammage"))) {
      weight = normalizeWeightUnit(spec.value);
    } else if (!thickness && (label.includes("thickness") || label.includes("dikte") || label.includes("hoogte"))) {
      thickness = normalizeMicronUnit(spec.value);
    }
  }

  return { weight, thickness };
}

export function materialHeading(material: {
  title?: string | null;
  subtitle?: string | null;
  code?: string | null;
}): string {
  const title = htmlToText(material.title ?? "");
  const subtitle = htmlToText(material.subtitle ?? "");
  const code = htmlToText(material.code ?? "");

  return title && title.toLocaleLowerCase() !== code.toLocaleLowerCase()
    ? title
    : subtitle || title || code;
}
