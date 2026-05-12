/**
 * Product type definitions for TypeScript
 *
 * @see Backend: app/Http/Resources/Api/ProductResource
 * @see Docs: docs/FRONTEND_PRINTER_COMPATIBILITY_INTEGRATION.md
 */

/**
 * Product properties using Vanilo property system.
 * These properties are used for compatibility matching with printers.
 */
export type ProductProperties = {
  /** Print method required (TD = Thermal Direct, TT = Thermal Transfer) */
  printmethode?: string[];
  
  /** Label width in mm */
  breedte?: string[];
  
  /** Label height in mm */
  hoogte?: string[];
  
  /** Core diameter in mm */
  kern?: string[];
  
  /** Outer diameter in mm */
  'buiten-diameter'?: string[];
  
  /** Material type (e.g., "Papier", "Polyester", etc.) */
  materiaal?: string[];
  
  /** Finish (e.g., "MAT", "GLOSS", etc.) */
  afwerking?: string[];
  
  /** Adhesive type (e.g., "Permanent", "Removable", etc.) */
  lijm?: string[];
  
  // Additional properties that might be present
  [key: string]: string[] | undefined;
};

/**
 * Product type - simple, variable, or group_product
 */
export type ProductType = 'simple' | 'variable' | 'group_product';

/**
 * Localized string object
 */
export type LocalizedString = {
  en: string;
  nl: string;
};

/**
 * Product category
 */
export type ProductCategory = {
  id: number;
  name: LocalizedString;
  slug: LocalizedString;
};

/**
 * Product material
 */
export type ProductMaterial = {
  id: number;
  title: LocalizedString;
  slug: LocalizedString;
  subtitle?: LocalizedString;
  category?: {
    id: number;
    name: LocalizedString;
    slug: LocalizedString;
  };
};

/**
 * Product variant (for variable products)
 */
export type ProductVariant = {
  id: number;
  name: string;
  sku: string;
  price: number | null;
  original_price: number | null;
  stock: number;
  in_stock: boolean;
  attributes: Record<string, string>;
};

/**
 * Gallery image
 */
export type GalleryImage = {
  id: number;
  name: string;
  file_name: string;
  url: string;
};

/**
 * Related product summary (for up-sells, cross-sells)
 */
export type RelatedProductSummary = {
  id: number;
  title: LocalizedString;
  slug: LocalizedString;
  sku?: string | null;
  price?: number | null;
  original_price?: number | null;
  main_image?: string | null;
};

/**
 * Full product resource from the API
 */
export type Product = {
  id: number;
  type: ProductType;
  title: string;
  name: LocalizedString;
  subtitle?: LocalizedString;
  slug: LocalizedString;
  sku: string | null;
  article_number?: string | null;
  state?: string | null;
  price: number | null;
  original_price?: number | null;
  stock: number;
  in_stock: boolean;
  excerpt?: LocalizedString | null;
  main_image: string | null;
  material_id?: number | null;
  material?: ProductMaterial | null;
  categories: ProductCategory[];
  properties: ProductProperties;
  created_at: string;
  updated_at: string;
  
  // Detail-only fields (present on show/showBySlug)
  description?: LocalizedString;
  content?: LocalizedString;
  product_information?: string | null;
  product_template?: string | null;
  make?: string | null;
  material_information?: string | null;
  packaging_unit?: string | null;
  jeritech_stock?: string | null;
  delivery_dates_no_stock?: string | null;
  delivery_dates_in_stock?: string | null;
  packing_group?: string | null;
  dimensions?: {
    weight: number | null;
    width: number | null;
    height: number | null;
    length: number | null;
  };
  gallery_images?: GalleryImage[];
  variants?: ProductVariant[];
  up_sells?: RelatedProductSummary[];
  cross_sells?: RelatedProductSummary[];
};
