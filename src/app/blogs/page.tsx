import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("blogsPage.metadataTitle"),
    description: t("blogsPage.metadataDescription"),
  };
}

type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image?: string;
  created_at: string;
};

async function getPosts(search?: string): Promise<Post[]> {
  try {
    const apiBaseUrl = process.env.BBNL_API_BASE_URL;
    if (!apiBaseUrl) return [];

    let url = `${apiBaseUrl.replace(/\/$/, "")}/api/posts`;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url, {
      next: { revalidate: search ? 0 : 60 },
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const t = await getTranslations();
  const searchParamsResolved = await searchParams;
  const search = searchParamsResolved.search;
  const posts = await getPosts(search);

  return (
    <div className="relative bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-sky-950 py-24 text-white">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_20%_30%,rgba(241,136,0,0.15),transparent_50%)]" />
        <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
          <Breadcrumbs 
            className="mb-8 text-white/70"
            items={[
              { label: t("blogsPage.titlePrefix") }
            ]} 
          />
          <div className="max-w-3xl">
            <h1 className="text-5xl font-black uppercase tracking-tight sm:text-6xl lg:text-7xl">
              {t("blogsPage.titlePrefix")} <span className="text-amber-500">{t("blogsPage.titleHighlight")}</span>
            </h1>
            <p className="mt-6 text-xl text-sky-100/80 leading-relaxed font-medium">
              {t("blogsPage.subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Blogs Grid */}
      <section className="mx-auto max-w-360 px-4 py-24 sm:px-6 lg:px-8">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link 
                key={post.id} 
                href={`/blogs/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-300">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="rounded-full bg-amber-500/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-amber-600">
                      {t("blogsPage.insight")}
                    </span>
                    <span className="text-sm font-semibold text-neutral-400">
                      {new Date(post.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h2 className="mb-4 text-2xl font-bold text-neutral-800 transition-colors group-hover:text-amber-500 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="mb-8 text-neutral-600 leading-relaxed line-clamp-3 font-medium">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto flex items-center gap-2 font-black uppercase tracking-widest text-xs text-amber-500 group-hover:gap-4 transition-all">
                    {t("blogsPage.readArticle")}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 rounded-full bg-slate-50 p-6">
              <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2zM14 4v4h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-800">{t("blogsPage.noPostsTitle")}</h2>
            <p className="mt-2 text-neutral-500 font-medium">{t("blogsPage.noPostsDescription")}</p>
          </div>
        )}
      </section>
    </div>
  );
}
