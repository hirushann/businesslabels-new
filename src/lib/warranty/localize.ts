export type LocaleCode = "en" | "nl";

type TranslationRecord = Record<string, unknown>;

export type WarrantyTranslations =
  | Array<Record<string, TranslationRecord | null> | TranslationRecord | string>
  | Record<string, TranslationRecord | string | null>
  | string
  | null
  | undefined;

export type WarrantyDefaultOptionInput = {
  warranty_option_id?: number | string | null;
  name?: string | null;
  duration_years?: number | null;
  price?: number | null;
  description?: string | null;
  translations?: unknown;
};

export type WarrantyOptionInput = {
  id?: number | string | null;
  warranty_option_id?: number | string | null;
  type?: string | null;
  typeName?: string | null;
  type_name?: string | null;
  warranty_type_name?: string | null;
  duration_years?: number | null;
  duration_months?: number | null;
  price?: number | null;
  name?: string | null;
  description?: string | null;
  sort?: number | null;
  sort_order?: number | null;
  translations?: unknown;
  cart?: {
    type?: string | null;
    warranty_option_id?: number | string | null;
  } | null;
};

export type WarrantyTypeInput = {
  id: number | string;
  name?: string | null;
  title?: string | null;
  type_name?: string | null;
  warranty_type_name?: string | null;
  description?: string | null;
  icon?: string | null;
  badge_text?: string | null;
  badge_color?: string | null;
  translations?: unknown;
  options?: WarrantyOptionInput[] | null;
};

export type WarrantyInput = {
  default_option?: WarrantyDefaultOptionInput | null;
  types?: WarrantyTypeInput[] | null;
  options?: WarrantyOptionInput[] | null;
} | null | undefined;

export type NormalizedWarrantyOption = {
  id: number | string;
  name: string;
  typeName?: string;
  durationMonths: number;
  price: number;
  description: string;
  sortOrder?: number;
};

export type NormalizedWarrantyType = {
  id: number | string;
  name: string;
  description: string;
  icon: string;
  badgeText: string;
  badgeColor: string;
  options: NormalizedWarrantyOption[];
};

export function normalizeWarrantyOptions(warranty: WarrantyInput, locale: string) {
  const normalizedLocale = normalizeLocale(locale);

  const defaultOption = warranty?.default_option
    ? {
        id: warranty.default_option.warranty_option_id ?? "default",
        name: localizedWarrantyField(warranty.default_option, normalizedLocale, "default_warranty_name", "name") || "Warranty",
        durationMonths: warranty.default_option.duration_years ? warranty.default_option.duration_years * 12 : 0,
        price: warranty.default_option.price || 0,
        description: localizedWarrantyField(warranty.default_option, normalizedLocale, "default_warranty_description", "description") || "",
      }
    : null;

  let types: NormalizedWarrantyType[] = (warranty?.types || []).map((type) => {
    const typeName = localizedWarrantyField(type, normalizedLocale, "name", "title", "type_name", "warranty_type_name") || "";

    const typeDescription = localizedWarrantyField(type, normalizedLocale, "description") || "";

    return {
      id: type.id,
      name: typeName,
      description: typeDescription,
      icon: type.icon || "",
      badgeText: localizedWarrantyField(type, normalizedLocale, "badge_text") || "",
      badgeColor: type.badge_color || "",
      options: (type.options || []).map((option) => {
        const normalizedOpt = normalizeWarrantyOption(option, normalizedLocale);
        if (!normalizedOpt.description && typeDescription) {
          normalizedOpt.description = typeDescription;
        }
        return {
          ...normalizedOpt,
          typeName: typeName || warrantyOptionTypeName(option, normalizedLocale) || undefined,
        };
      }),
    };
  });

  const oldOptions: NormalizedWarrantyOption[] = (warranty?.options || [])
    .map((option) => normalizeWarrantyOption(option, normalizedLocale))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (types.length === 0 && oldOptions.length > 0) {
    types = [
      {
        id: "legacy",
        name: normalizedLocale === "nl" ? "Garantieopties" : "Extended Warranty",
        description: "",
        icon: "shield-check",
        badgeText: "",
        badgeColor: "",
        options: oldOptions,
      },
    ];
  }

  let allOptions = types.flatMap((type) => type.options);
  if (oldOptions.length > 0 && types[0]?.id !== "legacy") {
    allOptions = [...allOptions, ...oldOptions];
  }

  return {
    defaultOption,
    types,
    oldOptions: types[0]?.id === "legacy" ? [] : oldOptions,
    allOptions,
  };
}

function normalizeWarrantyOption(option: WarrantyOptionInput, locale: LocaleCode): NormalizedWarrantyOption {
  const durationYears = typeof option.duration_years === "number" ? option.duration_years : Number(option.duration_years || 0);
  const durationMonths = option.duration_months || (durationYears ? durationYears * 12 : 0);

  return {
    id: option.warranty_option_id ?? option.id ?? option.cart?.warranty_option_id ?? 0,
    name: localizedWarrantyField(option, locale, "name") || "Warranty",
    durationMonths,
    price: option.price || 0,
    description: localizedWarrantyField(option, locale, "description") || "",
    sortOrder: option.sort_order ?? option.sort ?? 0,
    typeName: warrantyOptionTypeName(option, locale) || undefined,
  };
}

function warrantyOptionTypeName(option: WarrantyOptionInput, locale: LocaleCode): string | null {
  return localizedWarrantyField(option, locale, "typeName", "type_name", "warranty_type_name", "type")
    || (typeof option.cart?.type === "string" && option.cart.type.trim() !== "" ? option.cart.type : null);
}

function localizedWarrantyField(source: { translations?: unknown } & Record<string, unknown>, locale: LocaleCode, ...fields: string[]): string | null {
  const translated = translationValue(source.translations, locale, fields);
  if (translated) return translated;

  for (const field of fields) {
    const value = source[field];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  return null;
}

function translationValue(translations: unknown, locale: LocaleCode, fields: string[]): string | null {
  const parsed = parseTranslations(translations);
  if (!parsed) return null;

  const valueFromRecord = (record: TranslationRecord | null | undefined): string | null => {
    if (!record) return null;

    for (const field of fields) {
      const value = record[field];
      if (typeof value === "string" && value.trim() !== "") {
        return value;
      }
    }

    return null;
  };

  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      const item = parseTranslationEntry(entry);
      if (!item) continue;

      const keyed = (item as Record<string, TranslationRecord | null>)[locale];
      const keyedValue = valueFromRecord(keyed);
      if (keyedValue) return keyedValue;

      const language = item.language;
      if (language === locale) {
        const directValue = valueFromRecord(item);
        if (directValue) return directValue;
      }
    }

    return null;
  }

  if (typeof parsed === "object") {
    const record = parsed as Record<string, TranslationRecord | string | null>;
    const localeEntry = record[locale];
    if (localeEntry && typeof localeEntry === "object") {
      const value = valueFromRecord(localeEntry);
      if (value) return value;
    }

    for (const field of fields) {
      const byField = record[field];
      if (byField && typeof byField === "object") {
        const value = byField[locale];
        if (typeof value === "string" && value.trim() !== "") {
          return value;
        }
      }
    }
  }

  return null;
}

function parseTranslations(translations: unknown): Exclude<WarrantyTranslations, string | null | undefined> | null {
  if (!translations) return null;

  if (typeof translations !== "string") {
    return typeof translations === "object" ? translations as Exclude<WarrantyTranslations, string | null | undefined> : null;
  }

  try {
    const parsed = JSON.parse(translations) as Exclude<WarrantyTranslations, string | null | undefined>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function parseTranslationEntry(entry: Record<string, TranslationRecord | null> | TranslationRecord | string): TranslationRecord | null {
  if (typeof entry !== "string") {
    return entry && typeof entry === "object" ? entry : null;
  }

  try {
    const parsed = JSON.parse(entry) as TranslationRecord;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeLocale(locale: string): LocaleCode {
  return locale === "nl" ? "nl" : "en";
}

function fallbackWarrantyDescription(durationMonths: number, locale: LocaleCode): string {
  if (durationMonths > 0) {
    return locale === "nl" ? `${durationMonths} maanden dekking` : `${durationMonths} months coverage`;
  }

  return locale === "nl" ? "Uitgebreide dekking" : "Extended coverage";
}
