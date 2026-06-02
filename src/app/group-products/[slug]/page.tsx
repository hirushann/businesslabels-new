import SingleProductPage, { generateMetadata as baseMetadata } from "../../product/[slug]/page";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
};

export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  // Force type to group_product for this route
  const forcedSearchParams = { ...searchParams, type: "group_product" };

  return baseMetadata({
    params: Promise.resolve(params),
    searchParams: Promise.resolve(forcedSearchParams),
  });
}

export default async function GroupProductPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  // Force type to group_product for this route
  const forcedSearchParams = { ...searchParams, type: "group_product" };

  return (
    <SingleProductPage
      params={Promise.resolve(params)}
      searchParams={Promise.resolve(forcedSearchParams)}
    />
  );
}
