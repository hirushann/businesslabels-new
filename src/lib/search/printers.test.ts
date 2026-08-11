import { describe, expect, it } from "vitest";
import type { estypes } from "@elastic/elasticsearch";
import { buildPrinterTextQuery, localizedPrinterText, parsePrinterSearchParams } from "./printers";

describe("localizedPrinterText", () => {
  const source = {
    title: "Nederlandse printer",
    subtitle: "Nederlandse omschrijving",
    translations: [
      { nl: { title: "Nederlandse printer", subtitle: "Nederlandse omschrijving" } },
      { en: { title: "English printer", subtitle: "English description" } },
    ],
  };

  it("uses the active locale and never falls back to Dutch on English routes", () => {
    expect(localizedPrinterText(source, "nl").subtitle).toBe("Nederlandse omschrijving");
    expect(localizedPrinterText(source, "en").subtitle).toBe("English description");
    expect(localizedPrinterText({ ...source, translations: [{ en: { title: "English printer" } }] }, "en").subtitle).toBeNull();
    expect(localizedPrinterText({ title: source.title, subtitle: source.subtitle }, "en").subtitle).toBeNull();
  });
});

describe("printer search relevance", () => {
  it("defaults searched listings to Elasticsearch relevance but respects an explicit sort", () => {
    expect(parsePrinterSearchParams(new URLSearchParams("search=epson")).sort).toBe("relevance");
    expect(parsePrinterSearchParams(new URLSearchParams("search=epson&sort=latest")).sort).toBe("latest");
    expect(parsePrinterSearchParams(new URLSearchParams()).sort).toBe("title_asc");
  });

  it("matches exact models, capabilities, and textual printer typos", () => {
    const model = JSON.stringify(buildPrinterTextQuery("Godex ZX1200i"));
    const capability = JSON.stringify(buildPrinterTextQuery("thermal transfer"));
    const typo = buildPrinterTextQuery("epsn") as estypes.QueryDslQueryContainer;
    const clauses = typo.bool?.should as estypes.QueryDslQueryContainer[];

    expect(model).toContain('"operator":"and"');
    expect(model).not.toContain('"fuzziness"');
    expect(capability).toContain("properties.druktype");
    expect(clauses.some((clause) => clause.match?.title && (clause.match.title as estypes.QueryDslMatchQuery).fuzziness === "AUTO")).toBe(true);
  });
});
