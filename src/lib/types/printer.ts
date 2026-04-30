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
