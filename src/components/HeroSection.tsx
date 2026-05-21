"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Droplet, Loader2, Search, ScrollText, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useHelp } from "./HelpProvider";
import { useTranslations } from 'next-intl';

type PrinterSearchResult = {
  id: number;
  brand: string | null;
  name: string;
  model: string | null;
  slug: string | null;
  image: string | null;
};

type CategoryCard = {
  label: string;
  description: string;
  slug: string;
  icon: typeof Droplet;
};

const CATEGORY_CARDS = {
  ink: {
    label: "Ink",
    description: "Ink cartridges",
    slug: "inkt-cartridges-nl",
    icon: Droplet,
  },
  ribbons: {
    label: "Ribbons",
    description: "Thermal transfer ribbons",
    slug: "tt-printlinten-nl",
    icon: ScrollText,
  },
  labels: {
    label: "Labels",
    description: "Labels and tickets",
    slug: "labels-en-tickets",
    icon: Tags,
  },
} satisfies Record<string, CategoryCard>;

function printerLabel(printer: PrinterSearchResult) {
  return [printer.brand, printer.name].filter(Boolean).join(" ");
}

function isEpsonPrinter(printer: PrinterSearchResult | null) {
  return printer?.brand?.toLowerCase().includes("epson") ?? false;
}

export default function HeroSection() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openHelp } = useHelp();
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [printerQuery, setPrinterQuery] = useState("");
  const [debouncedPrinterQuery, setDebouncedPrinterQuery] = useState("");
  const [printerResults, setPrinterResults] = useState<PrinterSearchResult[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterSearchResult | null>(null);
  const [isSearchingPrinters, setIsSearchingPrinters] = useState(false);
  const [printerSearchError, setPrinterSearchError] = useState<string | null>(null);

  const printerId = searchParams.get("printer_id");
  const canShowPrinterResults = printerQuery.trim().length >= 3;

  const categoryCards = useMemo(
    () => (isEpsonPrinter(selectedPrinter)
      ? [CATEGORY_CARDS.ink, CATEGORY_CARDS.ribbons, CATEGORY_CARDS.labels]
      : [CATEGORY_CARDS.ribbons, CATEGORY_CARDS.labels]),
    [selectedPrinter],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedPrinterQuery(printerQuery.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [printerQuery]);

  useEffect(() => {
    if (debouncedPrinterQuery.length < 3) {
      return;
    }

    const controller = new AbortController();

    async function searchPrinters() {
      setIsSearchingPrinters(true);
      setPrinterSearchError(null);

      try {
        const response = await fetch(`/api/printers/search?query=${encodeURIComponent(debouncedPrinterQuery)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Printer search failed");
        }

        const payload = (await response.json()) as { data?: PrinterSearchResult[]; message?: string };
        setPrinterResults(payload.data ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setPrinterResults([]);
        setPrinterSearchError("We could not search printers right now. Please try again.");
      } finally {
        setIsSearchingPrinters(false);
      }
    }

    searchPrinters();

    return () => controller.abort();
  }, [debouncedPrinterQuery]);

  useEffect(() => {
    if (!printerId) {
      return;
    }

    const currentPrinterId = printerId;
    const controller = new AbortController();

    async function loadSelectedPrinter() {
      try {
        const response = await fetch(`/api/printers/search?printer_id=${encodeURIComponent(currentPrinterId)}`, {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const payload = (await response.json()) as { data?: PrinterSearchResult[] };
        setSelectedPrinter(payload.data?.[0] ?? null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    loadSelectedPrinter();

    return () => controller.abort();
  }, [printerId]);

  const handlePrinterSelect = (printer: PrinterSearchResult) => {
    setSelectedPrinter(printer);
    setPrinterQuery(printerLabel(printer));
    setIsComboboxOpen(false);
  };

  const handlePrinterQueryChange = (value: string) => {
    setPrinterQuery(value);
    setIsComboboxOpen(value.trim().length >= 3);

    if (selectedPrinter && value !== printerLabel(selectedPrinter)) {
      setSelectedPrinter(null);
    }

    if (value.trim().length < 3) {
      setPrinterResults([]);
      setPrinterSearchError(null);
      setIsSearchingPrinters(false);
    }
  };

  const handleShowCompatibleProducts = () => {
    if (!selectedPrinter) return;

    const params = new URLSearchParams({ printer_id: String(selectedPrinter.id) });

    router.push(`/finder?${params.toString()}`);
  };

  return (
    <section className="relative w-full min-h-[85vh] lg:h-[85vh] py-12 lg:py-0 flex items-center overflow-hidden">
      {/* Background image */}
      <Image
        src="/Herobg.png"
        alt="Hero background"
        fill
        className="object-cover object-center"
        priority
      />
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-black/40 to-black/0" />
      <div className="absolute inset-0 bg-gradient-to-br from-stone-700/70 to-yellow-950/60" />

      {/* Content */}
      <div className="relative z-10 max-w-360 mx-auto w-full px-4 md:px-8 lg:px-10 h-full flex items-center">
        <div className="w-full flex flex-col lg:flex-row justify-between lg:justify-start items-center gap-10 lg:gap-12">
          {/* Left: text & CTAs */}
          <div className="flex-1 flex flex-col gap-8 lg:gap-12">
            <div className="flex flex-col gap-6">
              {/* Badge */}
              <div className="flex items-center gap-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.4787 12.8896L16.9937 21.4156C17.0107 21.516 16.9966 21.6192 16.9533 21.7114C16.9101 21.8036 16.8397 21.8803 16.7516 21.9314C16.6636 21.9825 16.562 22.0055 16.4605 21.9974C16.359 21.9892 16.2624 21.9502 16.1837 21.8856L12.6037 19.1986C12.4309 19.0695 12.2209 18.9998 12.0052 18.9998C11.7895 18.9998 11.5795 19.0695 11.4067 19.1986L7.8207 21.8846C7.74202 21.9491 7.64557 21.988 7.5442 21.9962C7.44283 22.0044 7.34138 21.9815 7.25337 21.9305C7.16536 21.8796 7.09498 21.803 7.05162 21.711C7.00827 21.619 6.99399 21.516 7.0107 21.4156L8.5247 12.8896"
                    stroke="#F18800"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 14C15.3137 14 18 11.3137 18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 11.3137 8.68629 14 12 14Z"
                    stroke="#F18800"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-amber-500 text-lg font-semibold font-['Segoe_UI'] uppercase leading-5">
                  {t('hero.badge')}
                </span>
              </div>
              {/* Headline */}
              <div className="flex flex-col gap-4">
                <h1 className="text-white text-4xl md:text-5xl lg:text-7xl font-bold font-['Segoe_UI'] leading-tight lg:leading-[86.4px]">
                  {t('hero.title')}
                </h1>
                <p className="text-white text-lg md:text-xl font-normal font-['Segoe_UI'] leading-relaxed md:leading-8">
                  {t('hero.subtitle')}
                </p>
              </div>
            </div>
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                href="/products"
                className="w-full sm:w-auto justify-center px-7 py-4 bg-amber-500 rounded-full flex items-center gap-2.5 text-white text-lg font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors"
              >
                {t('common.browseProducts')}
              </Link>
              <button
                type="button"
                onClick={openHelp}
                className="w-full sm:w-auto justify-center px-7 py-4 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm flex items-center gap-2.5 text-white text-lg font-semibold font-['Segoe_UI'] leading-6 hover:bg-white/20 transition-colors"
              >
                {t('hero.talkToExpert')}
              </button>
            </div>
          </div>

          {/* Right: Smart Product Finder widget */}
          <div className="w-full lg:w-[540px] max-w-[540px] pb-5 bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col gap-6 overflow-hidden">
            {/* Widget header */}
            <div className="px-6 py-5 bg-white shadow border border-gray-200 flex items-center gap-4">
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.594 18.0833C11.4898 17.6796 11.2794 17.3111 10.9845 17.0163C10.6897 16.7214 10.3212 16.511 9.91749 16.4068L2.75999 14.5612C2.63788 14.5265 2.5304 14.453 2.45387 14.3517C2.37734 14.2504 2.33594 14.1269 2.33594 14C2.33594 13.8731 2.37734 13.7496 2.45387 13.6483C2.5304 13.547 2.63788 13.4735 2.75999 13.4388L9.91749 11.592C10.3211 11.4879 10.6895 11.2777 10.9843 10.983C11.2791 10.6884 11.4897 10.3202 11.594 9.91666L13.4397 2.75916C13.474 2.63657 13.5474 2.52856 13.6489 2.45162C13.7503 2.37468 13.8741 2.33304 14.0014 2.33304C14.1287 2.33304 14.2525 2.37468 14.3539 2.45162C14.4554 2.52856 14.5288 2.63657 14.5632 2.75916L16.4077 9.91666C16.5118 10.3204 16.7223 10.6889 17.0171 10.9837C17.3119 11.2786 17.6804 11.489 18.0842 11.5932L25.2417 13.4377C25.3647 13.4716 25.4733 13.545 25.5506 13.6466C25.628 13.7482 25.6699 13.8723 25.6699 14C25.6699 14.1277 25.628 14.2518 25.5506 14.3534C25.4733 14.455 25.3647 14.5284 25.2417 14.5623L18.0842 16.4068C17.6804 16.511 17.3119 16.7214 17.0171 17.0163C16.7223 17.3111 16.5118 17.6796 16.4077 18.0833L14.562 25.2408C14.5277 25.3634 14.4542 25.4714 14.3528 25.5484C14.2514 25.6253 14.1275 25.667 14.0002 25.667C13.8729 25.667 13.7491 25.6253 13.6477 25.5484C13.5463 25.4714 13.4728 25.3634 13.4385 25.2408L11.594 18.0833Z"
                  stroke="#888888"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M23.332 3.5V8.16667"
                  stroke="#888888"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M25.6667 5.83301H21"
                  stroke="#888888"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.66797 19.833V22.1663"
                  stroke="#888888"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.83333 21H3.5"
                  stroke="#888888"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-neutral-800 text-2xl font-semibold font-['Segoe_UI'] leading-7">
                {t('hero.finderTitle')}
              </span>
            </div>
            {/* Printer select */}
            <div className="px-6 flex flex-col gap-4">
              <span className="text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">
                {t('hero.selectPrinter')}
              </span>
              <Combobox
                items={canShowPrinterResults ? printerResults : []}
                open={isComboboxOpen && canShowPrinterResults}
                onOpenChange={setIsComboboxOpen}
                value={selectedPrinter}
                onValueChange={(printer) => {
                  if (printer) {
                    handlePrinterSelect(printer);
                  } else {
                    setSelectedPrinter(null);
                  }
                }}
                itemToStringValue={(printer) => printer ? printerLabel(printer) : ""}
                autoHighlight
              >
                <ComboboxInput
                  autoFocus
                  showTrigger={false}
                  showClear
                  value={printerQuery}
                  onChange={(event) => handlePrinterQueryChange(event.currentTarget.value)}
                  placeholder="Search your printer model..."
                  className="w-full h-12 px-3 rounded-full"
                />
                {printerQuery.trim().length > 0 && printerQuery.trim().length < 3 ? (
                  <p className="text-sm text-muted-foreground">
                    Type at least 3 characters to search
                  </p>
                ) : null}
                <ComboboxContent className="p-0">
                  {isSearchingPrinters ? (
                    <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                      <span>Searching printers...</span>
                    </div>
                  ) : printerSearchError ? (
                    <div className="px-3 py-6 text-sm text-destructive">
                      {printerSearchError}
                    </div>
                  ) : (
                    <>
                      <ComboboxEmpty>No printers found</ComboboxEmpty>
                      <ComboboxList>
                        {(printer) => (
                          <ComboboxItem
                            key={printer.id}
                            value={printer}
                            className="items-start px-3 py-2"
                          >
                            {printer.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={printer.image}
                                alt=""
                                className="size-10 shrink-0 rounded-md border border-border object-contain"
                              />
                            ) : (
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                                <Search className="text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-medium">
                                {printerLabel(printer)}
                              </span>
                              {printer.model ? (
                                <span className="truncate text-xs text-muted-foreground">
                                  {printer.model}
                                </span>
                              ) : null}
                            </div>
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </>
                  )}
                </ComboboxContent>
              </Combobox>
            </div>
            {selectedPrinter ? (
              <div className="px-6 flex flex-col gap-4">
                <span className="text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">
                  {t('hero.availableForPrinter')}
                </span>
                <div className="flex flex-col sm:flex-row gap-4">
                  {categoryCards.map((category) => {
                    const Icon = category.icon;

                    return (
                      <div
                        key={category.slug}
                        className="flex h-auto flex-1 items-center gap-3 rounded-lg border border-zinc-100 bg-gray-50 px-3 py-3 text-left"
                      >
                        <Icon className="shrink-0 text-neutral-500" />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate text-base font-semibold font-['Segoe_UI'] leading-5 text-neutral-700">
                            {category.label}
                          </span>
                          <span className="truncate text-sm font-normal font-['Segoe_UI'] leading-5 text-zinc-500">
                            {category.description}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  onClick={handleShowCompatibleProducts}
                  className="h-auto w-full rounded-full bg-blue-400 py-3 text-base font-semibold font-['Segoe_UI'] text-white hover:bg-blue-500"
                >
                  <Search data-icon="inline-start" />
                  {t('hero.showProducts')}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
