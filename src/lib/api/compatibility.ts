/**
 * Printer ↔ Product Compatibility API
 *
 * Provides functions to fetch compatible products for printers,
 * compatible printers for products, and check specific compatibility.
 *
 * @see Laravel: app/Http/Controllers/Api/PrinterProductController.php
 * @see Docs: docs/FRONTEND_PRINTER_COMPATIBILITY_INTEGRATION.md
 */

import type { Printer, PrinterProperties } from '@/lib/types/printer';
import type { Product, ProductProperties } from '@/lib/types/product';

// ─── Response Types ──────────────────────────────────────────────────────

type PaginationMeta = {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
};

export type PrinterProductsResponse = {
  printer: Printer;
  products: {
    data: Product[];
    meta: PaginationMeta;
  };
};

export type ProductPrintersResponse = {
  product: Product;
  printers: {
    data: Printer[];
    meta: PaginationMeta;
  };
};

export type MaterialProductsResponse = {
  material: {
    id: number;
    name: string;
    slug: string;
    category: {
      id: number;
      name: string;
    } | null;
  };
  products: {
    data: Product[];
    meta: PaginationMeta;
  };
};

export type CompatibilityResponse = {
  compatibility: boolean;
};

// ─── Request Options ─────────────────────────────────────────────────────

type PrinterProductsOptions = {
  productType?: 'labels' | 'ink';
  perPage?: number;
};

type ProductPrintersOptions = {
  perPage?: number;
  status?: 'published' | 'draft';
};

type MaterialProductsOptions = {
  productType?: 'labels' | 'ink';
  perPage?: number;
};

// ─── API Functions ───────────────────────────────────────────────────────

/**
 * Fetch compatible products for a specific printer.
 *
 * @param printerId - The printer ID
 * @param options - Optional filters (productType, perPage)
 * @returns Promise with printer details and paginated compatible products
 *
 * @example
 * const { printer, products } = await getPrinterProducts(1, {
 *   productType: 'labels',
 *   perPage: 20
 * });
 */
export async function getPrinterProducts(
  printerId: number,
  options?: PrinterProductsOptions
): Promise<PrinterProductsResponse> {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  
  const response = await fetch(`${baseUrl}/api/products/printer-products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      printer_id: printerId,
      product_type: options?.productType,
      per_page: options?.perPage || 20,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch compatible products: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch compatible printers for a specific product.
 *
 * @param productId - The product ID
 * @param options - Optional filters (perPage, status)
 * @returns Promise with product details and paginated compatible printers
 *
 * @example
 * const { product, printers } = await getProductPrinters(42, {
 *   perPage: 8,
 *   status: 'published'
 * });
 */
export async function getProductPrinters(
  productId: number,
  options?: ProductPrintersOptions
): Promise<ProductPrintersResponse> {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  
  const response = await fetch(`${baseUrl}/api/products/product-printers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      per_page: options?.perPage || 20,
      status: options?.status || 'published',
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch compatible printers: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch all products made from a specific material.
 *
 * @param materialId - The material ID
 * @param options - Optional filters (productType, perPage)
 * @returns Promise with material details and paginated products
 *
 * @example
 * const { material, products } = await getMaterialProducts(5, {
 *   productType: 'labels',
 *   perPage: 20
 * });
 */
export async function getMaterialProducts(
  materialId: number,
  options?: MaterialProductsOptions
): Promise<MaterialProductsResponse> {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  
  const response = await fetch(`${baseUrl}/api/products/material-products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      material_id: materialId,
      product_type: options?.productType,
      per_page: options?.perPage || 20,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch material products: ${response.status}`);
  }

  return response.json();
}

/**
 * Check if a specific product is compatible with a specific printer.
 *
 * @param productId - The product ID
 * @param printerId - The printer ID
 * @returns Promise with boolean compatibility result
 *
 * @example
 * const isCompatible = await checkCompatibility(42, 1);
 * if (isCompatible) {
 *   console.log('Product works with this printer!');
 * }
 */
export async function checkCompatibility(
  productId: number,
  printerId: number
): Promise<boolean> {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  
  const response = await fetch(`${baseUrl}/api/products/compatibility`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      printer_id: printerId,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to check compatibility: ${response.status}`);
  }

  const data: CompatibilityResponse = await response.json();
  return data.compatibility;
}
