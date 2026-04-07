export type SearchSort = 'latest' | 'oldest' | 'title_asc' | 'title_desc' | 'price_asc' | 'price_desc';

export type SearchProduct = {
  id: number;
  type: 'simple' | 'variable' | string;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  article_number?: string | null;
  price?: number | null;
  original_price?: number | null;
  stock?: number | null;
  in_stock?: boolean | null;
  main_image?: string | null;
};

export type SearchPagination = {
  page: number;
  perPage: number;
  totalPages: number;
  totalItems: number;
};

export type SearchApiResponse = {
  items: SearchProduct[];
  pagination: SearchPagination;
  inStockCount: number;
  error?: string;
};
