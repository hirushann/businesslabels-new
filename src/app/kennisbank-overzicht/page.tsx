import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import {
  Search, Compass, CircleDollarSign, Layers, Download,
  AlertTriangle, Wrench, Lightbulb, HelpCircle,
  Settings, Sliders, PlayCircle, BookOpen, Link as LinkIcon, PhoneCall, Home
} from "lucide-react";
import { sectionIcon } from "@/app/epson-colorworks-faq/section-icon";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import KnowledgeSearchBar from "@/components/KnowledgeSearchBar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('knowledgePage');
  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
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
  name: any;
  slug: any;
  post_count: number;
};

async function getPostCategories(locale: string): Promise<PostCategoryData[]> {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  if (!apiBaseUrl) return [];

  try {
    const url = `${apiBaseUrl.replace(/\/$/, "")}/api/posts/categories?locale=${locale}`;
    const res = await fetch(url, { 
      headers: { 'Accept-Language': locale, 'X-Locale': locale },
      next: { revalidate: 60 } 
    });
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
  translations?: Array<Record<string, any>>;
};      

async function getPopularArticles(locale: string): Promise<ArticleData[]> {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  if (!apiBaseUrl) return [];

  try {
    const url = `${apiBaseUrl.replace(/\/$/, "")}/api/posts?random=4&locale=${locale}&type=kennisbank`;
    const res = await fetch(url, { 
      headers: { 'Accept-Language': locale, 'X-Locale': locale },
      next: { revalidate: 60 } 
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data as ArticleData[]) ?? [];
  } catch (err) {
    console.error("Failed to fetch popular articles:", err);
    return [];
  }
}

export default async function KnowledgeBaseArchive() {
  const t = await getTranslations('knowledgePage');
  const locale = await getLocale();
  const faqPages = await getFaqPages();
  const postCategories = await getPostCategories(locale);
  const popularArticles = await getPopularArticles(locale);

  return (
    <div className="relative min-h-screen bg-gray-50 flex flex-col items-center overflow-hidden">
      {/* Glow Effects */}
      <div className="size-48 left-0 top-[454px] absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none"></div>
      <div className="size-48 left-[315px] top-[1785px] absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none"></div>

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
            <div className="text-white text-sm font-semibold">{t('heroTitle')}</div>
          </div>
          
          <h1 className="text-white text-5xl md:text-6xl font-bold tracking-tight mb-8 mt-2">
            {t('heroTitle')}
          </h1>
          
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 w-full">
            <KnowledgeSearchBar apiBaseUrl={process.env.BBNL_API_BASE_URL || ""} />
            <div className="w-full lg:w-[45%]">
              <p className="!text-white text-base md:text-lg font-normal leading-relaxed">
                {t('heroDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What are you looking for? */}
      <div className="w-full max-w-[1440px] mx-auto mt-16 px-4 flex flex-col gap-8">
        <h2 className="text-neutral-800 text-3xl font-bold">{t('whatLookingFor')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {faqPages.map((page) => {
            const pageData = page.locales[locale] ?? page.locales[page.main_locale];
            const title = pageData?.title || "Untitled";
            const slug = page.slugs[locale] ?? page.slugs[page.main_locale];
            const IconComponent = sectionIcon(page.icon) || HelpCircle;
            
            return (
              <Link key={page.id} href={`/epson-colorworks-faq?topic=${slug}`} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-100 flex flex-col items-center gap-4 transition-all group">
                <IconComponent className="w-14 h-14 text-zinc-500 group-hover:text-brand transition-colors" />
                <h3 className="text-center text-neutral-800 text-xl font-semibold">{title}</h3>
              </Link>
            );
          })}
          
          <Link href="/contact-us" className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-100 flex flex-col items-center gap-4 transition-all group">
            <HelpCircle className="w-14 h-14 text-zinc-500 group-hover:text-brand transition-colors" />
            <h3 className="text-center text-neutral-800 text-xl font-semibold">{t('wantToKnowMore')}</h3>
          </Link>
        </div>
      </div>

      {/* Article Categories */}
      <div className="w-full max-w-[1440px] mx-auto mt-24 px-4 flex flex-col gap-8">
        <h2 className="text-neutral-800 text-3xl font-bold">{t('articleCategories')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {postCategories.map((category) => {
            const categoryName = typeof category.name === 'object' && category.name !== null ? ((category.name as any)[locale] ?? (category.name as any).en ?? (category.name as any).nl) : category.name;
            const categorySlug = typeof category.slug === 'object' && category.slug !== null ? ((category.slug as any)[locale] ?? (category.slug as any).en ?? (category.slug as any).nl) : category.slug;
            
            const Icon = ({
              'printer-setup-installation': Settings,
              'materials-substrates': Layers,
              'print-configuration': Sliders,
              'troubleshooting-guide': AlertTriangle,
              'software-drivers': Download,
              'printer-maintenance': Wrench,
            } as Record<string, any>)[category.slug] || BookOpen;

            return (
              <Link key={category.id} href={`/blog?category=${categorySlug}`} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-100 flex items-center gap-6 transition-all group">
                <div className="w-20 h-20 bg-brand-soft rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                  <Icon className="w-10 h-10 text-brand" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-neutral-800 text-xl font-semibold group-hover:text-brand transition-colors line-clamp-2">{categoryName}</h3>
                  <p className="text-neutral-500">{category.post_count} {category.post_count === 1 ? t('articleSingular') : t('articlePlural')}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Popular Articles */}
      <div className="w-full max-w-[1440px] mx-auto mt-24 px-4 flex flex-col gap-8">
        <h2 className="text-neutral-800 text-3xl font-bold">{t('popularArticles')}</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {popularArticles.map((article) => {
            const rawCatName = article.categories?.[0]?.name || "Article";
            const categoryName = typeof rawCatName === 'object' && rawCatName !== null ? ((rawCatName as any)[locale] ?? (rawCatName as any).en ?? (rawCatName as any).nl) : rawCatName;
            
            // Prefer explicit translations if available from the backend
            const translation = article.translations?.find((t) => t[locale])?.[locale];
            const title = translation?.title || article.title;
            const excerpt = translation?.excerpt || article.excerpt;
            const slug = translation?.slug || article.slug;
            
            return (
              <Link key={article.id} href={`/knowledge/${slug}`} className="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-100 p-5 flex flex-col sm:flex-row gap-6 transition-all group">
                <div className="w-full sm:w-48 aspect-square rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                  <img src={article.image || "https://placehold.co/400x400"} alt="Article Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex flex-col gap-4 justify-between py-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-blue-500 font-semibold text-sm uppercase tracking-wider">{categoryName}</span>
                    <h3 className="text-neutral-800 text-xl font-bold group-hover:text-brand transition-colors line-clamp-2">{article.title}</h3>
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
            <div className="flex items-center gap-3 text-brand font-semibold uppercase tracking-wider text-sm">
              <LinkIcon className="w-5 h-5" />
              {t('troubleshootingTree')}
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="text-4xl font-bold text-neutral-900">{t('printerNotWorking')}</h2>
              <p className="text-lg text-neutral-600 leading-relaxed max-w-md">
                {t('troubleshootingDesc')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="flex flex-col">
                <span className="font-bold text-neutral-800">{t('branchesCount')}</span>
                <span className="text-neutral-500 text-sm">{t('inThisTree')}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-neutral-800">{t('resolutionPathsCount')}</span>
                <span className="text-neutral-500 text-sm">{t('withSpecificSteps')}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-neutral-800">{t('deadEndsCount')}</span>
                <span className="text-neutral-500 text-sm">{t('alwaysReachesFix')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 flex flex-col gap-8">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full border-2 border-neutral-800 flex items-center justify-center font-bold text-neutral-800 flex-shrink-0">1</div>
                <h3 className="text-2xl font-bold text-neutral-800 leading-tight">
                  {t('treeQuestion1')}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <button className="py-4 px-6 bg-brand hover:bg-brand-hover transition-colors rounded-full text-white font-bold shadow-lg shadow-brand/30 flex items-center justify-center gap-2">
                  {t('yesRecognized')}
                </button>
                <button className="py-4 px-6 border-2 border-brand hover:bg-brand-soft transition-colors rounded-full text-brand font-bold flex items-center justify-center gap-2">
                  {t('noNotSeen')}
                </button>
              </div>
            </div>
            <p className="text-center text-neutral-600">
              {t('stillStuck')} <Link href="/contact-us" className="text-brand font-bold hover:underline">{t('contactSupport')}</Link> {t('connectViaTeamViewer')}
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full relative py-32 bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-stone-800/80 to-amber-900/60 z-10 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-black/40 z-20"></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-30 flex flex-col items-center gap-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{t('readyToFind')}</h2>
          <p className="text-xl text-slate-200 font-light">
            {t('joinTrust')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="/product-finder" className="px-8 py-4 bg-brand hover:bg-brand-hover transition-colors rounded-full text-white font-bold text-lg shadow-lg shadow-brand/20">
              {t('productFinder')}
            </Link>
            <Link href="/custom-made" className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-colors rounded-full text-white font-bold text-lg">
              {t('customMadeLabels')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
