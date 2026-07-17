"use client";

import Image from "next/image";
import Link from "next/link";
import type { Material } from "@/lib/search/materials";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";

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
      "view_details": "View Details",
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
      "view_details": "Bekijk Details",
    }
  };
  const lang = locale === "nl" ? "nl" : "en";
  return dictionary[lang][key] || key;
};

function normalizePrintMethod(raw: string): string {
  const s = raw.toLowerCase().replace(/[\s_-]+/g, "");
  if (s === "inkjet") return "Inkjet";
  if (s === "thermaltransfer" || s === "ttr" || s === "tt") return "Thermal Transfer";
  if (s === "thermaldirect" || s === "dt" || s === "directthermal") return "Thermal Direct";
  return "";
}

function printMethodLabelFromSlug(method?: string) {
  if (method === "inkjet") return "Inkjet";
  if (method === "thermal-transfer") return "Thermal Transfer";
  if (method === "thermal-direct") return "Thermal Direct";
  return "";
}

export function deriveMaterialAttributes(material: Material, currentPrintMethod?: string) {
  let printTech = material.print_method ? normalizePrintMethod(material.print_method) : "";
  const printTechs: string[] = printTech ? [printTech] : [];

  if (printTechs.length === 0) {
    const cats = [
      ...(material.categories ?? []).map((c) => c.slug),
      ...(material.category_slugs ?? []),
    ].map((slug) => slug.toLowerCase());
    const hasInkjet = cats.some((s) => s.includes("inkjet"));
    const hasTT = cats.some((s) =>
      s.includes("thermal-transfer") ||
      s.includes("thermische-overdracht") ||
      s.endsWith("-tt") ||
      s === "ttr" ||
      s === "tt"
    );
    const hasTD = cats.some((s) =>
      s.includes("thermal-direct") ||
      s.includes("thermisch-direct") ||
      s.endsWith("-td") ||
      s === "dt" ||
      s === "td"
    );

    if (hasInkjet) printTechs.push("Inkjet");
    if (hasTT) printTechs.push("Thermal Transfer");
    if (hasTD) printTechs.push("Thermal Direct");
  }

  if (!printTech) {
    if (currentPrintMethod === "inkjet" && printTechs.includes("Inkjet")) {
      printTech = "Inkjet";
    } else if (currentPrintMethod === "thermal-transfer" && printTechs.includes("Thermal Transfer")) {
      printTech = "Thermal Transfer";
    } else if (currentPrintMethod === "thermal-direct" && printTechs.includes("Thermal Direct")) {
      printTech = "Thermal Direct";
    } else {
      printTech = printTechs[0] || printMethodLabelFromSlug(currentPrintMethod);
    }
  }

  let baseMat = material.base_material || "";
  if (!baseMat && material.categories) {
    const cats = material.categories.map((c) => c.slug.toLowerCase());
    const contentText = [
      material.title,
      material.subtitle,
      material.code,
    ].filter(Boolean).join(" ").toLowerCase();

    if (cats.some((s) => s.includes("papier") || s.includes("paper"))) {
      baseMat = "Paper";
    } else if (cats.some((s) => s.includes("pe") || s.includes("polyethylene"))) {
      baseMat = "PE (polyethylene)";
    } else if (cats.some((s) => s.includes("pp") || s.includes("polypropylene"))) {
      baseMat = "PP (polypropylene)";
    } else if (cats.some((s) => s.includes("po") || s.includes("polyolefin"))) {
      baseMat = "PO (polyolefin)";
    } else {
      const isSynthetic = cats.some((s) => s.includes("kunststof") || s.includes("synthetic") || s.includes("plastic"));
      if (isSynthetic) {
        if (/\b(pe|polyethylene|polyethyleen)\b/i.test(contentText) || /-pe\b/i.test(contentText)) {
          baseMat = "PE (polyethylene)";
        } else if (/\b(pp|polypropylene|polypropyleen)\b/i.test(contentText) || /-pp\b/i.test(contentText)) {
          baseMat = "PP (polypropylene)";
        } else if (/\b(po|polyolefin|polyolefine)\b/i.test(contentText) || /-po\b/i.test(contentText)) {
          baseMat = "PO (polyolefin)";
        } else {
          baseMat = "PE (polyethylene)";
        }
      } else {
        if (/\b(pe|polyethylene|polyethyleen)\b/i.test(contentText) || /-pe\b/i.test(contentText)) {
          baseMat = "PE (polyethylene)";
        } else if (/\b(pp|polypropylene|polypropyleen)\b/i.test(contentText) || /-pp\b/i.test(contentText)) {
          baseMat = "PP (polypropylene)";
        } else if (/\b(po|polyolefin|polyolefine)\b/i.test(contentText) || /-po\b/i.test(contentText)) {
          baseMat = "PO (polyolefin)";
        } else if (/\b(papier|paper)\b/i.test(contentText)) {
          baseMat = "Paper";
        } else {
          baseMat = "Paper";
        }
      }
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

  return { printTech, printTechs, baseMat, finish, adhesive, weight, thickness };
}

function PrintMethodBadgeIcon({ tech }: { tech: string }) {
  if (tech === "Inkjet") {
    return (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a7 7 0 0 0 7-7c0-4.25-4.39-8.92-6.22-10.7a1.1 1.1 0 0 0-1.56 0C9.39 5.08 5 9.75 5 14a7 7 0 0 0 7 7Z" />
      </svg>
    );
  }

  if (tech === "Thermal Transfer") {
    return (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 17h16M7 7v10m10-10v10M9.5 12h5" />
      </svg>
    );
  }

  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" />
    </svg>
  );
}

function plainText(value?: string | null): string {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function MaterialCard({
  material,
  locale,
  printMethod,
}: {
  material: Material;
  locale: string;
  printMethod?: string;
}) {
  const { printTechs, baseMat, finish, adhesive, weight, thickness } = deriveMaterialAttributes(material, printMethod);
  const cardImage = toDisplayImageUrl(material.main_image) || "/images/material-placeholder.svg";
  const materialSummary = plainText(material.excerpt || material.description || material.subtitle);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(109,109,120,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(109,109,120,0.12)]">
      <Link href={`/material/${material.slug}`} className="relative block h-60 w-full overflow-hidden bg-slate-50">
        <Image
          src={cardImage}
          alt={material.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2 z-10">
          {printTechs.map((tech) => {
            const isInkjet = tech === "Inkjet";
            const isTtr = tech === "Thermal Transfer";
            return (
              <span
                key={tech}
                className={`rounded-full px-3 py-1.5 text-xs font-normal bg-white text-slate-600 shadow-sm flex items-center gap-1.5 ${isInkjet
                  ? ""
                  : isTtr
                    ? "bg-slate-700"
                    : "bg-emerald-600"
                  }`}
              >
                <PrintMethodBadgeIcon tech={tech} />
                {getLocalizedLabel(tech, locale)}
              </span>
            );
          })}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Link href={`/material/${material.slug}`} className="inline-block text-lg rounded-md font-bold uppercase tracking-wide text-link transition-colors">
              {material.code}
            </Link>
            <span className="text-xs text-slate-400 font-medium">{material.brand || "Diamondlabels"}</span>
          </div>

          <h3 className="mb-2 text-lg font-bold leading-snug line-clamp-1">
            <Link href={`/material/${material.slug}`} className="text-slate-800 hover:text-brand transition-colors">
              {material.subtitle ? material.subtitle : material.title}
            </Link>
          </h3>

          {materialSummary ? (
            <p className="mb-4 text-sm leading-relaxed text-slate-500 line-clamp-2">
              {materialSummary}
            </p>
          ) : null}

          <div className="mb-5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-brand-soft border border-brand/30 px-2.5 py-1 text-xs font-medium text-brown-600">
              {getLocalizedLabel(baseMat, locale)}
            </span>
            <span className="rounded-full bg-violet-50 border border-violet-200 px-2.5 py-1 text-xs font-medium text-violet-900">
              {getLocalizedLabel(finish, locale)}
            </span>
            <span className="rounded-full bg-lime-50 border border-lime-200 px-2.5 py-1 text-xs font-medium text-lime-900">
              {getLocalizedLabel(adhesive, locale)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 pb-1">
            <div className="flex flex-row gap-3 items-center">
              <span className="text-sm text-slate-700">
                {getLocalizedLabel("Weight", locale)}
              </span>
              <span className="text-sm font-bold text-slate-700">{weight}</span>
            </div>
            <div className="flex flex-row gap-3 items-center">
              <span className="text-sm text-slate-700">
                {getLocalizedLabel("Thickness", locale)}
              </span>
              <span className="text-sm font-bold text-slate-700">{thickness}</span>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Link
            href={`/material/${material.slug}`}
            className="flex h-11 items-center justify-center rounded-full bg-brand px-5 text-normal font-bold text-white shadow-sm transition-all duration-200 hover:bg-brand-hover hover:shadow-md hover:shadow-brand/10"
          >
            {getLocalizedLabel("view_details", locale)}
          </Link>
        </div>
      </div>
    </article>
  );
}
