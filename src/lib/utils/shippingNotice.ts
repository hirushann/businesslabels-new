/**
 * Shipping notice utility.
 *
 * Produces a short, customer-facing sentence based on:
 *  • stock level
 *  • cut-off time (default 15:00 Europe/Amsterdam)
 *  • delivery_dates_in_stock / delivery_dates_no_stock (DSO in working days)
 *
 * Rules:
 * ─────────────────────────────────────────────────────────────────────
 *  In stock + before cutoff (15:00) on working day:
 *    → "Bestel nu, vandaag verstuurd" / "Order now, we ship today"
 *  In stock + after cutoff (or weekend) and shipping is next day:
 *    → "Bestel nu, morgen verstuurd" / "Order now, we ship tomorrow"
 *  In stock + after cutoff (or weekend) and shipping is not tomorrow:
 *    → "Bestel nu, maandag verstuurd" / "Order now, we ship Monday"
 *  Not on stock:
 *    → "Bestel nu, 12 oktober verstuurd" / "Order now, 12 October shipped"
 *    (Count amount of working days from the DSO on the day from today)
 * ─────────────────────────────────────────────────────────────────────
 */

const DEFAULT_CUTOFF = "15:00";
const DEFAULT_TIMEZONE = "Europe/Amsterdam";

export type NumericLike = number | string | null | undefined;

function toFiniteNumber(value: NumericLike): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/* ── Timezone helpers (no external deps) ──────────────────────────────── */

type DateParts = { year: number; month: number; day: number; hour: number; minute: number };

function zonedParts(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const v = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return { year: v("year"), month: v("month"), day: v("day"), hour: v("hour"), minute: v("minute") };
}

/** Build a JS Date that maps to the given wall-clock in the given timezone. */
function zonedDate(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const intended = Date.UTC(year, month - 1, day, hour, minute, 0);
  let result = new Date(intended);
  for (let i = 0; i < 2; i++) {
    const actual = zonedParts(result, timeZone);
    const actualUTC = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, 0);
    result = new Date(result.getTime() + intended - actualUTC);
  }
  return result;
}

/** 0 = Sun, 6 = Sat. Working day = Mon–Fri (1–5). */
function isWorkingDay(date: Date, timeZone: string): boolean {
  const dow = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return dow !== "Sat" && dow !== "Sun";
}

/** Advance a date by 1 calendar day. */
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

/** Advance by N working days (Mon–Fri). */
function addWorkingDays(date: Date, workingDays: number, timeZone: string): Date {
  let remaining = workingDays;
  let cursor = date;
  while (remaining > 0) {
    cursor = addDays(cursor, 1);
    if (isWorkingDay(cursor, timeZone)) {
      remaining--;
    }
  }
  return cursor;
}

/** Find the next working day on or after the given date. */
function nextWorkingDayOnOrAfter(date: Date, timeZone: string): Date {
  let cursor = date;
  while (!isWorkingDay(cursor, timeZone)) {
    cursor = addDays(cursor, 1);
  }
  return cursor;
}

/* ── Formatting ───────────────────────────────────────────────────────── */

function isTomorrow(today: DateParts, target: DateParts): boolean {
  const todayDate = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const tomorrowDate = new Date(todayDate.getTime() + 86400000);
  return (
    target.year === tomorrowDate.getUTCFullYear() &&
    target.month === tomorrowDate.getUTCMonth() + 1 &&
    target.day === tomorrowDate.getUTCDate()
  );
}

/** Format a day name: "maandag" / "Monday" */
function formatDayName(date: Date, locale: "en" | "nl", timeZone: string): string {
  return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    timeZone,
    weekday: "long",
  }).format(date).toLowerCase();
}

/** Format a full date: "12 oktober" / "12 October" */
function formatFullDate(date: Date, locale: "en" | "nl", timeZone: string): string {
  return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    timeZone,
    day: "numeric",
    month: "long",
  }).format(date);
}

/* ── Main function ────────────────────────────────────────────────────── */

export type ShippingNoticeResult = {
  /** The full notice string, e.g. "Bestel nu, vandaag verstuurd" */
  notice: string;
  /** The ship-date portion only, e.g. "vandaag" / "morgen" / "maandag" / "12 oktober" */
  shipLabel: string;
  /** True when item is in stock. */
  isInStock: boolean;
  /** The JS Date of the shipping day (in Amsterdam timezone wall-clock). */
  shipDate: Date;
};

export type ShippingNoticeParams = {
  stock?: NumericLike;
  inStock?: boolean | null;
  delivery_dates_in_stock?: NumericLike;
  delivery_dates_no_stock?: NumericLike;
  now?: Date;
  cutoffTime?: string;
  timeZone?: string;
  locale?: "en" | "nl";
};

export function getShippingNotice({
  stock,
  inStock,
  delivery_dates_in_stock,
  delivery_dates_no_stock,
  now = new Date(),
  cutoffTime = process.env.NEXT_PUBLIC_DELIVERY_CUTOFF_TIME || process.env.DELIVERY_CUTOFF_TIME || DEFAULT_CUTOFF,
  timeZone = process.env.NEXT_PUBLIC_BUSINESS_TIMEZONE || process.env.BUSINESS_TIMEZONE || DEFAULT_TIMEZONE,
  locale = "nl",
}: ShippingNoticeParams): ShippingNoticeResult | null {
  const stockCount = toFiniteNumber(stock);
  const dsoNoStock = toFiniteNumber(delivery_dates_no_stock);

  // End of life products (stock <= 0 and delivery_dates_no_stock === 100) are discontinued
  if (stockCount !== null && stockCount <= 0 && dsoNoStock === 100) {
    return null;
  }

  // Determine whether item is in stock
  let isInStock: boolean;
  if (stockCount !== null) {
    isInStock = stockCount > 0;
  } else if (typeof inStock === "boolean") {
    isInStock = inStock;
  } else {
    // Default to in-stock when neither stock nor inStock is passed (e.g. cart default)
    isInStock = true;
  }

  const dso = isInStock
    ? (toFiniteNumber(delivery_dates_in_stock) ?? 0)
    : (dsoNoStock ?? 5);

  if (dso < 0) return null;

  const [cutH, cutM] = cutoffTime.split(":").map(Number);
  if (!Number.isInteger(cutH) || !Number.isInteger(cutM)) return null;

  const todayParts = zonedParts(now, timeZone);
  const cutoff = zonedDate(todayParts.year, todayParts.month, todayParts.day, cutH, cutM, timeZone);
  const beforeCutoff = now < cutoff;
  const isTodayWorkingDay = isWorkingDay(now, timeZone);

  if (isInStock) {
    // ── In stock ──────────────────────────────────────────────────────
    if (beforeCutoff && isTodayWorkingDay) {
      // Ships today
      const shipDate = now;
      const shipLabel = locale === "nl" ? "vandaag" : "today";
      return {
        notice: locale === "nl" ? "Bestel nu, vandaag verstuurd" : "Order now, we ship today",
        shipLabel,
        isInStock: true,
        shipDate,
      };
    }

    // After cutoff or not a working day → find the next working day
    const tomorrow = addDays(
      zonedDate(todayParts.year, todayParts.month, todayParts.day, 0, 0, timeZone),
      1,
    );
    const nextShipDay = nextWorkingDayOnOrAfter(tomorrow, timeZone);
    const nextShipParts = zonedParts(nextShipDay, timeZone);

    if (isTomorrow(todayParts, nextShipParts)) {
      const shipLabel = locale === "nl" ? "morgen" : "tomorrow";
      return {
        notice: locale === "nl" ? "Bestel nu, morgen verstuurd" : "Order now, we ship tomorrow",
        shipLabel,
        isInStock: true,
        shipDate: nextShipDay,
      };
    }

    // Next working day is not tomorrow (e.g. Friday after cutoff → Monday)
    const dayName = formatDayName(nextShipDay, locale, timeZone);
    return {
      notice: locale === "nl"
        ? `Bestel nu, ${dayName} verstuurd`
        : `Order now, we ship ${dayName}`,
      shipLabel: dayName,
      isInStock: true,
      shipDate: nextShipDay,
    };
  }

  // ── Out of stock ─────────────────────────────────────────────────────
  // Count DSO working days from today to get the shipping date.
  const startOfToday = zonedDate(todayParts.year, todayParts.month, todayParts.day, 0, 0, timeZone);
  const baseDate = (beforeCutoff && isTodayWorkingDay)
    ? startOfToday
    : nextWorkingDayOnOrAfter(addDays(startOfToday, 1), timeZone);

  const shipDate = addWorkingDays(baseDate, dso, timeZone);
  const dateStr = formatFullDate(shipDate, locale, timeZone);

  return {
    notice: locale === "nl"
      ? `Bestel nu, ${dateStr} verstuurd`
      : `Order now, ${dateStr} shipped`,
    shipLabel: dateStr,
    isInStock: false,
    shipDate,
  };
}

/* ── Cart helper ──────────────────────────────────────────────────────── */

export type CartItemShippingInput = {
  stock?: NumericLike;
  inStock?: boolean | null;
  delivery_dates_in_stock?: NumericLike;
  delivery_dates_no_stock?: NumericLike;
  itemKind?: string;
};

/**
 * Derives shipping notice parameters for the entire cart.
 * If any product in the cart is out of stock, the order ships together
 * on the latest out-of-stock delivery date (max DSO).
 * Otherwise, standard in-stock notice is used.
 */
export function getCartShippingParams(items: CartItemShippingInput[]): {
  stock: number;
  inStock: boolean;
  delivery_dates_in_stock: number;
  delivery_dates_no_stock: number;
} {
  const productItems = items.filter((i) => i.itemKind !== "warranty");
  if (productItems.length === 0) {
    return { stock: 1, inStock: true, delivery_dates_in_stock: 0, delivery_dates_no_stock: 0 };
  }

  const outOfStockItems = productItems.filter((i) => {
    if (typeof i.inStock === "boolean") return !i.inStock;
    const stockCount = toFiniteNumber(i.stock);
    if (stockCount !== null) return stockCount <= 0;
    return false;
  });

  if (outOfStockItems.length > 0) {
    const maxDso = Math.max(
      ...outOfStockItems.map((i) => {
        const val = toFiniteNumber(i.delivery_dates_no_stock);
        return val !== null && val > 0 && val !== 100 ? val : 5;
      }),
      5,
    );
    return { stock: 0, inStock: false, delivery_dates_in_stock: 0, delivery_dates_no_stock: maxDso };
  }

  const maxInStockDso = Math.max(
    ...productItems.map((i) => {
      const val = toFiniteNumber(i.delivery_dates_in_stock);
      return val !== null && val > 0 ? val : 0;
    }),
    0,
  );
  return { stock: 1, inStock: true, delivery_dates_in_stock: maxInStockDso, delivery_dates_no_stock: 0 };
}
