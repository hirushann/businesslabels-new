import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ReviewsSection from "@/components/ReviewsSection";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Material Overview — BusinessLabels",
  description:
    "Discover printer media materials selected for precision, durability, color accuracy, and reliable professional output.",
};

type Material = {
  id: number;
  title: string;
  subtitle: string;
  slug: string;
  code: string;
  brand: string;
  status: string;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

type MaterialsResponse = {
  data: Material[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
  };
};

function CheckIcon() {
  return (
    <svg className="mt-1 h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M10.9 5A5 5 0 1 1 8.5 1.67" stroke="#00C950" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 5.5L6 7L11 2" stroke="#00C950" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MaterialCard({ material }: { material: Material }) {
  const listingImage = `https://placehold.co/600x400?text=${encodeURIComponent(material.code)}`;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)]">
      <div className="relative h-56 bg-gray-100">
        <Image
          src={listingImage}
          alt={`${material.code} material preview`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 384px"
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-4">
          <h2 className="line-clamp-1 text-xl font-semibold leading-6 text-neutral-800">{material.title}</h2>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <CheckIcon />
              <span className="text-base leading-5 text-neutral-700">{material.brand}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckIcon />
              <span className="text-base leading-5 text-neutral-700">{material.code}</span>
            </div>
            {material.category && (
              <div className="flex items-start gap-2">
                <CheckIcon />
                <span className="text-base leading-5 text-neutral-700">{material.category.name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-4">
          <div className="h-px bg-gray-100" />
          <Link
            href={`/materials/${material.slug}`}
            className="flex h-9 items-center justify-center rounded-full bg-amber-500 px-4 text-base font-semibold leading-6 text-white transition-colors hover:bg-amber-600"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function MaterialPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  const query = await searchParams;

  if (!baseUrl) {
    throw new Error("BBNL_API_BASE_URL is not configured");
  }

  const locale = await getServerLocale();
  const requestedPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const normalizedPage = Number.parseInt(requestedPage ?? "1", 10);
  const page = Number.isFinite(normalizedPage) && normalizedPage > 0 ? normalizedPage : 1;

  let materials: Material[] = [];
  let currentPage = 1;
  let lastPage = 1;

  try {
    const response = await fetch(withLocaleParam(`${baseUrl}/api/materials?page=${page}`, locale), {
      cache: "no-store",
    });

    if (response.ok) {
      const json = (await response.json()) as MaterialsResponse;
      materials = json.data;
      currentPage = json.meta?.current_page ?? page;
      lastPage = json.meta?.last_page ?? 1;
    } else {
      console.error(`Failed to fetch materials: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching materials:", error);
  }

  return (
    <>
      <div className="relative overflow-hidden bg-white">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute left-0 top-64 h-48 w-48 -translate-x-1/2 rounded-full bg-amber-500/30 blur-[132px]" />
        <div className="pointer-events-none absolute right-0 top-225 h-48 w-48 translate-x-1/2 rounded-full bg-amber-500/30 blur-[132px]" />

        <section className="px-4 py-10 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-360 flex-col gap-12">
            {/* Hero banner */}
            <div className="relative min-h-56 overflow-hidden rounded-xl bg-neutral-900">
              <Image
                src="/images/archive-banner.jpg"
                alt=""
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1200px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 flex min-h-56 flex-col gap-4 p-6">
                <nav className="flex items-center gap-2 text-sm leading-5 text-white/70" aria-label="Breadcrumb">
                  <Link href="/" className="hover:text-white">
                    Home
                  </Link>
                  <span>/</span>
                  <span className="font-semibold text-white/70">Categories</span>
                  <span>/</span>
                  <span className="font-semibold text-white">Materials</span>
                </nav>
                <div className="mt-auto flex max-w-193.5 flex-col gap-4">
                  <h1 className="text-4xl font-bold leading-12 text-white">Material Overview</h1>
                  <p className="text-lg leading-6 text-white">
                    Explore our printer media materials, engineered for precision, durability, and high-quality
                    output. From standard to specialty stocks, each is chosen to boost performance, color accuracy,
                    and reliability—ensuring professional results without compromise.
                  </p>
                </div>
              </div>
            </div>

            {/* Materials listing */}
            <div className="flex flex-col gap-6">
              {/* Section header */}
              <div className="flex flex-col gap-4 border-b border-gray-100 pb-4">
                <h2 className="text-4xl font-bold leading-12 text-neutral-800">All Materials</h2>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="inline-flex h-10 w-fit items-center gap-2 rounded-[42px] border border-slate-200 px-5 text-neutral-800"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M3 5H17" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M5.5 10H14.5" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M8 15H12" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className="text-xl font-semibold leading-6">Filters</span>
                  </button>
                  <label className="flex h-10 w-fit items-center gap-3 rounded-[42px] border border-slate-200 px-5 text-neutral-800">
                    <span className="sr-only">Sort materials</span>
                    <select
                      defaultValue="name_asc"
                      disabled
                      className="bg-transparent text-base leading-5 outline-none disabled:opacity-100"
                    >
                      <option value="name_asc">Name: A to Z</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {materials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>

              {/* Pagination */}
              {lastPage > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {currentPage > 1 && (
                    <Link
                      href={`/materials?page=${currentPage - 1}`}
                      className="rounded-[50px] border border-slate-100 px-6 py-2.5 text-base font-medium text-neutral-800"
                    >
                      Previous
                    </Link>
                  )}
                  {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <Link
                        key={p}
                        href={`/materials?page=${p}`}
                        className={`flex h-10 min-w-10 items-center justify-center rounded-[50px] border border-slate-100 px-3 text-sm font-semibold ${
                          p === currentPage ? "bg-amber-500 text-white" : "text-neutral-700"
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                  {lastPage > 5 && <span className="px-2 text-sm font-semibold text-zinc-500">...</span>}
                  {currentPage < lastPage && (
                    <Link
                      href={`/materials?page=${currentPage + 1}`}
                      className="rounded-[50px] border border-slate-100 px-6 py-2.5 text-base font-semibold text-neutral-800"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <ReviewsSection />
    </>
  );
}
