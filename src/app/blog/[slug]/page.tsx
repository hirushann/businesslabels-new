import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { unescapeHtml } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/utils";
import { type LaravelProduct } from "@/lib/mappings/product";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";
import { searchMaterials } from "@/lib/search/materials";
import RecommendedProductsSlider from "@/components/blog/RecommendedProductsSlider";
import RecommendedMaterialsSlider from "@/components/materials/RecommendedMaterialsSlider";
import CTABanner from "@/components/CTABanner";
import InThisArticle from "@/components/blog/InThisArticle";
import CopyLinkButton from "@/components/blog/CopyLinkButton";

type PostTranslation = {
  language: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  excerpt: string;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
};

type PostData = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: string;
  meta?: {
    meta_title?: string;
    meta_description?: string;
  };
  image?: string;
  created_at: string;
  updated_at: string;
  author?: {
    name: string;
    email: string;
    avatar?: string;
    about?: string;
  } | null;
  categories?: { name: string; slug: string }[];
  translations?: Record<string, PostTranslation>[];
};

async function getPost(slug: string): Promise<PostData | null> {
  try {
    const apiBaseUrl = process.env.BBNL_API_BASE_URL;
    if (!apiBaseUrl) return null;

    const res = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/posts/slug/${slug}`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }

    // Fallback: fetch posts and find the one with matching slug or translation slug
    const listRes = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/posts?type=kennisbank`, {
      next: { revalidate: 60 },
    });
    if (listRes.ok) {
      const listJson = await listRes.json();
      const posts = (listJson.data as PostData[]) || [];
      const found = posts.find(post => {
        if (post.slug === slug) return true;
        if (post.translations && post.translations.length > 0) {
          return post.translations.some(entry => {
            const translation = Object.values(entry)[0];
            return translation && translation.slug === slug;
          });
        }
        return false;
      });
      if (found) return found;
    }

    return null;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

/** Pick the right translation for the active locale, falling back to root fields. */
function getLocalizedFields(post: PostData, locale: string): PostTranslation {
  if (post.translations && post.translations.length > 0) {
    for (const entry of post.translations) {
      const translation = entry[locale];
      if (translation && translation.language === locale) {
        return translation;
      }
    }
  }
  // Fallback: use root-level fields
  return {
    language: locale,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    meta_title: post.meta?.meta_title ?? null,
    meta_description: post.meta?.meta_description ?? null,
  };
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
      next: { revalidate: 0 },
    });
    if (response.ok) {
      const json = await response.json();
      if (json.data && Array.isArray(json.data)) {
        console.log("Fetched products length:", json.data.length);
        return shuffleArray(json.data as LaravelProduct[]).slice(0, 6);
      }
    }
  } catch (error) {
    console.error('Error fetching recommended products:', error);
  }
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    const t = await getTranslations();
    return { title: t("blogDetail.notFoundTitle") };
  }

  const locale = await getServerLocale();
  const localized = getLocalizedFields(post, locale);

  const getSlugForLocale = (localeStr: string) => {
    if (post.translations && post.translations.length > 0) {
      for (const entry of post.translations) {
        const translation = entry[localeStr];
        if (translation && translation.language === localeStr) {
          return translation.slug || post.slug;
        }
      }
    }
    return post.slug;
  };

  const enSlug = getSlugForLocale("en");
  const nlSlug = getSlugForLocale("nl");

  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://businesslabels.nl").replace(/\/$/, "");

  return {
    title: localized.meta_title || localized.title,
    description: localized.meta_description || localized.excerpt,
    alternates: {
      canonical: locale === "en" ? `${siteUrl}/en/blog/${enSlug}` : `${siteUrl}/blog/${nlSlug}`,
      languages: {
        en: `${siteUrl}/en/blog/${enSlug}`,
        nl: `${siteUrl}/blog/${nlSlug}`,
      },
    },
  };
}

interface HeadingItem {
  text: string;
  id: string;
}

function parseAndInjectHeadings(htmlContent: string) {
  const headings: HeadingItem[] = [];
  let index = 0;
  
  const unescaped = unescapeHtml(htmlContent);
  
  const transformedContent = unescaped.replace(/<(h[1-3])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, contentText) => {
    const text = contentText.replace(/<[^>]*>/g, "").trim();
    const id = `heading-${index++}`;
    headings.push({ text, id });
    return `<${tag} id="${id}"${attrs}>${contentText}</${tag}>`;
  });
  
  return { transformedContent, headings };
}

export default async function SingleBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations();
  const locale = await getServerLocale();
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // Resolve locale-specific translation from the API translations array
  const localized = getLocalizedFields(post, locale);
  const { transformedContent: localizedContent, headings: localizedHeadings } = parseAndInjectHeadings(localized.content);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://businesslabels.nl";
  const fullPostUrl = `${siteUrl}/${locale}/blog/${localized.slug}`;

  const recommendedProducts = await getRecommendedProducts(locale as "en" | "nl");

  const materialResponse = await searchMaterials({
    page: 1,
    perPage: 6,
    search: "",
    sort: "latest",
    printMethod: "",
    baseMaterial: [],
    finish: [],
    adhesive: [],
    locale: locale as "en" | "nl",
  });
  const recommendedMaterials = materialResponse.materials;

  const formattedDate = new Date(post.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const authorInitials = post.author?.name
    ? post.author.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "BL";

  return (
    <div className="relative bg-white overflow-hidden w-full">
      {/* Glow Effects */}
      <div className="hidden lg:block w-48 h-48 left-0 top-[454px] absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none"></div>
      <div className="hidden lg:block w-48 h-48 right-[100px] top-[858px] absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none"></div>
      
      <div className="w-full flex flex-col justify-start items-stretch">
        
        {/* Main Content Area Wrapper */}
        <div className="w-full px-4 sm:px-6 lg:px-10 py-12 relative z-10">
          
          {/* Main Content Area */}
          <div className="w-full max-w-360 mx-auto flex flex-col justify-start gap-24">
          
          <div className="w-full flex flex-col justify-start items-start gap-10">
            {/* Header Section */}
            <div className="w-full flex flex-col justify-start items-start gap-8">
              <div className="w-full flex flex-col justify-start items-start gap-4">
                <Breadcrumbs 
                  items={[
                    { label: t("common.blogs"), href: "/blog" },
                    { label: localized.title }
                  ]} 
                />
                
                <h1 className="text-neutral-800 text-4xl font-bold leading-[48px]">{localized.title}</h1>
                <p className="w-full text-neutral-700 text-lg font-normal leading-7">
                  {localized.excerpt}
                </p>
                
                <div className="flex flex-wrap justify-start items-center gap-8 mt-2">
                  {/* Author */}
                  <div className="flex flex-col justify-start items-start gap-3">
                    <div className="text-neutral-700 text-sm font-normal leading-5">{t("blogDetail.writtenBy")}</div>
                    <div className="flex items-center gap-2">
                      {post.author?.avatar ? (
                        <div className="w-7 h-7 rounded-full overflow-hidden relative">
                          <Image src={toDisplayImageUrl(post.author.avatar) as string} alt={post.author.name} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-brand">{authorInitials}</div>
                      )}
                      <div className="text-neutral-800 text-lg font-bold leading-7">
                        {post.author?.name || "Businesslabels"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block w-px h-14 bg-slate-200"></div>
                  
                  {/* Date */}
                  <div className="flex flex-col justify-start items-start gap-3">
                    <div className="text-neutral-700 text-sm font-normal leading-5">{t("blogDetail.publishedOn")}</div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 flex items-center justify-center text-slate-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <mask id="mask0_2064_9123" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                            <rect width="24" height="24" fill="#D9D9D9"/>
                          </mask>
                          <g mask="url(#mask0_2064_9123)">
                            <path d="M5.30775 21.4981C4.80258 21.4981 4.375 21.3231 4.025 20.9731C3.675 20.6231 3.5 20.1955 3.5 19.6903V6.30581C3.5 5.80065 3.675 5.37306 4.025 5.02306C4.375 4.67306 4.80258 4.49806 5.30775 4.49806H6.69225V3.15181C6.69225 2.93265 6.76567 2.74965 6.9125 2.60281C7.05933 2.45615 7.24233 2.38281 7.4615 2.38281C7.68083 2.38281 7.86383 2.45615 8.0105 2.60281C8.15733 2.74965 8.23075 2.93265 8.23075 3.15181V4.49806H15.8077V3.13281C15.8077 2.91998 15.8795 2.74173 16.023 2.59806C16.1667 2.45456 16.3449 2.38281 16.5577 2.38281C16.7706 2.38281 16.9487 2.45456 17.0922 2.59806C17.2359 2.74173 17.3077 2.91998 17.3077 3.13281V4.49806H18.6923C19.1974 4.49806 19.625 4.67306 19.975 5.02306C20.325 5.37306 20.5 5.80065 20.5 6.30581V19.6903C20.5 20.1955 20.325 20.6231 19.975 20.9731C19.625 21.3231 19.1974 21.4981 18.6923 21.4981H5.30775ZM5.30775 19.9981H18.6923C18.7692 19.9981 18.8398 19.966 18.9038 19.9018C18.9679 19.8378 19 19.7673 19 19.6903V10.3058H5V19.6903C5 19.7673 5.03208 19.8378 5.09625 19.9018C5.16025 19.966 5.23075 19.9981 5.30775 19.9981ZM5 8.80581H19V6.30581C19 6.22881 18.9679 6.15831 18.9038 6.09431C18.8398 6.03014 18.7692 5.99806 18.6923 5.99806H5.30775C5.23075 5.99806 5.16025 6.03014 5.09625 6.09431C5.03208 6.15831 5 6.22881 5 6.30581V8.80581ZM12 14.0751C11.7552 14.0751 11.5465 13.9888 11.374 13.8163C11.2017 13.644 11.1155 13.4353 11.1155 13.1903C11.1155 12.9455 11.2017 12.7368 11.374 12.5643C11.5465 12.392 11.7552 12.3058 12 12.3058C12.2448 12.3058 12.4535 12.392 12.626 12.5643C12.7983 12.7368 12.8845 12.9455 12.8845 13.1903C12.8845 13.4353 12.7983 13.644 12.626 13.8163C12.4535 13.9888 12.2448 14.0751 12 14.0751ZM7.374 13.8163C7.20167 13.644 7.1155 13.4353 7.1155 13.1903C7.1155 12.9455 7.20167 12.7368 7.374 12.5643C7.5465 12.392 7.75517 12.3058 8 12.3058C8.24483 12.3058 8.4535 12.392 8.626 12.5643C8.79833 12.7368 8.8845 12.9455 8.8845 13.1903C8.8845 13.4353 8.79833 13.644 8.626 13.8163C8.4535 13.9888 8.24483 14.0751 8 14.0751C7.75517 14.0751 7.5465 13.9888 7.374 13.8163ZM16 14.0751C15.7552 14.0751 15.5465 13.9888 15.374 13.8163C15.2017 13.644 15.1155 13.4353 15.1155 13.1903C15.1155 12.9455 15.2017 12.7368 15.374 12.5643C15.5465 12.392 15.7552 12.3058 16 12.3058C16.2448 12.3058 16.4535 12.392 16.626 12.5643C16.7983 12.7368 16.8845 12.9455 16.8845 13.1903C16.8845 13.4353 16.7983 13.644 16.626 13.8163C16.4535 13.9888 16.2448 14.0751 16 14.0751ZM12 17.9981C11.7552 17.9981 11.5465 17.9118 11.374 17.7393C11.2017 17.567 11.1155 17.3584 11.1155 17.1136C11.1155 16.8686 11.2017 16.6599 11.374 16.4876C11.5465 16.3151 11.7552 16.2288 12 16.2288C12.2448 16.2288 12.4535 16.3151 12.626 16.4876C12.7983 16.6599 12.8845 16.8686 12.8845 17.1136C12.8845 17.3584 12.7983 17.567 12.626 17.7393C12.4535 17.9118 12.2448 17.9981 12 17.9981ZM7.374 17.7393C7.20167 17.567 7.1155 17.3584 7.1155 17.1136C7.1155 16.8686 7.20167 16.6599 7.374 16.4876C7.5465 16.3151 7.75517 16.2288 8 16.2288C8.24483 16.2288 8.4535 16.3151 8.626 16.4876C8.79833 16.6599 8.8845 16.8686 8.8845 17.1136C8.8845 17.3584 8.79833 17.567 8.626 17.7393C8.4535 17.9118 8.24483 17.9981 8 17.9981C7.75517 17.9981 7.5465 17.9118 7.374 17.7393ZM16 17.9981C15.7552 17.9981 15.5465 17.9118 15.374 17.7393C15.2017 17.567 15.1155 17.3584 15.1155 17.1136C15.1155 16.8686 15.2017 16.6599 15.374 16.4876C15.5465 16.3151 15.7552 16.2288 16 16.2288C16.2448 16.2288 16.4535 16.3151 16.626 16.4876C16.7983 16.6599 16.8845 16.8686 16.8845 17.1136C16.8845 17.3584 16.7983 17.567 16.626 17.7393C16.4535 17.9118 16.2448 17.9981 16 17.9981Z" fill="#222222"/>
                          </g>
                        </svg>
                      </div>
                      <div className="text-neutral-800 text-lg font-bold leading-7">{formattedDate}</div>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block w-px h-14 bg-slate-200"></div>
                  
                  {/* Category */}
                  <div className="flex flex-col justify-start items-start gap-3">
                    <div className="text-neutral-700 text-sm font-normal leading-5">{t("common.category")}:</div>
                    <Link href={`/blog?category=${post.categories?.[0]?.slug || "all"}`} className="h-7 px-3 bg-neutral-800/10 rounded-full flex items-center hover:bg-neutral-800/20 transition-colors">
                      <div className="text-neutral-800 text-sm font-bold">
                        {post.categories?.[0]?.name || "Article"}
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Featured Image */}
              <div className="w-full h-[300px] sm:h-[450px] lg:h-[580px] relative rounded-xl overflow-hidden bg-slate-100">
                {post.image ? (
                  <Image src={toDisplayImageUrl(post.image) as string} alt={post.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex justify-center items-center text-slate-400">
                     <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
              </div>
            </div>
            
            {/* Main Content & Sidebar Container */}
            <div className="w-full flex flex-col lg:flex-row justify-start items-start gap-10">
              
              {/* Article Content */}
              <div className="flex-1 flex flex-col justify-start items-start gap-8 min-w-0 w-full">
                <div 
                  className="cms-content w-full prose prose-neutral max-w-none prose-headings:font-bold prose-headings:text-neutral-800 prose-p:text-neutral-700 prose-p:text-lg prose-p:leading-8 prose-a:text-brand hover:prose-a:text-[var(--brand-hover)] prose-a:underline prose-img:rounded-xl"
                  dangerouslySetInnerHTML={{ __html: localizedContent }}
                />
                
                {/* About Author */}
                <div className="w-full p-6 bg-white shadow-[2px_4px_20px_rgba(109,109,120,0.06)] rounded-xl border border-[#EDF2F7] flex flex-col justify-start items-start gap-4 mt-8">
                  <div className="text-neutral-800 text-[24px] font-bold leading-[28.80px]">{t("blogDetail.aboutAuthor")}</div>
                  <div className="w-full h-px bg-[#EDF2F7]"></div>
                  <div className="w-full flex flex-col sm:flex-row justify-start gap-4">
                    {post.author?.avatar ? (
                      <div className="w-[156px] h-[156px] rounded-lg overflow-hidden relative flex-shrink-0">
                        <Image src={toDisplayImageUrl(post.author.avatar) as string} alt={post.author.name} fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="w-[156px] h-[156px] rounded-lg bg-brand flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
                        {authorInitials}
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-center items-start gap-2.5">
                      <div className="text-neutral-800 text-[32px] font-bold leading-[38.40px] line-clamp-1">
                        {post.author?.name || t("blogDetail.teamName")}
                      </div>
                      <div className="text-neutral-700 text-lg font-medium leading-[27px]">
                        {post.author?.about || t("blogDetail.teamDescription")}
                      </div>
                    </div>
                  </div>
                </div>
                
                 {/* Was this helpful */}
                 <div className="w-full px-6 py-4 bg-white shadow-[2px_4px_20px_rgba(109,109,120,0.06)] overflow-hidden rounded-xl border border-[#EDF2F7] justify-start items-center gap-6 inline-flex">
                   <div className="text-neutral-800 text-lg font-bold leading-normal">{t("blogDetail.wasThisHelpful")}</div>
                   <div className="justify-start items-center gap-2 flex">
                     <button className="px-3 py-1.5 bg-brand hover:bg-brand-hover transition-colors rounded flex justify-start items-center gap-2">
                       <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                         <g clipPath="url(#clip0_2064_10311)">
                           <path d="M4.375 6.25V13.75" stroke="white" strokeWidth="1.08333" strokeLinecap="round" strokeLinejoin="round"/>
                           <path d="M9.375 3.675L8.75 6.25H12.3937C12.5878 6.25 12.7792 6.29518 12.9528 6.38197C13.1263 6.46875 13.2773 6.59476 13.3938 6.75C13.5102 6.90525 13.5889 7.08547 13.6236 7.27639C13.6583 7.46732 13.6481 7.66371 13.5938 7.85L12.1375 12.85C12.0618 13.1096 11.9039 13.3377 11.6875 13.5C11.4711 13.6623 11.208 13.75 10.9375 13.75H2.5C2.16848 13.75 1.85054 13.6183 1.61612 13.3839C1.3817 13.1495 1.25 12.8315 1.25 12.5V7.5C1.25 7.16848 1.3817 6.85054 1.61612 6.61612C1.85054 6.3817 2.16848 6.25 2.5 6.25H4.225C4.45755 6.24988 4.68546 6.18488 4.8831 6.06233C5.08073 5.93977 5.24026 5.76451 5.34375 5.55625L7.5 1.25C7.79474 1.25365 8.08484 1.32386 8.34863 1.45537C8.61242 1.58689 8.84308 1.77632 9.02338 2.0095C9.20368 2.24269 9.32895 2.5136 9.38984 2.802C9.45072 3.0904 9.44565 3.38883 9.375 3.675Z" stroke="white" strokeWidth="1.08333" strokeLinecap="round" strokeLinejoin="round"/>
                         </g>
                         <defs>
                           <clipPath id="clip0_2064_10311">
                             <rect width="15" height="15" fill="white"/>
                           </clipPath>
                         </defs>
                       </svg>
                       <span className="text-white text-base font-bold leading-6">{t("blogDetail.yes")}</span>
                     </button>
                     <button className="h-9 px-3 py-1.5 bg-white border border-[#D7DDE5] hover:bg-slate-50 transition-colors rounded flex justify-start items-center gap-2">
                       <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                         <g clipPath="url(#clip0_2064_10316)">
                           <path d="M10.625 8.75V1.25" stroke="#F18800" strokeWidth="1.08333" strokeLinecap="round" strokeLinejoin="round"/>
                           <path d="M5.6252 11.325L6.2502 8.75H2.60645C2.41239 8.75 2.221 8.70482 2.04743 8.61803C1.87386 8.53125 1.72288 8.40525 1.60645 8.25C1.49001 8.09476 1.41132 7.91453 1.37661 7.72361C1.34189 7.53268 1.35211 7.33629 1.40645 7.15L2.8627 2.15C2.93842 1.89036 3.09633 1.66228 3.3127 1.5C3.52907 1.33772 3.79223 1.25 4.0627 1.25H12.5002C12.8317 1.25 13.1497 1.3817 13.3841 1.61612C13.6185 1.85054 13.7502 2.16848 13.7502 2.5V7.5C13.7502 7.83152 13.6185 8.14946 13.3841 8.38388C13.1497 8.6183 12.8317 8.75 12.5002 8.75H10.7752C10.5426 8.75012 10.3147 8.81512 10.1171 8.93768C9.91946 9.06023 9.75993 9.23549 9.65645 9.44375L7.5002 13.75C7.20546 13.7464 6.91536 13.6761 6.65157 13.5446C6.38778 13.4131 6.15712 13.2237 5.97682 12.9905C5.79652 12.7573 5.67125 12.4864 5.61036 12.198C5.54947 11.9096 5.55454 11.6112 5.6252 11.325Z" stroke="#F18800" strokeWidth="1.08333" strokeLinecap="round" strokeLinejoin="round"/>
                         </g>
                         <defs>
                           <clipPath id="clip0_2064_10316">
                             <rect width="15" height="15" fill="white"/>
                           </clipPath>
                         </defs>
                       </svg>
                       <span className="text-brand text-base font-bold leading-6">{t("blogDetail.no")}</span>
                     </button>
                   </div>
                 </div>
              </div>
              
              {/* Sidebar */}
              <div className="w-full lg:w-80 flex flex-col justify-start items-start gap-7 shrink-0">
                {/* In this Article */}
                {localizedHeadings.length > 0 && (
                  <InThisArticle headings={localizedHeadings} title={t("blogDetail.inThisArticle")} />
                )}
                
                {/* Share this article */}
                <div className="w-full p-5 bg-white rounded-xl shadow-[2px_4px_20px_rgba(109,109,120,0.06)] border border-[#EDF2F7] flex flex-col items-start gap-5">
                  <div className="text-neutral-800 text-2xl font-semibold leading-7">{t("blogDetail.shareArticle")}</div>
                  <div className="flex items-center gap-3">
                    {/* LinkedIn */}
                    <a 
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullPostUrl)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group flex-shrink-0"
                    >
                      <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.0455 1H20.9545C9.93393 1 1 9.93391 1 20.9545V21.0455C1 32.0661 9.93393 41 20.9545 41H21.0455C32.0661 41 41 32.0661 41 21.0455V20.9545C41 9.93391 32.0661 1 21.0455 1Z" fill="white" className="group-hover:fill-brand transition-colors duration-200"/>
                        <path d="M21.0459 0.5C32.3423 0.500194 41.4998 9.6577 41.5 20.9541V21.0459C41.4998 32.3423 32.3423 41.4998 21.0459 41.5H20.9541C9.65771 41.4998 0.50019 32.3423 0.5 21.0459V20.9541C0.50019 9.6577 9.65771 0.500195 20.9541 0.5H21.0459Z" stroke="#888888" strokeOpacity={0.5} className="group-hover:stroke-brand transition-colors duration-200"/>
                        <path d="M12.63 15.5135C12.2086 15.1222 11.999 14.6379 11.999 14.0617C11.999 13.4854 12.2097 12.9798 12.63 12.5875C13.0514 12.1962 13.5939 12 14.2585 12C14.9231 12 15.4442 12.1962 15.8645 12.5875C16.2859 12.9787 16.4955 13.4709 16.4955 14.0617C16.4955 14.6525 16.2848 15.1222 15.8645 15.5135C15.4431 15.9048 14.9085 16.101 14.2585 16.101C13.6084 16.101 13.0514 15.9048 12.63 15.5135ZM16.1414 17.7579V29.7536H12.3521V17.7579H16.1414Z" fill="#444444" className="group-hover:fill-white transition-colors duration-200"/>
                        <path d="M28.7546 18.943C29.5806 19.8398 29.9931 21.0708 29.9931 22.6381V29.5418H26.3943V23.1247C26.3943 22.3343 26.1892 21.7199 25.7802 21.2827C25.3711 20.8455 24.8197 20.6257 24.1293 20.6257C23.4389 20.6257 22.8874 20.8443 22.4784 21.2827C22.0693 21.7199 21.8642 22.3343 21.8642 23.1247V29.5418H18.2441V17.7243H21.8642V19.2916C22.2307 18.7692 22.725 18.3566 23.3459 18.0528C23.9668 17.749 24.665 17.5977 25.4417 17.5977C26.8247 17.5977 27.9298 18.0461 28.7546 18.9418V18.943Z" fill="#444444" className="group-hover:fill-white transition-colors duration-200"/>
                      </svg>
                    </a>

                    {/* Instagram */}
                    <a 
                      href="https://www.instagram.com/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group flex-shrink-0"
                    >
                      <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.0459 0.5C32.3423 0.500192 41.4998 9.6577 41.5 20.9541V21.0459C41.4998 32.3423 32.3423 41.4998 21.0459 41.5H20.9541C9.6577 41.4998 0.500192 32.3423 0.5 21.0459V20.9541C0.500193 9.6577 9.6577 0.500193 20.9541 0.5H21.0459Z" fill="white" stroke="#888888" strokeOpacity={0.5} className="group-hover:fill-brand group-hover:stroke-brand transition-colors duration-200"/>
                        <path d="M25.8599 12H15.9613C13.2267 12 11.002 14.2254 11.002 16.9608V26.0193C11.002 28.7547 13.2267 30.9801 15.9613 30.9801H25.8599C28.5946 30.9801 30.8193 28.7547 30.8193 26.0193V16.9608C30.8193 14.2254 28.5946 12 25.8599 12ZM12.7515 16.9608C12.7515 15.1906 14.1916 13.75 15.9613 13.75H25.8599C27.6296 13.75 29.0698 15.1906 29.0698 16.9608V26.0193C29.0698 27.7895 27.6296 29.2301 25.8599 29.2301H15.9613C14.1916 29.2301 12.7515 27.7895 12.7515 26.0193V16.9608Z" fill="#444444" className="group-hover:fill-white transition-colors duration-200"/>
                        <path d="M20.9099 26.1038C23.453 26.1038 25.523 24.0343 25.523 21.4894C25.523 18.9445 23.4541 16.875 20.9099 16.875C18.3658 16.875 16.2969 18.9445 16.2969 21.4894C16.2969 24.0343 18.3658 26.1038 20.9099 26.1038ZM20.9099 18.6261C22.4891 18.6261 23.7735 19.9109 23.7735 21.4905C23.7735 23.0702 22.4891 24.3549 20.9099 24.3549C19.3308 24.3549 18.0464 23.0702 18.0464 21.4905C18.0464 19.9109 19.3308 18.6261 20.9099 18.6261Z" fill="#444444" className="group-hover:fill-white transition-colors duration-200"/>
                        <path d="M25.95 17.6194C26.6347 17.6194 27.1929 17.0622 27.1929 16.3761C27.1929 15.69 26.6359 15.1328 25.95 15.1328C25.264 15.1328 24.707 15.69 24.707 16.3761C24.707 17.0622 25.264 17.6194 25.95 17.6194Z" fill="#444444" className="group-hover:fill-white transition-colors duration-200"/>
                      </svg>
                    </a>

                    {/* Pinterest */}
                    <a 
                      href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(fullPostUrl)}&description=${encodeURIComponent(post.title)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group flex-shrink-0"
                    >
                      <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.0455 1H20.9545C9.93391 1 1 9.93391 1 20.9545V21.0455C1 32.0661 9.93391 41 20.9545 41H21.0455C32.0661 41 41 32.0661 41 21.0455V20.9545C41 9.93391 32.0661 1 21.0455 1Z" fill="white" className="group-hover:fill-brand transition-colors duration-200"/>
                        <path d="M21.0459 0.5C32.3423 0.50019 41.4998 9.6577 41.5 20.9541V21.0459C41.4998 32.3423 32.3423 41.4998 21.0459 41.5H20.9541C9.6577 41.4998 0.50019 32.3423 0.5 21.0459V20.9541C0.500191 9.6577 9.6577 0.500191 20.9541 0.5H21.0459Z" stroke="#888888" strokeOpacity={0.5} className="group-hover:stroke-brand transition-colors duration-200"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M19.4601 24.0336C19.441 24.0998 19.4231 24.1558 19.4085 24.2119C18.5623 27.5281 18.4682 28.2646 17.5985 29.805C17.1838 30.5371 16.7164 31.231 16.1998 31.8947C16.1415 31.9698 16.0866 32.0663 15.97 32.0427C15.8422 32.0427 15.8321 31.9003 15.8187 31.7983C15.6797 30.7904 15.6024 29.7803 15.636 28.7624C15.6797 27.4373 15.8434 26.9821 17.5514 19.7981C17.5761 19.6883 17.548 19.5975 17.5122 19.4988C17.1031 18.3956 17.0224 17.2757 17.3799 16.1411C18.1532 13.6904 20.9305 13.5032 21.4158 15.5245C21.715 16.7745 20.9238 18.4113 20.3163 20.8307C19.8131 22.8262 22.1622 24.2455 24.1695 22.7881C26.021 21.445 26.7394 18.2252 26.6027 15.9427C26.3337 11.3922 21.3452 10.409 18.1813 11.8742C14.5534 13.5525 13.7285 18.0503 15.367 20.1064C15.5744 20.3676 15.9655 20.528 15.8971 20.7925C15.7918 21.204 15.6988 21.6188 15.5845 22.028C15.4993 22.3329 15.014 22.4439 14.7058 22.3183C14.1017 22.0739 13.5985 21.6894 13.1905 21.1827C11.7996 19.4596 11.4018 16.0514 13.2409 13.1657C15.2785 9.96951 19.0689 8.67576 22.5298 9.06815C26.6632 9.53789 29.2757 12.363 29.7643 15.5682C29.9874 17.0279 29.8271 20.6277 27.7784 23.1726C25.4214 26.0964 21.6007 26.2904 19.8377 24.4955C19.7021 24.3576 19.5934 24.1973 19.4601 24.0325V24.0336Z" fill="#444444" className="group-hover:fill-white transition-colors duration-200"/>
                      </svg>
                    </a>

                    {/* Facebook */}
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullPostUrl)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group flex-shrink-0"
                    >
                      <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M40.9972 21.0007C40.9972 31.1019 33.5098 39.4529 23.7831 40.808C22.8736 40.9341 21.9431 41 20.9986 41C19.9084 41 18.8377 40.9131 17.7951 40.745C8.27298 39.2118 1 30.9548 1 21.0007C1 9.95491 9.9546 1 21 1C32.0454 1 41 9.95491 41 21.0007H40.9972Z" fill="white" className="group-hover:fill-brand transition-colors duration-200"/>
                        <path d="M21 0.5C32.3216 0.5 41.5 9.67906 41.5 21.001V21.501H41.4902C41.2477 31.6294 33.6617 39.9369 23.8525 41.3037H23.8516C22.9198 41.4329 21.9665 41.5 20.999 41.5C19.8823 41.5 18.7848 41.4107 17.7158 41.2383C7.95526 39.6668 0.500136 31.2043 0.5 21.001C0.5 21.001 0.5 21.001 0.5 21.001C0.5 9.67906 9.67844 0.5 21 0.5Z" stroke="#888888" strokeOpacity={0.5} className="group-hover:stroke-brand transition-colors duration-200"/>
                        <path d="M22.7634 14.5707V18.0562H27.0738L26.3913 22.7513H22.7634V33.5688C22.036 33.6697 21.2918 33.7223 20.5364 33.7223C19.6645 33.7223 18.8082 33.6528 17.9744 33.5183V22.7513H13.999V18.0562H17.9744V13.7916C17.9744 11.1458 20.1184 9 22.7645 9V9.00224C22.7724 9.00224 22.7791 9 22.7869 9H27.075V13.0606H24.2731C23.4403 13.0606 22.7645 13.7366 22.7645 14.5696L22.7634 14.5707Z" fill="#444444" className="group-hover:fill-white transition-colors duration-200"/>
                      </svg>
                    </a>

                    {/* X (Twitter) */}
                    <a 
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(fullPostUrl)}&text=${encodeURIComponent(post.title)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group flex-shrink-0"
                    >
                      <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M40.9972 21.0007C40.9972 31.1019 33.5098 39.4529 23.7831 40.808C22.8736 40.9341 21.9431 41 20.9986 41C19.9083 41 18.8377 40.9131 17.7951 40.745C8.27298 39.2118 1 30.9548 1 21.0007C1 9.95491 9.95459 1 21 1C32.0454 1 41 9.95491 41 21.0007H40.9972Z" fill="white" className="group-hover:fill-brand transition-colors duration-200"/>
                        <path d="M21 0.5C32.3216 0.5 41.5 9.67906 41.5 21.001V21.501H41.4902C41.2477 31.6294 33.6617 39.9369 23.8525 41.3037H23.8516C22.9198 41.4329 21.9665 41.5 20.999 41.5C19.8823 41.5 18.7848 41.4107 17.7158 41.2383C7.95526 39.6668 0.500136 31.2043 0.5 21.001C0.5 9.67906 9.67844 0.5 21 0.5Z" stroke="#888888" strokeOpacity={0.5} className="group-hover:stroke-brand transition-colors duration-200"/>
                        <path d="M11.0469 12L18.4238 21.8656L11.001 29.887H12.672L19.1713 22.8645L24.4221 29.887H30.1077L22.3162 19.4665L29.2257 12H27.5546L21.5698 18.4676L16.7337 12H11.048H11.0469ZM13.5036 13.231H16.115L27.6488 28.6561H25.0374L13.5036 13.231Z" fill="#444444" className="group-hover:fill-white transition-colors duration-200"/>
                      </svg>
                    </a>
                  </div>
                  <CopyLinkButton url={fullPostUrl} />
                </div>
                
                {/* Need help? */}
                <div className="w-full p-4 bg-white shadow-[2px_4px_20px_rgba(109,109,120,0.06)] rounded-xl border border-[#EDF2F7] flex flex-col justify-center items-center gap-6">
                  <div className="w-full flex flex-col justify-start items-start gap-2">
                    <div className="text-neutral-800 text-2xl font-semibold leading-[28.80px]">{t("blogDetail.needHelp")}</div>
                    <div className="w-full text-neutral-600 text-base font-normal leading-6">{t("blogDetail.needHelpDescription")}</div>
                  </div>
                  <div className="w-full flex flex-col gap-3">
                    <a href="tel:+31318590465" className="w-full h-[52px] px-6 py-2.5 bg-brand hover:bg-brand-hover transition-colors rounded-full flex justify-start items-center gap-2.5 text-white text-lg font-medium">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <mask id="mask0_2064_9248" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                          <rect width="20" height="20" fill="#D9D9D9"/>
                        </mask>
                        <g mask="url(#mask0_2064_9248)">
                          <path d="M16.2025 17.0768C14.6321 17.0768 13.0544 16.7117 11.4694 15.9814C9.8845 15.2511 8.42832 14.221 7.10082 12.891C5.77346 11.5609 4.74464 10.1046 4.01436 8.52224C3.28408 6.94002 2.91895 5.3637 2.91895 3.79328C2.91895 3.54092 3.00228 3.33064 3.16895 3.16245C3.33561 2.99425 3.54395 2.91016 3.79395 2.91016H6.51186C6.72228 2.91016 6.9079 2.97884 7.06874 3.1162C7.22957 3.25342 7.33186 3.423 7.37561 3.62495L7.85332 6.07682C7.88638 6.30432 7.87943 6.49981 7.83249 6.66328C7.7854 6.82675 7.70096 6.96405 7.57915 7.07516L5.65457 8.9487C5.96429 9.51592 6.31818 10.0525 6.71624 10.5585C7.11415 11.0643 7.54499 11.5475 8.00874 12.0079C8.46596 12.4652 8.95207 12.8899 9.46707 13.282C9.98207 13.6741 10.5382 14.039 11.1354 14.3766L13.0054 12.4904C13.1358 12.3547 13.2937 12.2595 13.4792 12.205C13.6644 12.1505 13.857 12.1372 14.0569 12.1649L16.3708 12.6362C16.5812 12.6918 16.753 12.7991 16.886 12.9583C17.0191 13.1174 17.0856 13.298 17.0856 13.5V16.2018C17.0856 16.4518 17.0015 16.6602 16.8333 16.8268C16.6651 16.9935 16.4549 17.0768 16.2025 17.0768ZM5.06311 7.76599L6.5504 6.34287C6.57707 6.32148 6.59443 6.2921 6.60249 6.25474C6.61054 6.21738 6.60922 6.18266 6.59853 6.15057L6.23624 4.28828C6.22554 4.24564 6.20686 4.21363 6.1802 4.19224C6.15353 4.17085 6.11881 4.16016 6.07603 4.16016H4.29395C4.26186 4.16016 4.23513 4.17085 4.21374 4.19224C4.19249 4.21363 4.18186 4.24037 4.18186 4.27245C4.2245 4.84189 4.3177 5.42037 4.46145 6.00787C4.60506 6.5955 4.80561 7.18155 5.06311 7.76599ZM12.3131 14.9679C12.8655 15.2254 13.4416 15.4222 14.0414 15.5585C14.6414 15.6946 15.2021 15.7755 15.7233 15.8012C15.7554 15.8012 15.7821 15.7905 15.8035 15.7691C15.8249 15.7477 15.8356 15.721 15.8356 15.6889V13.9358C15.8356 13.893 15.8249 13.8583 15.8035 13.8316C15.7821 13.8049 15.7501 13.7863 15.7075 13.7756L13.9575 13.4197C13.9254 13.4197 13.8974 13.4077 13.8733 13.4158C13.8493 13.4238 13.8239 13.4412 13.7971 13.4679L12.3131 14.9679Z" fill="white"/>
                        </g>
                      </svg>
                      {t("blogDetail.callUs")}
                    </a>
                    <a href="mailto:verkoop@businesslabels.nl" className="w-full h-[52px] px-6 py-2.5 border-2 border-brand text-brand hover:bg-brand-soft transition-colors rounded-full flex justify-start items-center gap-2.5 text-lg font-medium">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <mask id="mask0_2064_9253" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                          <rect width="20" height="20" fill="#D9D9D9"/>
                        </mask>
                        <g mask="url(#mask0_2064_9253)">
                          <path d="M3.58947 16.25C3.16849 16.25 2.81217 16.1042 2.52051 15.8125C2.22884 15.5208 2.08301 15.1645 2.08301 14.7435V5.25646C2.08301 4.83549 2.22884 4.47917 2.52051 4.1875C2.81217 3.89583 3.16849 3.75 3.58947 3.75H16.4099C16.8309 3.75 17.1872 3.89583 17.4788 4.1875C17.7705 4.47917 17.9163 4.83549 17.9163 5.25646V14.7435C17.9163 15.1645 17.7705 15.5208 17.4788 15.8125C17.1872 16.1042 16.8309 16.25 16.4099 16.25H3.58947ZM16.6663 6.20187L10.4051 10.21C10.3411 10.2462 10.2748 10.2748 10.2063 10.2956C10.138 10.3165 10.0691 10.3269 9.99967 10.3269C9.93023 10.3269 9.86134 10.3165 9.79301 10.2956C9.72454 10.2748 9.65829 10.2462 9.59426 10.21L3.33301 6.20187V14.7435C3.33301 14.8184 3.35704 14.8799 3.40509 14.9279C3.45315 14.976 3.51461 15 3.58947 15H16.4099C16.4847 15 16.5462 14.976 16.5943 14.9279C16.6423 14.8799 16.6663 14.8184 16.6663 14.7435V6.20187ZM9.99967 9.16667L16.5382 5H3.46113L9.99967 9.16667ZM3.33301 6.39417V5.44146V5.46625V5.43979V6.39417Z" fill="currentColor"/>
                        </g>
                      </svg>
                      {t("blogDetail.sendEmail")}
                    </a>
                  </div>
                </div>
                
                {/* Download Markdown */}
                <div className="w-full p-5 bg-gradient-to-br from-orange-50 to-white rounded-xl border-2 border-orange-100 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-neutral-800 text-2xl font-semibold leading-[28.80px]">{t("blogDetail.downloadMarkdown")}</div>
                    <div className="text-neutral-600 text-sm">{t("blogDetail.downloadMarkdownDescription")}</div>
                  </div>
                  <button className="text-brand font-bold flex items-center gap-2 hover:text-brand underline">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    {t("blogDetail.downloadMarkdownButton")}
                  </button>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

        {/* Recommended Products */}
        <div className="w-full py-24 bg-gray-50 flex flex-col justify-start items-center px-4 sm:px-6 lg:px-10">
          <div className="w-full max-w-360 mx-auto">
            {recommendedProducts.length > 0 && (
              <RecommendedProductsSlider products={recommendedProducts} locale={locale} title={t("blogDetail.recommendedProducts")} />
            )}
          </div>
        </div>

        {/* Recommended Materials */}
        <div className="w-full py-24 bg-white border-t border-slate-100 flex flex-col justify-start items-center px-4 sm:px-6 lg:px-10">
          <div className="w-full max-w-360 mx-auto">
            {recommendedMaterials.length > 0 && (
              <RecommendedMaterialsSlider materials={recommendedMaterials} locale={locale} title={t("blogDetail.recommendedMaterials")} />
            )}
          </div>
        </div>
        
        {/* Footer CTA */}
        <CTABanner />

      </div>
    </div>
  );
}
