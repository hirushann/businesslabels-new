import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import { mapLaravelProductToCardData, type LaravelProduct } from "@/lib/mappings/product";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("blogsPage.metadataTitle"),
    description: t("blogsPage.metadataDescription"),
  };
}

type PostCategoryData = {
  id: number;
  name: string;
  slug: string;
  post_count: number;
};

async function getPostCategories(): Promise<PostCategoryData[]> {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  if (!apiBaseUrl) return [];

  try {
    const url = `${apiBaseUrl.replace(/\/$/, "")}/api/posts/categories`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data as PostCategoryData[]) ?? [];
  } catch (err) {
    console.error("Failed to fetch post categories:", err);
    return [];
  }
}

type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image?: string;
  image_preview?: string;
  created_at: string;
  author?: {
    name: string;
    email: string;
  } | null;
  categories?: Array<{
    name: string;
    slug: string;
  }>;
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

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

async function getRecommendedProducts(locale: "en" | "nl"): Promise<LaravelProduct[]> {
  try {
    const backendUrl = process.env.BBNL_API_BASE_URL;
    if (!backendUrl) return [];
    
    const url = withLocaleParam(`${backendUrl}/api/products`, locale);
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 0 }, // Disable caching so it randomizes per request
    });
    if (response.ok) {
      const json = await response.json();
      if (json.data && Array.isArray(json.data)) {
        return shuffleArray(json.data as LaravelProduct[]).slice(0, 4);
      }
    }
  } catch (error) {
    console.error('Error fetching recommended products:', error);
  }
  return [];
}

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const t = await getTranslations();
  const locale = await getServerLocale();
  const searchParamsResolved = await searchParams;
  const search = searchParamsResolved.search;
  const activeCategory = searchParamsResolved.category || "all";
  
  const allPosts = await getPosts(search);
  const categories = await getPostCategories();
  
  const posts = activeCategory === "all" 
    ? allPosts 
    : allPosts.filter(p => p.categories?.some(c => c.slug === activeCategory));

  const recommendedProducts = await getRecommendedProducts(locale as "en" | "nl");

  return (
    <div className="relative bg-white min-h-screen overflow-hidden">
      {/* Glow Effects */}
      <div className="size-48 left-0 top-[454px] absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none"></div>
      <div className="size-48 right-[100px] top-[1012px] absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none"></div>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-0 py-8 pb-24 flex flex-col gap-10">
        {/* Header Section */}
        <div className="flex flex-col justify-end items-start gap-4">
          <Breadcrumbs 
            className="text-zinc-500"
            items={[
              { label: "Knowledge Center", href: "/knowledge" },
              { label: "Articles & Guides" }
            ]} 
          />
          <div className="flex flex-col justify-end items-start gap-4">
            <h1 className="text-neutral-800 text-4xl md:text-5xl font-bold leading-tight">
              A resource for people who print labels.
            </h1>
            <p className="text-neutral-700 text-lg font-normal leading-6 max-w-3xl">
              Not a news feed. Practical knowledge about equipment, materials, settings, and standards — written to stay relevant.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col justify-start items-start gap-6">
          {/* Categories Tab */}
          <div className="w-full flex flex-col justify-end items-start">
            <div className="w-full flex overflow-x-auto no-scrollbar pb-3 items-start justify-between">
              <Link 
                href="/blog?category=all"
                className={`px-2.5 pb-2 flex justify-center items-center gap-2.5 relative transition-colors ${activeCategory === "all" ? "text-brand font-bold" : "text-neutral-700 font-semibold hover:text-brand"}`}
              >
                <span className="text-base leading-5 whitespace-nowrap">All</span>
                {activeCategory === "all" && (
                  <div className="w-full h-0.5 absolute bottom-0 bg-brand rounded-sm"></div>
                )}
              </Link>
              
              {categories.map(category => (
                <Link 
                  key={category.slug}
                  href={`/blog?category=${category.slug}`}
                  className={`px-2.5 pb-2 flex justify-center items-center gap-2.5 relative transition-colors ${activeCategory === category.slug ? "text-brand font-bold" : "text-neutral-700 font-semibold hover:text-brand"}`}
                >
                  <span className="text-base leading-5 whitespace-nowrap">{category.name}</span>
                  {activeCategory === category.slug && (
                    <div className="w-full h-0.5 absolute bottom-0 bg-brand rounded-sm"></div>
                  )}
                </Link>
              ))}
            </div>
            <div className="w-full h-px bg-slate-200"></div>
          </div>

          {/* Articles Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.length > 0 ? posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="flex flex-col bg-white rounded-2xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-slate-100 overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-full h-48 relative overflow-hidden bg-slate-100">
                  <Image 
                    src={toDisplayImageUrl(post.image_preview || post.image) || "https://placehold.co/384x192"} 
                    alt={post.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                <div className="p-4 flex flex-col justify-between flex-1 gap-4">
                  <div className="flex flex-col justify-start items-start gap-2">
                    <div className="text-blue-400 text-base font-semibold leading-5">
                      {post.categories?.[0]?.name || "Article"}
                    </div>
                    <div className="text-neutral-800 text-xl font-semibold leading-6 group-hover:text-brand transition-colors line-clamp-2">
                      {post.title}
                    </div>
                    <div className="text-neutral-700 text-base font-normal leading-6 line-clamp-2">
                      {post.excerpt}
                    </div>
                  </div>
                  <div className="inline-flex justify-start items-center gap-2 mt-4">
                    <div className="w-9 h-9 relative rounded-full overflow-hidden bg-slate-200">
                       <Image src="https://placehold.co/36x36" alt="Author" fill className="object-cover" />
                    </div>
                    <div className="text-neutral-700 text-base font-semibold leading-6">
                      {post.author?.name || "Admin"}
                    </div>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-6 rounded-full bg-slate-50 p-6">
                  <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2zM14 4v4h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-neutral-800">{t("blogsPage.noPostsTitle") || "No articles found"}</h2>
                <p className="mt-2 text-neutral-500 font-medium">{t("blogsPage.noPostsDescription") || "Try selecting a different category."}</p>
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Base Callout */}
        <div className="w-full p-6 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-8">
          <div className="inline-flex flex-col justify-start items-start gap-2">
            <div className="text-neutral-800 text-2xl font-semibold leading-7">Looking for in-depth information?</div>
            <div className="text-neutral-700 text-base font-normal leading-6">Step-by-step guides, troubleshooting trees, and printer manuals live in the Knowledge Base.</div>
          </div>
          <Link href="/knowledge" className="h-12 px-6 py-2.5 bg-brand hover:bg-brand-hover transition-colors rounded-[100px] flex justify-center items-center gap-2.5 flex-shrink-0">
            <span className="text-white text-lg font-semibold leading-6">Browse Knowledge Base</span>
          </Link>
        </div>
      </div>

      {/* Recommended Products */}
      <div className="w-full py-24 bg-gray-50 flex flex-col justify-start items-center">
        <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-0 flex flex-col gap-12">
          <div className="w-full flex justify-between items-center">
            <h2 className="text-neutral-800 text-3xl md:text-4xl font-bold leading-tight">Recommended Products</h2>
            <div className="hidden sm:flex justify-start items-center gap-6">
              <button className="w-12 h-12 flex justify-center items-center bg-gray-50 rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-gray-200 hover:bg-gray-200 transition-colors text-neutral-400 hover:text-neutral-600">
                <svg className="w-6 h-6 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-12 h-12 flex justify-center items-center bg-white rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-amber-500 hover:bg-brand-soft transition-colors text-brand">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((product) => {
              const cardProduct = mapLaravelProductToCardData(product, locale as "en" | "nl");

              const href = cardProduct.slug
                ? (cardProduct.type === "simple" || cardProduct.type === "variable")
                  ? { pathname: `/product/${cardProduct.slug}`, query: { type: cardProduct.type } }
                  : { pathname: `/product/${cardProduct.slug}` }
                : undefined;

              return <ProductCard key={cardProduct.sku} product={cardProduct} href={href} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
