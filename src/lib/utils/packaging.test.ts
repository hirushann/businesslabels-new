import { describe, it, expect } from "vitest";
import {
  getNextQuantity,
  getPreviousQuantity,
  getPackagingValidation,
  formatPackagingBreakdown,
  getPackagingType,
  getPackagingHint,
} from "./packaging";

describe("packaging utility", () => {
  describe("Example 1: No packaging (e.g. Printers)", () => {
    it("identifies as none", () => {
      expect(getPackagingType({ hasPackingGroup: false, packingGroup: null })).toBe("none");
    });

    it("steps 1 by 1", () => {
      expect(getNextQuantity({ current: 1, pack: null })).toBe(2);
      expect(getNextQuantity({ current: 2, pack: null })).toBe(3);
      expect(getPreviousQuantity({ current: 3, pack: null })).toBe(2);
      expect(getPreviousQuantity({ current: 2, pack: null })).toBe(1);
      expect(getPreviousQuantity({ current: 1, pack: null })).toBe(1);
    });

    it("validates any positive integer >= moq", () => {
      expect(getPackagingValidation({ quantity: 1, pack: null }).isValid).toBe(true);
      expect(getPackagingValidation({ quantity: 5, pack: null }).isValid).toBe(true);
      expect(getPackagingValidation({ quantity: 0, pack: null }).isValid).toBe(false);
      expect(getPackagingValidation({ quantity: 1, pack: null, moq: 2 }).isValid).toBe(false);
    });
  });

  describe("Example 2: Seiko SLP-2RL (pack = 2, strict = true)", () => {
    const pack = 2;
    const allowSingulars = false;

    it("steps by 2", () => {
      expect(getNextQuantity({ current: 2, pack, allowSingulars })).toBe(4);
      expect(getNextQuantity({ current: 4, pack, allowSingulars })).toBe(6);
      expect(getPreviousQuantity({ current: 6, pack, allowSingulars })).toBe(4);
      expect(getPreviousQuantity({ current: 4, pack, allowSingulars })).toBe(2);
      expect(getPreviousQuantity({ current: 2, pack, allowSingulars })).toBe(2);
    });

    it("suggests 10 and 12 rolls when typing 11", () => {
      const result = getPackagingValidation({ quantity: 11, pack, allowSingulars });
      expect(result.isValid).toBe(false);
      expect(result.lower).toBe(10);
      expect(result.upper).toBe(12);
      expect(result.choices).toEqual([10, 12]);
    });

    it("validates multiple of 2", () => {
      expect(getPackagingValidation({ quantity: 10, pack, allowSingulars }).isValid).toBe(true);
      expect(getPackagingValidation({ quantity: 12, pack, allowSingulars }).isValid).toBe(true);
    });
  });

  describe("Example 3: Diamondlabels (pack = 6, MOQ = 1, loose allowed)", () => {
    const pack = 6;
    const allowSingulars = true;
    const moq = 1;

    it("steps 1, 2, 3, 4, 5, 6, 12, 18...", () => {
      expect(getNextQuantity({ current: 1, pack, allowSingulars, moq })).toBe(2);
      expect(getNextQuantity({ current: 2, pack, allowSingulars, moq })).toBe(3);
      expect(getNextQuantity({ current: 5, pack, allowSingulars, moq })).toBe(6);
      expect(getNextQuantity({ current: 6, pack, allowSingulars, moq })).toBe(12);
      expect(getNextQuantity({ current: 12, pack, allowSingulars, moq })).toBe(18);
      expect(getNextQuantity({ current: 18, pack, allowSingulars, moq })).toBe(24);

      expect(getPreviousQuantity({ current: 24, pack, allowSingulars, moq })).toBe(18);
      expect(getPreviousQuantity({ current: 18, pack, allowSingulars, moq })).toBe(12);
      expect(getPreviousQuantity({ current: 12, pack, allowSingulars, moq })).toBe(6);
      expect(getPreviousQuantity({ current: 6, pack, allowSingulars, moq })).toBe(5);
      expect(getPreviousQuantity({ current: 5, pack, allowSingulars, moq })).toBe(4);
      expect(getPreviousQuantity({ current: 2, pack, allowSingulars, moq })).toBe(1);
      expect(getPreviousQuantity({ current: 1, pack, allowSingulars, moq })).toBe(1);
    });

    it("allows ordering 14 rolls directly", () => {
      const result = getPackagingValidation({ quantity: 14, pack, allowSingulars, moq });
      expect(result.isValid).toBe(true);
      expect(result.choices).toEqual([]);
    });

    it("from 14: + jumps to 18, - jumps to 12", () => {
      expect(getNextQuantity({ current: 14, pack, allowSingulars, moq })).toBe(18);
      expect(getPreviousQuantity({ current: 14, pack, allowSingulars, moq })).toBe(12);
    });

    it("formats breakdown under Order 14 rolls button", () => {
      expect(formatPackagingBreakdown({ quantity: 14, pack, allowSingulars, locale: "en" })).toBe(
        "14 rolls · 2 packages + 2 loose rolls"
      );
      expect(formatPackagingBreakdown({ quantity: 14, pack, allowSingulars, locale: "nl" })).toBe(
        "14 rollen · 2 verpakkingen + 2 losse rollen"
      );
      expect(formatPackagingBreakdown({ quantity: 7, pack, allowSingulars, locale: "nl" })).toBe(
        "7 rollen · 1 verpakking + 1 losse rol"
      );
      expect(formatPackagingBreakdown({ quantity: 12, pack, allowSingulars, locale: "nl" })).toBe(
        "12 rollen · 2 verpakkingen"
      );
      expect(formatPackagingBreakdown({ quantity: 2, pack, allowSingulars, locale: "nl" })).toBe(
        "2 rollen · 2 losse rollen"
      );
    });
  });

  describe("Example 4: Zebra labels (pack = 6, MOQ = 6, strict = true)", () => {
    const pack = 6;
    const allowSingulars = false;
    const moq = 6;

    it("steps always by 6", () => {
      expect(getNextQuantity({ current: 6, pack, allowSingulars, moq })).toBe(12);
      expect(getNextQuantity({ current: 12, pack, allowSingulars, moq })).toBe(18);
      expect(getPreviousQuantity({ current: 18, pack, allowSingulars, moq })).toBe(12);
      expect(getPreviousQuantity({ current: 12, pack, allowSingulars, moq })).toBe(6);
      expect(getPreviousQuantity({ current: 6, pack, allowSingulars, moq })).toBe(6);
    });

    it("entering 8 suggests 6 and 12 rolls", () => {
      const result = getPackagingValidation({ quantity: 8, pack, allowSingulars, moq });
      expect(result.isValid).toBe(false);
      expect(result.lower).toBe(6);
      expect(result.upper).toBe(12);
      expect(result.choices).toEqual([6, 12]);
    });

    it("entering 14 suggests 12 and 18 rolls", () => {
      const result = getPackagingValidation({ quantity: 14, pack, allowSingulars, moq });
      expect(result.isValid).toBe(false);
      expect(result.lower).toBe(12);
      expect(result.upper).toBe(18);
      expect(result.choices).toEqual([12, 18]);
    });

    it("entering 3 (below MOQ 6) suggests only 6 rolls", () => {
      const result = getPackagingValidation({ quantity: 3, pack, allowSingulars, moq });
      expect(result.isValid).toBe(false);
      expect(result.lower).toBe(null);
      expect(result.upper).toBe(6);
      expect(result.choices).toEqual([6]);
    });
  });

  describe("getPackagingHint", () => {
    it("returns strict packaging hint in Dutch and English", () => {
      expect(getPackagingHint({ pack: 2, allowSingulars: false, locale: "nl" })).toBe(
        "Per verpakking van 2 rollen"
      );
      expect(getPackagingHint({ pack: 2, allowSingulars: false, locale: "en" })).toBe(
        "Per package of 2 rolls"
      );
    });

    it("returns loose packaging hint in Dutch and English", () => {
      expect(getPackagingHint({ pack: 6, allowSingulars: true, locale: "nl" })).toBe(
        "Per rol verkrijgbaar · 6 rollen per verpakking"
      );
      expect(getPackagingHint({ pack: 6, allowSingulars: true, locale: "en" })).toBe(
        "Available per roll · 6 rolls per package"
      );
    });

    it("handles fanfold stacks correctly", () => {
      expect(getPackagingHint({ pack: 4, allowSingulars: false, locale: "nl", isStack: true })).toBe(
        "Per verpakking van 4 stapels"
      );
    });

    it("returns null when no packaging", () => {
      expect(getPackagingHint({ pack: null, allowSingulars: false, locale: "nl" })).toBe(null);
      expect(getPackagingHint({ pack: 0, allowSingulars: false, locale: "nl" })).toBe(null);
    });
  });
});
