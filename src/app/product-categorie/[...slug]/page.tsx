import ProductCategoryPage, {
  generateMetadata,
} from "@/app/product-category/[...slug]/page";

export { generateMetadata };

export default async function DutchProductCategoryPage(
  props: Parameters<typeof ProductCategoryPage>[0],
) {
  return ProductCategoryPage({
    ...props,
    requestedRouteBase: "product-categorie",
  });
}
