/**
 * Shared warranty types and helpers used across ProductPurchase, ProductCard,
 * and the Wishlist flow.
 */

export type WarrantyRawData = {
  is_available?: boolean | null;
  has_options?: boolean | null;
  options?: Array<{
    id: number;
    name?: string | null;
    duration_months?: number | null;
    price?: number | null;
    description?: string | null;
    sort_order?: number | null;
  }> | null;
  default_option?: {
    id: number;
    name?: string | null;
    duration_months?: number | null;
    price?: number | null;
    description?: string | null;
    sort_order?: number | null;
  } | null;
};

export type WarrantyOption = {
  id: number;
  name: string;
  durationMonths: number | null;
  price: number;
  description: string | null;
  sortOrder: number;
};

export function normalizeWarrantyOptions(
  warranty: WarrantyRawData | null | undefined,
): { options: WarrantyOption[]; defaultOptionId: number | null } {
  if (!warranty?.is_available || !warranty?.has_options || !Array.isArray(warranty.options)) {
    return { options: [], defaultOptionId: null };
  }

  const options = warranty.options
    .map((option) => {
      if (typeof option?.id !== "number" || !Number.isFinite(option.id)) {
        return null;
      }

      const normalizedPrice =
        typeof option.price === "number" && Number.isFinite(option.price) ? option.price : 0;

      return {
        id: option.id,
        name: option.name?.trim() || "Warranty option",
        durationMonths:
          typeof option.duration_months === "number" && Number.isFinite(option.duration_months)
            ? option.duration_months
            : null,
        price: normalizedPrice,
        description: option.description?.trim() || null,
        sortOrder:
          typeof option.sort_order === "number" && Number.isFinite(option.sort_order)
            ? option.sort_order
            : 0,
      } satisfies WarrantyOption;
    })
    .filter((option): option is WarrantyOption => Boolean(option))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  if (!options.length) {
    return { options: [], defaultOptionId: null };
  }

  const defaultOptionId =
    options.find((option) => option.id === warranty.default_option?.id)?.id ??
    options.find((option) => option.price <= 0)?.id ??
    options[0].id;

  return { options, defaultOptionId };
}
