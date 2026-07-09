"use client";

import { Clock3 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_TIMEZONE = "Europe/Amsterdam";
const BUSINESS_START_MINUTES = 8 * 60;
const BUSINESS_END_MINUTES = 17 * 60 + 30;
const LOOKAHEAD_DAYS = 14;

type AvailabilitySlot = {
   date?: string;
   timezone?: string;
   time_zone?: string;
   isOpen?: boolean;
   nextAvailable?: unknown;
   openUntil?: unknown;
   is_available?: boolean;
   available?: boolean;
   is_open?: boolean;
   currently_open?: boolean;
   next_available?: unknown;
   open_until?: unknown;
   is_fully_unavailable?: boolean;
   start_time?: string | null;
   end_time?: string | null;
   available_start_time?: string | null;
   available_end_time?: string | null;
   available_ent_time?: string | null;
   unavailable_start_time?: string | null;
   unavailable_end_time?: string | null;
};

type AvailabilityResponse = {
   data?: unknown;
   timezone?: string;
   time_zone?: string;
   isOpen?: boolean;
   nextAvailable?: unknown;
   openUntil?: unknown;
   is_open?: boolean;
   currently_open?: boolean;
   next_available?: unknown;
   open_until?: unknown;
};

type StatusViewModel = {
   available: boolean;
   statusLabel: string;
   detailLabel: string;
   tone: "open" | "closed" | "neutral";
};

type AvailabilityT = (key: string, values?: Record<string, string>) => string;

function isRecord(value: unknown): value is Record<string, unknown> {
   return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readTimezone(payload: AvailabilityResponse, slots: AvailabilitySlot[]) {
   const dataTimezone = isRecord(payload.data) && (typeof payload.data.timezone === "string" || typeof payload.data.time_zone === "string")
      ? String(payload.data.timezone || payload.data.time_zone)
      : "";
   const timezone = payload.timezone || payload.time_zone || dataTimezone || slots.find((slot) => slot.timezone || slot.time_zone)?.timezone || slots.find((slot) => slot.time_zone)?.time_zone;

   return timezone || DEFAULT_TIMEZONE;
}

function normalizeSlots(data: unknown): AvailabilitySlot[] {
   if (Array.isArray(data)) {
      return data.filter(isRecord) as AvailabilitySlot[];
   }

   if (isRecord(data) && Array.isArray(data.availabilities)) {
      return data.availabilities.filter(isRecord) as AvailabilitySlot[];
   }

   return [];
}

function getZonedParts(date: Date, timezone: string) {
   const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
   });
   const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));

   return {
      dateKey: `${parts.year}-${parts.month}-${parts.day}`,
      minutes: Number(parts.hour) * 60 + Number(parts.minute),
   };
}

function getZonedDateTimeParts(date: Date, timezone: string) {
   const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
   });
   const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));

   return {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      hour: Number(parts.hour),
      minute: Number(parts.minute),
   };
}

function zonedWallTimeToDate(dateKey: string, minutes: number, timezone: string) {
   const [year, month, day] = dateKey.split("-").map(Number);
   const hour = Math.floor(minutes / 60);
   const minute = minutes % 60;
   let candidate = new Date(Date.UTC(year, month - 1, day, hour, minute));

   for (let attempt = 0; attempt < 3; attempt += 1) {
      const parts = getZonedDateTimeParts(candidate, timezone);
      const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
      const actualUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
      const delta = desiredUtc - actualUtc;

      if (delta === 0) break;

      candidate = new Date(candidate.getTime() + delta);
   }

   return candidate;
}

function addDays(dateKey: string, days: number) {
   const [year, month, day] = dateKey.split("-").map(Number);
   const date = new Date(Date.UTC(year, month - 1, day + days));

   return date.toISOString().slice(0, 10);
}

function isWeekday(dateKey: string) {
   const [year, month, day] = dateKey.split("-").map(Number);
   const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

   return dayOfWeek >= 1 && dayOfWeek <= 5;
}

function parseTimeToMinutes(time: string | null | undefined) {
   if (!time) return null;

   const match = time.match(/^(\d{1,2}):(\d{2})/);
   if (!match) return null;

   const hours = Number(match[1]);
   const minutes = Number(match[2]);

   if (hours > 23 || minutes > 59) return null;

   return hours * 60 + minutes;
}

function getLocalDateKey(date: Date) {
   return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addLocalDays(date: Date, days: number) {
   const nextDate = new Date(date);
   nextDate.setDate(date.getDate() + days);

   return nextDate;
}

function formatLocalTime(date: Date, locale: string) {
   return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
   }).format(date);
}

function getLocalRelativeDayLabel(date: Date, now: Date, locale: string, t: AvailabilityT) {
   const dateKey = getLocalDateKey(date);
   const todayKey = getLocalDateKey(now);
   const tomorrowKey = getLocalDateKey(addLocalDays(now, 1));

   if (dateKey === todayKey) return t("today");
   if (dateKey === tomorrowKey) return t("tomorrow");

   return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
   }).format(date);
}

function formatNextAvailability(date: Date, now: Date, locale: string, t: AvailabilityT) {
   const time = formatLocalTime(date, locale);
   const dayLabel = getLocalRelativeDayLabel(date, now, locale, t);

   return getLocalDateKey(date) === getLocalDateKey(now) ? t("opensToday", { time }) : t("nextAvailable", { day: dayLabel, time });
}

function getAvailableIntervals(slot: AvailabilitySlot | undefined, dateKey: string) {
   const hasExplicitSlot = Boolean(slot);

   if (slot?.is_fully_unavailable || slot?.is_available === false || slot?.available === false || slot?.is_open === false) {
      return [];
   }

   const explicitStart = parseTimeToMinutes(slot?.start_time ?? slot?.available_start_time);
   const explicitEnd = parseTimeToMinutes(slot?.end_time ?? slot?.available_end_time ?? slot?.available_ent_time);

   if (explicitStart !== null && explicitEnd !== null && explicitStart < explicitEnd) {
      return [{ start: explicitStart, end: explicitEnd }];
   }

   if (!hasExplicitSlot && !isWeekday(dateKey)) {
      return [];
   }

   const unavailableStart = parseTimeToMinutes(slot?.unavailable_start_time);
   const unavailableEnd = parseTimeToMinutes(slot?.unavailable_end_time);

   if (unavailableStart !== null && unavailableEnd !== null && unavailableStart < unavailableEnd) {
      return [
         { start: BUSINESS_START_MINUTES, end: unavailableStart },
         { start: unavailableEnd, end: BUSINESS_END_MINUTES },
      ].filter((interval) => interval.start < interval.end);
   }

   return [{ start: BUSINESS_START_MINUTES, end: BUSINESS_END_MINUTES }];
}

function readBoolean(source: unknown, keys: string[]) {
   if (!isRecord(source)) return null;

   for (const key of keys) {
      const value = source[key];

      if (typeof value === "boolean") {
         return value;
      }
   }

   return null;
}

function readValue(source: unknown, keys: string[]) {
   if (!isRecord(source)) return null;

   for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null) {
         return source[key];
      }
   }

   return null;
}

function parseApiDateTime(value: unknown, timezone: string, fallbackDateKey: string) {
   if (!value) return null;

   if (typeof value === "string") {
      const wallDateTime = value.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}:\d{2})/);
      const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);

      if (wallDateTime && !hasExplicitZone) {
         const minutes = parseTimeToMinutes(wallDateTime[2]);

         return minutes === null ? null : zonedWallTimeToDate(wallDateTime[1], minutes, timezone);
      }

      const timeOnly = parseTimeToMinutes(value);

      if (timeOnly !== null) {
         return zonedWallTimeToDate(fallbackDateKey, timeOnly, timezone);
      }

      const parsed = Date.parse(value);

      return Number.isNaN(parsed) ? null : new Date(parsed);
   }

   if (!isRecord(value)) return null;

   const date = readValue(value, ["date", "day"]);
   const time = readValue(value, ["time", "start_time", "available_start_time", "starts_at"]);
   const iso = readValue(value, ["datetime", "date_time", "startsAt", "starts_at"]);

   if (typeof iso === "string") {
      const parsed = Date.parse(iso);

      if (!Number.isNaN(parsed)) {
         return new Date(parsed);
      }
   }

   if (typeof date === "string" && typeof time === "string") {
      const minutes = parseTimeToMinutes(time);

      if (minutes !== null) {
         return zonedWallTimeToDate(date, minutes, timezone);
      }
   }

   return null;
}

function getApiStatus(payload: AvailabilityResponse, now: Date, locale: string, t: AvailabilityT, timezone: string) {
   const apiSource = isRecord(payload.data) ? payload.data : payload;
   const isOpen = readBoolean(apiSource, ["isOpen", "is_open", "currently_open"]);

   if (isOpen === null) return null;

   const nextAvailable = readValue(apiSource, ["nextAvailable", "next_available"]);
   const openUntil = readValue(apiSource, ["openUntil", "open_until"]);
   const currentBusinessDateKey = getZonedParts(now, timezone).dateKey;

   if (isOpen) {
      const openUntilDate = parseApiDateTime(openUntil, timezone, currentBusinessDateKey);

      return {
         available: true,
         statusLabel: t("open"),
         detailLabel: openUntilDate ? t("openUntil", { time: formatLocalTime(openUntilDate, locale) }) : t("availableNow"),
         tone: "open" as const,
      };
   }

   const nextAvailableDate = parseApiDateTime(nextAvailable, timezone, currentBusinessDateKey);

   return {
      available: false,
      statusLabel: t("closed"),
      detailLabel: nextAvailableDate ? formatNextAvailability(nextAvailableDate, now, locale, t) : t("noUpcoming"),
      tone: "closed" as const,
   };
}

function computeStatus(payload: AvailabilityResponse | null, now: Date, locale: string, t: AvailabilityT): StatusViewModel {
   if (!payload) {
      return {
         available: false,
         statusLabel: t("unavailable"),
         detailLabel: "",
         tone: "neutral",
      };
   }

   const slots = normalizeSlots(payload.data);
   const timezone = readTimezone(payload, slots);
   const apiStatus = getApiStatus(payload, now, locale, t, timezone);

   if (apiStatus) {
      return apiStatus;
   }

   const slotsByDate = new Map(slots.filter((slot) => typeof slot.date === "string").map((slot) => [slot.date as string, slot]));
   const current = getZonedParts(now, timezone);
   const todayIntervals = getAvailableIntervals(slotsByDate.get(current.dateKey), current.dateKey);
   const currentInterval = todayIntervals.find((interval) => current.minutes >= interval.start && current.minutes < interval.end);

   if (currentInterval) {
      return {
         available: true,
         statusLabel: t("open"),
         detailLabel: t("availableNow"),
         tone: "open",
      };
   }

   for (let offset = 0; offset <= LOOKAHEAD_DAYS; offset += 1) {
      const dateKey = addDays(current.dateKey, offset);
      const intervals = getAvailableIntervals(slotsByDate.get(dateKey), dateKey);
      const nextInterval = intervals.find((interval) => offset > 0 || interval.start > current.minutes);

      if (nextInterval) {
         const nextAvailable = zonedWallTimeToDate(dateKey, nextInterval.start, timezone);

         return {
            available: false,
            statusLabel: t("closed"),
            detailLabel: formatNextAvailability(nextAvailable, now, locale, t),
            tone: "closed",
         };
      }
   }

   return {
      available: false,
      statusLabel: t("closed"),
      detailLabel: t("noUpcoming"),
      tone: "closed",
   };
}

function AvailabilitySkeleton() {
   return (
      <div className="self-stretch flex flex-col items-center gap-2" aria-label="Loading availability">
         <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
         <div className="h-4 w-36 animate-pulse rounded-full bg-slate-100" />
      </div>
   );
}

export default function AvailabilityStatus() {
   const t = useTranslations("contactPage.availability");
   const locale = useLocale();
   const [payload, setPayload] = useState<AvailabilityResponse | null>(null);
   const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
   const [now, setNow] = useState(() => new Date());

   useEffect(() => {
      let ignore = false;

      async function loadAvailability() {
         try {
            const response = await fetch("/api/availabilities", {
               headers: {
                  Accept: "application/json",
               },
            });
            const data = (await response.json().catch(() => ({}))) as AvailabilityResponse;

            if (!response.ok) {
               throw new Error("Availability request failed");
            }

            if (!ignore) {
               setPayload(data);
               setNow(new Date());
               setStatus("ready");
            }
         } catch (error) {
            console.error("Failed to load contact availability:", error);

            if (!ignore) {
               setStatus("error");
            }
         }
      }

      loadAvailability();

      return () => {
         ignore = true;
      };
   }, []);

   useEffect(() => {
      const intervalId = window.setInterval(() => setNow(new Date()), 60_000);

      return () => window.clearInterval(intervalId);
   }, []);

   const viewModel = useMemo(() => computeStatus(payload, now, locale, t), [payload, now, locale, t]);

   if (status === "loading") {
      return <AvailabilitySkeleton />;
   }

   if (status === "error") {
      return (
         <div className="self-stretch flex justify-center">
            <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500">
               {t("unavailable")}
            </span>
         </div>
      );
   }

   return (
      <div className="self-stretch flex flex-col items-center justify-start gap-2 text-center">
         <span
            className={
               viewModel.tone === "open"
                  ? "inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200"
                  : "inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 ring-1 ring-slate-200"
            }
         >
            <span className={viewModel.tone === "open" ? "size-2 rounded-full bg-emerald-500" : "size-2 rounded-full bg-rose-500"} aria-hidden="true" />
            {viewModel.statusLabel}
         </span>
         {viewModel.detailLabel && (
            <span className={viewModel.available ? "inline-flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-700" : "inline-flex items-center justify-center gap-1.5 text-sm font-medium text-sky-700"}>
               <Clock3 className="size-4 shrink-0" aria-hidden="true" />
               {viewModel.detailLabel}
            </span>
         )}
      </div>
   );
}
