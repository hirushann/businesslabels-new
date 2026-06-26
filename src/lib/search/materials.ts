import type { estypes } from "@elastic/elasticsearch";
import { elasticClient } from "@/lib/search/client";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 12;
const MAX_PER_PAGE = 60;

export type Material = {
  id: number;
  title: string;
  subtitle: string;
  slug: string;
  code: string;
  brand: string;
  status: string;
  categories: {
    id: number;
    name: string;
    slug: string;
  }[];
  specifications: {
    material_specs?: { label: string; value: string }[];
  } | null;
  print_method: string | null;
  base_material: string | null;
  finish: string | null;
  adhesive: string | null;
  main_image?: string;
  description?: string;
};

export type MaterialSortValue = "name_asc" | "name_desc" | "latest" | "oldest";

export type MaterialSearchParams = {
  search: string;
  page: number;
  perPage: number;
  sort: MaterialSortValue;
  printMethod: string;
  baseMaterial: string[];
  finish: string[];
  adhesive: string[];
  locale?: "en" | "nl";
};

export type MaterialSearchResponse = {
  materials: Material[];
  total: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
};

type MaterialSource = Record<string, unknown>;

function materialIndexName(): string {
  const prefix = process.env.SCOUT_PREFIX?.trim() ?? "";
  return prefix ? `${prefix}catalog_materials` : "catalog_materials";
}

function firstScalar(value: unknown): string | number | boolean | null {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const scalar = firstScalar(item);
      if (scalar !== null) return scalar;
    }
  }
  return null;
}

function stringValue(value: unknown): string {
  const scalar = firstScalar(value);
  return scalar === null ? "" : String(scalar);
}

function nullableString(value: unknown): string | null {
  const string = stringValue(value).trim();
  return string ? string : null;
}

function numberValue(value: unknown): number | null {
  const scalar = firstScalar(value);
  if (typeof scalar === "number") return scalar;
  if (typeof scalar === "string" && scalar.trim()) {
    const parsed = Number(scalar);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringParamValues(params: URLSearchParams, key: string): string[] {
  return params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseSortValue(value: string | null): MaterialSortValue {
  if (value === "name_desc" || value === "latest" || value === "oldest") return value;
  return "name_asc";
}

export function parseMaterialSearchParams(params: URLSearchParams, locale?: "en" | "nl"): MaterialSearchParams {
  const page = Math.max(1, Number.parseInt(params.get("page") ?? String(DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number.parseInt(params.get("per_page") ?? String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE),
  );

  return {
    search: params.get("search") || params.get("q") || "",
    page,
    perPage,
    sort: parseSortValue(params.get("sort")),
    printMethod: params.get("print_method") || "",
    baseMaterial: stringParamValues(params, "base_material"),
    finish: stringParamValues(params, "finish"),
    adhesive: stringParamValues(params, "adhesive"),
    locale,
  };
}

function labelVariants(value: string): string[] {
  const normalized = value.trim();
  const lower = normalized.toLowerCase();
  const known: Record<string, string[]> = {
    paper: ["Paper", "Papier", "paper", "papier", "papieren-labels-td", "papieren-labels-tt", "inkjetpapier-labels"],
    "pe (polyethylene)": ["PE (polyethylene)", "PE (polyethyleen)", "pe", "polyethylene", "polyethyleen", "kunststof-labels-td", "kunststof-labels-tt", "kunststof-inkjet-labels"],
    "pp (polypropylene)": ["PP (polypropylene)", "PP (polypropyleen)", "pp", "polypropylene", "polypropyleen", "kunststof-labels-td", "kunststof-labels-tt", "kunststof-inkjet-labels"],
    "po (polyolefin)": ["PO (polyolefin)", "PO (polyolefine)", "po", "polyolefin", "polyolefine", "kunststof-labels-td", "kunststof-labels-tt", "kunststof-inkjet-labels"],
    glossy: ["Glossy", "Glanzend", "glossy", "glanzend", "glanzende-labels", "glanzende-labels-tt"],
    matte: ["Matte", "Mat", "matte", "mat", "matte-labels", "matte-labels-tt"],
    "top coated": ["Top Coated", "top coated", "top-coated", "coated"],
    permanent: ["Permanent", "permanent", "labels-met-lijm", "labels-met-lijm-td", "labels-met-lijm-tt"],
    removable: ["Removable", "Verwijderbaar", "removable", "verwijderbaar", "verwijderbare-labels", "verwijderbare-labels-td", "verwijderbare-labels-tt"],
  };

  return Array.from(new Set([normalized, lower, ...(known[lower] ?? [])]));
}

function exactTextFilter(fields: string[], rawValues: string[]): estypes.QueryDslQueryContainer | null {
  const values = Array.from(new Set(rawValues.flatMap(labelVariants)));
  if (values.length === 0) return null;

  return {
    bool: {
      minimum_should_match: 1,
      should: fields.flatMap((field) => [
        { terms: { [field]: values } },
        { terms: { [`${field}.keyword`]: values } },
        ...values.map((value) => ({ match_phrase: { [field]: value } })),
      ]),
    },
  };
}

function printMethodFilter(method: string): estypes.QueryDslQueryContainer | null {
  const normalized = method.trim().toLowerCase();
  if (!normalized) return null;

  const variants: Record<string, string[]> = {
    inkjet: ["inkjet", "Inkjet"],
    "thermal-transfer": ["thermal-transfer", "thermal_transfer", "thermaltransfer", "Thermal Transfer", "ttr", "tt"],
    "thermal-direct": ["thermal-direct", "thermal_direct", "thermaldirect", "direct-thermal", "Thermal Direct", "dt", "td", "thermisch-direct"],
  };

  const values = variants[normalized] ?? [method];

  return {
    bool: {
      minimum_should_match: 1,
      should: [
        { terms: { print_method: values } },
        { terms: { "print_method.keyword": values } },
        { terms: { "print_method_label.keyword": values } },
        { terms: { category_slugs: values } },
        { terms: { "category_slugs.keyword": values } },
      ],
    },
  };
}

function buildSortClause(sort: MaterialSortValue): estypes.Sort {
  switch (sort) {
    case "name_desc":
      return [{ "title_sort.keyword": { order: "desc", unmapped_type: "keyword" } }];
    case "latest":
      return [{ created_at_timestamp: { order: "desc" } }];
    case "oldest":
      return [{ created_at_timestamp: { order: "asc" } }];
    case "name_asc":
    default:
      return [{ "title_sort.keyword": { order: "asc", unmapped_type: "keyword" } }];
  }
}

function buildTextQuery(search: string): estypes.QueryDslQueryContainer {
  const query = search.trim();
  if (!query) return { match_all: {} };

  return {
    bool: {
      minimum_should_match: 1,
      should: [
        { match_phrase: { title: { query, boost: 20 } } },
        { match_phrase_prefix: { title: { query, boost: 12, max_expansions: 50 } } },
        {
          multi_match: {
            query,
            fields: [
              "title^5",
              "title_locales^5",
              "slug^4",
              "slug_locales^4",
              "code^4",
              "brand^2",
              "brand_label^2",
              "description",
              "description_locales",
            ],
            type: "bool_prefix",
            operator: "and",
          },
        },
        { wildcard: { "title_sort.keyword": { value: `${query.toLowerCase()}*`, boost: 5, case_insensitive: true } } },
        { wildcard: { "code.keyword": { value: `${query.toLowerCase()}*`, boost: 4, case_insensitive: true } } },
      ],
    },
  };
}

function applyTranslation(source: MaterialSource, locale?: "en" | "nl"): Partial<Material> {
  if (!locale || !Array.isArray(source.translations)) return {};

  const entry = source.translations.find((item) => {
    if (!item || typeof item !== "object") return false;
    const record = item as Record<string, unknown>;
    return record[locale] || record.language === locale || record.locale === locale;
  }) as Record<string, unknown> | undefined;

  if (!entry) return {};

  const translation = (entry[locale] && typeof entry[locale] === "object"
    ? entry[locale]
    : entry) as Record<string, unknown>;

  return {
    title: nullableString(translation.title) ?? nullableString(translation.name) ?? undefined,
    subtitle: nullableString(translation.subtitle) ?? undefined,
    slug: nullableString(translation.slug) ?? undefined,
  };
}

function mapMaterialHit(hit: estypes.SearchHit<MaterialSource>, locale?: "en" | "nl"): Material | null {
  const source = hit._source;
  if (!source) return null;

  const id = numberValue(source.id);
  if (id === null) return null;

  const translated = applyTranslation(source, locale);
  const categories = arrayValue(source.categories)
    .filter((category): category is Record<string, unknown> => Boolean(category) && typeof category === "object" && !Array.isArray(category))
    .map((category) => ({
      id: numberValue(category.id) ?? 0,
      name: stringValue(category.name),
      slug: stringValue(category.slug),
    }))
    .filter((category) => category.id || category.name || category.slug);

  return {
    id,
    title: translated.title || stringValue(source.title),
    subtitle: translated.subtitle || stringValue(source.subtitle),
    slug: translated.slug || stringValue(source.slug),
    code: stringValue(source.code),
    brand: stringValue(source.brand_label) || stringValue(source.brand),
    status: stringValue(source.status),
    categories,
    specifications: source.specifications && typeof source.specifications === "object"
      ? (source.specifications as Material["specifications"])
      : null,
    print_method: nullableString(source.print_method_label) ?? nullableString(source.print_method),
    base_material: nullableString(source.base_material_label) ?? nullableString(source.base_material),
    finish: nullableString(source.finish_label) ?? nullableString(source.finish),
    adhesive: nullableString(source.adhesive_label) ?? nullableString(source.adhesive),
    main_image: nullableString(source.main_image) ?? nullableString(source.image) ?? undefined,
  };
}

export async function searchMaterials(params: MaterialSearchParams): Promise<MaterialSearchResponse> {
  const client = elasticClient();
  const from = (params.page - 1) * params.perPage;
  const filter: estypes.QueryDslQueryContainer[] = [{ term: { status: "active" } }];

  const methodFilter = printMethodFilter(params.printMethod);
  if (methodFilter) filter.push(methodFilter);

  const baseFilter = exactTextFilter(["base_material", "base_material_label", "category_slugs"], params.baseMaterial);
  if (baseFilter) filter.push(baseFilter);

  const finishFilter = exactTextFilter(["finish", "finish_label", "category_slugs"], params.finish);
  if (finishFilter) filter.push(finishFilter);

  const adhesiveFilter = exactTextFilter(["adhesive", "adhesive_label", "category_slugs"], params.adhesive);
  if (adhesiveFilter) filter.push(adhesiveFilter);

  const response = await client.search<MaterialSource>({
    index: materialIndexName(),
    ignore_unavailable: true,
    track_total_hits: true,
    from,
    size: params.perPage,
    _source: [
      "id",
      "title",
      "title_sort",
      "subtitle",
      "slug",
      "code",
      "brand",
      "brand_label",
      "status",
      "categories",
      "category_slugs",
      "specifications",
      "print_method",
      "print_method_label",
      "base_material",
      "base_material_label",
      "finish",
      "finish_label",
      "adhesive",
      "adhesive_label",
      "main_image",
      "image",
      "translations",
      "created_at_timestamp",
    ],
    query: {
      bool: {
        must: [buildTextQuery(params.search)],
        filter,
      },
    },
    sort: buildSortClause(params.sort),
  });

  const total = typeof response.hits.total === "number"
    ? response.hits.total
    : response.hits.total?.value ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / params.perPage));
  const materials = response.hits.hits
    .map((hit) => mapMaterialHit(hit, params.locale))
    .filter((material): material is Material => material !== null);

  return {
    materials,
    total,
    currentPage: params.page,
    lastPage,
    perPage: params.perPage,
  };
}
