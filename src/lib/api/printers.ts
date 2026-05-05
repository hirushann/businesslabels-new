import type { PrinterSelectResponse } from '@/lib/types/printer';

/**
 * Fetches printer options for select/combobox fields
 * @returns Promise with printer options (id, name, slug)
 */
export async function fetchPrinterOptions(): Promise<PrinterSelectResponse> {
  try {
    const response = await fetch('/api/printers/select', {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return {
        data: [],
        error: 'Failed to fetch printers',
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching printers:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch printers',
    };
  }
}
