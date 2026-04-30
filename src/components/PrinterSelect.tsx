"use client";

import { useEffect, useState } from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { fetchPrinterOptions } from "@/lib/api/printers";
import type { PrinterOption } from "@/lib/types/printer";

type PrinterSelectProps = {
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function PrinterSelect({
  value,
  onValueChange,
  placeholder = "Choose a printer",
  className,
}: PrinterSelectProps) {
  const [printers, setPrinters] = useState<PrinterOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const anchor = useComboboxAnchor();

  useEffect(() => {
    async function loadPrinters() {
      setIsLoading(true);
      setError(null);

      const response = await fetchPrinterOptions();

      if (response.error) {
        setError(response.error);
        setPrinters([]);
      } else {
        setPrinters(response.data);
      }

      setIsLoading(false);
    }

    loadPrinters();
  }, []);

  if (error) {
    return (
      <div className={className}>
        <div className="w-full px-5 py-3 rounded-full border border-red-200 bg-red-50 text-red-700 text-base font-normal font-['Segoe_UI']">
          {error}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>
        <div className="w-full px-5 py-3 rounded-full border border-zinc-200 text-neutral-400 text-base font-normal font-['Segoe_UI']">
          Loading printers...
        </div>
      </div>
    );
  }

  // Convert slugs to printer objects for display
  const selectedPrinters = (value || [])
    .map((slug) => printers.find((p) => p.slug === slug))
    .filter(Boolean) as PrinterOption[];

  return (
    <div className={className}>
      <Combobox
        items={printers}
        multiple
        autoHighlight
        value={selectedPrinters}
        onValueChange={(selectedPrinters) => {
          const slugs = selectedPrinters.map((p) => p.slug);
          onValueChange?.(slugs);
        }}
        itemToStringValue={(printer) => printer?.name || ""}
      >
        <ComboboxChips ref={anchor} className="w-full px-5 py-3 rounded-full">
          <ComboboxValue>
            {selectedPrinters.map((printer) => (
              <ComboboxChip key={printer.slug}>{printer.name}</ComboboxChip>
            ))}
          </ComboboxValue>
          <ComboboxChipsInput placeholder={placeholder} />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No printer found.</ComboboxEmpty>
          <ComboboxList>
            {(printer) => (
              <ComboboxItem key={printer.id} value={printer}>
                {printer.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
