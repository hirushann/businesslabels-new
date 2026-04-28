import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { materialReviews } from "@/lib/materialCatalog";

export const metadata: Metadata = {
  title: "Material Overview — BusinessLabels",
  description:
    "Discover printer media materials selected for precision, durability, color accuracy, and reliable professional output.",
};

type Printer = {
  id: number;
  title: string;
  subtitle: string;
  slug: string;
  code: string;
  brand: string;
  status: string;
  image?: string;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  meta?: Record<string, PrinterMetaValue>;
};

type PrinterMetaScalar = string | number | boolean;
type PrinterMetaValue = PrinterMetaScalar | PrinterMetaScalar[] | null | undefined;

type PrintersResponse = {
  data: Printer[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
  };
};

function CheckIcon() {
  return (
    <svg className="mt-1 h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M10.9 5A5 5 0 1 1 8.5 1.67"
        stroke="#00C950"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.5 5.5L6 7L11 2" stroke="#00C950" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DetailRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <CheckIcon />
      <span className="min-w-0 truncate text-base leading-5 text-neutral-700 capitalize">{children}</span>
    </div>
  );
}

function formatMetaKey(key: string) {
  return key.replaceAll("_", " ");
}

function formatMetaValue(value: PrinterMetaValue) {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length > 0 ? items.join(", ") : null;
  }

  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function truncateMetaText(text: string, maxLength = 25) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function PrinterCard({ printer }: { printer: Printer }) {
  // Use a fallback image if none provided by the API (though currently MaterialResource doesn't include images)
  const listingImage = printer.image ? printer.image : `https://placehold.co/600x400?text=${encodeURIComponent(printer.title)}`;
  const metaItems = Object.entries(printer.meta ?? {})
    .map(([key, value]) => ({
      key,
      label: formatMetaKey(key),
      value: formatMetaValue(value),
    }))
    .filter((item): item is { key: string; label: string; value: string } => item.value !== null && item.key !== 'featured')
    .map((item) => ({
      ...item,
      value: truncateMetaText(item.value),
    }));

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)]">
      <div className="relative h-56 bg-gray-100">
        <Image
          src={listingImage}
          alt={`${printer.code} printer preview`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 384px"
          className="object-contain"
          unoptimized
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-4">
          <Link href={`/printers/${printer.slug}`} >
          <h2 className="line-clamp-1 text-xl font-semibold leading-6 text-neutral-800">{printer.title}</h2>
          </Link>
          <div className="flex flex-col gap-2">
            {metaItems.slice(0, 2).map(({ key, label, value }) => (
              <DetailRow key={key}>
                <span className="font-medium text-neutral-800 capitalize">{label}:</span> {value}
              </DetailRow>
            ))}
            {printer.category && <DetailRow>{printer.category.name}</DetailRow>}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <div className="h-px bg-gray-100" />
          <Link
            href={`/printers/${printer.slug}`}
            className="flex h-9 items-center justify-center rounded-full bg-blue-400 px-4 text-base font-semibold leading-6 text-white transition-colors hover:bg-blue-500"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function PrinterPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  const query = await searchParams;

  if (!baseUrl) {
    throw new Error("BBNL_API_BASE_URL is not configured");
  }

  const requestedPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const normalizedPage = Number.parseInt(requestedPage ?? "1", 10);
  const page = Number.isFinite(normalizedPage) && normalizedPage > 0 ? normalizedPage : 1;

  let printers: Printer[] = [];
  let currentPage = 1;
  let lastPage = 1;

  try {
    const response = await fetch(`${baseUrl}/api/printers?page=${page}`, {
      cache: "no-store",
    });

    if (response.ok) {
      const json = (await response.json()) as PrintersResponse;
      printers = json.data;
      currentPage = json.meta?.current_page ?? page;
      lastPage = json.meta?.last_page ?? 1;
    } else {
      console.error(`Failed to fetch printers: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching printers:", error);
  }

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute left-0 top-64 h-48 w-48 -translate-x-1/2 rounded-full bg-amber-500/30 blur-[132px]" />
      <div className="pointer-events-none absolute right-0 top-[900px] h-48 w-48 translate-x-1/2 rounded-full bg-amber-500/30 blur-[132px]" />

      <section className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-360 flex-col gap-12">
          

          

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 border-b border-gray-100 pb-4">
              <h2 className="text-4xl font-bold leading-[48px] text-neutral-800">All Printers</h2>
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
                  <span className="sr-only">Sort printers</span>
                  <select
                    value="name_asc"
                    disabled
                    className="bg-transparent text-base leading-5 outline-none disabled:opacity-100"
                  >
                    <option value="name_asc">Name: A to Z</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {printers.map((printer) => (
                <PrinterCard key={printer.id} printer={printer} />
              ))}
            </div>

            {lastPage > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {currentPage > 1 && (
                  <Link
                    href={`/printers?page=${currentPage - 1}`}
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
                      href={`/printers?page=${p}`}
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
                    href={`/printers?page=${currentPage + 1}`}
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

      <section className="bg-gray-50 px-4 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-360 flex-col gap-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="text-4xl font-bold leading-[48px] text-neutral-800">Over 1000 Positive Reviews</h2>
            <div className="flex items-center gap-6">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-neutral-700 shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)]"
                aria-label="Previous review"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500 bg-white text-amber-500 shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)]"
                aria-label="Next review"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {materialReviews.map((review) => (
              <article
                key={review.name}
                className="flex min-h-72 flex-col justify-between gap-8 rounded-xl border border-gray-100 bg-white p-5 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Image
                      src={`https://placehold.co/96x96?text=${encodeURIComponent(review.name.charAt(0))}`}
                      alt=""
                      width={48}
                      height={48}
                      className="rounded-full"
                      unoptimized
                    />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold leading-5 text-neutral-800">{review.name}</h3>
                      <p className="text-sm leading-5 text-zinc-500">{review.time}</p>
                    </div>
                  </div>
                  <p className="text-base leading-6 text-neutral-700">{review.text}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm leading-5 text-zinc-500">Posted on</span>
                  <span className="text-sm font-semibold leading-5 text-neutral-800">Google</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
