import { NextRequest, NextResponse } from "next/server";
import { parseCatalogSearchParams, searchCatalogProducts } from "@/lib/search/products";

export async function GET(request: NextRequest) {
  try {
    const params = parseCatalogSearchParams(request.nextUrl.searchParams);
    const response = await searchCatalogProducts(params);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Catalog product search failed.", error);

    return NextResponse.json(
      {
        error: "Catalog search is temporarily unavailable.",
        products: [],
        total: 0,
        currentPage: 1,
        lastPage: 1,
        perPage: 24,
        filters: { ranges: [], options: [] },
      },
      { status: 503 },
    );
  }
}
