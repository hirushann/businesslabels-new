"use client";

import { useEffect, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { fetchPrinterOptions } from "@/lib/api/printers";
import type { PrinterOption } from "@/lib/types/printer";

type PrinterSelectProps = {
  value?: number | null;
  onValueChange?: (value: number | null) => void;
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

  // Convert ID to printer object for display
  const selectedPrinter = value ? printers.find((p) => p.id === value) : null;

  return (
    <div className={className}>
      <Combobox
        items={printers}
        autoHighlight
        value={selectedPrinter}
        onValueChange={(selectedPrinter) => {
          const id = selectedPrinter?.id ?? null;
          onValueChange?.(id);
        }}
        itemToStringValue={(printer) => printer?.name || ""}
      >
        <ComboboxTrigger
          render={
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
            >
              {selectedPrinter ? selectedPrinter.name : placeholder}
            </Button>
          }
        />
        <ComboboxContent>
          <ComboboxInput showTrigger={false} placeholder="Search" />
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
