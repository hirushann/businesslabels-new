import { NextResponse, type NextRequest } from "next/server";
import { localizedCategoryArchivePath } from "@/lib/categories/archives";

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname") ?? "";
  const locale = request.nextUrl.searchParams.get("locale");

  if ((locale !== "en" && locale !== "nl") || !pathname.startsWith("/")) {
    return NextResponse.json({ path: null }, { status: 400 });
  }

  const path = await localizedCategoryArchivePath(pathname, locale);

  return NextResponse.json({ path });
}
