"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Accordion from "@/components/Accordion";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";

type Material = {
  id: number;
  title: string;
  subtitle: string;
  slug: string;
  code: string;
  brand: string;
  status: string;
  categories: {
    id: number;
    name: string;
    slug: string;
  }[];
  specifications: {
    material_specs?: { label: string; value: string }[];
  } | null;
  print_method: string | null;
  base_material: string | null;
  finish: string | null;
  adhesive: string | null;
  main_image?: string;
};

// Inline helper for labels
const getLocalizedLabel = (key: string, locale: string) => {
  const dictionary: Record<string, Record<string, string>> = {
    en: {
      "Inkjet": "Inkjet",
      "Thermal Transfer": "Thermal Transfer",
      "Thermal Direct": "Thermal Direct",
      "Paper": "Paper",
      "PE (polyethylene)": "PE (polyethylene)",
      "PP (polypropylene)": "PP (polypropylene)",
      "PO (polyolefin)": "PO (polyolefin)",
      "Glossy": "Glossy",
      "Matte": "Matte",
      "Top Coated": "Top Coated",
      "Permanent": "Permanent",
      "Removable": "Removable",
      "Weight": "Weight",
      "Thickness": "Thickness",
      "full_color_media": "Full color media",
      "print_with_ribbon": "Print with ribbon",
      "print_without_ribbon": "Print without ribbon",
      "all_materials": "All Materials",
      "filters": "Filters",
      "sort_by": "Name: A to Z",
      "sort_by_desc": "Name: Z to A",
      "base_material": "Base Material",
      "finish": "Finish",
      "adhesive": "Adhesive",
      "clear_all": "Clear all filters",
      "view_details": "View Details",
      "no_materials_found": "No materials found",
      "no_materials_desc": "Try clearing some filters or selecting another printing method.",
      "previous": "Previous",
      "next": "Next",
      "all_printers": "All Printing Methods"
    },
    nl: {
      "Inkjet": "Inkjet",
      "Thermal Transfer": "Thermal Transfer",
      "Thermal Direct": "Thermal Direct",
      "Paper": "Papier",
      "PE (polyethylene)": "PE (polyethyleen)",
      "PP (polypropylene)": "PP (polypropyleen)",
      "PO (polyolefin)": "PO (polyolefine)",
      "Glossy": "Glanzend",
      "Matte": "Mat",
      "Top Coated": "Top Coated",
      "Permanent": "Permanent",
      "Removable": "Verwijderbaar",
      "Weight": "Gewicht",
      "Thickness": "Dikte",
      "full_color_media": "Full-color media",
      "print_with_ribbon": "Printen met lint",
      "print_without_ribbon": "Printen zonder lint",
      "all_materials": "Alle materialen",
      "filters": "Filters",
      "sort_by": "Naam: A tot Z",
      "sort_by_desc": "Naam: Z tot A",
      "base_material": "Basismateriaal",
      "finish": "Afwerking",
      "adhesive": "Lijm",
      "clear_all": "Filters wissen",
      "view_details": "Bekijk Details",
      "no_materials_found": "Geen materialen gevonden",
      "no_materials_desc": "Probeer filters te wissen of selecteer een andere printtechnologie.",
      "previous": "Vorige",
      "next": "Volgende",
      "all_printers": "Alle printtechnologieën"
    }
  };
  const lang = locale === "nl" ? "nl" : "en";
  return dictionary[lang][key] || key;
};

// Dynamic helper to extract attributes when DB values are null
function deriveMaterialAttributes(material: Material) {
  let printTech = material.print_method || "";
  if (!printTech && material.categories) {
    const cats = material.categories.map((c) => c.slug.toLowerCase());
    if (cats.includes("inkjet") || cats.some((s) => s.includes("inkjet"))) {
      printTech = "Inkjet";
    } else if (
      cats.includes("thermal-transfer") ||
      cats.includes("ttr") ||
      cats.some((s) => s.includes("thermal-transfer"))
    ) {
      printTech = "Thermal Transfer";
    } else if (
      cats.includes("thermal-direct") ||
      cats.includes("dt") ||
      cats.some((s) => s.includes("thermal-direct"))
    ) {
      printTech = "Thermal Direct";
    } else {
      printTech = "Inkjet";
    }
  }

  let baseMat = material.base_material || "";
  if (!baseMat && material.categories) {
    const cats = material.categories.map((c) => c.slug.toLowerCase());
    if (cats.some((s) => s.includes("papier") || s.includes("paper"))) {
      baseMat = "Paper";
    } else if (cats.some((s) => s.includes("pe") || s.includes("polyethylene"))) {
      baseMat = "PE (polyethylene)";
    } else if (cats.some((s) => s.includes("pp") || s.includes("polypropylene"))) {
      baseMat = "PP (polypropylene)";
    } else if (cats.some((s) => s.includes("po") || s.includes("polyolefin"))) {
      baseMat = "PO (polyolefin)";
    } else {
      baseMat = "Paper";
    }
  }

  let finish = material.finish || "";
  if (!finish && material.categories) {
    const cats = material.categories.map((c) => c.slug.toLowerCase());
    if (cats.some((s) => s.includes("glans") || s.includes("gloss") || s.includes("glanzende"))) {
      finish = "Glossy";
    } else if (cats.some((s) => s.includes("mat") || s.includes("matte"))) {
      finish = "Matte";
    } else if (cats.some((s) => s.includes("coated"))) {
      finish = "Top Coated";
    } else {
      finish = "Matte";
    }
  }

  let adhesive = material.adhesive || "";
  if (!adhesive && material.categories) {
    const cats = material.categories.map((c) => c.slug.toLowerCase());
    if (cats.some((s) => s.includes("verwijderbaar") || s.includes("removable"))) {
      adhesive = "Removable";
    } else if (cats.some((s) => s.includes("permanent") || s.includes("lijm"))) {
      adhesive = "Permanent";
    } else {
      adhesive = "Permanent";
    }
  }

  let weight = "";
  let thickness = "";
  if (material.specifications && Array.isArray(material.specifications.material_specs)) {
    for (const spec of material.specifications.material_specs) {
      const label = (spec.label || "").toLowerCase();
      if (label.includes("weight") || label.includes("gewicht")) {
        weight = spec.value;
      } else if (label.includes("thickness") || label.includes("dikte") || label.includes("hoogte")) {
        thickness = spec.value;
      }
    }
  }

  if (!weight) weight = "165 g/m²";
  if (!thickness) thickness = "169 µm";

  return { printTech, baseMat, finish, adhesive, weight, thickness };
}

function MaterialCard({
  material,
  locale,
}: {
  material: Material;
  locale: string;
}) {
  const { printTech, baseMat, finish, adhesive, weight, thickness } = deriveMaterialAttributes(material);
  const cardImage = toDisplayImageUrl(material.main_image) || "/images/labelrolls.png";

  const isInkjet = printTech === "Inkjet";
  const isTtr = printTech === "Thermal Transfer";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(109,109,120,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(109,109,120,0.12)]">
      <div className="relative h-60 w-full overflow-hidden bg-slate-50">
        <Image
          src={cardImage}
          alt={material.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-4 transition-transform duration-500 hover:scale-105"
        />
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 ${
            isInkjet
              ? "bg-amber-500"
              : isTtr
              ? "bg-slate-700"
              : "bg-emerald-600"
          }`}
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.867 48.867 0 00-14.326 0C3.768 7.44 3 8.375 3 9.456V15.75a2.25 2.25 0 002.25 2.25h1.091M9 9h6m-6 3h6" />
          </svg>
          {getLocalizedLabel(printTech, locale)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block rounded-md bg-amber-50 px-2 py-1 text-xs font-bold uppercase tracking-wide text-amber-700 border border-amber-100">
              {material.code}
            </span>
            <span className="text-xs text-slate-400 font-medium">{material.brand || "Diamondlabels"}</span>
          </div>

          <h3 className="mb-2 text-lg font-bold leading-snug text-slate-800 line-clamp-1">
            {material.title}
          </h3>

          <p className="mb-4 text-sm leading-relaxed text-slate-500 line-clamp-2">
            {material.subtitle}
          </p>

          <div className="mb-5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {getLocalizedLabel(baseMat, locale)}
            </span>
            <span className="rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {getLocalizedLabel(finish, locale)}
            </span>
            <span className="rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {getLocalizedLabel(adhesive, locale)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 pb-1">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {getLocalizedLabel("Weight", locale)}
              </span>
              <span className="text-sm font-semibold text-slate-700">{weight}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {getLocalizedLabel("Thickness", locale)}
              </span>
              <span className="text-sm font-semibold text-slate-700">{thickness}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <Link
            href={`/materials/${material.slug}`}
            className="flex h-11 items-center justify-center rounded-full bg-amber-500 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-600 hover:shadow-md hover:shadow-amber-500/10"
          >
            {getLocalizedLabel("view_details", locale)}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function MaterialsCatalogClient({
  initialMaterials,
  locale,
}: {
  initialMaterials: Material[];
  locale: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Mobile filters drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync state from query parameters
  const printMethod = searchParams.get("print_method") || "";
  const sort = searchParams.get("sort") || "name_asc";
  const currentPage = Number(searchParams.get("page") || "1");

  const selectedBaseMaterials = useMemo(() => {
    const val = searchParams.get("base_material");
    return val ? val.split(",") : [];
  }, [searchParams]);

  const selectedFinishes = useMemo(() => {
    const val = searchParams.get("finish");
    return val ? val.split(",") : [];
  }, [searchParams]);

  const selectedAdhesives = useMemo(() => {
    const val = searchParams.get("adhesive");
    return val ? val.split(",") : [];
  }, [searchParams]);

  // Update query parameters helper
  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    // Reset page to 1 when changing filters
    if (!updates.hasOwnProperty("page")) {
      params.delete("page");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Toggle filter item
  const toggleFilter = (type: "base_material" | "finish" | "adhesive", value: string) => {
    let current: string[] = [];
    if (type === "base_material") current = [...selectedBaseMaterials];
    if (type === "finish") current = [...selectedFinishes];
    if (type === "adhesive") current = [...selectedAdhesives];

    const idx = current.indexOf(value);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(value);
    }

    updateQuery({ [type]: current.join(",") });
  };

  // Toggle Print Method
  const togglePrintMethod = (method: string) => {
    if (printMethod === method) {
      updateQuery({ print_method: null });
    } else {
      updateQuery({ print_method: method });
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    updateQuery({
      base_material: null,
      finish: null,
      adhesive: null,
      page: null,
    });
  };

  // Process Materials: Filter, Sort & Paginate
  const processed = useMemo(() => {
    let list = [...initialMaterials];

    // 1. Printer Type filter (Inkjet, Thermal Transfer, Thermal Direct)
    // If not selected, show all materials
    if (printMethod) {
      list = list.filter((m) => {
        const { printTech } = deriveMaterialAttributes(m);
        const techSlug = printTech.toLowerCase().replace(/\s+/g, "-");
        return techSlug === printMethod;
      });
    }

    // 2. Base Material Filter
    if (selectedBaseMaterials.length > 0) {
      list = list.filter((m) => {
        const { baseMat } = deriveMaterialAttributes(m);
        return selectedBaseMaterials.includes(baseMat.toLowerCase());
      });
    }

    // 3. Finish Filter
    if (selectedFinishes.length > 0) {
      list = list.filter((m) => {
        const { finish } = deriveMaterialAttributes(m);
        return selectedFinishes.includes(finish.toLowerCase());
      });
    }

    // 4. Adhesive Filter
    if (selectedAdhesives.length > 0) {
      list = list.filter((m) => {
        const { adhesive } = deriveMaterialAttributes(m);
        return selectedAdhesives.includes(adhesive.toLowerCase());
      });
    }

    // 5. Sorting (Name: A to Z, Name: Z to A)
    if (sort === "name_desc") {
      list.sort((a, b) => b.title.localeCompare(a.title, locale));
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title, locale));
    }

    return list;
  }, [initialMaterials, printMethod, selectedBaseMaterials, selectedFinishes, selectedAdhesives, sort, locale]);

  // Paginated partition
  const perPage = 12;
  const total = processed.length;
  const lastPage = Math.ceil(total / perPage);
  const activePage = Math.max(1, Math.min(currentPage, lastPage));
  const paginatedMaterials = useMemo(() => {
    return processed.slice((activePage - 1) * perPage, activePage * perPage);
  }, [processed, activePage, perPage]);

  // Filter choices
  const filterSections = [
    {
      type: "base_material" as const,
      title: getLocalizedLabel("base_material", locale),
      options: [
        { value: "paper", label: getLocalizedLabel("Paper", locale) },
        { value: "pe (polyethylene)", label: getLocalizedLabel("PE (polyethylene)", locale) },
        { value: "pp (polypropylene)", label: getLocalizedLabel("PP (polypropylene)", locale) },
        { value: "po (polyolefin)", label: getLocalizedLabel("PO (polyolefin)", locale) },
      ],
      selected: selectedBaseMaterials,
    },
    {
      type: "finish" as const,
      title: getLocalizedLabel("finish", locale),
      options: [
        { value: "glossy", label: getLocalizedLabel("Glossy", locale) },
        { value: "matte", label: getLocalizedLabel("Matte", locale) },
        { value: "top coated", label: getLocalizedLabel("Top Coated", locale) },
      ],
      selected: selectedFinishes,
    },
    {
      type: "adhesive" as const,
      title: getLocalizedLabel("adhesive", locale),
      options: [
        { value: "permanent", label: getLocalizedLabel("Permanent", locale) },
        { value: "removable", label: getLocalizedLabel("Removable", locale) },
      ],
      selected: selectedAdhesives,
    },
  ];

  const hasActiveFilters =
    selectedBaseMaterials.length > 0 || selectedFinishes.length > 0 || selectedAdhesives.length > 0;

  // Sync scroll on change
  useEffect(() => {
    window.scrollTo({ top: 400, behavior: "smooth" });
  }, [searchParams]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-10">
      {/* Print Technology Selector Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {/* Inkjet Card */}
        <button
          type="button"
          onClick={() => togglePrintMethod("inkjet")}
          className={`group flex flex-col overflow-hidden text-left rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
            printMethod === "inkjet" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-100"
          }`}
        >
          <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-50">
            <Image
              src="/images/inkjet_preview.png"
              alt="Inkjet printer preview"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="mt-4 flex flex-1 flex-col justify-between w-full">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center justify-between">
                {getLocalizedLabel("Inkjet", locale)}
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                    printMethod === "inkjet" ? "bg-amber-500 scale-125" : "bg-slate-200"
                  }`}
                />
              </h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                {getLocalizedLabel("full_color_media", locale)}
              </p>
            </div>
          </div>
        </button>

        {/* Thermal Transfer Card */}
        <button
          type="button"
          onClick={() => togglePrintMethod("thermal-transfer")}
          className={`group flex flex-col overflow-hidden text-left rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
            printMethod === "thermal-transfer" ? "border-slate-800 ring-2 ring-slate-800/10" : "border-slate-100"
          }`}
        >
          <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-50">
            <Image
              src="/images/thermal_transfer_preview.png"
              alt="Thermal transfer printer preview"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="mt-4 flex flex-1 flex-col justify-between w-full">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center justify-between">
                {getLocalizedLabel("Thermal Transfer", locale)}
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                    printMethod === "thermal-transfer" ? "bg-slate-800 scale-125" : "bg-slate-200"
                  }`}
                />
              </h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                {getLocalizedLabel("print_with_ribbon", locale)}
              </p>
            </div>
          </div>
        </button>

        {/* Thermal Direct Card */}
        <button
          type="button"
          onClick={() => togglePrintMethod("thermal-direct")}
          className={`group flex flex-col overflow-hidden text-left rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
            printMethod === "thermal-direct" ? "border-emerald-600 ring-2 ring-emerald-500/15" : "border-slate-100"
          }`}
        >
          <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-50">
            <Image
              src="/images/thermal_direct_preview.png"
              alt="Thermal direct printer preview"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="mt-4 flex flex-1 flex-col justify-between w-full">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center justify-between">
                {getLocalizedLabel("Thermal Direct", locale)}
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                    printMethod === "thermal-direct" ? "bg-emerald-600 scale-125" : "bg-slate-200"
                  }`}
                />
              </h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                {getLocalizedLabel("print_without_ribbon", locale)}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Materials Catalog Block */}
      <div className="flex flex-col gap-6">
        {/* Section heading with controls */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              {getLocalizedLabel("all_materials", locale)}
              {total > 0 && <span className="ml-2.5 text-sm font-normal text-slate-400">({total})</span>}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile Filters Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex md:hidden h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="none">
                <path d="M3 5H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M5.5 10H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M8 15H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span>{getLocalizedLabel("filters", locale)}</span>
            </button>

            {/* Active print_method pill filter */}
            {printMethod && (
              <button
                type="button"
                onClick={() => togglePrintMethod(printMethod)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 pl-3 pr-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
              >
                <span>
                  {getLocalizedLabel(
                    printMethod === "inkjet"
                      ? "Inkjet"
                      : printMethod === "thermal-transfer"
                      ? "Thermal Transfer"
                      : "Thermal Direct",
                    locale
                  )}
                </span>
                <span className="text-sm font-bold opacity-60">×</span>
              </button>
            )}

            {/* Active base material pills */}
            {selectedBaseMaterials.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => toggleFilter("base_material", val)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 pl-3 pr-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
              >
                <span>{getLocalizedLabel(val === "paper" ? "Paper" : val === "pe (polyethylene)" ? "PE (polyethylene)" : val === "pp (polypropylene)" ? "PP (polypropylene)" : "PO (polyolefin)", locale)}</span>
                <span className="text-sm font-bold opacity-60">×</span>
              </button>
            ))}

            {/* Active finish pills */}
            {selectedFinishes.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => toggleFilter("finish", val)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 pl-3 pr-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
              >
                <span>{getLocalizedLabel(val === "glossy" ? "Glossy" : val === "matte" ? "Matte" : "Top Coated", locale)}</span>
                <span className="text-sm font-bold opacity-60">×</span>
              </button>
            ))}

            {/* Active adhesive pills */}
            {selectedAdhesives.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => toggleFilter("adhesive", val)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 pl-3 pr-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
              >
                <span>{getLocalizedLabel(val === "permanent" ? "Permanent" : "Removable", locale)}</span>
                <span className="text-sm font-bold opacity-60">×</span>
              </button>
            ))}

            {/* Clear All button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors py-1.5 px-3 rounded-full hover:bg-amber-50"
              >
                {getLocalizedLabel("clear_all", locale)}
              </button>
            )}

            {/* Sort select indicator */}
            <div className="ml-auto flex h-10 w-fit items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm">
              <select
                value={sort}
                onChange={(e) => updateQuery({ sort: e.target.value })}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="name_asc">{getLocalizedLabel("sort_by", locale)}</option>
                <option value="name_desc">{getLocalizedLabel("sort_by_desc", locale)}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout: Sidebar + Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:gap-8 items-start">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden md:flex flex-col gap-5 md:col-span-1">
            {filterSections.map((sec) => (
              <Accordion key={sec.type} title={sec.title} defaultOpen={true} size="compact" className="bg-white">
                <div className="flex flex-col gap-2 mt-2">
                  {sec.options.map((opt) => {
                    const active = sec.selected.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleFilter(sec.type, opt.value)}
                        className={`flex w-full min-h-9 items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs font-semibold border transition-all ${
                          active
                            ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                            : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {active && <span className="text-amber-600 font-bold text-sm">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </Accordion>
            ))}
          </aside>

          {/* Grid listing */}
          <div className="col-span-1 md:col-span-3 flex flex-col gap-8">
            {paginatedMaterials.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedMaterials.map((material) => (
                  <MaterialCard key={material.id} material={material} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="my-10 flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-lg mx-auto w-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  {getLocalizedLabel("no_materials_found", locale)}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {getLocalizedLabel("no_materials_desc", locale)}
                </p>
              </div>
            )}

            {/* Pagination controls */}
            {lastPage > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-6 pb-4">
                {activePage > 1 && (
                  <button
                    onClick={() => updateQuery({ page: String(activePage - 1) })}
                    className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    {getLocalizedLabel("previous", locale)}
                  </button>
                )}
                {Array.from({ length: lastPage }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => updateQuery({ page: String(p) })}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-full border px-3.5 text-xs font-bold transition-all ${
                        p === activePage
                          ? "bg-amber-50 border-amber-500 text-white shadow-md shadow-amber-500/10"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                {activePage < lastPage && (
                  <button
                    onClick={() => updateQuery({ page: String(activePage + 1) })}
                    className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    {getLocalizedLabel("next", locale)}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer/Modal for Filters */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300 md:hidden">
          <div className="flex h-full w-[280px] flex-col bg-white p-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-800">{getLocalizedLabel("filters", locale)}</h3>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
              {filterSections.map((sec) => (
                <div key={sec.type} className="flex flex-col gap-2">
                  <h4 className="text-sm font-bold text-slate-700 border-l-2 border-amber-500 pl-2 mb-1">
                    {sec.title}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {sec.options.map((opt) => {
                      const active = sec.selected.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleFilter(sec.type, opt.value)}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                            active
                              ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                              : "bg-slate-100 border-slate-100 hover:bg-amber-50 text-slate-600"
                          }`}
                        >
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mt-4 flex flex-col gap-2.5">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setMobileOpen(false);
                  }}
                  className="w-full h-10 border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  {getLocalizedLabel("clear_all", locale)}
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-sm font-semibold shadow-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
