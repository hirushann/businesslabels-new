/** Delivery estimates at or below this many days count as in stock. */
export const IN_STOCK_DELIVERY_DAY_LIMIT = 10;

const DEFAULT_BUSINESS_TIMEZONE = "Europe/Amsterdam";

type NumericLike = number | string | null | undefined;

type StockStatusParams = {
  stock?: NumericLike;
  delivery_dates_in_stock?: NumericLike;
  delivery_dates_no_stock?: NumericLike;
};

function toFiniteNumber(value: NumericLike): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function getEffectiveDeliveryDays({
  stock,
  delivery_dates_in_stock,
  delivery_dates_no_stock,
}: StockStatusParams): number | null {
  const stockCount = toFiniteNumber(stock);
  const value = stockCount !== null && stockCount > 0
    ? delivery_dates_in_stock
    : delivery_dates_no_stock;
  const days = toFiniteNumber(value);
  return days !== null && days >= 0 ? days : null;
}

export function isDeliverableInStock(params: StockStatusParams): boolean | null {
  const days = getEffectiveDeliveryDays(params);
  return days === null ? null : days <= IN_STOCK_DELIVERY_DAY_LIMIT;
}

export function isEndOfLife({ stock, delivery_dates_no_stock }: StockStatusParams): boolean {
  const stockCount = toFiniteNumber(stock);
  return stockCount !== null && stockCount <= 0 && toFiniteNumber(delivery_dates_no_stock) === 100;
}

type DeliveryMessageParams = StockStatusParams & {
  stock: NumericLike;
  now?: Date;
  pickupTime?: string;
  timeZone?: string;
  availableDates: readonly string[];
  locale?: "en" | "nl";
};

type DeliveryMessageResult = {
  message: string;
  countdown: { hours: number; minutes: number; formattedMinutes: string };
  deliveryLabel: string;
  deliveryDate: Date;
};

type DateParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function zonedParts(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
}

function zonedDate(parts: DateParts, timeZone: string): Date {
  const intended = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let result = new Date(intended);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const actual = zonedParts(result, timeZone);
    const actualWallTime = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    result = new Date(result.getTime() + intended - actualWallTime);
  }
  return result;
}

function dateKey(parts: Pick<DateParts, "year" | "month" | "day">): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function datePartsFromKey(key: string): DateParts {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day, hour: 0, minute: 0, second: 0 };
}

function addCalendarDays(key: string, days: number): string {
  const { year, month, day } = datePartsFromKey(key);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function getAvailableDeliveryDates(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) return [];

  return payload.data.flatMap((slot) => {
    if (!slot || typeof slot !== "object" || !("date" in slot) || !("is_fully_unavailable" in slot)) return [];
    return typeof slot.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(slot.date) && slot.is_fully_unavailable === false
      ? [slot.date]
      : [];
  });
}

function nextAvailableDay(key: string, availableDates: Set<string>): string {
  const candidate = [...availableDates].sort().find((date) => date > key);
  if (!candidate) throw new Error("No upcoming delivery availability returned by the API");
  return candidate;
}

function formatDeliveryDate(key: string, currentKey: string, locale: "en" | "nl", timeZone: string): string {
  if (key === addCalendarDays(currentKey, 1)) return locale === "nl" ? "morgen" : "tomorrow";
  const date = zonedDate(datePartsFromKey(key), timeZone);
  return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", { timeZone, day: "numeric", month: "long" }).format(date);
}

export function getExpectedDeliveryMessage({
  stock,
  delivery_dates_in_stock,
  delivery_dates_no_stock,
  now = new Date(),
  pickupTime = process.env.NEXT_PUBLIC_DELIVERY_PICKUP_TIME || process.env.DELIVERY_PICKUP_TIME || "13:00",
  timeZone = process.env.NEXT_PUBLIC_BUSINESS_TIMEZONE || process.env.BUSINESS_TIMEZONE || DEFAULT_BUSINESS_TIMEZONE,
  availableDates,
  locale = "en",
}: DeliveryMessageParams): DeliveryMessageResult {
  const stockCount = toFiniteNumber(stock);
  if (stockCount === null) throw new Error("Stock must be a finite number");

  const deliveryDays = getEffectiveDeliveryDays({ stock: stockCount, delivery_dates_in_stock, delivery_dates_no_stock });
  if (deliveryDays === null) throw new Error("Delivery dates must be non-negative finite numbers");

  const [pickupHour, pickupMinute] = pickupTime.split(":").map(Number);
  if (!Number.isInteger(pickupHour) || !Number.isInteger(pickupMinute)) throw new Error("Pickup time must use HH:mm");

  const availableDateSet = new Set(availableDates);
  const current = zonedParts(now, timeZone);
  const currentKey = dateKey(current);
  const todayCutoff = zonedDate({ ...datePartsFromKey(currentKey), hour: pickupHour, minute: pickupMinute }, timeZone);
  const orderDateKey = availableDateSet.has(currentKey) && now < todayCutoff
    ? currentKey
    : nextAvailableDay(currentKey, availableDateSet);
  const cutoff = orderDateKey === currentKey
    ? todayCutoff
    : zonedDate({ ...datePartsFromKey(orderDateKey), hour: pickupHour, minute: pickupMinute }, timeZone);
  const remainingMinutes = Math.max(0, Math.floor((cutoff.getTime() - now.getTime()) / 60000));
  const deliveryCandidateKey = addCalendarDays(orderDateKey, deliveryDays);
  const deliveryKey = availableDateSet.has(deliveryCandidateKey)
    ? deliveryCandidateKey
    : nextAvailableDay(deliveryCandidateKey, availableDateSet);
  const deliveryDate = zonedDate(datePartsFromKey(deliveryKey), timeZone);
  const deliveryLabel = formatDeliveryDate(deliveryKey, currentKey, locale, timeZone);
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  const formattedMinutes = String(minutes).padStart(2, "0");

  return {
    message: `Order within ${hours} hours ${formattedMinutes} minutes for delivery ${deliveryLabel}`,
    countdown: { hours, minutes, formattedMinutes },
    deliveryLabel,
    deliveryDate,
  };
}
