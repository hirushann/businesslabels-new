import { describe, expect, it } from "vitest";
import { localizedPrinterText } from "./printers";

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
