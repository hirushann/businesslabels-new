/**
 * Utilities for packaging-aware quantity calculations, stepping, suggestions, and breakdown labels.
 */

export type PackagingType = "none" | "strict" | "loose";

export function getPackagingType({
  hasPackingGroup,
  packingGroup,
  allowSingulars,
}: {
  hasPackingGroup?: boolean | null;
  packingGroup?: number | null;
  allowSingulars?: boolean | null;
}): PackagingType {
  if (!hasPackingGroup || !packingGroup || packingGroup <= 0) {
    return "none";
  }
  return allowSingulars ? "loose" : "strict";
}

/**
 * Returns the next quantity for stepping up (+)
 */
export function getNextQuantity({
  current,
  pack,
  allowSingulars,
  moq,
}: {
  current: number;
  pack?: number | null;
  allowSingulars?: boolean | null;
  moq?: number | null;
}): number {
  const n = Math.max(0, current);
  const packingGroup = pack && pack > 0 ? pack : null;
  const isStrict = Boolean(packingGroup && !allowSingulars);
  const minQty = moq && moq > 0 ? moq : isStrict && packingGroup ? packingGroup : 1;

  if (!packingGroup) {
    return Math.max(minQty, n + 1);
  }

  if (isStrict) {
    if (n < minQty) return minQty;
    return Math.max(minQty, (Math.floor(n / packingGroup) + 1) * packingGroup);
  }

  // Loose allowed (e.g. Diamondlabels pack 6, moq 1)
  if (n < minQty) return minQty;
  if (n < packingGroup) return n + 1;
  return (Math.floor(n / packingGroup) + 1) * packingGroup;
}

/**
 * Returns the previous quantity for stepping down (-)
 */
export function getPreviousQuantity({
  current,
  pack,
  allowSingulars,
  moq,
}: {
  current: number;
  pack?: number | null;
  allowSingulars?: boolean | null;
  moq?: number | null;
}): number {
  const n = Math.max(0, current);
  const packingGroup = pack && pack > 0 ? pack : null;
  const isStrict = Boolean(packingGroup && !allowSingulars);
  const minQty = moq && moq > 0 ? moq : isStrict && packingGroup ? packingGroup : 1;

  if (!packingGroup) {
    return n > minQty ? n - 1 : minQty;
  }

  if (isStrict) {
    if (n <= minQty) return minQty;
    const prev = (Math.ceil(n / packingGroup) - 1) * packingGroup;
    return Math.max(minQty, prev);
  }

  // Loose allowed (e.g. Diamondlabels pack 6, moq 1)
  if (n <= minQty) return minQty;
  if (n <= packingGroup) return n - 1;
  const prev = (Math.ceil(n / packingGroup) - 1) * packingGroup;
  return Math.max(minQty, prev);
}

export type PackagingValidationResult = {
  isValid: boolean;
  lower: number | null;
  upper: number | null;
  choices: number[];
};

/**
 * Validates a typed quantity and returns choice suggestions if invalid for strict packaging.
 */
export function getPackagingValidation({
  quantity,
  pack,
  allowSingulars,
  moq,
}: {
  quantity: number;
  pack?: number | null;
  allowSingulars?: boolean | null;
  moq?: number | null;
}): PackagingValidationResult {
  const packingGroup = pack && pack > 0 ? pack : null;
  const isStrict = Boolean(packingGroup && !allowSingulars);
  const minQty = moq && moq > 0 ? moq : isStrict && packingGroup ? packingGroup : 1;

  const isInteger = Number.isInteger(quantity);
  if (!isInteger || quantity < 1) {
    return { isValid: false, lower: null, upper: null, choices: [] };
  }

  if (!packingGroup) {
    return {
      isValid: quantity >= minQty,
      lower: null,
      upper: null,
      choices: [],
    };
  }

  if (!isStrict) {
    // Loose packaging: any integer >= minQty is valid
    return {
      isValid: quantity >= minQty,
      lower: null,
      upper: null,
      choices: [],
    };
  }

  // Strict packaging: must be divisible by pack and >= minQty
  if (quantity % packingGroup === 0 && quantity >= minQty) {
    return { isValid: true, lower: null, upper: null, choices: [] };
  }

  // Invalid strict quantity: calculate suggestions
  const rawLower = Math.floor(quantity / packingGroup) * packingGroup;
  const rawUpper = Math.ceil(quantity / packingGroup) * packingGroup;

  const validLower = rawLower >= minQty && rawLower > 0 ? rawLower : null;
  const validUpper = rawUpper >= minQty && rawUpper > 0 ? rawUpper : (rawUpper === 0 ? minQty : rawUpper);

  const choices: number[] = [];
  if (validLower !== null && validLower !== validUpper) {
    choices.push(validLower);
  }
  if (validUpper !== null && !choices.includes(validUpper)) {
    choices.push(validUpper);
  }

  return {
    isValid: false,
    lower: validLower,
    upper: validUpper,
    choices,
  };
}

/**
 * Formats breakdown text, e.g. "14 rollen · 2 verpakkingen + 2 losse rollen"
 */
export function formatPackagingBreakdown({
  quantity,
  pack,
  allowSingulars,
  locale,
  isStack,
}: {
  quantity: number;
  pack?: number | null;
  allowSingulars?: boolean | null;
  locale: string;
  isStack?: boolean;
}): string | null {
  if (!pack || pack <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
    return null;
  }

  const isNl = locale === "nl";
  const unitSingular = isStack ? (isNl ? "stapel" : "stack") : (isNl ? "rol" : "roll");
  const unitPlural = isStack ? (isNl ? "stapels" : "stacks") : (isNl ? "rollen" : "rolls");
  const unitNoun = quantity === 1 ? unitSingular : unitPlural;

  const packSingular = isNl ? "verpakking" : "package";
  const packPlural = isNl ? "verpakkingen" : "packages";

  const looseSingular = isStack ? (isNl ? "losse stapel" : "loose stack") : (isNl ? "losse rol" : "loose roll");
  const loosePlural = isStack ? (isNl ? "losse stapels" : "loose stacks") : (isNl ? "losse rollen" : "loose rolls");

  if (quantity % pack === 0) {
    const numPacks = quantity / pack;
    const packNoun = numPacks === 1 ? packSingular : packPlural;
    return `${quantity} ${unitNoun} · ${numPacks} ${packNoun}`;
  }

  if (allowSingulars) {
    const numPacks = Math.floor(quantity / pack);
    const looseCount = quantity % pack;
    const looseNoun = looseCount === 1 ? looseSingular : loosePlural;

    if (numPacks > 0) {
      const packNoun = numPacks === 1 ? packSingular : packPlural;
      return `${quantity} ${unitNoun} · ${numPacks} ${packNoun} + ${looseCount} ${looseNoun}`;
    }

    return `${quantity} ${unitNoun} · ${looseCount} ${looseNoun}`;
  }

  return null;
}

/**
 * Returns static packaging hint for display below quantity input,
 * e.g. "Per verpakking van 2 rollen" or "Per rol verkrijgbaar · 6 rollen per verpakking"
 */
export function getPackagingHint({
  pack,
  allowSingulars,
  locale,
  isStack,
}: {
  pack?: number | null;
  allowSingulars?: boolean | null;
  locale: string;
  isStack?: boolean;
}): string | null {
  if (!pack || pack <= 0) return null;
  const isNl = locale === "nl";
  const unitNoun = isStack ? (isNl ? "stapels" : "stacks") : (isNl ? "rollen" : "rolls");
  const unitSingular = isStack ? (isNl ? "stapel" : "stack") : (isNl ? "rol" : "roll");

  if (!allowSingulars) {
    return isNl
      ? `Per verpakking van ${pack} ${unitNoun}`
      : `Per package of ${pack} ${unitNoun}`;
  }

  return isNl
    ? `Per ${unitSingular} verkrijgbaar · ${pack} ${unitNoun} per verpakking`
    : `Available per ${unitSingular} · ${pack} ${unitNoun} per package`;
}
