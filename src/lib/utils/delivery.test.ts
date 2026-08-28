import { describe, expect, it } from "vitest";
import { getAvailableDeliveryDates, getEffectiveDeliveryDays, getExpectedDeliveryMessage, isDeliverableInStock, isEndOfLife } from "./delivery";

describe("delivery lead times", () => {
  it("returns no estimate for missing backend data without replacing zero", () => {
    expect(getEffectiveDeliveryDays({ stock: 5, delivery_dates_in_stock: null })).toBeNull();
    expect(getEffectiveDeliveryDays({ stock: 0, delivery_dates_no_stock: undefined })).toBeNull();
    expect(getEffectiveDeliveryDays({ stock: 5, delivery_dates_in_stock: 0 })).toBe(0);
  });

  it("selects the stock-specific lead time", () => {
    expect(getEffectiveDeliveryDays({ stock: 5, delivery_dates_in_stock: 2, delivery_dates_no_stock: 14 })).toBe(2);
    expect(getEffectiveDeliveryDays({ stock: 0, delivery_dates_in_stock: 2, delivery_dates_no_stock: 14 })).toBe(14);
    expect(isDeliverableInStock({ stock: 5, delivery_dates_in_stock: 10 })).toBe(true);
    expect(isDeliverableInStock({ stock: 5, delivery_dates_in_stock: 11 })).toBe(false);
  });

  it("marks only non-positive stock with a 100-day no-stock value as end of life", () => {
    expect(isEndOfLife({ stock: 0, delivery_dates_no_stock: 100 })).toBe(true);
    expect(isEndOfLife({ stock: -1, delivery_dates_no_stock: "100" })).toBe(true);
    expect(isEndOfLife({ stock: 1, delivery_dates_no_stock: 100 })).toBe(false);
    expect(isEndOfLife({ stock: 0, delivery_dates_no_stock: 99 })).toBe(false);
  });
});

describe("business cut-off", () => {
  const base = {
    stock: 1,
    delivery_dates_in_stock: 0,
    delivery_dates_no_stock: 0,
    pickupTime: "13:00",
    timeZone: "Europe/Amsterdam",
    availableDates: ["2026-05-06", "2026-05-07", "2026-05-08", "2026-05-11", "2026-05-12"],
  } as const;

  it("uses today's shipping date immediately before cut-off", () => {
    const result = getExpectedDeliveryMessage({ ...base, now: new Date("2026-05-06T10:59:00Z") });
    expect(result.countdown).toMatchObject({ hours: 0, minutes: 1, formattedMinutes: "01" });
    expect(result.deliveryLabel).toBe("6 May");
    expect(result.message).toContain(result.deliveryLabel);
  });

  it("rolls to the next working day exactly at cut-off", () => {
    const result = getExpectedDeliveryMessage({ ...base, now: new Date("2026-05-06T11:00:00Z") });
    expect(result.countdown).toMatchObject({ hours: 24, minutes: 0, formattedMinutes: "00" });
    expect(result.deliveryLabel).toBe("tomorrow");
    expect(result.message).toContain(result.deliveryLabel);
  });

  it("keeps countdown and shipping date aligned immediately after cut-off", () => {
    const result = getExpectedDeliveryMessage({ ...base, now: new Date("2026-05-06T11:01:00Z") });
    expect(result.countdown).toMatchObject({ hours: 23, minutes: 59, formattedMinutes: "59" });
    expect(result.deliveryLabel).toBe("tomorrow");
    expect(result.message).toContain(result.deliveryLabel);
  });

  it("uses the availability endpoint dates for working-day rollover", () => {
    const result = getExpectedDeliveryMessage({
      ...base,
      now: new Date("2026-05-08T11:00:00Z"),
      availableDates: ["2026-05-08", "2026-05-12"],
    });
    expect(result.countdown).toMatchObject({ hours: 96, minutes: 0 });
    expect(result.deliveryLabel).toBe("12 May");
    expect(result.message).toContain(result.deliveryLabel);
  });

  it("rolls a delivery date omitted by the availability endpoint", () => {
    const result = getExpectedDeliveryMessage({
      ...base,
      delivery_dates_in_stock: 1,
      now: new Date("2026-05-08T10:00:00Z"),
    });
    expect(result.deliveryLabel).toBe("11 May");
  });
});

describe("delivery availability", () => {
  it("keeps only dates the availability endpoint marks usable", () => {
    expect(getAvailableDeliveryDates({
      data: [
        { date: "2026-05-08", is_fully_unavailable: false },
        { date: "2026-05-11", is_fully_unavailable: true },
        { date: "invalid", is_fully_unavailable: false },
      ],
    })).toEqual(["2026-05-08"]);
  });
});
