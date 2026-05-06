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
 * Mirrors `App\Http\Resources\Api\PrinterResource` from the Laravel backend.
 * Stored printer technical details live in `meta` as post_meta values.
 * Multi-select admin fields (`druktype`, `width`, `buiten_diameter`,
 * `detectie`, `kern`) round-trip as string arrays via the JSON accessor on
 * `PostMeta`; single-value fields stay as strings.
 */
export type PrinterMeta = {
  druktype?: string[] | string;
  kern?: string[] | string;
  width?: string[];
  buiten_diameter?: string[] | string;
  detectie?: string[] | string;
  label_breedte?: string;
  label_type?: string;
  max_buiten_diameter?: string;
  subtitle?: string;
  featured?: string;
  printer_url?: string;
};

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
  meta: PrinterMeta;
  created_at: string | null;
  updated_at: string | null;
};
