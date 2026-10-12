import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ensureImgAlt, htmlToText, sanitizeCmsHtml, unescapeHtml } from "./utils";

describe("HTML entity decoding", () => {
  it("decodes numeric entities once for descriptions and metadata text", () => {
    expect(htmlToText("<p>Printer&#8217;s features&#8226;</p>")).toBe("Printer’s features•");
    expect(unescapeHtml("Title &amp;#8217;")).toBe("Title &#8217;");
    expect(unescapeHtml("Re- &amp; unwinders")).toBe("Re- & unwinders");
    expect(unescapeHtml("Re- &#038; unwinders")).toBe("Re- & unwinders");
    expect(unescapeHtml("Labels &ndash; Premium &trade;")).toBe("Labels – Premium ™");
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

describe("ensureImgAlt", () => {
  it("derives alt text from the filename when missing or empty", () => {
    expect(ensureImgAlt('<img src="/wp-content/uploads/2021/11/Loftware_Nicelabel_Logo_Stacked-1-300x87.png">')).toBe(
      '<img alt="Loftware Nicelabel Logo Stacked 1" src="/wp-content/uploads/2021/11/Loftware_Nicelabel_Logo_Stacked-1-300x87.png">',
    );
    expect(ensureImgAlt('<img class="a" alt="" src="/x/manual-printing.png" />')).toBe(
      '<img class="a" alt="manual printing" src="/x/manual-printing.png" />',
    );
  });

  it("keeps existing alt text", () => {
    const html = '<img alt="Existing" src="/x/y.png">';
    expect(ensureImgAlt(html)).toBe(html);
  });
});
