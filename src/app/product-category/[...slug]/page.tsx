import {
  generateCategoryArchiveMetadata,
  renderCategoryArchivePage,
} from "@/app/category/[slug]/page";

type ProductCategoryPageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function resolveCurrentSlug(params: ProductCategoryPageProps["params"]) {
  const { slug } = await params;
  return slug.at(-1) ?? "labelprinters";
}

async function resolveRouteSegments(params: ProductCategoryPageProps["params"]) {
  const { slug } = await params;
  return slug.length ? slug : ["labelprinters"];
}

export async function generateMetadata({ params }: ProductCategoryPageProps) {
  return generateCategoryArchiveMetadata(await resolveCurrentSlug(params));
}

export async function ProductCategoryPage({
  params,
  searchParams,
  requestedRouteBase = "product-category",
}: ProductCategoryPageProps & {
  requestedRouteBase?: "product-category" | "product-categorie";
}) {
  const routeSegments = await resolveRouteSegments(params);

  return renderCategoryArchivePage({
    slug: routeSegments.at(-1) ?? "labelprinters",
    routeSegments,
    searchParams,
    routeMode: "productCategory",
    requestedRouteBase,
  });
}

export default ProductCategoryPage;
