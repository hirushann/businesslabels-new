import type { Metadata } from "next";
import MaterialsPageClient from "./MaterialsPageClient";
import ReviewsSection from "@/components/ReviewsSection";
import { technologyCards } from "@/lib/materialCatalog";

export const metadata: Metadata = {
  title: "Material Overview — BusinessLabels",
  description:
    "Discover printer media materials selected for precision, durability, color accuracy, and reliable professional output.",
};

type Material = {
  id: number;
  title: string;
  subtitle: string;
  slug: string;
  code: string;
  brand: string;
  status: string;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

type MaterialsResponse = {
  data: Material[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
  };
};

export default async function MaterialPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  const query = await searchParams;

  if (!baseUrl) {
    throw new Error("BBNL_API_BASE_URL is not configured");
  }

  const requestedPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const normalizedPage = Number.parseInt(requestedPage ?? "1", 10);
  const page = Number.isFinite(normalizedPage) && normalizedPage > 0 ? normalizedPage : 1;

  let materials: Material[] = [];
  let currentPage = 1;
  let lastPage = 1;

  try {
    const response = await fetch(`${baseUrl}/api/materials?page=${page}`, {
      cache: "no-store",
    });

    if (response.ok) {
      const json = (await response.json()) as MaterialsResponse;
      materials = json.data;
      currentPage = json.meta?.current_page ?? page;
      lastPage = json.meta?.last_page ?? 1;
    } else {
      console.error(`Failed to fetch materials: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching materials:", error);
  }

  return (
    <>
      <MaterialsPageClient
        materials={materials}
        currentPage={currentPage}
        lastPage={lastPage}
        technologyCards={technologyCards}
      />
      <ReviewsSection />
    </>
  );
}
