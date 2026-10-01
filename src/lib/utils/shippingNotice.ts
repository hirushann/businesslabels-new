/**
 * Shipping notice utility.
 *
 * Produces a short, customer-facing sentence based on:
 *  • stock level
 *  • cut-off time (default 15:00 Europe/Amsterdam)
 *  • delivery_dates_in_stock / delivery_dates_no_stock (DSO in working days)
 *
 * Rules
 * ─────────────────────────────────────────────────────────────────────
 *  In stock + before cutoff  → "Order now, we ship today"
 *  In stock + after cutoff   → next shipping working day
 *    • if that day is tomorrow → "Order now, we ship tomorrow"
 *    • otherwise              → "Order now, we ship [day name]"
 *  Out of stock              → count DSO working days from today
 *    → "Order now, [date] shipped"
 * ─────────────────────────────────────────────────────────────────────
 */

const DEFAULT_CUTOFF = "15:00";
const DEFAULT_TIMEZONE = "Europe/Amsterdam";

type NumericLike = number | string | null | undefined;

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

function isSameDay(a: DateParts, b: DateParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
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
  /** True when item is in stock and ships today or within a day. */
  isInStock: boolean;
  /** The JS Date of the shipping day (in Amsterdam timezone wall-clock). */
  shipDate: Date;
};

export type ShippingNoticeParams = {
  stock?: NumericLike;
  delivery_dates_in_stock?: NumericLike;
  delivery_dates_no_stock?: NumericLike;
  now?: Date;
  cutoffTime?: string;
  timeZone?: string;
  locale?: "en" | "nl";
};

export function getShippingNotice({
  stock,
  delivery_dates_in_stock,
  delivery_dates_no_stock,
  now = new Date(),
  cutoffTime = process.env.NEXT_PUBLIC_DELIVERY_CUTOFF_TIME || process.env.DELIVERY_CUTOFF_TIME || DEFAULT_CUTOFF,
  timeZone = process.env.NEXT_PUBLIC_BUSINESS_TIMEZONE || process.env.BUSINESS_TIMEZONE || DEFAULT_TIMEZONE,
  locale = "nl",
}: ShippingNoticeParams): ShippingNoticeResult | null {
  const stockCount = toFiniteNumber(stock);
  if (stockCount === null) return null;

  const inStock = stockCount > 0;
  const dso = toFiniteNumber(inStock ? delivery_dates_in_stock : delivery_dates_no_stock);
  if (dso === null || dso < 0) return null;

  const [cutH, cutM] = cutoffTime.split(":").map(Number);
  if (!Number.isInteger(cutH) || !Number.isInteger(cutM)) return null;

  const todayParts = zonedParts(now, timeZone);
  const cutoff = zonedDate(todayParts.year, todayParts.month, todayParts.day, cutH, cutM, timeZone);
  const beforeCutoff = now < cutoff;

  if (inStock) {
    // ── In stock ──────────────────────────────────────────────────────
    if (beforeCutoff && isWorkingDay(now, timeZone)) {
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
  const shipDate = addWorkingDays(startOfToday, dso, timeZone);
  const shipDateParts = zonedParts(shipDate, timeZone);

  if (isSameDay(todayParts, shipDateParts)) {
    const shipLabel = locale === "nl" ? "vandaag" : "today";
    return {
      notice: locale === "nl" ? "Bestel nu, vandaag verstuurd" : "Order now, shipped today",
      shipLabel,
      isInStock: false,
      shipDate,
    };
  }

  if (isTomorrow(todayParts, shipDateParts)) {
    const shipLabel = locale === "nl" ? "morgen" : "tomorrow";
    return {
      notice: locale === "nl" ? "Bestel nu, morgen verstuurd" : "Order now, shipped tomorrow",
      shipLabel,
      isInStock: false,
      shipDate,
    };
  }

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
