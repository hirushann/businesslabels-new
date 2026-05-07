import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const slug = searchParams.get("slug");
  const type = searchParams.get("type");

  if (!slug) {
    return NextResponse.json({ warranty: null });
  }

  const baseUrl = process.env.BBNL_API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json({ warranty: null });
  }

  const typesToTry: Array<"simple" | "variable"> =
    type === "simple"
      ? ["simple"]
      : type === "variable"
        ? ["variable", "simple"]
        : ["simple", "variable"];

  for (const t of typesToTry) {
    try {
      const res = await fetch(
        `${baseUrl}/api/products/${t}/slug/${encodeURIComponent(slug)}`,
        { cache: "no-store" },
      );
      if (!res.ok) continue;

      const json = (await res.json()) as { data?: { warranty?: unknown } };
      const warranty = json.data?.warranty ?? null;
      return NextResponse.json({ warranty });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ warranty: null });
}
