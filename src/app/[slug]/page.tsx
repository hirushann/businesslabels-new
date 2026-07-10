import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { unescapeHtml } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";

/** Strip empty/whitespace-only <p> tags and HTML comments injected by the Quill WYSIWYG editor. */
function cleanCmsContent(html: string): string {
  // Remove HTML comments
  let result = html.replace(/<!--[\s\S]*?-->/g, "");

  // Remove p tags that contain only whitespace, spaces, &nbsp;, \u00a0, or <br>
  // Run multiple passes until fully stable
  let prev = "";
  while (prev !== result) {
    prev = result;
    result = result
      .replace(/<p>[ \t\n\r\u00a0]*<\/p>/g, "")
      .replace(/<p>\s*<\/p>/g, "")
      .replace(/<p>(&nbsp;|&#160;|\u00a0|\s)*<\/p>/g, "")
      .replace(/<p>\s*(<br\s*\/?>\s*)*<\/p>/gi, "");
  }

  return result;
}

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

async function getPage(slug: string, locale: string): Promise<PageData | null> {
  try {
    const apiBaseUrl = process.env.BBNL_API_BASE_URL;
    if (!apiBaseUrl) return null;

    const baseUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/pages/slug/${slug}`;
    const url = withLocaleParam(baseUrl, locale as "en" | "nl");
    
    console.log(`[CMS Page Debug] Fetching: ${url}`);

    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.log(`[CMS Page Debug] Failed to fetch. Status: ${res.status}`);
      return null;
    }
    const json = await res.json();
    console.log(`[CMS Page Debug] API Response for "${slug}":`, JSON.stringify(json.data, null, 2));
    
    return json.data;
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerLocale();
  const page = await getPage(slug, locale);

  if (!page) {
    const t = await getTranslations();
    return { title: t("pages.pageNotFound") };
  }

  return {
    title: page.meta?.meta_title || page.title,
    description: page.meta?.meta_description || page.excerpt,
  };
}

export default async function DynamicCMSPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getServerLocale();
  const t = await getTranslations();
  const page = await getPage(slug, locale);

  if (!page) {
    notFound();
  }

  return (
    <div className="relative overflow-hidden bg-white min-h-screen">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute left-0 top-[10%] h-64 w-64 rounded-full bg-brand/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-[40%] h-64 w-64 rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumbs 
            items={[
              { label: page.title }
            ]} 
          />
        </div>

        {/* Page Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tight text-neutral-800 sm:text-5xl lg:text-6xl">
            {page.title}
          </h1>
          {/* {page.excerpt && (
            <p className="mt-6 max-w-3xl text-xl font-medium text-neutral-600 leading-relaxed">
              {page.excerpt}
            </p>
          )} */}
        </header>

        {/* Page Content */}
        <article
          className="cms-content"
          dangerouslySetInnerHTML={{ __html: cleanCmsContent(unescapeHtml(page.content)) }}
        />
      </div>
    </div>
  );
}
