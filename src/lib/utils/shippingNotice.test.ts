import { describe, expect, it } from "vitest";
import { getShippingNotice, getCartShippingParams } from "./shippingNotice";

describe("shipping notice rules", () => {
  // Wednesday at 10:00 (before 15:00 cutoff)
  const wednesdayMorning = new Date("2026-10-07T08:00:00Z"); // 10:00 in Amsterdam (UTC+2 in DST)
  // Wednesday at 16:00 (after 15:00 cutoff)
  const wednesdayAfternoon = new Date("2026-10-07T14:00:00Z"); // 16:00 in Amsterdam
  // Friday at 16:00 (after 15:00 cutoff)
  const fridayAfternoon = new Date("2026-10-09T14:00:00Z"); // 16:00 in Amsterdam
  // Saturday afternoon
  const saturday = new Date("2026-10-10T12:00:00Z"); // Saturday
  // Sunday afternoon
  const sunday = new Date("2026-10-11T12:00:00Z"); // Sunday

  describe("in stock", () => {
    it("before cutoff on working day: says ships today", () => {
      const nl = getShippingNotice({
        stock: 5,
        now: wednesdayMorning,
        locale: "nl",
      });
      expect(nl?.notice).toBe("Bestel nu, vandaag verstuurd");
      expect(nl?.shipLabel).toBe("vandaag");
      expect(nl?.isInStock).toBe(true);

      const en = getShippingNotice({
        stock: 5,
        now: wednesdayMorning,
        locale: "en",
      });
      expect(en?.notice).toBe("Order now, we ship today");
      expect(en?.shipLabel).toBe("today");
    });

    it("after cutoff on Wednesday: says ships tomorrow", () => {
      const nl = getShippingNotice({
        stock: 5,
        now: wednesdayAfternoon,
        locale: "nl",
      });
      expect(nl?.notice).toBe("Bestel nu, morgen verstuurd");
      expect(nl?.shipLabel).toBe("morgen");

      const en = getShippingNotice({
        stock: 5,
        now: wednesdayAfternoon,
        locale: "en",
      });
      expect(en?.notice).toBe("Order now, we ship tomorrow");
    });

    it("after cutoff on Friday: says ships Monday (maandag)", () => {
      const nl = getShippingNotice({
        stock: 5,
        now: fridayAfternoon,
        locale: "nl",
      });
      expect(nl?.notice).toBe("Bestel nu, maandag verstuurd");
      expect(nl?.shipLabel).toBe("maandag");

      const en = getShippingNotice({
        stock: 5,
        now: fridayAfternoon,
        locale: "en",
      });
      expect(en?.notice).toBe("Order now, we ship monday");
    });

    it("on Saturday: says ships Monday", () => {
      const nl = getShippingNotice({
        stock: 5,
        now: saturday,
        locale: "nl",
      });
      expect(nl?.notice).toBe("Bestel nu, maandag verstuurd");
    });

    it("on Sunday: says ships tomorrow (morgen)", () => {
      const nl = getShippingNotice({
        stock: 5,
        now: sunday,
        locale: "nl",
      });
      expect(nl?.notice).toBe("Bestel nu, morgen verstuurd");
    });

    it("supports inStock boolean when stock number is null", () => {
      const nl = getShippingNotice({
        inStock: true,
        now: wednesdayMorning,
        locale: "nl",
      });
      expect(nl?.notice).toBe("Bestel nu, vandaag verstuurd");
    });
  });

  describe("not on stock", () => {
    it("counts DSO working days from today and displays full date", () => {
      const nl = getShippingNotice({
        stock: 0,
        delivery_dates_no_stock: 5,
        now: wednesdayMorning,
        locale: "nl",
      });
      // Wed + 5 working days = Thu (1), Fri (2), Mon (3), Tue (4), Wed (5) -> 14 oktober
      expect(nl?.notice).toBe("Bestel nu, 14 oktober verstuurd");
      expect(nl?.isInStock).toBe(false);

      const en = getShippingNotice({
        stock: 0,
        delivery_dates_no_stock: 5,
        now: wednesdayMorning,
        locale: "en",
      });
      expect(en?.notice).toBe("Order now, 14 October shipped");
    });

    it("rolls after-cutoff orders to next working day before counting DSO", () => {
      const nl = getShippingNotice({
        stock: 0,
        delivery_dates_no_stock: 5,
        now: wednesdayAfternoon,
        locale: "nl",
      });
      // After cutoff Wed -> base is Thu. Thu + 5 working days -> next Thu (15 oktober)
      expect(nl?.notice).toBe("Bestel nu, 15 oktober verstuurd");
    });

    it("returns null for end-of-life products (stock <= 0 and DSO === 100)", () => {
      const result = getShippingNotice({
        stock: 0,
        delivery_dates_no_stock: 100,
        now: wednesdayMorning,
      });
      expect(result).toBeNull();
    });
  });

  describe("getCartShippingParams", () => {
    it("returns in-stock when all items in stock", () => {
      const params = getCartShippingParams([
        { stock: 10, delivery_dates_in_stock: 0 },
        { stock: 2, delivery_dates_in_stock: 0 },
      ]);
      expect(params.inStock).toBe(true);
      expect(params.stock).toBe(1);
    });

    it("returns out-of-stock with max DSO when any item is out of stock", () => {
      const params = getCartShippingParams([
        { stock: 10, delivery_dates_in_stock: 0 },
        { stock: 0, delivery_dates_no_stock: 10 },
      ]);
      expect(params.inStock).toBe(false);
      expect(params.stock).toBe(0);
      expect(params.delivery_dates_no_stock).toBe(10);
    });
  });
});
