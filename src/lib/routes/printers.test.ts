import { describe, expect, it } from "vitest";
import { getPrinterPath } from "./printers";

describe("getPrinterPath", () => {
  it("builds live printer routes without a Dutch locale prefix", () => {
    expect(getPrinterPath("nl")).toBe("/printers");
    expect(getPrinterPath("nl", "godex-zx1200iplus")).toBe(
      "/printers/godex-zx1200iplus/",
    );
  });

  it("builds live printer routes with the English locale prefix", () => {
    expect(getPrinterPath("en")).toBe("/en/printers");
    expect(getPrinterPath("en", "godex-zx1200iplus")).toBe(
      "/en/printers/godex-zx1200iplus/",
    );
  });
});
