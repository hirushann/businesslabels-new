/**
 * Printer option for select/combobox fields
 */
export type PrinterOption = {
  id: number;
  name: string;
  slug: string;
};

/**
 * API response for printer select endpoint
 */
export type PrinterSelectResponse = {
  data: PrinterOption[];
  error?: string;
};

/**
 * Printer properties using Vanilo property system.
 * These properties are used for compatibility matching with products.
 *
 * @see Backend: app/Http/Resources/Api/PrinterResource
 * @see Docs: docs/FRONTEND_PRINTER_COMPATIBILITY_INTEGRATION.md
 */
export type PrinterProperties = {
  /** Print methods supported (TD = Thermal Direct, TT = Thermal Transfer) */
  printmethode?: string[];
  
  /** Supported label widths in mm */
  breedte?: string[];
  
  /** Minimum label width in mm */
  'label-breedte-min'?: string[];
  
  /** Maximum label width in mm */
  'label-breedte-max'?: string[];
  
  /** Supported core diameters in mm (can include "Fan-fold") */
  kern?: string[];
  
  /** Supported outer diameters in mm */
  'buiten-diameter'?: string[];
  
  /** Maximum outer diameter in mm */
  'max-buiten-diameter'?: string[];
  
  /** Detection methods (GAP, Blackmark, etc.) */
  detectie?: string[];
  
  /** Label types (Rollen, Fan-fold, etc.) */
  labeltype?: string[];
  
  /** Printer subtitle/description */
  'printer-subtitle'?: string[];
  
  // Legacy fields for backwards compatibility (deprecated)
  /** @deprecated Use printmethode instead */
  druktype?: string[];
  /** @deprecated Use breedte with label-breedte-min/max instead */
  width?: string[];
  /** @deprecated Use buiten-diameter with max-buiten-diameter instead */
  buiten_diameter?: string[];
  /** @deprecated Use kern instead */
  label_breedte?: string;
  /** @deprecated Use labeltype instead */
  label_type?: string;
  /** @deprecated Use max-buiten-diameter instead */
  max_buiten_diameter?: string;
  subtitle?: string;
  featured?: string;
  printer_url?: string;
};

/**
 * Full printer resource from the API.
 * Uses `properties` field (Vanilo system) instead of legacy `meta` field.
 */
export type Printer = {
  id: number;
  title: string | null;
  subtitle: string | null;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  status: string;
  template: string | null;
  image: string | null;
  thumbnail?: string | null;
  properties: PrinterProperties;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * @deprecated Legacy type - use PrinterProperties instead
 */
export type PrinterMeta = PrinterProperties;
