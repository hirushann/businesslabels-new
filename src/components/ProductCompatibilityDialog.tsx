'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type PrinterOption = {
  id: number;
  name: string;
};

type ProductCompatibilityDialogProps = {
  productId?: number | string | null;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readStringValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number') {
      return String(value);
    }
  }

  return '';
}

function extractPrinterList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isPlainObject(payload)) {
    return [];
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (isPlainObject(payload.data) && Array.isArray(payload.data.data)) {
    return payload.data.data;
  }

  return [];
}

function normalizePrinters(payload: unknown): PrinterOption[] {
  return extractPrinterList(payload)
    .filter(isPlainObject)
    .map((printer) => {
      const id = Number(printer.id);
      const name = readStringValue(printer, ['name', 'title', 'model']);

      if (!Number.isFinite(id) || !name) {
        return null;
      }

      return { id, name };
    })
    .filter((printer): printer is PrinterOption => Boolean(printer));
}

function getResponseMessage(payload: unknown) {
  if (typeof payload === 'string') {
    return payload;
  }

  if (!isPlainObject(payload)) {
    return '';
  }

  return readStringValue(payload, ['message', 'status', 'result', 'compatibility']);
}

function getCompatibilityValue(payload: unknown) {
  if (!isPlainObject(payload)) {
    return null;
  }

  const directValue = payload.compatible ?? payload.is_compatible ?? payload.compatibility;

  if (typeof directValue === 'boolean') {
    return directValue;
  }

  if (typeof directValue === 'string') {
    const normalized = directValue.toLowerCase();

    if (['true', 'yes', 'compatible', 'success'].includes(normalized)) {
      return true;
    }

    if (['false', 'no', 'not compatible', 'incompatible', 'failed'].includes(normalized)) {
      return false;
    }
  }

  if (isPlainObject(payload.data)) {
    return getCompatibilityValue(payload.data);
  }

  return null;
}

function formatResponseDetails(payload: unknown) {
  if (!isPlainObject(payload)) {
    return null;
  }
  console.log('Formatting response details from payload:', payload);

  const data = isPlainObject(payload.data) ? payload.data : payload;
  const details = Object.entries(data)
    .filter(([key, value]) => !['compatible', 'is_compatible', 'compatibility', 'message', 'status'].includes(key) && value != null)
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' '),
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));

  return details.length ? details : null;
}

export default function ProductCompatibilityDialog({ productId }: ProductCompatibilityDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [printers, setPrinters] = useState<PrinterOption[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState('');
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterOption | null>(null);
  const [printerQuery, setPrinterQuery] = useState('');
  const [isPrinterListOpen, setIsPrinterListOpen] = useState(false);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [printerError, setPrinterError] = useState('');
  const [checkError, setCheckError] = useState('');
  const [compatibilityResponse, setCompatibilityResponse] = useState<unknown>(null);

  const compatibilityValue = getCompatibilityValue(compatibilityResponse);
  const responseMessage = getResponseMessage(compatibilityResponse);
  const responseDetails = formatResponseDetails(compatibilityResponse);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      async function searchPrinters() {
        setIsLoadingPrinters(true);
        setPrinterError('');

        try {
          const response = await fetch(`/api/printers/search?query=${encodeURIComponent(printerQuery)}`, {
            headers: {
              Accept: 'application/json',
            },
          });
          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              isPlainObject(data) && typeof data.message === 'string'
                ? data.message
                : 'Unable to load printer models.'
            );
          }

          if (isMounted) {
            setPrinters(normalizePrinters(data));
          }
        } catch (error) {
          if (isMounted) {
            setPrinters([]);
            setPrinterError(error instanceof Error ? error.message : 'Unable to load printer models.');
          }
        } finally {
          if (isMounted) {
            setIsLoadingPrinters(false);
          }
        }
      }

      void searchPrinters();
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, printerQuery]);

  const handleCheckCompatibility = async () => {
    if (!productId || !selectedPrinterId || isChecking) {
      return;
    }

    setIsChecking(true);
    setCheckError('');
    setCompatibilityResponse(null);

    try {
      const response = await fetch('/api/products/compatibility', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          printer_id: selectedPrinterId,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          isPlainObject(data) && typeof data.message === 'string'
            ? data.message
            : 'Unable to check compatibility.'
        );
      }

      setCompatibilityResponse(data);
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : 'Unable to check compatibility.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="text-amber-500 text-base font-semibold underline text-left">
          Check Compatibility
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-neutral-800">Check Compatibility</DialogTitle>
          <DialogDescription>
            Select your printer model to confirm whether this product is compatible.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-neutral-700" htmlFor="compatibility-printer">
              Printer model
            </label>
            <div className="relative">
              <Input
                id="compatibility-printer"
                value={printerQuery}
                onChange={(event) => {
                  setPrinterQuery(event.target.value);
                  setSelectedPrinterId('');
                  setSelectedPrinter(null);
                  setCompatibilityResponse(null);
                  setCheckError('');
                  setIsPrinterListOpen(true);
                }}
                onFocus={() => setIsPrinterListOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setIsPrinterListOpen(false), 120);
                }}
                placeholder="Search printer model"
                autoComplete="off"
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-base font-semibold text-neutral-800 placeholder:font-medium focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
              />
              {isPrinterListOpen ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[60] max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10">
                  {isLoadingPrinters ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-neutral-500">
                      <Loader2 className="size-4 animate-spin" />
                      Loading printers
                    </div>
                  ) : printers.length > 0 ? (
                    printers.map((printer) => (
                      <button
                        key={printer.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setSelectedPrinterId(String(printer.id));
                          setSelectedPrinter(printer);
                          setPrinterQuery(printer.name);
                          setCompatibilityResponse(null);
                          setCheckError('');
                          setIsPrinterListOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold text-neutral-700 transition-colors hover:bg-amber-50 hover:text-amber-700"
                      >
                        <span>{printer.name}</span>
                        {String(printer.id) === selectedPrinterId ? (
                          <span className="text-xs font-black uppercase tracking-wider text-amber-600">Selected</span>
                        ) : null}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm font-semibold text-neutral-500">
                      No printers found.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            {!printerQuery ? (
              <p className="text-xs font-semibold text-neutral-400">Showing the latest printer models. Type to search.</p>
            ) : null}
            {printerError ? <p className="text-sm font-semibold text-red-600">{printerError}</p> : null}
          </div>

          <button
            type="button"
            onClick={handleCheckCompatibility}
            disabled={!productId || !selectedPrinterId || isChecking || isLoadingPrinters}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-amber-500 px-6 text-sm font-black text-white transition-colors hover:bg-amber-600 disabled:pointer-events-none disabled:opacity-60"
          >
            {isChecking ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Checking
              </>
            ) : (
              'Check Compatibility'
            )}
          </button>

          {checkError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {checkError}
            </div>
          ) : null}

          {compatibilityResponse ? (
            <div className={`rounded-2xl border p-5 ${compatibilityValue === false ? 'border-red-100 bg-red-50' : 'border-emerald-100 bg-emerald-50'}`}>
              <p className={`text-lg font-black ${compatibilityValue === false ? 'text-red-700' : 'text-emerald-700'}`}>
                {compatibilityValue === false ? 'Not compatible' : compatibilityValue === true ? 'Compatible' : 'Compatibility result'}
              </p>
              <p className={`mt-1 text-sm font-semibold ${compatibilityValue === false ? 'text-red-600' : 'text-emerald-700'}`}>
                {responseMessage || (selectedPrinter ? `Result for ${selectedPrinter.name}` : 'The compatibility check completed.')}
              </p>
              {responseDetails ? (
                <dl className="mt-4 grid gap-2 text-sm">
                  {responseDetails.map((detail) => (
                    <div key={detail.label} className="flex justify-between gap-4 border-t border-white/70 pt-2">
                      <dt className="font-bold capitalize text-neutral-500">{detail.label}</dt>
                      <dd className="text-right font-semibold text-neutral-700">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
