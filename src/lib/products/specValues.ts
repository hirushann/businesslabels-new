const MATERIAL_SPEC_KEYS = new Set([
  "materiaal",
  "material",
]);

const MATERIAL_VALUE_TRANSLATIONS: Record<string, Record<"en" | "nl", string>> = {
  papier: {
    en: "Paper",
    nl: "Papier",
  },
  paper: {
    en: "Paper",
    nl: "Papier",
  },
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

export function localizeProductSpecValue(
  key: string,
  value: string,
  locale: "en" | "nl",
): string {
  const cleanKey = normalizeToken(key);
  if (!MATERIAL_SPEC_KEYS.has(cleanKey)) {
    return value;
  }

  return MATERIAL_VALUE_TRANSLATIONS[normalizeToken(value)]?.[locale] ?? value;
}
