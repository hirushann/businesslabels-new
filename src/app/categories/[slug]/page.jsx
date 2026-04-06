export default async function CategoryDetailPage({ params }) {
  const { slug } = await params;

  return <h1>Category: {slug}</h1>;
}
