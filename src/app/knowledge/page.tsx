import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import {
  Search, Compass, CircleDollarSign, Layers, Download,
  AlertTriangle, Wrench, Lightbulb, HelpCircle,
  Settings, Sliders, PlayCircle, BookOpen, Link as LinkIcon, PhoneCall, Home
} from "lucide-react";
import { sectionIcon } from "@/app/faq/section-icon";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import KnowledgeSearchBar from "@/components/KnowledgeSearchBar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("menus.resources.knowledgeTitle")} — Businesslabels`,
    description: t("menus.resources.knowledgeDesc"),
  };
}

type FaqPageData = {
  id: number;
  status: string;
  icon: string | null;
  hero_image: string | null;
  hero_image_preview: string | null;
  main_locale: string;
  available_locales: string[];
  slugs: Record<string, string | null>;
  locales: Record<string, {
    title: string | null;
    intro: string | null;
  }>;
};

async function getFaqPages(): Promise<FaqPageData[]> {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  if (!apiBaseUrl) return [];

  try {
    const url = `${apiBaseUrl.replace(/\/$/, "")}/api/faq`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data as FaqPageData[]) ?? [];
  } catch (err) {
    console.error("Failed to fetch FAQ pages:", err);
    return [];
  }
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

type ArticleData = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image: string | null;
  author: {
    name: string;
    email: string;
  } | null;
  categories: Array<{
    name: string;
    slug: string;
  }>;
};

async function getPopularArticles(): Promise<ArticleData[]> {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  if (!apiBaseUrl) return [];

  try {
    const url = `${apiBaseUrl.replace(/\/$/, "")}/api/posts?random=4`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data as ArticleData[]) ?? [];
  } catch (err) {
    console.error("Failed to fetch popular articles:", err);
    return [];
  }
}

export default async function KnowledgeBaseArchive() {
  const t = await getTranslations();
  const locale = await getLocale();
  const faqPages = await getFaqPages();
  const postCategories = await getPostCategories();
  const popularArticles = await getPopularArticles();

  return (
    <div className="relative min-h-screen bg-gray-50 flex flex-col items-center overflow-hidden">
      {/* Glow Effects */}
      <div className="size-48 left-0 top-[454px] absolute bg-amber-500/30 rounded-full blur-[132px] pointer-events-none"></div>
      <div className="size-48 left-[315px] top-[1785px] absolute bg-amber-500/30 rounded-full blur-[132px] pointer-events-none"></div>

      {/* Hero Section */}
      <div className="w-full py-12 md:py-16 px-6 md:px-12 relative mt-8 max-w-[1440px] rounded-[24px] mx-auto overflow-hidden shadow-2xl bg-zinc-800 bg-[url('/images/archive-banner.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/60 z-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-0" />
        
        <div className="max-w-[1440px] mx-auto flex flex-col relative z-10">
          <div className="inline-flex justify-start items-center gap-2 mb-4">
            <Link href="/" className="text-white/70 hover:text-white transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <div className="text-white/70 text-sm font-normal">/</div>
            <div className="text-white text-sm font-semibold font-['Segoe_UI']">Knowledge Base</div>
          </div>
          
          <h1 className="text-white text-5xl md:text-6xl font-bold font-['Segoe_UI'] tracking-tight mb-8 mt-2">
            Knowledge Base
          </h1>
          
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 w-full">
            <KnowledgeSearchBar apiBaseUrl={process.env.BBNL_API_BASE_URL || ""} />
            <div className="w-full lg:w-[45%]">
              <p className="!text-white text-base md:text-lg font-normal font-['Segoe_UI'] leading-relaxed">
                Comprehensive setup guides, troubleshooting help, and smart workflows. Specifically for Epson ColorWorks printers and their compatible label materials, ensuring smooth operation and optimal printing results.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What are you looking for? */}
      <div className="w-full max-w-[1440px] mx-auto mt-16 px-4 flex flex-col gap-8">
        <h2 className="text-neutral-800 text-3xl font-bold font-['Segoe_UI']">What are you looking for? Click on the topic you need below.</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {faqPages.map((page) => {
            const pageData = page.locales[locale] ?? page.locales[page.main_locale];
            const title = pageData?.title || "Untitled";
            const slug = page.slugs[locale] ?? page.slugs[page.main_locale];
            const IconComponent = sectionIcon(page.icon) || HelpCircle;
            
            return (
              <Link key={page.id} href={`/faq?topic=${slug}`} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-100 flex flex-col items-center gap-4 transition-all group">
                <IconComponent className="w-14 h-14 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                <h3 className="text-center text-neutral-800 text-xl font-semibold font-['Segoe_UI']">{title}</h3>
              </Link>
            );
          })}
          
          <Link href="/contact-us" className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-100 flex flex-col items-center gap-4 transition-all group">
            <HelpCircle className="w-14 h-14 text-zinc-500 group-hover:text-amber-500 transition-colors" />
            <h3 className="text-center text-neutral-800 text-xl font-semibold font-['Segoe_UI']">Want to know more or need help?</h3>
          </Link>
        </div>
      </div>

      {/* Article Categories */}
      <div className="w-full max-w-[1440px] mx-auto mt-24 px-4 flex flex-col gap-8">
        <h2 className="text-neutral-800 text-3xl font-bold font-['Segoe_UI']">Article Categories</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {postCategories.map((category) => {
            const Icon = ({
              'printer-setup-installation': Settings,
              'materials-substrates': Layers,
              'print-configuration': Sliders,
              'troubleshooting-guide': AlertTriangle,
              'software-drivers': Download,
              'printer-maintenance': Wrench,
            } as Record<string, any>)[category.slug] || BookOpen;

            return (
              <Link key={category.id} href="#" className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-100 flex items-center gap-6 transition-all group">
                <div className="w-20 h-20 bg-orange-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                  <Icon className="w-10 h-10 text-amber-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-neutral-800 text-xl font-semibold font-['Segoe_UI'] group-hover:text-amber-600 transition-colors line-clamp-2">{category.name}</h3>
                  <p className="text-neutral-500">{category.post_count} {category.post_count === 1 ? 'Article' : 'Articles'}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Popular Articles */}
      <div className="w-full max-w-[1440px] mx-auto mt-24 px-4 flex flex-col gap-8">
        <h2 className="text-neutral-800 text-3xl font-bold font-['Segoe_UI']">Popular Articles</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {popularArticles.map((article) => {
            const categoryName = article.categories?.[0]?.name || "Article";
            return (
              <Link key={article.id} href={`/knowledge/${article.slug}`} className="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-100 p-5 flex flex-col sm:flex-row gap-6 transition-all group">
                <div className="w-full sm:w-48 aspect-square rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                  <img src={article.image || "https://placehold.co/400x400"} alt="Article Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex flex-col gap-4 justify-between py-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-blue-500 font-semibold text-sm uppercase tracking-wider">{categoryName}</span>
                    <h3 className="text-neutral-800 text-xl font-bold group-hover:text-amber-600 transition-colors line-clamp-2">{article.title}</h3>
                    <p className="text-neutral-500 line-clamp-2">{article.excerpt}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src="https://placehold.co/100x100" alt="Author" className="w-9 h-9 rounded-full bg-slate-200" />
                    <span className="font-semibold text-neutral-700">{article.author?.name || "Admin"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Troubleshooting Tree */}
      <div className="w-full bg-zinc-100 py-24 mt-24">
        <div className="max-w-[1440px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 text-amber-500 font-semibold uppercase tracking-wider text-sm">
              <LinkIcon className="w-5 h-5" />
              Troubleshooting Tree
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="text-4xl font-bold text-neutral-900">Printer not working?</h2>
              <p className="text-lg text-neutral-600 leading-relaxed max-w-md">
                Answer each question to follow your specific path through the diagnosis. The tree branches based on your situation — not a generic checklist.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="flex flex-col">
                <span className="font-bold text-neutral-800">12 branches</span>
                <span className="text-neutral-500 text-sm">in this tree</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-neutral-800">5 resolution paths</span>
                <span className="text-neutral-500 text-sm">with specific steps</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-neutral-800">0 dead ends</span>
                <span className="text-neutral-500 text-sm">always reaches a fix or escalation</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 flex flex-col gap-8">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full border-2 border-neutral-800 flex items-center justify-center font-bold text-neutral-800 flex-shrink-0">1</div>
                <h3 className="text-2xl font-bold text-neutral-800 leading-tight">
                  Is the printer showing up on your computer — in Device Manager or the Windows printer list?
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <button className="py-4 px-6 bg-amber-500 hover:bg-amber-600 transition-colors rounded-full text-white font-bold shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2">
                  Yes, it's recognized
                </button>
                <button className="py-4 px-6 border-2 border-amber-500 hover:bg-amber-50 transition-colors rounded-full text-amber-500 font-bold flex items-center justify-center gap-2">
                  No, computer doesn't see it
                </button>
              </div>
            </div>
            <p className="text-center text-neutral-600">
              Still stuck? <Link href="/contact-us" className="text-amber-500 font-bold hover:underline">Contact support</Link> — we can connect via TeamViewer and walk through it together.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full relative py-32 bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-stone-800/80 to-amber-900/60 z-10 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-black/40 z-20"></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-30 flex flex-col items-center gap-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Ready to find the perfect labels?</h2>
          <p className="text-xl text-slate-200 font-light">
            Join over 12,000 businesses who trust us for expert advice and high-quality products
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="/product-finder" className="px-8 py-4 bg-amber-500 hover:bg-amber-600 transition-colors rounded-full text-white font-bold text-lg shadow-lg shadow-amber-500/20">
              Product Finder
            </Link>
            <Link href="/custom-made" className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-colors rounded-full text-white font-bold text-lg">
              Custom-made Labels
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
