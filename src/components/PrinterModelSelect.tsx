"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type PrinterSearchResult = {
  id: number;
  brand: string | null;
  name: string;
  model: string | null;
  slug: string | null;
  image: string | null;
  productIds?: number[];
};

export function printerLabel(printer: PrinterSearchResult) {
  return printer.name.trim();
}

type PrinterModelSelectProps = {
  value: PrinterSearchResult | null;
  textValue?: string;
  onValueChange: (printer: PrinterSearchResult | null) => void;
  onTextChange?: (text: string) => void;
  placeholder?: string;
  className?: string;
  inputId?: string;
  autoFocus?: boolean;
};

export default function PrinterModelSelect({
  value,
  textValue,
  onValueChange,
  onTextChange,
  placeholder,
  className = "w-full h-12 px-3 rounded-full",
  inputId,
  autoFocus = false,
}: PrinterModelSelectProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [printerQuery, setPrinterQuery] = useState(() => value ? printerLabel(value) : "");
  const [debouncedPrinterQuery, setDebouncedPrinterQuery] = useState("");
  const [printerResults, setPrinterResults] = useState<PrinterSearchResult[]>([]);
  const [isSearchingPrinters, setIsSearchingPrinters] = useState(false);
  const [printerSearchError, setPrinterSearchError] = useState<string | null>(null);

  const canShowPrinterResults = printerQuery.trim().length >= 3;

  useEffect(() => {
    if (textValue !== undefined) {
      setPrinterQuery(textValue);
      return;
    }

    setPrinterQuery(value ? printerLabel(value) : "");
  }, [textValue, value]);

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
          throw new Error(t("hero.printerSearchFailed"));
        }

        const payload = (await response.json()) as { data?: PrinterSearchResult[]; message?: string };
        setPrinterResults(payload.data ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setPrinterResults([]);
        setPrinterSearchError(t("hero.printerSearchError"));
      } finally {
        setIsSearchingPrinters(false);
      }
    }

    searchPrinters();

    return () => controller.abort();
  }, [debouncedPrinterQuery, t]);

  const handlePrinterQueryChange = (nextValue: string) => {
    setPrinterQuery(nextValue);
    onTextChange?.(nextValue);
    setIsOpen(nextValue.trim().length >= 3);

    if (value && nextValue !== printerLabel(value)) {
      onValueChange(null);
    }

    if (nextValue.trim().length < 3) {
      setPrinterResults([]);
      setPrinterSearchError(null);
      setIsSearchingPrinters(false);
    }
  };

  const handlePrinterSelect = (printer: PrinterSearchResult) => {
    onValueChange(printer);
    setPrinterQuery(printerLabel(printer));
    onTextChange?.(printerLabel(printer));
    setIsOpen(false);
  };

  const handleClear = () => {
    onValueChange(null);
    setPrinterQuery("");
    onTextChange?.("");
    setPrinterResults([]);
    setPrinterSearchError(null);
    setIsOpen(false);
  };

  return (
    <Popover
      open={isOpen && canShowPrinterResults}
      onOpenChange={setIsOpen}
    >
      <PopoverAnchor asChild>
        <div className="relative w-full flex items-center">
          <div className="absolute left-4 pointer-events-none flex items-center justify-center text-zinc-400">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.7504 15.7484L12.5254 12.5234" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <Input
            id={inputId}
            autoFocus={autoFocus}
            value={printerQuery}
            onChange={(event) => handlePrinterQueryChange(event.currentTarget.value)}
            onFocus={() => setIsOpen(!value && printerQuery.trim().length >= 3)}
            placeholder={placeholder ?? t("hero.searchPrinterPlaceholder")}
            autoComplete="off"
            className={cn(className, "pl-11 pr-10")}
          />
          {printerQuery ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              aria-label="Clear"
            >
              <X />
            </Button>
          ) : null}
        </div>
      </PopoverAnchor>
      {printerQuery.trim().length > 0 && printerQuery.trim().length < 3 ? (
        <p className="text-sm text-muted-foreground">
          {t("hero.searchMinChars")}
        </p>
      ) : null}
      <PopoverContent
        align="start"
        className="w-[var(--radix-popper-anchor-width)] gap-0 p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {isSearchingPrinters ? (
          <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
            <Loader2 data-icon="inline-start" className="animate-spin" />
            <span>{t("hero.searchingPrinters")}</span>
          </div>
        ) : printerSearchError ? (
          <div className="px-3 py-6 text-sm text-destructive">
            {printerSearchError}
          </div>
        ) : printerResults.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t("hero.noPrintersFound")}
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto p-1">
            {printerResults.map((printer) => (
              <button
                key={printer.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handlePrinterSelect(printer)}
                className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"
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
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">
                    {printerLabel(printer)}
                  </span>
                  {printer.model ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {printer.model}
                    </span>
                  ) : null}
                </span>
                {value?.id === printer.id ? (
                  <Check className="mt-1 text-primary" />
                ) : null}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
