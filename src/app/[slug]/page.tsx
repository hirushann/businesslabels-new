import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { unescapeHtml } from "@/lib/utils";

type PageData = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: string;
  template?: string;
  meta?: {
    meta_title?: string;
    meta_description?: string;
  };
  image?: string;
  created_at: string;
  updated_at: string;
};

async function getPage(slug: string): Promise<PageData | null> {
  try {
    const apiBaseUrl = process.env.BBNL_API_BASE_URL;
    if (!apiBaseUrl) return null;

    const res = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/pages/slug/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) return { title: "Page Not Found" };

  return {
    title: page.meta?.meta_title || page.title,
    description: page.meta?.meta_description || page.excerpt,
  };
}

export default async function DynamicCMSPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="relative overflow-hidden bg-white min-h-screen">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute left-0 top-[10%] h-64 w-64 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-[40%] h-64 w-64 rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="mx-auto max-w-360 px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-amber-500 transition-colors">Home</Link>
          <span>/</span>
          <span className="font-semibold text-neutral-800">{page.title}</span>
        </nav>

        {/* Page Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tight text-neutral-800 sm:text-5xl lg:text-6xl">
            {page.title}
          </h1>
          {page.excerpt && (
            <p className="mt-6 max-w-3xl text-xl font-medium text-neutral-600 leading-relaxed">
              {page.excerpt}
            </p>
          )}
        </header>

        {/* Page Content */}
        <article 
          className="cms-content prose prose-neutral max-w-none prose-headings:text-neutral-800 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-p:text-neutral-700 prose-p:text-lg prose-p:leading-8 prose-a:text-amber-600 hover:prose-a:text-amber-700 prose-img:rounded-2xl prose-strong:text-neutral-900"
          dangerouslySetInnerHTML={{ __html: unescapeHtml(page.content) }}
        />
      </div>
    </div>
  );
}
