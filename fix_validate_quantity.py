import re

path = '/Users/hirushanperera/Sites/businesslabels-new/src/components/ProductPurchase.tsx'
with open(path, 'r') as f:
    content = f.read()

validate_old = """  const validateQuantity = (customQuantity?: number): number | null => {
    setQuantityError(null);

    if (!hasPrice) return null;

    const qtyToAdd = customQuantity ?? quantity;
    const normalizedQuantity = Number.isFinite(qtyToAdd) ? Math.floor(qtyToAdd) : 0;

    const minQty = allowSingulars ? 1 : (normalizedPackingGroup ?? 1);
    if (normalizedQuantity < minQty) {
      setQuantityError(
        allowSingulars
          ? t("product.quantityMinError")
          : t("product.quantityLimitErrorMultiple", { limit: normalizedPackingGroup ?? 1 })
      );
      return null;
    }

    if (hasPackingGroup) {
      const singularQuantityAllowed = Boolean(allowSingulars && normalizedQuantity <= (normalizedPackingGroup ?? 1));

      if (
        !singularQuantityAllowed &&
        (allowSingulars ? normalizedQuantity !== 1 : true) &&
        normalizedQuantity % (normalizedPackingGroup ?? 1) !== 0
      ) {
        setQuantityError(
          allowSingulars
            ? t("product.quantityLimitErrorSingular", { limit: normalizedPackingGroup ?? 1 })
            : t("product.quantityLimitErrorMultiple", { limit: normalizedPackingGroup ?? 1 }),
        );
        return null;
      }
    }

    return normalizedQuantity;
  };"""

validate_new = """  const validateQuantity = (customQuantity?: number): number | null => {
    setQuantityError(null);

    if (!hasPrice) return null;

    const qtyToAdd = customQuantity ?? quantity;
    const normalizedQuantity = Number.isFinite(qtyToAdd) ? Math.floor(qtyToAdd) : 0;

    const minQty = normalizedMoq ?? (allowSingulars ? 1 : (normalizedPackingGroup ?? 1));
    if (normalizedQuantity < minQty) {
      setQuantityError(
        normalizedMoq
          ? t("product.quantityMinError", { min: minQty })
          : allowSingulars
            ? t("product.quantityMinError")
            : t("product.quantityLimitErrorMultiple", { limit: normalizedPackingGroup ?? 1 })
      );
      return null;
    }

    if (hasPackingGroup) {
      const pg = normalizedPackingGroup ?? 1;
      const moqAllowsSingulars = normalizedMoq !== null && normalizedMoq < pg && normalizedQuantity <= pg;
      const singularQuantityAllowed = Boolean((allowSingulars && normalizedQuantity <= pg) || moqAllowsSingulars);

      if (
        !singularQuantityAllowed &&
        (allowSingulars ? normalizedQuantity !== 1 : true) &&
        normalizedQuantity % pg !== 0
      ) {
        setQuantityError(
          allowSingulars
            ? t("product.quantityLimitErrorSingular", { limit: pg })
            : t("product.quantityLimitErrorMultiple", { limit: pg }),
        );
        return null;
      }
    }

    return normalizedQuantity;
  };"""

if validate_old in content:
    content = content.replace(validate_old, validate_new)
else:
    print("validateQuantity chunk not found")

with open(path, 'w') as f:
    f.write(content)
