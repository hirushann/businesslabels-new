import { Client } from "@elastic/elasticsearch";

let cachedClient: Client | null = null;

function appendPortIfMissing(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.port || !process.env.ELASTIC_PORT?.trim()) {
      return url.toString().replace(/\/$/, "");
    }

    url.port = process.env.ELASTIC_PORT.trim();
    return url.toString().replace(/\/$/, "");
  } catch {
    return rawUrl.replace(/\/$/, "");
  }
}

export function elasticNode(): string {
  const url = process.env.ELASTICSEARCH_URL;
  if (url?.trim()) return appendPortIfMissing(url.trim());

  const host = process.env.ELASTIC_HOST?.trim();
  if (!host) return "";

  if (host.startsWith("http://") || host.startsWith("https://")) {
    return appendPortIfMissing(host);
  }

  const scheme = process.env.ELASTIC_SCHEME?.trim() || "http";
  return appendPortIfMissing(`${scheme}://${host}`);
}

export function catalogIndexForType(type?: "simple" | "variable"): string[] {
  const configured = process.env.SEARCH_INDEX || process.env.ELASTICSEARCH_INDEX;
  if (configured?.trim()) return configured.split(",").map((part) => part.trim()).filter(Boolean);

  const prefix = process.env.SCOUT_PREFIX?.trim() ?? "";
  if (type === "simple") return [`${prefix}catalog_products_simple`];
  if (type === "variable") return [`${prefix}catalog_products_variable`];

  return [`${prefix}catalog_products_simple`, `${prefix}catalog_products_variable`];
}

export function elasticClient(): Client {
  if (cachedClient) return cachedClient;

  const node = elasticNode();
  if (!node) {
    throw new Error("Elasticsearch host is not configured.");
  }

  const apiKey = process.env.ELASTIC_API_KEY?.trim();
  const username = process.env.ELASTIC_USERNAME?.trim();

  cachedClient = new Client({
    node,
    ...(apiKey
      ? { auth: { apiKey } }
      : username
        ? { auth: { username, password: process.env.ELASTIC_PASSWORD ?? "" } }
        : {}),
  });

  return cachedClient;
}
