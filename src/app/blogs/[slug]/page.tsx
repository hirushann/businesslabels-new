import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unescapeHtml } from "@/lib/utils";

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return { title: "Post Not Found" };

  return {
    title: post.meta?.meta_title || post.title,
    description: post.meta?.meta_description || post.excerpt,
  };
}

export default async function SingleBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      <div className="relative overflow-hidden bg-white">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute left-0 top-[454px] h-48 w-48 rounded-full bg-amber-500/30 blur-[132px]" />
        <div className="pointer-events-none absolute left-[1312px] top-[858px] h-48 w-48 rounded-full bg-amber-500/30 blur-[132px]" />

        <div className="mx-auto flex max-w-[1440px] flex-col gap-24 pt-10 pb-24 px-4 sm:px-6 lg:px-0">
          {/* Main Content Area */}
          <div className="flex flex-col items-start gap-10">
            {/* Header Section */}
            <div className="flex w-full flex-col items-start gap-6">
              <div className="flex flex-col items-start gap-4">
                <div className="inline-flex items-center gap-2 h-4 text-zinc-500">
                  <Link href="/" className="hover:text-amber-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </Link>
                  <span className="text-sm">/</span>
                  <Link href="/blogs" className="text-sm hover:text-amber-500 transition-colors">Blogs</Link>
                  <span className="text-sm">/</span>
                  <span className="text-sm font-semibold text-neutral-700">Details</span>
                </div>
                <h1 className="text-4xl font-bold leading-[48px] text-neutral-800">
                  {post.title}
                </h1>
              </div>

              <div className="relative h-[580px] w-full overflow-hidden rounded-xl bg-slate-100">
                {post.image ? (
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-slate-200 text-slate-400">
                    <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {post.excerpt && (
                  <div className="absolute left-[24px] bottom-[24px] right-[24px] inline-flex flex-col items-start gap-4 rounded-lg bg-white/90 p-6 backdrop-blur-[2px] shadow-sm">
                    <p className="text-lg font-semibold leading-7 text-neutral-700">
                      {post.excerpt}
                    </p>
                    <div className="inline-flex items-start gap-6">
                      <div className="inline-flex flex-col items-start gap-1.5">
                        <span className="text-sm font-normal leading-5 text-neutral-700">Author:</span>
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-600">BL</div>
                          <span className="text-base font-semibold leading-6 text-neutral-800">BusinessLabels</span>
                        </div>
                      </div>
                      <div className="h-12 w-px bg-gray-200"></div>
                      <div className="inline-flex flex-col items-start gap-1.5">
                        <span className="text-sm font-normal leading-5 text-neutral-700">Published on:</span>
                        <div className="inline-flex items-center gap-1.5">
                          <span className="text-base font-semibold leading-6 text-neutral-800">{formattedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="inline-flex w-full items-start gap-10">
              {/* Article Content */}
              <article className="flex flex-1 flex-col items-start gap-8">
                <div 
                  className="cms-content w-full prose prose-neutral max-w-none prose-headings:text-neutral-800 prose-p:text-neutral-700 prose-a:text-amber-600 hover:prose-a:text-amber-700"
                  dangerouslySetInnerHTML={{ __html: unescapeHtml(post.content) }}
                />

                {/* Author Bio Box - Default for now as API doesn't provide author yet */}
                <div className="flex w-full flex-col items-start gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm mt-8">
                  <h3 className="text-2xl font-semibold leading-7 text-neutral-800">About BusinessLabels</h3>
                  <div className="w-full border-t border-gray-100"></div>
                  <div className="inline-flex w-full items-center gap-4">
                    <div className="w-20 h-20 rounded-lg bg-amber-500 flex items-center justify-center text-white text-2xl font-bold">BL</div>
                    <div className="flex flex-1 flex-col items-start gap-2.5">
                      <h4 className="text-2xl font-bold text-neutral-800">The BusinessLabels Team</h4>
                      <p className="text-base font-medium text-neutral-700">
                        Your trusted partner for high-quality labels and printing solutions. We share insights on label design, material selection, and industry standards to help your business grow.
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              {/* Sidebar Area */}
              <aside className="inline-flex w-80 flex-col items-start gap-7 shrink-0">
                {/* Share Box */}
                <div className="relative flex w-full flex-col items-start gap-8 overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="absolute left-0 top-0 h-14 w-80 bg-slate-50"></div>
                  <h3 className="relative z-10 text-xl font-semibold leading-6 text-neutral-800">Share this post</h3>
                  <div className="relative z-10 flex w-full flex-col items-start gap-5">
                    <div className="inline-flex items-center gap-3 w-full">
                      <button className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      </button>
                      <button className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      </button>
                      <button className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Categories Box */}
                <div className="relative flex w-full flex-col items-start gap-8 overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="absolute left-0 top-0 h-14 w-80 bg-slate-50"></div>
                  <h3 className="relative z-10 text-xl font-semibold leading-6 text-neutral-800">Categories</h3>
                  <div className="relative z-10 flex w-full flex-col items-start gap-4">
                    <Link href="/blogs" className="text-base font-semibold leading-6 text-neutral-700 hover:text-amber-500 transition-colors">All Posts</Link>
                    <div className="w-full border-t border-gray-100"></div>
                    <Link href="#" className="text-base font-semibold leading-6 text-neutral-700 hover:text-amber-500 transition-colors">Label Design</Link>
                    <div className="w-full border-t border-gray-100"></div>
                    <Link href="#" className="text-base font-semibold leading-6 text-neutral-700 hover:text-amber-500 transition-colors">Materials</Link>
                    <div className="w-full border-t border-gray-100"></div>
                    <Link href="#" className="text-base font-semibold leading-6 text-neutral-700 hover:text-amber-500 transition-colors">Technology</Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Products */}
      <div className="flex w-full flex-col items-start gap-12 bg-gray-50 px-4 py-24 sm:px-6 lg:px-40">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
          <h2 className="text-4xl font-bold leading-[48px] text-neutral-800">Recommended Products</h2>
          <div className="flex items-center gap-6">
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-neutral-800 shadow-sm transition-colors hover:bg-gray-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-amber-500 text-amber-500 shadow-sm transition-colors hover:bg-amber-50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="mx-auto inline-flex w-full max-w-[1200px] items-start gap-6 overflow-x-auto pb-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex w-[384px] shrink-0 flex-col items-start overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="relative h-60 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                <Image src="https://placehold.co/222x180" alt="Product" width={222} height={180} unoptimized />
                <div className="absolute left-4 top-4 flex w-[calc(100%-32px)] items-center justify-between">
                  <div className="flex items-center gap-1.5 rounded-3xl bg-white px-2.5 py-1">
                    <div className="h-3 w-3 rounded-full bg-neutral-700/20 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-neutral-700"></div>
                    </div>
                    <span className="text-xs font-normal leading-4 text-neutral-700">Inkjet</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-green-600 px-2.5 py-[5px]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-xs font-normal leading-4 text-white">In Stock</span>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-4 p-4 shadow-sm">
                <div className="flex w-full flex-col items-start gap-4">
                  <div className="flex w-full flex-col items-start gap-2">
                    <span className="text-sm font-normal leading-5 text-blue-400">SKU: EP-C3500</span>
                    <h3 className="line-clamp-1 text-xl font-semibold leading-6 text-neutral-800">
                      CW-C4000 ink cartridge Black (BK)
                    </h3>
                  </div>
                  <div className="flex w-full flex-col items-start gap-4">
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-base font-normal leading-5 text-neutral-700">Ink content: 50 ml</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-base font-normal leading-5 text-neutral-700">Color system: CMYK</span>
                    </div>
                  </div>
                </div>
                <div className="flex w-full flex-col items-start gap-4">
                  <div className="w-full border-t border-gray-100"></div>
                  <div className="flex w-full items-center justify-between">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-2xl font-bold leading-7 text-neutral-800">€9,34</span>
                      <span className="text-xs font-normal leading-4 text-zinc-500">ex. VAT</span>
                    </div>
                    <button className="flex h-9 items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 transition-colors hover:bg-amber-600">
                      <span className="text-base font-semibold leading-6 text-white">Add</span>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 4.16667V15.8333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4.16669 10H15.8334" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Materials */}
      <div className="flex w-full flex-col items-start gap-12 bg-white px-4 py-24 sm:px-6 lg:px-40">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
          <h2 className="text-4xl font-bold leading-[48px] text-neutral-800">Recommended Materials</h2>
          <div className="flex items-center gap-6">
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-neutral-800 shadow-sm transition-colors hover:bg-gray-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-amber-500 text-amber-500 shadow-sm transition-colors hover:bg-amber-50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="mx-auto inline-flex w-full max-w-[1200px] items-start gap-6 overflow-x-auto pb-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex w-[384px] shrink-0 flex-col items-start overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                <Image src="https://placehold.co/384x220" alt="Material" width={384} height={220} className="w-full object-cover" unoptimized />
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-3xl bg-white px-2.5 py-1">
                  <div className="h-3 w-3 rounded-full bg-neutral-700/20 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-700"></div>
                  </div>
                  <span className="text-xs font-normal leading-4 text-neutral-700">Inkjet</span>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-4 p-4">
                <div className="flex w-full flex-col items-start gap-4">
                  <div className="flex w-full flex-col items-start gap-2">
                    <span className="text-sm font-normal leading-5 text-blue-400">DIA055</span>
                    <h3 className="line-clamp-1 text-xl font-semibold leading-6 text-neutral-800">
                      Matte Paper permanent adhesive.
                    </h3>
                    <p className="line-clamp-2 text-base font-normal leading-5 text-neutral-700">
                      The Diamondlabels DIA055 is an extremely versatile matte inkjet material with favorable pricing
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 items-center justify-center rounded-xl bg-orange-100 px-3">
                    <span className="text-sm font-normal leading-4 text-amber-500">Paper</span>
                  </div>
                  <div className="flex h-6 items-center justify-center rounded-xl bg-purple-100 px-3">
                    <span className="text-sm font-normal leading-4 text-purple-600">Glossy</span>
                  </div>
                  <div className="flex h-6 items-center justify-center rounded-xl bg-green-100 px-3">
                    <span className="text-sm font-normal leading-4 text-green-600">Permanent</span>
                  </div>
                </div>
                <div className="flex w-full flex-col items-start gap-4">
                  <div className="w-full border-t border-gray-100"></div>
                  <div className="flex w-full items-start gap-2">
                    <div className="flex-1">
                      <span className="text-base font-normal leading-5 text-neutral-700">Weight: </span>
                      <span className="text-base font-semibold leading-5 text-neutral-700">165 g/m²</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-base font-normal leading-5 text-neutral-700">Thickness: </span>
                      <span className="text-base font-semibold leading-5 text-neutral-700">169 μm</span>
                    </div>
                  </div>
                  <button className="flex h-9 w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 transition-colors hover:bg-amber-600">
                    <span className="text-base font-semibold leading-6 text-white">View Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative h-80 w-full overflow-hidden bg-black/20">
        <div className="absolute left-0 top-0 h-80 w-full bg-gradient-to-l from-black/50 via-black/50 to-transparent"></div>
        <div className="absolute left-0 top-0 h-80 w-full bg-gradient-to-br from-stone-700/70 to-yellow-950/60"></div>
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-center text-4xl font-bold leading-[48px] text-white">
              Ready to find the perfect labels?
            </h2>
            <p className="text-center text-lg font-normal leading-7 text-gray-100">
              Join over 12,000 businesses who trust us for expert advice and high-quality products
            </p>
          </div>
          <div className="inline-flex items-center gap-4">
            <Link href="/finder" className="flex h-12 items-center justify-center gap-2.5 rounded-[50px] bg-amber-500 px-7 py-4 transition-colors hover:bg-amber-600">
              <span className="text-center text-lg font-semibold leading-6 text-white">Product Finder</span>
            </Link>
            <Link href="/custom" className="flex h-12 items-center justify-center gap-2.5 rounded-[50px] bg-white/10 px-7 py-4 border border-white/20 backdrop-blur-[5px] transition-colors hover:bg-white/20">
              <span className="text-center text-lg font-semibold leading-6 text-white">Custom-made Labels</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
