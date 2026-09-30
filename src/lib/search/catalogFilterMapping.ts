import type { estypes } from "@elastic/elasticsearch";

export type MaterialFilterCategory = "Papier" | "Kunststof";
export type AfwerkingFilterCategory = "Mat" | "Glanzend";

export interface CatalogMaterialMappingEntry {
  materialCode: string;
  brand: string;
  materialDescription: string;
  finishing: string;
  glue: string;
  printMethod: string;
  vendor: string;
  materialFilter: MaterialFilterCategory;
  afwerkingFilter: AfwerkingFilterCategory;
}

export const CATALOG_MATERIAL_MAPPINGS: CatalogMaterialMappingEntry[] = [
  { materialCode: "1000D", brand: "Zebra", materialDescription: "Papier", finishing: "ECO coated", glue: "Permanent", printMethod: "TD", vendor: "Jarltech", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "1000D-tag", brand: "Zebra", materialDescription: "Papier", finishing: "ECO coated", glue: "Geen (ticket)", printMethod: "TD", vendor: "Jarltech", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "1000T", brand: "Zebra", materialDescription: "Papier", finishing: "Mat", glue: "Permanent", printMethod: "TT", vendor: "Jarltech", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "1000T-tag", brand: "Zebra", materialDescription: "Papier", finishing: "Mat", glue: "Geen (ticket)", printMethod: "TT", vendor: "Jarltech", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "2000D", brand: "Zebra", materialDescription: "Papier", finishing: "Top coated", glue: "Permanent", printMethod: "TD", vendor: "Jarltech", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "2000D-R", brand: "Zebra", materialDescription: "Papier", finishing: "Top coated", glue: "Verwijderbaar", printMethod: "TD", vendor: "Jarltech", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "2000D-tag", brand: "Zebra", materialDescription: "Papier", finishing: "Top coated", glue: "Geen (ticket)", printMethod: "TD", vendor: "Jarltech", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "2000T", brand: "Zebra", materialDescription: "Papier", finishing: "MAT", glue: "Permanent", printMethod: "TT", vendor: "Jarltech", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "3000T-CL", brand: "Zebra", materialDescription: "PP (polypropylene)", finishing: "Transparant", glue: "Diepvries", printMethod: "TT", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "3000T-PE", brand: "Zebra", materialDescription: "PE (polyethylene)", finishing: "Glanzend", glue: "Permanent", printMethod: "TT", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "3000T-PO", brand: "Zebra", materialDescription: "PO (polyolefin)", finishing: "Glanzend", glue: "Permanent", printMethod: "TT", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "3000T-PP", brand: "Zebra", materialDescription: "PP (polypropylene)", finishing: "Glanzend", glue: "Permanent", printMethod: "TT", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "3000T-S", brand: "Zebra", materialDescription: "PE (polyethylene)", finishing: "Glanzend zilver", glue: "Permanent", printMethod: "TT", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "3100T-PE", brand: "Zebra", materialDescription: "PE (polyethylene)", finishing: "Glanzend", glue: "Permanent", printMethod: "TT", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "3100T-PO", brand: "Zebra", materialDescription: "PO (polyolefin)", finishing: "Glanzend", glue: "Permanent", printMethod: "TT", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "3100T-PP", brand: "Zebra", materialDescription: "PP (polypropylene)", finishing: "Glanzend", glue: "Permanent", printMethod: "TT", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "8000T-B", brand: "Zebra", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Permanent", printMethod: "TT", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "8000T-C", brand: "Zebra", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Permanent", printMethod: "TT", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "8000t-PO-tag", brand: "Zebra", materialDescription: "PO (polyolefin)", finishing: "Glanzend", glue: "Geen (ticket)", printMethod: "TT", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "8000T-V", brand: "Zebra", materialDescription: "VOID", finishing: "MAT", glue: "Permanent", printMethod: "TT", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "8100T-PE", brand: "Zebra", materialDescription: "PE Destructible", finishing: "Mat", glue: "Permanent", printMethod: "TT", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "BOPS", brand: "Epson", materialDescription: "PP (polypropylene)", finishing: "Satin gloss", glue: "Permanent", printMethod: "Inkjet", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA010", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA015", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Hotmelt", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA050", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA050L", brand: "Diamondlabels", materialDescription: "Sandwich, papier op laminaat", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA050O", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Opaque, permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA050R", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Verwijderbaar", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA050S", brand: "Diamondlabels", materialDescription: "Scheurbestendig papier", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA055HT", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "High tack", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA055", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA070GR", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA090GR", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA100GR", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA107GR", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA120GR", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA120T", brand: "Diamondlabels", materialDescription: "Scheurbestendig papier", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA140GR", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA160GR", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA180GR", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA230GR", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA180T", brand: "Diamondlabels", materialDescription: "Scheurbestendig papier", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA260", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA260T", brand: "Diamondlabels", materialDescription: "Scheurbestendig papier", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA300", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Glanzend zilver", glue: "Permanent", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA400", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Glanzend", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA400B", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Glanzend", glue: "Afwasbaar", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA400F", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Glanzend", glue: "Diepvries", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA400H", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Glanzend", glue: "High tack", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA400O", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Glanzend", glue: "Opaque, permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA400R", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Glanzend", glue: "Verwijderbaar", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA600", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Glanzend", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA600B", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Glanzend", glue: "Afwasbaar", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA602", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Glanzend", glue: "Hotmelt", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA602H", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Glanzend", glue: "High tack", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA610", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Glanzend", glue: "Hotmelt", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA700", brand: "Diamondlabels", materialDescription: "PE (polyethylene)", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA700EC", brand: "Diamondlabels", materialDescription: "PET", finishing: "Transparant", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA700H", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "High tack", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA700T", brand: "Diamondlabels", materialDescription: "PE (polyethylene)", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA700W", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA700Z", brand: "Diamondlabels", materialDescription: "PET", finishing: "Glanzend zilver", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA701", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA703", brand: "Diamondlabels", materialDescription: "HDPE", finishing: "MAT", glue: "Hotmelt", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA703H", brand: "Diamondlabels", materialDescription: "HDPE", finishing: "MAT", glue: "High tack", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA703-Tag210", brand: "Diamondlabels", materialDescription: "HDPE", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA704", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA704H", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Hotmelt, High tag", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA704W", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA707-TD", brand: "Diamondlabels", materialDescription: "PP front, papier achter", finishing: "Glanzend, topcoated", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA715", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Glanzend", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA715UR", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Glanzend", glue: "Ultra verwijderbaar", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA717", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Transparant", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA725", brand: "Diamondlabels", materialDescription: "PET", finishing: "Glanzend", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA727", brand: "Diamondlabels", materialDescription: "PET", finishing: "Transparant", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA729", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Satin gloss", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA730", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Hotmelt", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA730R", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Glanzend", glue: "Verwijderbaar", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA735", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Glanzend", glue: "Hotmelt", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA735R", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Glanzend", glue: "Verwijderbaar", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA73-tag", brand: "Diamondlabels", materialDescription: "HDPE", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA760", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA760H", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Hotmelt", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIB050R", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIC200", brand: "Creative", materialDescription: "Papier", finishing: "Houtstructuur mat", glue: "Hotmelt", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIW1", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Gestructureerd mat", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIW2", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Gestructureerd mat", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIW3", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Gestructureerd mat", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIW4", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Gestructureerd mat", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIW5", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Gestructureerd mat", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIW6", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Gestructureerd mat", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD01", brand: "Diamondlabels", materialDescription: "Papier", finishing: "ECO coated", glue: "Permanent", printMethod: "TD", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD01H", brand: "Diamondlabels", materialDescription: "Papier", finishing: "ECO coated", glue: "Extra permanent", printMethod: "TD", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD01R", brand: "Diamondlabels", materialDescription: "Papier", finishing: "ECO coated", glue: "Verwijderbaar", printMethod: "TD", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD02", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Top coated", glue: "Permanent", printMethod: "TD", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD02T", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Top coated", glue: "Hotmelt", printMethod: "TD", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD03", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Top coated", glue: "Permanent", printMethod: "TD", vendor: "Supply service", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTD04", brand: "Diamondlabels", materialDescription: "PE (polyethylene)", finishing: "Top coated", glue: "Permanent", printMethod: "TD", vendor: "Supply service", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTD05", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Top coated", glue: "Permanent", printMethod: "TD", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD06", brand: "Diamondlabels", materialDescription: "Papier", finishing: "ECO coated", glue: "Permanent", printMethod: "TD", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD07", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Top coated", glue: "Permanent", printMethod: "TD", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD07R", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Top coated", glue: "Verwijderbaar", printMethod: "TD", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD08", brand: "Diamondlabels", materialDescription: "Papier", finishing: "ECO coated", glue: "Permanent", printMethod: "TD", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD09", brand: "Diamondlabels", materialDescription: "Papier", finishing: "ECO coated", glue: "Permanent", printMethod: "TD", vendor: "Supply service", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD09F", brand: "Diamondlabels", materialDescription: "Papier", finishing: "ECO coated", glue: "Diepvries", printMethod: "TD", vendor: "Supply service", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD09R", brand: "Diamondlabels", materialDescription: "Papier", finishing: "ECO coated", glue: "Verwijderbaar", printMethod: "TD", vendor: "Supply service", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD10", brand: "Diamondlabels", materialDescription: "Papier", finishing: "ECO coated", glue: "Hotmelt", printMethod: "TD", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD15", brand: "Diamondlabels", materialDescription: "Papier", finishing: "ECO coated", glue: "Permanent", printMethod: "TD", vendor: "W&R Etiketten BV", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD40", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Silicone coated", glue: "Linerless, hotmelt", printMethod: "TD", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DTD50", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Top coated", glue: "Geen (ticket)", printMethod: "TD", vendor: "Supply service", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD60", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Top coated", glue: "Permanent", printMethod: "TD", vendor: "Profilabel", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT01", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Ongecoat", glue: "Permanent", printMethod: "TT", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTT01B", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Ongecoat", glue: "Afwasbaar", printMethod: "TT", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTT01H", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Ongecoat", glue: "Extra permanent", printMethod: "TT", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTT01R", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Ongecoat", glue: "Verwijderbaar", printMethod: "TT", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTT02", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Permanent", printMethod: "TT", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTT02T", brand: "Diamondlabels", materialDescription: "Scheurbestendig papier", finishing: "MAT", glue: "Permanent", printMethod: "TT", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTT03", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Geen (ticket)", printMethod: "TT", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTT04", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Glanzend", glue: "Permanent", printMethod: "TT", vendor: "Supply service", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT04B", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Blauw", glue: "Permanent", printMethod: "TT", vendor: "Supply service", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT04O", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Oranje", glue: "High tack", printMethod: "TT", vendor: "Supply service", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT04Y", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Geel", glue: "Permanent", printMethod: "TT", vendor: "Supply service", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT05", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Permanent", printMethod: "TT", vendor: "Supply service", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT05Z", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Mat zilver", glue: "High tack", printMethod: "TT", vendor: "Supply service", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT06", brand: "Diamondlabels", materialDescription: "PE (polyethylene)", finishing: "Glanzend", glue: "Permanent", printMethod: "TT", vendor: "Supply service", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT07", brand: "Diamondlabels", materialDescription: "PET", finishing: "Satin gloss", glue: "Permanent", printMethod: "TT", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT07U", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Ultra verwijderbaar", printMethod: "TT", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTT08", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Ongecoat", glue: "Permanent", printMethod: "TT", vendor: "Nakagawa", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTT09", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Satin gloss", glue: "Geen (ticket)", printMethod: "TT", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT10", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Machine coated", glue: "Permanent", printMethod: "TT", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTT11", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Ongecoat", glue: "Permanent", printMethod: "TT", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTT14", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Glanzend", glue: "Permanent", printMethod: "TT", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT15", brand: "Diamondlabels", materialDescription: "PET", finishing: "Glanzend", glue: "Permanent", printMethod: "TT", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT17", brand: "Diamondlabels", materialDescription: "PE (polyethylene)", finishing: "Glanzend", glue: "Permanent", printMethod: "TD", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT170gr", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Geen (ticket)", printMethod: "TT", vendor: "Profilabel", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTT20", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Glanzend", glue: "Permanent", printMethod: "TT", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT21", brand: "Diamondlabels", materialDescription: "PET", finishing: "MAT", glue: "Permanent", printMethod: "TT", vendor: "Profilabel", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT22", brand: "Diamondlabels", materialDescription: "PET", finishing: "Mat zilver", glue: "Permanent", printMethod: "TT", vendor: "Profilabel", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT23", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Glanzend", glue: "Extra permanent", printMethod: "TT", vendor: "Profilabel", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT24", brand: "Diamondlabels", materialDescription: "150 mu PE (polyethylene)", finishing: "MAT", glue: "Geen (ticket)", printMethod: "TT", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT25", brand: "Diamondlabels", materialDescription: "155 mu PP (polypropylene)", finishing: "MAT", glue: "Geen (ticket)", printMethod: "TT", vendor: "Profilabel", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT26", brand: "Diamondlabels", materialDescription: "PET", finishing: "Mat zilver", glue: "Extra permanent", printMethod: "TT", vendor: "Profilabel", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT35", brand: "Diamondlabels", materialDescription: "350 mu PP (polypropylene)", finishing: "MAT", glue: "Geen (ticket)", printMethod: "TT", vendor: "Profilabel", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT38", brand: "Diamondlabels", materialDescription: "HDPE", finishing: "MAT", glue: "Extra permanent", printMethod: "TT", vendor: "Profilabel", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT50", brand: "Diamondlabels", materialDescription: "Vinyl", finishing: "Glanzend zilver", glue: "High tack", printMethod: "TT", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT67", brand: "Diamondlabels", materialDescription: "PET", finishing: "Glanzend", glue: "Extra permanent", printMethod: "TT", vendor: "Profilabel", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT70", brand: "Diamondlabels", materialDescription: "PET", finishing: "MAT", glue: "Extra permanent", printMethod: "TT", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT71", brand: "Diamondlabels", materialDescription: "PET", finishing: "Mat zilver", glue: "Extra permanent", printMethod: "TT", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT75", brand: "Diamondlabels", materialDescription: "PET", finishing: "Mat zilver", glue: "Permanent", printMethod: "TT", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT77", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "Transparant", glue: "Extra permanent", printMethod: "TT", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "High gloss label", brand: "Epson", materialDescription: "Papier", finishing: "Glanzend", glue: "Permanent", printMethod: "Inkjet", vendor: "Jarltech", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "PE matte", brand: "Epson", materialDescription: "PE (polyethylene)", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "PIA100", brand: "Pure Labels", materialDescription: "Gras papier", finishing: "Inktjet coated", glue: "Hotmelt", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "PP matte", brand: "Epson", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Jarltech", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "Premium matte", brand: "Epson", materialDescription: "Papier", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Jarltech", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "SE01", brand: "Seiko", materialDescription: "Papier", finishing: "Top coated", glue: "Permanent", printMethod: "TD", vendor: "Seiko Instruments GMBH", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "SE01O", brand: "Seiko", materialDescription: "Papier", finishing: "Top coated", glue: "Opaque, permanent", printMethod: "TD", vendor: "Seiko Instruments GMBH", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "SE01R", brand: "Seiko", materialDescription: "Papier", finishing: "Top coated", glue: "Verwijderbaar", printMethod: "TD", vendor: "Seiko Instruments GMBH", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "SE02", brand: "Seiko", materialDescription: "Papier", finishing: "Top coated", glue: "Geen (ticket)", printMethod: "TD", vendor: "Seiko Instruments GMBH", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "SE03", brand: "Seiko", materialDescription: "PE (polyethylene)", finishing: "Top coated", glue: "Permanent", printMethod: "TD", vendor: "Seiko Instruments GMBH", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "SE03C", brand: "Seiko", materialDescription: "PE (polyethylene)", finishing: "Transparant", glue: "Permanent", printMethod: "TD", vendor: "Seiko Instruments GMBH", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "SE-B", brand: "Seiko", materialDescription: "Papier", finishing: "Blauw", glue: "Permanent", printMethod: "TD", vendor: "Seiko Instruments GMBH", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "SE-R", brand: "Seiko", materialDescription: "Papier", finishing: "Rood", glue: "Permanent", printMethod: "TD", vendor: "Seiko Instruments GMBH", materialFilter: "Papier", afwerkingFilter: "Glanzend" },
  { materialCode: "Voucher", brand: "Epson", materialDescription: "Papier", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Jarltech", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA740", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Hotmelt", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA740H", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "High tack", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTD10R", brand: "Diamondlabels", materialDescription: "Papier", finishing: "ECO coated", glue: "Verwijderbaar", printMethod: "TD", vendor: "Polcoat", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DTD41", brand: "Diamondlabels", materialDescription: "Papier", finishing: "Top coated", glue: "Verwijderbaar", printMethod: "TD", vendor: "W&R Etiketten BV", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "PE85", brand: "Diamondlabels", materialDescription: "PE (polyethylene)", finishing: "Glanzend, topcoated", glue: "Permanent", printMethod: "TT", vendor: "Profilabel", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DIA720", brand: "Diamondlabels", materialDescription: "PE (polyethylene)", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA720W", brand: "Diamondlabels", materialDescription: "PE (polyethylene)", finishing: "MAT", glue: "Geen (ticket)", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA741H", brand: "Diamondlabels", materialDescription: "PP (polypropylene)", finishing: "MAT", glue: "Hotmelt, High tag", printMethod: "Inkjet", vendor: "Polcoat", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTD12", brand: "Diamondlabels", materialDescription: "Papier", finishing: "ECO coated", glue: "Hotmelt", printMethod: "TD", vendor: "activaTec ", materialFilter: "Papier", afwerkingFilter: "Mat" },
  { materialCode: "DIA750L", brand: "Diamondlabels", materialDescription: "Sandwich, PP op laminaat", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Nakagawa", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DTT18", brand: "Diamondlabels", materialDescription: "PE (polyethylene)", finishing: "Glanzend", glue: "Permanent", printMethod: "TT", vendor: "Kolibri", materialFilter: "Kunststof", afwerkingFilter: "Glanzend" },
  { materialCode: "DTT34", brand: "Diamondlabels", materialDescription: "HDPE", finishing: "MAT", glue: "Geen (ticket)", printMethod: "TT", vendor: "Profilabel", materialFilter: "Kunststof", afwerkingFilter: "Mat" },
  { materialCode: "DIA060", brand: "Diamondlabels", materialDescription: "Papier", finishing: "MAT", glue: "Permanent", printMethod: "Inkjet", vendor: "Kolibri", materialFilter: "Papier", afwerkingFilter: "Mat" },
];

export const MATERIAL_FILTER_VALUES: MaterialFilterCategory[] = ["Papier", "Kunststof"];
export const AFWERKING_FILTER_VALUES: AfwerkingFilterCategory[] = ["Mat", "Glanzend"];

function buildCodeVariants(code: string): string[] {
  const trimmed = code.trim();
  const set = new Set<string>([
    trimmed,
    trimmed.toLowerCase(),
    trimmed.toUpperCase(),
  ]);

  if (trimmed.toLowerCase() === "pp matte") {
    set.add("PP Matte");
    set.add("PP matte");
  }
  if (trimmed.toLowerCase() === "pe matte") {
    set.add("PE Matte");
    set.add("PE matte");
  }

  return Array.from(set);
}

const papierCodesSet = new Set<string>();
const kunststofCodesSet = new Set<string>();
const matCodesSet = new Set<string>();
const glanzendCodesSet = new Set<string>();

const papierDescriptionsSet = new Set<string>();
const kunststofDescriptionsSet = new Set<string>();
const matAfwerkingenSet = new Set<string>();
const glanzendAfwerkingenSet = new Set<string>();

CATALOG_MATERIAL_MAPPINGS.forEach((entry) => {
  const codeVariants = buildCodeVariants(entry.materialCode);

  if (entry.materialFilter === "Papier") {
    codeVariants.forEach((c) => papierCodesSet.add(c));
    if (entry.materialDescription) papierDescriptionsSet.add(entry.materialDescription);
  } else if (entry.materialFilter === "Kunststof") {
    codeVariants.forEach((c) => kunststofCodesSet.add(c));
    if (entry.materialDescription) kunststofDescriptionsSet.add(entry.materialDescription);
  }

  if (entry.afwerkingFilter === "Mat") {
    codeVariants.forEach((c) => matCodesSet.add(c));
    if (entry.finishing) matAfwerkingenSet.add(entry.finishing);
  } else if (entry.afwerkingFilter === "Glanzend") {
    codeVariants.forEach((c) => glanzendCodesSet.add(c));
    if (entry.finishing) glanzendAfwerkingenSet.add(entry.finishing);
  }
});

export const PAPIER_MATERIAL_CODES = Array.from(papierCodesSet);
export const KUNSTSTOF_MATERIAL_CODES = Array.from(kunststofCodesSet);
export const MAT_MATERIAL_CODES = Array.from(matCodesSet);
export const GLANZEND_MATERIAL_CODES = Array.from(glanzendCodesSet);

export const PAPIER_DESCRIPTIONS = Array.from(papierDescriptionsSet);
export const KUNSTSTOF_DESCRIPTIONS = Array.from(kunststofDescriptionsSet);
export const MAT_AFWERKINGEN = Array.from(matAfwerkingenSet);
export const GLANZEND_AFWERKINGEN = Array.from(glanzendAfwerkingenSet);

/**
 * Normalizes an incoming material query value into "Papier" or "Kunststof".
 */
export function normalizeMaterialFilterCategory(raw: string): MaterialFilterCategory | null {
  const val = raw.trim().toLowerCase();
  if (val === "papier" || val === "paper") return "Papier";
  if (val === "kunststof" || val === "plastic" || val === "synthetic") return "Kunststof";

  if (PAPIER_DESCRIPTIONS.some((d) => d.toLowerCase() === val)) return "Papier";
  if (KUNSTSTOF_DESCRIPTIONS.some((d) => d.toLowerCase() === val)) return "Kunststof";

  if (PAPIER_MATERIAL_CODES.some((c) => c.toLowerCase() === val)) return "Papier";
  if (KUNSTSTOF_MATERIAL_CODES.some((c) => c.toLowerCase() === val)) return "Kunststof";

  return null;
}

/**
 * Normalizes an incoming finishing query value into "Mat" or "Glanzend".
 */
export function normalizeAfwerkingFilterCategory(raw: string): AfwerkingFilterCategory | null {
  const val = raw.trim().toLowerCase();
  if (val === "mat" || val === "matte") return "Mat";
  if (val === "glanzend" || val === "glossy" || val === "gloss") return "Glanzend";

  if (MAT_AFWERKINGEN.some((a) => a.toLowerCase() === val)) return "Mat";
  if (GLANZEND_AFWERKINGEN.some((a) => a.toLowerCase() === val)) return "Glanzend";

  if (MAT_MATERIAL_CODES.some((c) => c.toLowerCase() === val)) return "Mat";
  if (GLANZEND_MATERIAL_CODES.some((c) => c.toLowerCase() === val)) return "Glanzend";

  return null;
}

/**
 * Single category clause for "Papier"
 */
export function papierQueryClause(): estypes.QueryDslQueryContainer {
  return {
    bool: {
      should: [
        { terms: { "catalog_material_code.keyword": PAPIER_MATERIAL_CODES } },
        { terms: { "catalog_material.keyword": PAPIER_DESCRIPTIONS } },
        { wildcard: { "catalog_material.keyword": "*papier*" } },
      ],
      minimum_should_match: 1,
    },
  };
}

/**
 * Single category clause for "Kunststof"
 */
export function kunststofQueryClause(): estypes.QueryDslQueryContainer {
  return {
    bool: {
      should: [
        { terms: { "catalog_material_code.keyword": KUNSTSTOF_MATERIAL_CODES } },
        { terms: { "catalog_material.keyword": KUNSTSTOF_DESCRIPTIONS } },
      ],
      minimum_should_match: 1,
    },
  };
}

/**
 * Single category clause for "Mat"
 */
export function matQueryClause(): estypes.QueryDslQueryContainer {
  return {
    bool: {
      should: [
        { terms: { "catalog_material_code.keyword": MAT_MATERIAL_CODES } },
        {
          nested: {
            path: "properties",
            query: {
              terms: { "properties.afwerking.keyword": MAT_AFWERKINGEN },
            },
          },
        },
      ],
      minimum_should_match: 1,
    },
  };
}

/**
 * Single category clause for "Glanzend"
 */
export function glanzendQueryClause(): estypes.QueryDslQueryContainer {
  return {
    bool: {
      should: [
        { terms: { "catalog_material_code.keyword": GLANZEND_MATERIAL_CODES } },
        {
          nested: {
            path: "properties",
            query: {
              terms: { "properties.afwerking.keyword": GLANZEND_AFWERKINGEN },
            },
          },
        },
      ],
      minimum_should_match: 1,
    },
  };
}

/**
 * Builds Elasticsearch Query Container for the Material filter given raw selected values.
 */
export function buildMaterialFilterClause(values: string[]): estypes.QueryDslQueryContainer | null {
  if (!values || values.length === 0) return null;

  const categories = new Set<MaterialFilterCategory>();
  for (const v of values) {
    const norm = normalizeMaterialFilterCategory(v);
    if (norm) categories.add(norm);
  }

  if (categories.size === 0) return null;
  if (categories.has("Papier") && categories.has("Kunststof")) {
    return {
      bool: {
        should: [papierQueryClause(), kunststofQueryClause()],
        minimum_should_match: 1,
      },
    };
  }

  if (categories.has("Papier")) return papierQueryClause();
  if (categories.has("Kunststof")) return kunststofQueryClause();

  return null;
}

/**
 * Builds Elasticsearch Query Container for the Afwerking filter given raw selected values.
 */
export function buildFinishingFilterClause(values: string[]): estypes.QueryDslQueryContainer | null {
  if (!values || values.length === 0) return null;

  const categories = new Set<AfwerkingFilterCategory>();
  for (const v of values) {
    const norm = normalizeAfwerkingFilterCategory(v);
    if (norm) categories.add(norm);
  }

  if (categories.size === 0) return null;
  if (categories.has("Mat") && categories.has("Glanzend")) {
    return {
      bool: {
        should: [matQueryClause(), glanzendQueryClause()],
        minimum_should_match: 1,
      },
    };
  }

  if (categories.has("Mat")) return matQueryClause();
  if (categories.has("Glanzend")) return glanzendQueryClause();

  return null;
}

/**
 * Builds the Elasticsearch filter aggregation for Material ("Papier" vs "Kunststof")
 */
export function buildMaterialFilterAggregation(): estypes.AggregationsAggregationContainer {
  return {
    filters: {
      filters: {
        Papier: papierQueryClause(),
        Kunststof: kunststofQueryClause(),
      },
    },
  };
}

/**
 * Builds the Elasticsearch filter aggregation for Finishing ("Mat" vs "Glanzend")
 */
export function buildFinishingFilterAggregation(): estypes.AggregationsAggregationContainer {
  return {
    filters: {
      filters: {
        Mat: matQueryClause(),
        Glanzend: glanzendQueryClause(),
      },
    },
  };
}
