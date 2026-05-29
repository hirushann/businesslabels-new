import { NextRequest, NextResponse } from "next/server";
import { parseMaterialSearchParams, searchMaterials } from "@/lib/search/materials";

export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get("locale") as "en" | "nl" | null;
    const params = parseMaterialSearchParams(request.nextUrl.searchParams, locale || undefined);
    const result = await searchMaterials(params);

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Material search failed.", error);

    return NextResponse.json(
      {
        materials: [],
        total: 0,
        currentPage: 1,
        lastPage: 1,
        perPage: 12,
        error: "Material search is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}
