import { describe, expect, it } from "vitest";
import {
  getPrinterLocaleSlugs,
  getPrinterPath,
  getPrinterTranslation,
} from "./printers";
import type { Printer } from "@/lib/types/printer";

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

describe("getPrinterLocaleSlugs", () => {
  it("extracts distinct NL and EN slugs when printer translations differ", () => {
    const godexPrinter = {
      id: 212,
      slug: "godex-rt730ipro",
      title: "Godex RT730i PRO",
      translations: [
        {
          en: {
            language: "en",
            title: "Godex RT730i PRO",
            slug: "godex-rt730i-pro",
            subtitle: null,
            excerpt: null,
            content: null,
            meta_title: null,
            meta_description: null,
          },
        },
        {
          nl: {
            language: "nl",
            title: "Godex RT730i PRO",
            slug: "godex-rt730ipro",
            subtitle: null,
            excerpt: null,
            content: null,
            meta_title: null,
            meta_description: null,
          },
        },
      ],
      subtitle: null,
      excerpt: null,
      content: null,
      status: "published",
      template: null,
      image: null,
      properties: {},
    } as unknown as Printer;

    expect(getPrinterLocaleSlugs(godexPrinter)).toEqual({
      nl: "godex-rt730ipro",
      en: "godex-rt730i-pro",
    });
  });

  it("extracts Epson CW-C4000 MK Matte distinct slugs correctly", () => {
    const epsonPrinter = {
      id: 229,
      slug: "epson-colorworks-cw-c4000-mk-matte",
      title: "Epson ColorWorks CW-C4000 MK Matte",
      translations: [
        {
          en: {
            language: "en",
            title: "Epson ColorWorks CW-C4000 MK Matte",
            slug: "epson-colorworks-cw-c4000-mk-matte-2",
            subtitle: null,
            excerpt: null,
            content: null,
            meta_title: null,
            meta_description: null,
          },
        },
        {
          nl: {
            language: "nl",
            title: "Epson ColorWorks CW-C4000 MK Matte",
            slug: "epson-colorworks-cw-c4000-mk-matte",
            subtitle: null,
            excerpt: null,
            content: null,
            meta_title: null,
            meta_description: null,
          },
        },
      ],
      subtitle: null,
      excerpt: null,
      content: null,
      status: "published",
      template: null,
      image: null,
      properties: {},
    } as unknown as Printer;

    expect(getPrinterLocaleSlugs(epsonPrinter)).toEqual({
      nl: "epson-colorworks-cw-c4000-mk-matte",
      en: "epson-colorworks-cw-c4000-mk-matte-2",
    });
  });

  it("falls back to main slug if translations are missing", () => {
    const simplePrinter = {
      id: 300,
      slug: "zebra-zd421",
      title: "Zebra ZD421",
      translations: [],
      properties: {},
    } as unknown as Printer;

    expect(getPrinterLocaleSlugs(simplePrinter)).toEqual({
      nl: "zebra-zd421",
      en: "zebra-zd421",
    });
  });
});

describe("getPrinterTranslation", () => {
  it("resolves the requested locale translation entry", () => {
    const printer = {
      id: 1,
      slug: "test-printer",
      title: "Default Title",
      translations: [
        {
          en: {
            language: "en",
            title: "English Title",
            slug: "test-printer-en",
            subtitle: "English Subtitle",
          },
        },
        {
          nl: {
            language: "nl",
            title: "Nederlandse Titel",
            slug: "test-printer-nl",
            subtitle: "Nederlandse Subtitel",
          },
        },
      ],
      properties: {},
    } as unknown as Printer;

    expect(getPrinterTranslation(printer, "en")?.title).toBe("English Title");
    expect(getPrinterTranslation(printer, "nl")?.title).toBe("Nederlandse Titel");
    expect(getPrinterTranslation(printer, "de")).toBeNull();
  });
});

