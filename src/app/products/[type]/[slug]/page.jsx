export default async function ProductDetailPage({ params }) {
  const { type, slug } = await params;

  return <h1>Product: {slug} ({type})</h1>;
}
