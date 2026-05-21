import type { estypes } from "@elastic/elasticsearch";
import { NextRequest, NextResponse } from "next/server";
import { elasticClient } from "@/lib/search/client";

type PrinterSearchSource = {
  id?: unknown;
  title?: unknown;
  name?: unknown;
  subtitle?: unknown;
  slug?: unknown;
  brand?: unknown;
  catalog_brand?: unknown;
  manufacturer?: unknown;
  image?: unknown;
  main_image?: unknown;
  thumbnail?: unknown;
  properties?: unknown;
};

type PrinterSearchResult = {
  id: number;
  brand: string | null;
  name: string;
  model: string | null;
  slug: string | null;
  image: string | null;
};

function printerIndexName(): string {
  const prefix = process.env.SCOUT_PREFIX?.trim() ?? "";
  return prefix ? `${prefix}catalog_printers` : "catalog_printers";
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

function stringValue(value: unknown): string | null {
  const scalar = firstScalar(value);
  const string = scalar === null ? null : String(scalar).trim();

  return string || null;
}

function numberValue(value: unknown): number | null {
  const scalar = firstScalar(value);
  if (typeof scalar === "number" && Number.isFinite(scalar)) return scalar;

  if (typeof scalar === "string" && scalar.trim()) {
    const parsed = Number.parseInt(scalar, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function nestedStringValue(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;

  for (const key of keys) {
    const direct = stringValue(record[key]);
    if (direct) return direct;
  }

  return null;
}

function brandFromTitle(title: string, slug: string | null): string | null {
  const haystack = `${title} ${slug ?? ""}`.toLowerCase();
  const knownBrands = [
    "epson",
    "zebra",
    "godex",
    "cab",
    "toshiba",
    "citizen",
    "primera",
    "dtm",
    "sato",
    "honeywell",
    "datamax",
    "intermec",
    "brother",
  ];

  const match = knownBrands.find((brand) => haystack.includes(brand));
  if (!match) return null;

  return match === "dtm" ? "DTM" : match.charAt(0).toUpperCase() + match.slice(1);
}

function mapPrinterSearchResult(source: PrinterSearchSource): PrinterSearchResult | null {
  const id = numberValue(source.id);
  const name = stringValue(source.title) ?? stringValue(source.name);
  const slug = stringValue(source.slug);

  if (id === null || !name) return null;

  const brand =
    stringValue(source.brand) ??
    stringValue(source.catalog_brand) ??
    stringValue(source.manufacturer) ??
    nestedStringValue(source.properties, ["brand", "merk", "manufacturer", "merken"]) ??
    brandFromTitle(name, slug);

  return {
    id,
    brand,
    name,
    model: stringValue(source.subtitle),
    slug,
    image: stringValue(source.image) ?? stringValue(source.main_image) ?? stringValue(source.thumbnail),
  };
}

const PRINTER_SOURCE_FIELDS: string[] = [
  "id",
  "title",
  "name",
  "subtitle",
  "slug",
  "brand",
  "catalog_brand",
  "manufacturer",
  "image",
  "main_image",
  "thumbnail",
  "properties",
];

function buildPrinterTextQuery(query: string): estypes.QueryDslQueryContainer {
  const trimmed = query.trim();
  const lowerQuery = trimmed.toLowerCase();

  return {
    bool: {
      should: [
        { match_phrase: { title: { query: trimmed, boost: 100 } } },
        { match_phrase_prefix: { title: { query: trimmed, boost: 60, max_expansions: 50 } } },
        { match: { title: { query: trimmed, operator: "and", boost: 30 } } },
        { match: { subtitle: { query: trimmed, boost: 10 } } },
        { match: { brand: { query: trimmed, boost: 20 } } },
        { match: { catalog_brand: { query: trimmed, boost: 20 } } },
        {
          wildcard: {
            "title_sort.keyword": {
              value: `${lowerQuery}*`,
              boost: 15,
              case_insensitive: true,
            },
          },
        },
      ],
      minimum_should_match: 1,
    },
  };
}

async function findPrinterById(id: number): Promise<PrinterSearchResult | null> {
  const response = await elasticClient().search<PrinterSearchSource>({
    index: printerIndexName(),
    ignore_unavailable: true,
    size: 1,
    _source: PRINTER_SOURCE_FIELDS,
    query: {
      bool: {
        filter: [{ term: { id } }, { term: { status: "published" } }],
      },
    },
  });

  const source = response.hits.hits[0]?._source;

  return source ? mapPrinterSearchResult(source) : null;
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
    const printerId = Number.parseInt(request.nextUrl.searchParams.get("printer_id") ?? "", 10);

    if (Number.isFinite(printerId)) {
      const printer = await findPrinterById(printerId);
      return NextResponse.json({ data: printer ? [printer] : [] });
    }

    if (query.length < 3) {
      return NextResponse.json({ data: [] });
    }

    const response = await elasticClient().search<PrinterSearchSource>({
      index: printerIndexName(),
      ignore_unavailable: true,
      size: 10,
      _source: PRINTER_SOURCE_FIELDS,
      query: {
        bool: {
          filter: [{ term: { status: "published" } }],
          must: [buildPrinterTextQuery(query)],
        },
      },
    });

    const data = response.hits.hits
      .map((hit) => (hit._source ? mapPrinterSearchResult(hit._source) : null))
      .filter((printer): printer is PrinterSearchResult => printer !== null);

    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Error searching printers:", error);

    return NextResponse.json(
      { data: [], message: "Failed to search printers." },
      { status: 500 },
    );
  }
}
