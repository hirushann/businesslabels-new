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
import type { Material } from "@/lib/search/materials";

export function materialLabel(material: Material) {
  return `${material.code} - ${material.title}`.trim();
}

type MaterialModelSelectProps = {
  value: Material | null;
  textValue?: string;
  onValueChange: (material: Material | null) => void;
  onTextChange?: (text: string) => void;
  placeholder?: string;
  className?: string;
  inputId?: string;
  autoFocus?: boolean;
};

export default function MaterialModelSelect({
  value,
  textValue,
  onValueChange,
  onTextChange,
  placeholder,
  className = "w-full h-12 px-3 rounded-full",
  inputId,
  autoFocus = false,
}: MaterialModelSelectProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [materialQuery, setMaterialQuery] = useState(() => value ? materialLabel(value) : "");
  const [debouncedMaterialQuery, setDebouncedMaterialQuery] = useState("");
  const [materialResults, setMaterialResults] = useState<Material[]>([]);
  const [isSearchingMaterials, setIsSearchingMaterials] = useState(false);
  const [materialSearchError, setMaterialSearchError] = useState<string | null>(null);

  const canShowMaterialResults = materialQuery.trim().length >= 3;

  useEffect(() => {
    if (textValue !== undefined) {
      setMaterialQuery(textValue);
      return;
    }

    setMaterialQuery(value ? materialLabel(value) : "");
  }, [textValue, value]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedMaterialQuery(materialQuery.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [materialQuery]);

  useEffect(() => {
    if (debouncedMaterialQuery.length < 3) {
      return;
    }

    const controller = new AbortController();

    async function searchMaterials() {
      setIsSearchingMaterials(true);
      setMaterialSearchError(null);

      try {
        const response = await fetch(`/api/materials?q=${encodeURIComponent(debouncedMaterialQuery)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to search materials");
        }

        const payload = (await response.json()) as { materials?: Material[]; message?: string };
        setMaterialResults(payload.materials ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setMaterialResults([]);
        setMaterialSearchError("Error searching materials");
      } finally {
        setIsSearchingMaterials(false);
      }
    }

    searchMaterials();

    return () => controller.abort();
  }, [debouncedMaterialQuery]);

  const handleMaterialQueryChange = (nextValue: string) => {
    setMaterialQuery(nextValue);
    onTextChange?.(nextValue);
    setIsOpen(nextValue.trim().length >= 3);

    if (value && nextValue !== materialLabel(value)) {
      onValueChange(null);
    }

    if (nextValue.trim().length < 3) {
      setMaterialResults([]);
      setMaterialSearchError(null);
      setIsSearchingMaterials(false);
    }
  };

  const handleMaterialSelect = (material: Material) => {
    setMaterialQuery(materialLabel(material));
    onTextChange?.(materialLabel(material));
    onValueChange(material);
    setIsOpen(false);
  };

  const handleClear = () => {
    onValueChange(null);
    setMaterialQuery("");
    onTextChange?.("");
    setMaterialResults([]);
    setMaterialSearchError(null);
    setIsOpen(false);
  };

  return (
    <Popover
      open={isOpen && canShowMaterialResults}
      onOpenChange={setIsOpen}
    >
      <PopoverAnchor asChild>
        <div className="relative w-full">
          <Input
            id={inputId}
            autoFocus={autoFocus}
            value={materialQuery}
            onChange={(event) => handleMaterialQueryChange(event.currentTarget.value)}
            onFocus={() => setIsOpen(!value && materialQuery.trim().length >= 3)}
            placeholder={placeholder ?? "Search material code"}
            autoComplete="off"
            className={cn(className, "pr-10")}
          />
          {materialQuery ? (
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
      {materialQuery.trim().length > 0 && materialQuery.trim().length < 3 ? (
        <p className="text-sm text-muted-foreground mt-2">
          {t("hero.searchMinChars")}
        </p>
      ) : null}
      <PopoverContent
        align="start"
        className="w-[var(--radix-popper-anchor-width)] gap-0 p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {isSearchingMaterials ? (
          <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
            <Loader2 data-icon="inline-start" className="animate-spin" />
            <span>Searching...</span>
          </div>
        ) : materialSearchError ? (
          <div className="px-3 py-6 text-sm text-destructive">
            {materialSearchError}
          </div>
        ) : materialResults.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No materials found
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto p-1">
            {materialResults.map((material) => (
              <button
                key={material.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleMaterialSelect(material)}
                className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"
              >
                {material.main_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={material.main_image}
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
                    {material.code}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {material.title}
                  </span>
                </span>
                {value?.id === material.id ? (
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
