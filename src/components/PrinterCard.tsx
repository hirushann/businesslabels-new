"use client";

import Image from "next/image";
import Link from "next/link";
import type { LinkProps } from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type PrinterCardData = {
  id: string | number;
  sku: string;
  name: string;
  subtitle?: string | null;
  excerpt?: string | null;
  mainImage?: string | null;
  slug?: string | null;
  properties?: Record<string, string[]>;
};

type PrinterCardProps = {
  printer: PrinterCardData;
  href?: LinkProps["href"];
};

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function featureLines(printer: PrinterCardData): string[] {
  return [printer.subtitle, printer.excerpt]
    .map((value) => normalizeText(value))
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
}

const truncateWords = (text: string, count: number) => {
  const words = text.split(/\s+/);
  if (words.length <= count) return text;
  return words.slice(0, count).join(' ') + ' .....';
};

export default function PrinterCard({ printer, href }: PrinterCardProps) {
  const printerName = printer.name ?? "";
  const features = featureLines(printer);
  const imageSrc = normalizeText(printer.mainImage) || "https://placehold.co/600x400";

  const cardContent = (
    <div className="mx-auto h-full w-full max-w-88 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] border border-slate-100 flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
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
            {(() => {
              const label = "Printer"; // This could be dynamic or translated in the future
              const truncated = truncateWords(label, 2);
              const isTruncated = label !== truncated;
              return isTruncated ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-neutral-700 text-xs font-normal font-['Segoe_UI'] leading-4 cursor-default">{truncated}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{label}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="text-neutral-700 text-xs font-normal font-['Segoe_UI'] leading-4">{label}</span>
              );
            })()}
          </div>
        </div>
        <Image
          src={imageSrc}
          alt={printerName}
          width={600}
          height={400}
          className="h-full w-auto object-contain mx-auto py-5"
          unoptimized
        />
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {printer.sku && (
              <span className="text-blue-400 text-sm font-normal font-['Segoe_UI'] leading-5">SKU: {printer.sku}</span>
            )}
            <h3 className="text-neutral-800 text-xl font-semibold font-['Segoe_UI'] leading-6">{printer.name}</h3>
          </div>
          {features.length > 0 && (
            <div className="flex flex-col gap-4">
              {features.map((feature, index) => (
                <div key={`${feature}-${index}`} className="flex items-start gap-2">
                  <svg className="shrink-0 mt-1" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_757_364)">
                      <path d="M10.9013 4.99975C11.1296 6.1204 10.9669 7.28546 10.4402 8.30065C9.91352 9.31583 9.05473 10.1198 8.00704 10.5784C6.95935 11.037 5.7861 11.1226 4.68293 10.8209C3.57977 10.5192 2.61338 9.84845 1.94492 8.92046C1.27646 7.99247 0.946343 6.86337 1.00961 5.72144C1.07289 4.57952 1.52572 3.4938 2.29261 2.64534C3.05949 1.79688 4.09407 1.23697 5.22381 1.05898C6.35356 0.880989 7.51017 1.09568 8.50078 1.66725" stroke="#00C950" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4.5 5.5L6 7L11 2" stroke="#00C950" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs>
                      <clipPath id="clip0_757_364">
                        <rect width="12" height="12" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <span className="line-clamp-2 wrap-break-word text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-5">{feature}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto pt-4">
          <div className="text-center">
            <span className="text-amber-600 text-base font-semibold font-['Segoe_UI'] leading-6">
              View Compatible Products →
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full w-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
