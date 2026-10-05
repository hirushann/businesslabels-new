import {
  CATALOG_MATERIAL_MAPPINGS,
  normalizeAfwerkingFilterCategory,
  normalizeMaterialFilterCategory,
  type AfwerkingFilterCategory,
  type MaterialFilterCategory,
} from "@/lib/search/catalogFilterMapping";

/**
 * Shared product display rules (quantity per unit, title, subtitle).
 * Used by listing cards, the selection popup and the product detail page so
 * the wording cannot drift between them.
 */

export type DisplayLocale = "en" | "nl";

/** Product unit wording, e.g. "per roll" / "per stack". */
export type ProductUnitType = "roll" | "stack";

export type DisplayTranslator = (key: string, values?: Record<string, string | number>) => string;

/** Shape-agnostic product input — accepts both card data and detail payloads. */
export type ProductDisplaySource = {
  labels_per_roll?: unknown;
  unit_type?: unknown;
  properties?: unknown;
};

export type ProductDisplayTitle = {
  /** e.g. "DIA700Z, 52 x 29000 mm" */
  main: string;
  /** e.g. "29 meter per roll" — rendered as secondary title text */
  quantity: string | null;
};

/** Decimal precision for meter values (height / 1000). Pending client confirmation. */
const METER_MAX_FRACTION_DIGITS = 1;

const PROPERTY_KEYS = {
  width: ["breedte", "width"],
  height: ["hoogte", "height"],
  core: ["kern", "core"],
  materialCode: ["material_code", "materiaal_code", "material-code", "materiaal-code"],
  printMethod: ["printmethode", "print_method", "print-method"],
  material: ["materiaal", "material"],
  finish: ["afwerking", "finish", "finishing"],
  adhesive: ["lijm", "adhesive", "glue"],
} as const;

const UNIT_TYPES: readonly ProductUnitType[] = ["roll", "stack"];
const STACK_CORE_VALUES = new Set(["fan-fold", "fanfold"]);

const SIMPLIFIED_MATERIAL_KEYS: Record<MaterialFilterCategory, string> = {
  Papier: "product.simplifiedMaterial.paper",
  Kunststof: "product.simplifiedMaterial.plastic",
};

const SIMPLIFIED_FINISH_KEYS: Record<AfwerkingFilterCategory, string> = {
  Mat: "product.simplifiedFinish.matte",
  Glanzend: "product.simplifiedFinish.glossy",
};

function numberLocale(locale: DisplayLocale): string {
  return locale === "nl" ? "nl-NL" : "en-GB";
}

function textFromValue(value: unknown, locale: DisplayLocale): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = textFromValue(item, locale);
      if (text) return text;
    }
    return null;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      textFromValue(record[locale], locale) ??
      textFromValue(record.value, locale) ??
      textFromValue(record.title, locale) ??
      textFromValue(record.name, locale)
    );
  }
  return null;
}

function propertyText(
  product: ProductDisplaySource,
  keys: readonly string[],
  locale: DisplayLocale,
): string | null {
  const properties = product.properties;
  if (!properties || typeof properties !== "object") return null;

  // Elasticsearch returns nested properties as an array of objects.
  const records = Array.isArray(properties) ? properties : [properties];
  const entries = records
    .filter((record): record is Record<string, unknown> => Boolean(record) && typeof record === "object")
    .flatMap((record) => Object.entries(record));
  for (const key of keys) {
    const entry = entries.find(([name]) => name.toLowerCase().trim() === key);
    const text = entry ? textFromValue(entry[1], locale) : null;
    if (text) return text;
  }
  return null;
}

/** Parses "29000", "29000 mm", "52,5" into a number. */
function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const match = value.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number, locale: DisplayLocale, maxFractionDigits = 0): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

/** Formats a dimension in mm without thousands separators, e.g. "29000" or "52.5". */
function formatDimension(value: string): string | null {
  const parsed = parseNumber(value);
  return parsed === null ? null : String(parsed);
}

/**
 * Resolves the product unit. Prefers an explicit backend `unit_type`, then
 * falls back to the core property (fan-fold cores are stacks, everything else
 * is a roll).
 */
export function getProductUnitType(product: ProductDisplaySource, locale: DisplayLocale = "nl"): ProductUnitType {
  const explicit = textFromValue(product.unit_type, locale)?.toLowerCase();
  if (explicit && (UNIT_TYPES as readonly string[]).includes(explicit)) {
    return explicit as ProductUnitType;
  }

  const core = propertyText(product, PROPERTY_KEYS.core, locale)?.toLowerCase();
  return core && STACK_CORE_VALUES.has(core) ? "stack" : "roll";
}

export function getProductQuantity(product: ProductDisplaySource): number | null {
  const quantity = parseNumber(product.labels_per_roll);
  return quantity !== null && quantity > 0 ? quantity : null;
}

export function getProductHeightMm(product: ProductDisplaySource, locale: DisplayLocale = "nl"): number | null {
  const height = parseNumber(propertyText(product, PROPERTY_KEYS.height, locale));
  return height !== null && height > 0 ? height : null;
}

/**
 * "{quantity} per {unit}", or "{meters} meter per {unit}" when quantity is 1
 * (continuous media, where height is the roll length in mm).
 */
export function formatQuantityDisplay(
  input: { quantity: number | null; heightMm: number | null; unitType: ProductUnitType },
  locale: DisplayLocale,
  t: DisplayTranslator,
): string | null {
  const { quantity, heightMm, unitType } = input;
  if (quantity === null || quantity <= 0) return null;

  const unit = t(`product.unitType.${unitType}`);

  if (quantity === 1) {
    if (heightMm === null) return null;
    const meters = formatNumber(heightMm / 1000, locale, METER_MAX_FRACTION_DIGITS);
    return t("product.metersPerUnit", { meters, unit });
  }

  return t("product.quantityPerUnit", { quantity: formatNumber(quantity, locale), unit });
}

export function getQuantityDisplay(
  product: ProductDisplaySource,
  locale: DisplayLocale,
  t: DisplayTranslator,
): string | null {
  return formatQuantityDisplay(
    {
      quantity: getProductQuantity(product),
      heightMm: getProductHeightMm(product, locale),
      unitType: getProductUnitType(product, locale),
    },
    locale,
    t,
  );
}

/**
 * "{material code}, {width} x {height} mm" plus the quantity display.
 * Returns null when material code or dimensions are missing so callers can
 * fall back to the regular product name.
 */
export function getProductDisplayTitle(
  product: ProductDisplaySource,
  locale: DisplayLocale,
  t: DisplayTranslator,
): ProductDisplayTitle | null {
  const materialCode = propertyText(product, PROPERTY_KEYS.materialCode, locale);
  const widthText = propertyText(product, PROPERTY_KEYS.width, locale);
  const heightText = propertyText(product, PROPERTY_KEYS.height, locale);
  const width = widthText ? formatDimension(widthText) : null;
  const height = heightText ? formatDimension(heightText) : null;

  if (!materialCode || !width || !height) return null;

  return {
    main: `${materialCode}, ${width} x ${height} mm`,
    quantity: getQuantityDisplay(product, locale, t),
  };
}

function findMaterialMapping(materialCode: string | null) {
  if (!materialCode) return null;
  const code = materialCode.trim().toLowerCase();
  return CATALOG_MATERIAL_MAPPINGS.find((entry) => entry.materialCode.toLowerCase() === code) ?? null;
}

export function getSimplifiedMaterial(
  product: ProductDisplaySource,
  locale: DisplayLocale,
  t: DisplayTranslator,
): string | null {
  const mapping = findMaterialMapping(propertyText(product, PROPERTY_KEYS.materialCode, locale));
  const raw = propertyText(product, PROPERTY_KEYS.material, locale);
  const category = mapping?.materialFilter ?? (raw ? normalizeMaterialFilterCategory(raw) : null);
  return category ? t(SIMPLIFIED_MATERIAL_KEYS[category]) : raw;
}

export function getSimplifiedFinish(
  product: ProductDisplaySource,
  locale: DisplayLocale,
  t: DisplayTranslator,
): string | null {
  const mapping = findMaterialMapping(propertyText(product, PROPERTY_KEYS.materialCode, locale));
  const raw = propertyText(product, PROPERTY_KEYS.finish, locale);
  const category = mapping?.afwerkingFilter ?? (raw ? normalizeAfwerkingFilterCategory(raw) : null);
  return category ? t(SIMPLIFIED_FINISH_KEYS[category]) : raw;
}

/**
 * "{print method}, {material - simplified}, {finish - simplified}, {adhesive}".
 * Empty parts are skipped; returns null when nothing is available.
 */
export function getProductDisplaySubtitle(
  product: ProductDisplaySource,
  locale: DisplayLocale,
  t: DisplayTranslator,
): string | null {
  const parts = [
    propertyText(product, PROPERTY_KEYS.printMethod, locale),
    getSimplifiedMaterial(product, locale, t),
    getSimplifiedFinish(product, locale, t),
    propertyText(product, PROPERTY_KEYS.adhesive, locale),
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : null;
}
