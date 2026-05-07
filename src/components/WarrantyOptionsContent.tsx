"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import { PopoverDescription, PopoverHeader, PopoverTitle } from "@/components/ui/popover";
import type { WarrantyOption } from "@/lib/utils/warranty";

function formatEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

type WarrantyOptionsContentProps = {
  options: WarrantyOption[];
  defaultOptionId: number | null;
  selectedId: number | null;
  instanceId: string | number;
  onSelect: (id: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function WarrantyOptionsContent({
  options,
  defaultOptionId,
  selectedId,
  instanceId,
  onSelect,
  onCancel,
  onConfirm,
}: WarrantyOptionsContentProps) {
  const activeId = selectedId ?? defaultOptionId;

  return (
    <>
      <PopoverHeader>
        <PopoverTitle className="text-base">Choose Warranty</PopoverTitle>
        <PopoverDescription>
          Select a warranty option before adding this item to your cart.
        </PopoverDescription>
      </PopoverHeader>

      <RadioGroup
        value={activeId !== null ? String(activeId) : undefined}
        onValueChange={(value) => {
          const parsed = Number.parseInt(value, 10);
          if (Number.isFinite(parsed)) onSelect(parsed);
        }}
        className="gap-2 mt-3"
      >
        {options.map((option) => {
          const optionId = `warranty-opt-${instanceId}-${option.id}`;
          const isDefault = option.id === defaultOptionId;
          const hasExtraPrice = option.price > 0;

          return (
            <FieldLabel key={option.id} htmlFor={optionId} className="cursor-pointer rounded-xl border border-slate-200 p-0">
              <Field orientation="horizontal" className="items-start rounded-xl border-none p-3">
                <RadioGroupItem id={optionId} value={String(option.id)} className="mt-1" />
                <FieldContent>
                  <div className="flex items-start justify-between gap-3">
                    <FieldTitle className="text-sm font-semibold text-neutral-800">{option.name}</FieldTitle>
                    <span className={`shrink-0 text-sm font-semibold ${hasExtraPrice ? "text-amber-600" : "text-emerald-600"}`}>
                      {hasExtraPrice ? `+${formatEuro(option.price)}` : "No extra cost"}
                    </span>
                  </div>
                  <FieldDescription className="text-xs">
                    {option.description || (option.durationMonths ? `${option.durationMonths} months coverage` : "Extended coverage")}
                  </FieldDescription>
                  {isDefault ? (
                    <span className="mt-1 inline-flex w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Default Option
                    </span>
                  ) : null}
                </FieldContent>
              </Field>
            </FieldLabel>
          );
        })}
      </RadioGroup>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-full border border-slate-200 px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-9 rounded-full bg-amber-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
        >
          Add to Cart
        </button>
      </div>
    </>
  );
}
