"use client";

import { useState, type CSSProperties } from "react";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DownloadIcon,
  HomeIcon,
  InfoIcon,
  ShoppingCart,
  TruckIcon,
  type LucideIcon,
} from "lucide-react";
import type {
  NormalizedWarrantyOption,
  NormalizedWarrantyType,
} from "@/lib/warranty/localize";

type NormalizedWarrantyData = {
  defaultOption: NormalizedWarrantyOption | null;
  types: NormalizedWarrantyType[];
  oldOptions: NormalizedWarrantyOption[];
  allOptions: NormalizedWarrantyOption[];
};

type WarrantyDialogContentProps = {
  open: boolean;
  productName: string;
  warranty: NormalizedWarrantyData;
  title: string;
  defaultWarrantyDescription: string;
  downloadLabel: string;
  groupLabel: string;
  warrantyDescription: string;
  additionalOptionsLabel: string;
  footerText: string;
  noThanksLabel: string;
  addWarrantyLabel: string;
  selectWarrantyLabel: string;
  addToCartLabel: string;
  onSkip: () => void;
  onConfirm: (option: NormalizedWarrantyOption | null) => void;
};

function formatWarrantyEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizeHexColor(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }

  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : null;
}

function hexToRgba(hexColor: string, alpha: number): string {
  const cleanHex = hexColor.replace("#", "");
  const r = Number.parseInt(cleanHex.slice(0, 2), 16);
  const g = Number.parseInt(cleanHex.slice(2, 4), 16);
  const b = Number.parseInt(cleanHex.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getWarrantyBadgeStyle(color: string): CSSProperties | undefined {
  const hexColor = normalizeHexColor(color);
  if (!hexColor) return undefined;

  return {
    backgroundColor: hexToRgba(hexColor, 0.1),
    borderColor: hexToRgba(hexColor, 0.25),
    color: hexColor,
  };
}

function getWarrantyBadgeClass(color: string): string {
  if (normalizeHexColor(color)) {
    return "border";
  }

  if (color === "blue") {
    return "bg-blue-50 text-blue-600 ring-1 ring-blue-100";
  }

  if (color === "green") {
    return "bg-green-50 text-green-700 ring-1 ring-green-100";
  }

  return "bg-muted text-muted-foreground ring-1 ring-border";
}

function getWarrantyTypeIcon(iconName: string | null | undefined): LucideIcon {
  const normalizedIconName = iconName?.toLowerCase().replace(/[_\s]/g, "-") ?? "";

  if (
    normalizedIconName.includes("home") ||
    normalizedIconName.includes("site") ||
    normalizedIconName.includes("engineer")
  ) {
    return HomeIcon;
  }

  if (
    normalizedIconName.includes("truck") ||
    normalizedIconName.includes("return") ||
    normalizedIconName.includes("shipping")
  ) {
    return TruckIcon;
  }

  return InfoIcon;
}

export default function WarrantyDialogContent({
  open,
  ...props
}: WarrantyDialogContentProps) {
  return <WarrantyDialogContentBody key={open ? "open" : "closed"} {...props} />;
}

function WarrantyDialogContentBody({
  productName,
  warranty,
  title,
  defaultWarrantyDescription,
  downloadLabel,
  groupLabel,
  warrantyDescription,
  additionalOptionsLabel,
  footerText,
  noThanksLabel,
  addWarrantyLabel,
  selectWarrantyLabel,
  addToCartLabel,
  onSkip,
  onConfirm,
}: Omit<WarrantyDialogContentProps, "open">) {
  const defaultWarrantyId = warranty.defaultOption?.id ?? null;
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<number | string | null>(null);
  const selectedWarrantyOption =
    warranty.allOptions.find((option) => option.id === selectedWarrantyId) ??
    (selectedWarrantyId === defaultWarrantyId ? warranty.defaultOption : null);
  const selectedWarrantyPrice =
    selectedWarrantyOption &&
    typeof selectedWarrantyOption.price === "number" &&
    Number.isFinite(selectedWarrantyOption.price)
      ? selectedWarrantyOption.price
      : 0;
  const hasSelectedPaidWarranty = selectedWarrantyPrice > 0;

  return (
    <DialogContent
      className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden bg-background p-0 text-foreground shadow-xl sm:w-[92vw] sm:max-w-[44rem] sm:rounded-xl md:max-w-[49rem] lg:max-w-[52rem]"
      showCloseButton={false}
    >
      <div className="max-h-[calc(100dvh-5rem)] overflow-y-auto p-4 sm:p-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DialogTitle className="mb-1 text-lg font-extrabold leading-tight text-foreground sm:text-xl">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-5 text-muted-foreground">
              {productName}
            </DialogDescription>
          </div>
          <DialogClose className="-mr-1 -mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="flex flex-col gap-5">
          {warranty.defaultOption && (
            <button
              type="button"
              onClick={() => setSelectedWarrantyId(warranty.defaultOption?.id ?? "default")}
              className={`w-full rounded-lg border p-3.5 text-left transition-colors sm:p-4 ${
                selectedWarrantyId === defaultWarrantyId
                  ? "border-brand bg-brand-soft/60 ring-2 ring-brand/15"
                  : "border-brand bg-brand-soft/30 hover:bg-brand-soft/60"
              }`}
              aria-pressed={selectedWarrantyId === defaultWarrantyId}
            >
              <div className="flex items-start gap-2">
                <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold leading-5 text-foreground sm:text-base">
                    {warranty.defaultOption.name}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    {warranty.defaultOption.description || defaultWarrantyDescription}
                  </p>
                  <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold leading-normal text-brand underline underline-offset-2">
                    <DownloadIcon className="size-3.5" strokeWidth={1.8} />
                    {downloadLabel}
                  </span>
                </div>
              </div>
            </button>
          )}

          <div className="flex flex-col gap-5" role="group" aria-label={groupLabel}>
            {warranty.types.map((type) => {
              const WarrantyIcon = getWarrantyTypeIcon(type.icon);

              return (
                <section key={type.id || type.name} className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <WarrantyIcon className="size-[1.125rem] text-brand" strokeWidth={2.2} />
                      <h3 className="text-base font-extrabold leading-6 text-foreground sm:text-lg">{type.name}</h3>
                      {type.badgeText && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold leading-4 ${getWarrantyBadgeClass(type.badgeColor)}`}
                          style={getWarrantyBadgeStyle(type.badgeColor)}
                        >
                          {type.badgeText}
                        </span>
                      )}
                    </div>
                  </div>

                  {type.description && (
                    <p className="text-sm leading-5 text-muted-foreground sm:text-[0.95rem]">{type.description}</p>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {type.options.map((option) => (
                      <WarrantyOptionCard
                        key={option.id}
                        option={option}
                        isSelected={selectedWarrantyId == option.id}
                        fallbackDescription={warrantyDescription}
                        inputId={`warranty-option-${option.id}`}
                        onSelect={() => setSelectedWarrantyId(selectedWarrantyId == option.id ? null : option.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {warranty.oldOptions.length > 0 && (
              <section className="flex flex-col gap-2.5">
                <h3 className="text-base font-extrabold leading-6 text-foreground sm:text-lg">{additionalOptionsLabel}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {warranty.oldOptions.map((option) => (
                    <WarrantyOptionCard
                      key={option.id}
                      option={option}
                      isSelected={selectedWarrantyId == option.id}
                      fallbackDescription={warrantyDescription}
                      inputId={`warranty-option-${option.id}`}
                      onSelect={() => setSelectedWarrantyId(selectedWarrantyId == option.id ? null : option.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          <p className="text-xs leading-5 text-muted-foreground sm:text-sm">{footerText}</p>
        </div>
      </div>

      <Separator />
      <div className="flex flex-col gap-3 bg-background/95 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onSkip}
            className="h-10 w-full rounded-full px-5 text-sm font-bold sm:w-auto"
          >
            {noThanksLabel}
          </Button>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          {hasSelectedPaidWarranty ? (
            <div className="flex items-baseline justify-between gap-2 whitespace-nowrap sm:flex-col sm:items-end sm:gap-1">
              <span className="text-xs leading-tight text-muted-foreground">{addWarrantyLabel}</span>
              <span className="text-lg font-extrabold leading-6 text-foreground">
                +{formatWarrantyEuro(selectedWarrantyPrice)}
              </span>
            </div>
          ) : null}
          <Button
            type="button"
            size="default"
            onClick={() => onConfirm(selectedWarrantyOption ?? null)}
            disabled={selectedWarrantyId == null}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-brand-hover disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-100 sm:w-auto"
          >
            <ShoppingCart data-icon="inline-start" />
            {selectedWarrantyId == null ? selectWarrantyLabel : addToCartLabel}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

type WarrantyOptionCardProps = {
  option: NormalizedWarrantyOption;
  isSelected: boolean;
  fallbackDescription: string;
  inputId: string;
  onSelect: () => void;
};

function WarrantyOptionCard({
  option,
  isSelected,
  fallbackDescription,
  inputId,
  onSelect,
}: WarrantyOptionCardProps) {
  return (
    <label
      htmlFor={inputId}
      className={`relative flex min-h-[7.5rem] cursor-pointer flex-col gap-1.5 rounded-lg border p-3 pr-8 transition-all ${
        isSelected
          ? "border-brand bg-brand-soft/60 shadow-sm"
          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/70"
      }`}
    >
      <Checkbox
        id={inputId}
        checked={isSelected}
        onCheckedChange={onSelect}
        className="absolute right-3 top-3 size-3.5 rounded-full border-slate-300 bg-background text-white shadow-none data-checked:border-brand data-checked:bg-brand"
      />
      <div className="pr-4 text-sm font-extrabold leading-5 text-foreground sm:text-[0.95rem]">{option.name}</div>
      <div className={`text-xl font-bold leading-tight sm:text-[1.35rem] ${isSelected ? "text-brand" : "text-foreground"}`}>
        {formatWarrantyEuro(option.price)}
      </div>
      <div className="text-xs leading-4 text-muted-foreground">{option.description || fallbackDescription}</div>
    </label>
  );
}
