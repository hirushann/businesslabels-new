import { NextResponse, type NextRequest } from "next/server";
import {
  fetchCategoryGroups,
  localizedProductCategoryPath,
} from "@/lib/categories/tree";

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname") ?? "";
  const locale = request.nextUrl.searchParams.get("locale");

  if ((locale !== "en" && locale !== "nl") || !pathname.startsWith("/")) {
    return NextResponse.json({ path: null }, { status: 400 });
  }

  const groups = await fetchCategoryGroups();
  const path = localizedProductCategoryPath(groups, pathname, locale);

  return NextResponse.json({ path });
}
