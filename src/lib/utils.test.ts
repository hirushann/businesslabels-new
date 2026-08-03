import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { htmlToText, unescapeHtml } from "./utils";

describe("HTML entity decoding", () => {
  it("decodes numeric entities once for descriptions and metadata text", () => {
    expect(htmlToText("<p>Printer&#8217;s features&#8226;</p>")).toBe("Printer’s features•");
    expect(unescapeHtml("Title &amp;#8217;")).toBe("Title &#8217;");
  });

  it("stays escaped when decoded content is rendered as text", () => {
    const rendered = renderToStaticMarkup(createElement("p", null, htmlToText("&lt;script&gt;alert(1)&lt;/script&gt;")));
    expect(rendered).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  });
});
