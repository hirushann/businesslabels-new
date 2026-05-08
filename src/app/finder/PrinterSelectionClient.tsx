"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

type Printer = {
  id: number;
  title: string;
  subtitle: string | null;
  slug: string;
  image: string | null;
};

type PrintersResponse = {
  data: Printer[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
};

function toDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === "") return null;
  const trimmed = url.trim();
  
  if (trimmed.startsWith("/") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  return `/api/media-proxy?url=${encodeURIComponent(trimmed)}`;
}

function PrinterCard({ printer }: { printer: Printer }) {
  const printerImage = toDisplayImageUrl(printer.image) || "https://placehold.co/600x400";

  return (
    <article className="mx-auto h-full w-full max-w-88 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] border border-slate-100 flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-56 bg-slate-100 overflow-hidden">
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <div className="px-2.5 py-1 bg-white rounded-full flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_757_440)">
                <path d="M3 9H2C1.73478 9 1.48043 8.89464 1.29289 8.70711C1.10536 8.51957 1 8.26522 1 8V5.5C1 5.23478 1.10536 4.98043 1.29289 4.79289C1.48043 4.60536 1.73478 4.5 2 4.5H10C10.2652 4.5 10.5196 4.60536 10.7071 4.79289C10.8946 4.98043 11 5.23478 11 5.5V8C11 8.26522 10.8946 8.51957 10.7071 8.70711C10.5196 8.89464 10.2652 9 10 9H9" stroke="#444444" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 4.5V1.5C3 1.36739 3.05268 1.24021 3.14645 1.14645C3.24021 1.05268 3.36739 1 3.5 1H8.5C8.63261 1 8.75979 1.05268 8.85355 1.14645C8.94732 1.24021 9 1.36739 9 1.5V4.5" stroke="#444444" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.5 7H3.5C3.22386 7 3 7.22386 3 7.5V10.5C3 10.7761 3.22386 11 3.5 11H8.5C8.77614 11 9 10.7761 9 10.5V7.5C9 7.22386 8.77614 7 8.5 7Z" stroke="#444444" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <defs>
                <clipPath id="clip0_757_440">
                  <rect width="12" height="12" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <span className="text-neutral-700 text-xs font-normal font-['Segoe_UI'] leading-4">Printer</span>
          </div>
        </div>
        <Image
          src={printerImage}
          alt={printer.title}
          width={600}
          height={400}
          className="h-full w-auto object-contain mx-auto py-5"
          unoptimized
        />
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-2">
          <h3 className="text-neutral-800 text-xl font-semibold font-['Segoe_UI'] leading-6">{printer.title}</h3>
          {printer.subtitle && (
            <p className="text-neutral-600 text-sm font-normal font-['Segoe_UI'] leading-5 line-clamp-2">
              {printer.subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-auto">
          <div className="h-px bg-slate-100" />
          <Link
            href={`/finder?printer_id=${printer.id}`}
            className="px-4 py-2.5 bg-amber-500 rounded-full flex items-center justify-center gap-2 text-white text-base font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors"
          >
            View Products
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function PrinterSelectionClient() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrinters() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/printers?per_page=1000');
        
        if (!response.ok) {
          throw new Error("Failed to fetch printers");
        }

        const json: PrintersResponse = await response.json();
        setPrinters(json.data);
      } catch (err) {
        console.error("Error loading printers:", err);
        setError(err instanceof Error ? err.message : "Failed to load printers");
      } finally {
        setIsLoading(false);
      }
    }

    loadPrinters();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-neutral-900">
        <Image
          src="/images/archive-banner.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="relative z-10 mx-auto max-w-360 px-10 py-16">
          <div className="flex max-w-3xl flex-col gap-4">
            <nav className="flex items-center gap-2 text-sm leading-5 text-white/70" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-white">
                Home
              </Link>
              <span>/</span>
              <span className="font-semibold text-white">Product Finder</span>
            </nav>
            <h1 className="text-4xl font-bold leading-12 text-white">Find Compatible Products</h1>
            <p className="text-lg leading-6 text-white/90">
              Select your printer model to discover compatible labels and ink cartridges designed for optimal performance.
            </p>
          </div>
        </div>
      </div>

      {/* Printers Grid */}
      <section className="px-10 py-12">
        <div className="mx-auto max-w-360">
          <div className="mb-8 flex flex-col gap-2">
            <h2 className="text-4xl font-bold leading-12 text-neutral-800">Select Your Printer</h2>
            <p className="text-lg text-neutral-600">
              Choose your printer model to view compatible products
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-[400px] rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-red-700">
              {error}
            </div>
          ) : printers.length === 0 ? (
            <EmptyState
              title="No printers found"
              description="We couldn't find any printers at the moment. Please try again later."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {printers.map((printer) => (
                <PrinterCard key={printer.id} printer={printer} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
