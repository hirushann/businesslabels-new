import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { unescapeHtml } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/utils";
import ProductCard from "@/components/ProductCard";
import { mapLaravelProductToCardData, type LaravelProduct } from "@/lib/mappings/product";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";
import { searchMaterials } from "@/lib/search/materials";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
    bio?: string;
  } | null;
  categories?: { name: string; slug: string }[];
};

async function getPost(slug: string): Promise<PostData | null> {
  try {
    const apiBaseUrl = process.env.BBNL_API_BASE_URL;
    if (!apiBaseUrl) return null;

    const res = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/posts/slug/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
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
      next: { revalidate: 0 },
    });
    if (response.ok) {
      const json = await response.json();
      if (json.data && Array.isArray(json.data)) {
        console.log("Fetched products length:", json.data.length);
        return shuffleArray(json.data as LaravelProduct[]).slice(0, 4);
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

  return {
    title: post.meta?.meta_title || post.title,
    description: post.meta?.meta_description || post.excerpt,
  };
}

export default async function SingleBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations();
  const locale = await getServerLocale();
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const recommendedProducts = await getRecommendedProducts(locale as "en" | "nl");

  const materialResponse = await searchMaterials({
    page: 1,
    perPage: 3,
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

  return (
    <div className="relative bg-white overflow-hidden w-full">
      {/* Glow Effects */}
      <div className="hidden lg:block w-48 h-48 left-0 top-[454px] absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none"></div>
      <div className="hidden lg:block w-48 h-48 right-[100px] top-[858px] absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none"></div>
      
      <div className="w-full flex flex-col justify-start items-center">
        
        {/* Main Content Area */}
        <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-0 mt-12 mb-24 flex flex-col justify-start items-center gap-24">
          
          <div className="w-full flex flex-col justify-start items-start gap-10">
            {/* Header Section */}
            <div className="w-full flex flex-col justify-start items-start gap-8">
              <div className="w-full flex flex-col justify-start items-start gap-4">
                <Breadcrumbs 
                  items={[
                    { label: t("common.blogs"), href: "/blogs" },
                    { label: post.title }
                  ]} 
                />
                
                <h1 className="text-neutral-800 text-4xl font-bold leading-[48px]">{post.title}</h1>
                <p className="w-full text-neutral-700 text-lg font-semibold leading-7">
                  {post.excerpt}
                </p>
                
                <div className="flex flex-wrap justify-start items-center gap-8 mt-2">
                  {/* Author */}
                  <div className="flex flex-col justify-start items-start gap-3">
                    <div className="text-neutral-700 text-sm font-normal leading-5">Author:</div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-brand">BL</div>
                      <div className="text-neutral-800 text-lg font-semibold leading-7">
                        {post.author?.name || "Businesslabels"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block w-px h-14 bg-slate-200"></div>
                  
                  {/* Date */}
                  <div className="flex flex-col justify-start items-start gap-3">
                    <div className="text-neutral-700 text-sm font-normal leading-5">Published on:</div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-zinc-300 rounded-sm"></div>
                      <div className="text-neutral-800 text-lg font-semibold leading-7">{formattedDate}</div>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block w-px h-14 bg-slate-200"></div>
                  
                  {/* Category */}
                  <div className="flex flex-col justify-start items-start gap-3">
                    <div className="text-neutral-700 text-sm font-normal leading-5">Category:</div>
                    <div className="h-7 px-3 bg-neutral-800/10 rounded-full flex items-center">
                      <div className="text-neutral-800 text-sm font-semibold">
                        {post.categories?.[0]?.name || "Article"}
                      </div>
                    </div>
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
              <div className="flex-1 flex flex-col justify-start items-start gap-8 min-w-0">
                <div 
                  className="cms-content w-full prose prose-neutral max-w-none prose-headings:font-bold prose-headings:text-neutral-800 prose-p:text-neutral-700 prose-p:text-lg prose-p:leading-8 prose-a:text-brand hover:prose-a:text-[var(--brand-hover)] prose-a:underline prose-img:rounded-xl"
                  dangerouslySetInnerHTML={{ __html: unescapeHtml(post.content) }}
                />
                
                {/* About Author */}
                <div className="w-full p-6 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 mt-8">
                  <div className="text-neutral-800 text-2xl font-semibold leading-7">About the Author</div>
                  <div className="w-full h-px bg-slate-100"></div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="w-32 h-32 rounded-lg bg-brand flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
                      BL
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-start gap-2.5">
                      <div className="text-neutral-800 text-2xl font-bold leading-8 line-clamp-1">
                        {post.author?.name || "Businesslabels Team"}
                      </div>
                      <div className="text-neutral-700 text-base font-medium leading-6">
                        {post.author?.bio || "Support and production specialists at BusinessLabels. With a passion for printing and experience in the technical aspects of production & support, we would be happy to advise and assist you."}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Was this helpful */}
                <div className="w-full px-6 py-4 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                  <div className="text-neutral-800 text-lg font-semibold leading-5">Was this helpful?</div>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-brand hover:bg-brand-hover transition-colors rounded-sm flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2.333L7 11.666M2.333 7L11.666 7" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                      <span className="text-white text-base font-semibold leading-6">Yes</span>
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 transition-colors rounded-sm flex items-center gap-2">
                      <svg width="14" height="2" viewBox="0 0 14 2" fill="none"><path d="M2.333 1L11.666 1" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/></svg>
                      <span className="text-brand text-base font-semibold leading-6">No</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Sidebar */}
              <div className="w-full lg:w-80 flex flex-col justify-start items-start gap-7 shrink-0">
                {/* In this Article (Placeholder / static layout) */}
                <div className="w-full p-5 relative bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-start gap-4">
                  <div className="text-neutral-800 text-xl font-bold leading-7">In this Article</div>
                  <div className="w-full flex flex-col items-start gap-3 pl-3 border-l-2 border-slate-100 relative">
                    <div className="absolute left-[-2px] top-2 bottom-1/2 w-0.5 bg-brand"></div>
                    <div className="text-neutral-800 text-sm font-semibold">Design labels for your printer</div>
                    <div className="text-neutral-500 text-sm font-normal hover:text-brand cursor-pointer">The search for software</div>
                    <div className="text-neutral-500 text-sm font-normal hover:text-brand cursor-pointer">Testimonial</div>
                    <div className="text-neutral-500 text-sm font-normal hover:text-brand cursor-pointer">Comparing options</div>
                  </div>
                </div>
                
                {/* Share this article */}
                <div className="w-full p-5 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-start gap-5">
                  <div className="text-neutral-800 text-xl font-bold leading-7">Share this article</div>
                  <div className="flex items-center gap-3">
                     <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-brand-soft hover:text-brand hover:border-brand transition-all">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                     </button>
                     <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-brand-soft hover:text-brand hover:border-brand transition-all">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                     </button>
                     <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-brand-soft hover:text-brand hover:border-brand transition-all">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                     </button>
                  </div>
                  <div className="w-full h-10 bg-gray-50 rounded-full flex items-center px-4 border border-slate-100 overflow-hidden relative">
                    <span className="text-sm text-neutral-500 truncate w-full pr-8">https://businesslabel.com/blogs/{post.slug}</span>
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-brand">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </button>
                  </div>
                </div>
                
                {/* Need help? */}
                <div className="w-full p-5 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-5">
                  <div className="flex flex-col gap-2">
                    <div className="text-neutral-800 text-xl font-bold">Need help?</div>
                    <div className="text-neutral-600 text-sm font-normal">Our team can walk through this with you over the phone or via TeamViewer.</div>
                  </div>
                  <div className="w-full flex flex-col gap-3">
                    <button className="w-full py-3 bg-brand rounded-full text-white font-semibold flex items-center justify-center gap-2 hover:bg-brand-hover transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      +31 (0)318 590 465
                    </button>
                    <button className="w-full py-3 border border-brand rounded-full text-brand font-semibold flex items-center justify-center gap-2 hover:bg-brand-soft transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      Send an email
                    </button>
                  </div>
                </div>
                
                {/* Download Markdown */}
                <div className="w-full p-5 bg-gradient-to-br from-orange-50 to-white rounded-xl border-2 border-orange-100 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-neutral-800 text-lg font-bold">Download as Markdown</div>
                    <div className="text-neutral-600 text-sm">Article available as structured markdown for AI tools and documentation.</div>
                  </div>
                  <button className="text-brand font-semibold flex items-center gap-2 hover:text-brand underline">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Download as markdown
                  </button>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Recommended Products */}
        <div className="w-full py-24 bg-gray-50 flex flex-col items-center">
          <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
            <Carousel opts={{ align: "start" }} className="w-full">
              <div className="w-full flex justify-between items-center mb-12">
                <h2 className="text-neutral-800 text-3xl md:text-4xl font-bold leading-tight">Recommended Products</h2>
                <div className="hidden sm:flex items-center gap-4">
                  <CarouselPrevious className="static transform-none w-12 h-12 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors" />
                  <CarouselNext className="static transform-none w-12 h-12 rounded-full border border-brand bg-white text-brand flex items-center justify-center hover:bg-brand-soft transition-colors" />
                </div>
              </div>
              <CarouselContent className="-ml-6">
                {recommendedProducts.map((product) => {
                  const cardProduct = mapLaravelProductToCardData(product, locale as "en" | "nl");
                  const href = cardProduct.slug
                    ? (cardProduct.type === "simple" || cardProduct.type === "variable")
                      ? { pathname: `/product/${cardProduct.slug}`, query: { type: cardProduct.type } }
                      : { pathname: `/product/${cardProduct.slug}` }
                    : undefined;
                  
                  return (
                    <CarouselItem key={product.id} className="pl-6 md:basis-1/2 lg:basis-1/4 flex">
                      <ProductCard product={cardProduct} href={href} />
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
        
        {/* Recommended Materials */}
        <div className="w-full py-24 bg-white flex flex-col items-center">
          <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
            <Carousel opts={{ align: "start" }} className="w-full">
              <div className="w-full flex justify-between items-center mb-12">
                <h2 className="text-neutral-800 text-3xl md:text-4xl font-bold leading-tight">Recommended Materials</h2>
                <div className="hidden sm:flex items-center gap-4">
                  <CarouselPrevious className="static transform-none w-12 h-12 rounded-full border border-gray-300 bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors" />
                  <CarouselNext className="static transform-none w-12 h-12 rounded-full border border-brand bg-white text-brand flex items-center justify-center hover:bg-brand-soft transition-colors" />
                </div>
              </div>
              <CarouselContent className="-ml-6">
                {recommendedMaterials.map((material) => {
                  const cardImage = toDisplayImageUrl(material.main_image) || "/images/material-placeholder.svg";
                  const baseMat = material.base_material || (material.categories?.find(c => c.slug.includes('papier') || c.slug.includes('paper')) ? 'Paper' : '');
                  const finish = material.finish || (material.categories?.find(c => c.slug.includes('glanzend') || c.slug.includes('glossy')) ? 'Glossy' : (material.categories?.find(c => c.slug.includes('mat')) ? 'Matte' : ''));
                  const adhesive = material.adhesive || (material.categories?.find(c => c.slug.includes('permanent')) ? 'Permanent' : (material.categories?.find(c => c.slug.includes('verwijderbaar') || c.slug.includes('removable')) ? 'Removable' : ''));
                  
                  let weight = "-";
                  let thickness = "-";
                  if (material.specifications && Array.isArray(material.specifications.material_specs)) {
                    for (const spec of material.specifications.material_specs) {
                      const label = (spec.label || "").toLowerCase();
                      if (label.includes("weight") || label.includes("gewicht") || label.includes("grammage")) {
                        weight = spec.value;
                      } else if (label.includes("thickness") || label.includes("dikte")) {
                        thickness = spec.value;
                      }
                    }
                  }
                  const isInkjet = material.categories?.some(c => c.slug.toLowerCase().includes('inkjet'));

                  return (
                    <CarouselItem key={material.id} className="pl-6 md:basis-1/2 lg:basis-1/3 flex">
                      <div className="w-full h-full bg-white rounded-xl shadow-[0_4px_20px_rgba(109,109,120,0.05)] border border-slate-100 flex flex-col overflow-hidden group hover:shadow-[0_12px_30px_rgba(109,109,120,0.12)] transition-all duration-300 hover:-translate-y-1">
                        <Link href={`/materials/${material.slug}`} className="h-56 relative bg-slate-100 overflow-hidden block">
                          <Image src={cardImage} alt={material.title} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" unoptimized />
                          <div className="absolute left-4 top-4 bg-white rounded-full px-3 py-1 flex items-center gap-2 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-neutral-700"></div>
                            <span className="text-xs font-semibold text-neutral-700">{isInkjet ? 'Inkjet' : (material.print_method || 'Material')}</span>
                          </div>
                        </Link>
                        <div className="p-5 flex flex-col gap-4 flex-1">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-blue-400">{material.code || material.title.split(' ')[0]}</span>
                            <Link href={`/materials/${material.slug}`}>
                              <h3 className="text-xl font-bold text-neutral-800 line-clamp-1 hover:text-brand transition-colors">{material.title}</h3>
                            </Link>
                            <p className="text-neutral-600 text-sm line-clamp-2 mt-1 font-medium">{material.excerpt || material.subtitle || ""}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {baseMat && <span className="px-3 py-1 bg-orange-100 text-brand rounded-xl text-xs font-semibold">{baseMat}</span>}
                            {finish && <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-xl text-xs font-semibold">{finish}</span>}
                            {adhesive && <span className="px-3 py-1 bg-green-100 text-green-600 rounded-xl text-xs font-semibold">{adhesive}</span>}
                          </div>
                          <div className="w-full h-px bg-slate-100 my-2 mt-auto"></div>
                          <div className="flex justify-between items-center gap-4">
                            <div className="flex-1 flex flex-col gap-0.5">
                              <span className="text-neutral-500 text-xs">Weight</span>
                              <span className="font-semibold text-neutral-700 text-sm">{weight}</span>
                            </div>
                            <div className="flex-1 flex flex-col gap-0.5">
                              <span className="text-neutral-500 text-xs">Thickness</span>
                              <span className="font-semibold text-neutral-700 text-sm">{thickness}</span>
                            </div>
                          </div>
                          <Link href={`/materials/${material.slug}`} className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-center font-semibold rounded-full mt-2 transition-colors">
                            View Details
                          </Link>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
        
        {/* Footer CTA */}
        <div className="w-full h-[320px] relative overflow-hidden bg-black/80 flex items-center justify-center mt-0">
          <div className="absolute inset-0 bg-gradient-to-l from-black/50 via-black/50 to-transparent z-0"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-stone-700/70 to-yellow-950/60 z-10"></div>
          <div className="relative z-20 flex flex-col items-center gap-10 px-4 max-w-[1440px] mx-auto">
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-white text-4xl md:text-5xl font-bold text-center">Ready to find the perfect labels?</h2>
              <p className="text-slate-200 text-lg md:text-xl text-center font-normal">Join over 12,000 businesses who trust us for expert advice and high-quality products</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href={localePath("/printers", locale)} className="px-8 py-4 bg-brand hover:bg-brand-hover rounded-full text-white text-lg font-semibold transition-colors shadow-lg">
                Product Finder
              </Link>
              <Link href="/custom" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm rounded-full text-white text-lg font-semibold transition-colors">
                Custom-made Labels
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
