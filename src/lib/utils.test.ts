import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { htmlToText, sanitizeCmsHtml, unescapeHtml } from "./utils";

describe("HTML entity decoding", () => {
  it("decodes numeric entities once for descriptions and metadata text", () => {
    expect(htmlToText("<p>Printer&#8217;s features&#8226;</p>")).toBe("Printer’s features•");
    expect(unescapeHtml("Title &amp;#8217;")).toBe("Title &#8217;");
  });

  it("stays escaped when decoded content is rendered as text", () => {
    const rendered = renderToStaticMarkup(createElement("p", null, htmlToText("&lt;script&gt;alert(1)&lt;/script&gt;")));
    expect(rendered).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  });

  it("rewrites dashboard wp-content/uploads links to local paths", () => {
    const input = '<a href="https://dashboard.businesslabels.nl/wp-content/uploads/2025/04/colorworks-d6500pe-datasheet.pdf">Download</a>';
    const output = sanitizeCmsHtml(input);
    expect(output).toBe('<a href="/wp-content/uploads/2025/04/colorworks-d6500pe-datasheet.pdf">Download</a>');
  });

  it("rewrites dashboard storage images to /api/media-proxy", () => {
    const input = '<img src="https://dashboard.businesslabels.nl/storage/12327/C6500A-printer-plate-17.png" alt="Plate" />';
    const output = sanitizeCmsHtml(input);
    expect(output).toContain('/api/media-proxy?url=https%3A%2F%2Fdashboard.businesslabels.nl%2Fstorage%2F12327%2FC6500A-printer-plate-17.png');
  });
});
