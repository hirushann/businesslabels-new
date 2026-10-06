"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";

export interface BlogPdfPostData {
  title: string;
  content: string;
  excerpt?: string | null;
  authorName?: string | null;
  date?: string | null;
  category?: string | null;
  image?: string | null;
  slug?: string;
  url: string;
}

export interface DownloadBlogPdfButtonProps {
  post: BlogPdfPostData;
  locale?: string;
  label?: string;
}

// Convert image URL to Base64 data URL with proxy support for remote URLs
const getBase64ImageFromUrl = async (url: string): Promise<string> => {
  let targetUrl = url;
  if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
    targetUrl = `/api/media-proxy?url=${encodeURIComponent(targetUrl)}`;
  }

  const response = await fetch(targetUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function DownloadBlogPdfButton({
  post,
  locale = "nl",
  label,
}: DownloadBlogPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    setIsGenerating(true);

    try {
      // Dynamically import jsPDF and autoTable
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // A4 dimensions: 210 x 297 mm
      const marginX = 15;
      const contentWidth = 180;
      const contentStartY = 32;
      const maxY = 265;
      let currentY = contentStartY;

      const checkPageBreak = (neededHeight: number) => {
        if (currentY + neededHeight > maxY) {
          doc.addPage();
          currentY = contentStartY;
          return true;
        }
        return false;
      };

      // Load header logo
      let logoBase64 = "";
      try {
        logoBase64 = await getBase64ImageFromUrl("/logo.png");
      } catch (err) {
        console.warn("Could not load logo for blog PDF:", err);
      }

      // Load featured image
      let featuredImageBase64 = "";
      if (post.image) {
        try {
          const displayUrl = toDisplayImageUrl(post.image) || post.image;
          featuredImageBase64 = await getBase64ImageFromUrl(displayUrl);
        } catch (err) {
          console.warn("Could not load featured image for blog PDF:", err);
        }
      }

      // 1. Category Tag
      if (post.category) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(241, 136, 0); // #F18800 brand orange
        doc.text(post.category.toUpperCase(), marginX, currentY);
        currentY += 6;
      }

      // 2. Article Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(24, 24, 27); // #18181b
      const titleLines = doc.splitTextToSize(post.title, contentWidth);
      doc.text(titleLines, marginX, currentY);
      currentY += titleLines.length * 7.5 + 2;

      // 3. Meta details (Author, Date, Online URL)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // Slate-500
      const authorText = post.authorName
        ? `${locale === "nl" ? "Auteur" : "Author"}: ${post.authorName}`
        : "";
      const dateText = post.date
        ? `${locale === "nl" ? "Gepubliceerd" : "Published"}: ${post.date}`
        : "";
      const metaParts = [authorText, dateText].filter(Boolean);
      if (metaParts.length > 0) {
        doc.text(metaParts.join("   •   "), marginX, currentY);
        currentY += 4.5;
      }

      if (post.url) {
        doc.setTextColor(241, 136, 0);
        doc.textWithLink(post.url, marginX, currentY, { url: post.url });
        currentY += 4;
      }

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, currentY, marginX + contentWidth, currentY);
      currentY += 6;

      // 4. Featured Image (if loaded)
      if (featuredImageBase64) {
        try {
          const imgProps = doc.getImageProperties(featuredImageBase64);
          const ratio = imgProps.width / imgProps.height;
          let drawW = contentWidth;
          let drawH = contentWidth / ratio;
          if (drawH > 75) {
            drawH = 75;
            drawW = 75 * ratio;
          }
          checkPageBreak(drawH + 6);
          const imgX = marginX + (contentWidth - drawW) / 2;
          doc.addImage(featuredImageBase64, imgProps.fileType || "JPEG", imgX, currentY, drawW, drawH);
          currentY += drawH + 6;
        } catch (err) {
          console.warn("Failed drawing featured image in PDF:", err);
        }
      }

      // 5. Excerpt block
      if (post.excerpt) {
        const cleanExcerpt = post.excerpt.replace(/\s+/g, " ").trim();
        if (cleanExcerpt) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105);
          const excerptLines = doc.splitTextToSize(cleanExcerpt, contentWidth - 8);
          checkPageBreak(excerptLines.length * 5 + 6);

          const startBoxY = currentY;
          doc.text(excerptLines, marginX + 6, currentY + 3);
          const endBoxY = currentY + 3 + (excerptLines.length - 1) * 5 + 3;

          doc.setDrawColor(241, 136, 0);
          doc.setLineWidth(1);
          doc.line(marginX + 1, startBoxY, marginX + 1, endBoxY);

          currentY = endBoxY + 6;
        }
      }

      // 6. Body Content
      if (post.content) {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(post.content, "text/html");

        const renderInlineImage = async (imgEl: Element) => {
          const src = imgEl.getAttribute("src");
          if (!src) return;
          try {
            const displayUrl = toDisplayImageUrl(src) || src;
            const imgBase64 = await getBase64ImageFromUrl(displayUrl);
            if (imgBase64) {
              const imgProps = doc.getImageProperties(imgBase64);
              const ratio = imgProps.width / imgProps.height;
              let drawW = contentWidth;
              let drawH = contentWidth / ratio;
              if (drawH > 80) {
                drawH = 80;
                drawW = 80 * ratio;
              }
              checkPageBreak(drawH + 6);
              const imgX = marginX + (contentWidth - drawW) / 2;
              doc.addImage(imgBase64, imgProps.fileType || "JPEG", imgX, currentY, drawW, drawH);
              currentY += drawH + 6;
            }
          } catch (e) {
            console.warn("Could not load inline image for PDF:", e);
          }
        };

        const renderElement = async (el: Element) => {
          const tag = el.tagName.toUpperCase();

          if (["DIV", "SECTION", "ARTICLE", "MAIN", "ASIDE", "HEADER", "FOOTER"].includes(tag)) {
            for (const child of Array.from(el.children)) {
              await renderElement(child);
            }
            return;
          }

          if (tag === "H1" || tag === "H2") {
            const rawText = el.textContent?.replace(/\s+/g, " ").trim();
            if (!rawText) return;
            checkPageBreak(18);
            currentY += 3;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(24, 24, 27);
            const lines = doc.splitTextToSize(rawText, contentWidth);
            for (const line of lines) {
              checkPageBreak(7);
              doc.text(line, marginX, currentY);
              currentY += 6;
            }
            currentY += 2;
            return;
          }

          if (tag === "H3" || tag === "H4" || tag === "H5" || tag === "H6") {
            const rawText = el.textContent?.replace(/\s+/g, " ").trim();
            if (!rawText) return;
            checkPageBreak(14);
            currentY += 2;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(39, 39, 42);
            const lines = doc.splitTextToSize(rawText, contentWidth);
            for (const line of lines) {
              checkPageBreak(6);
              doc.text(line, marginX, currentY);
              currentY += 5;
            }
            currentY += 2;
            return;
          }

          if (tag === "P") {
            const innerImg = el.querySelector("img");
            if (innerImg && !el.textContent?.trim()) {
              await renderInlineImage(innerImg);
              return;
            }

            const rawText = el.textContent?.replace(/\s+/g, " ").trim();
            if (!rawText) return;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.5);
            doc.setTextColor(51, 65, 85);
            const lines = doc.splitTextToSize(rawText, contentWidth);
            for (const line of lines) {
              checkPageBreak(5);
              doc.text(line, marginX, currentY);
              currentY += 4.5;
            }
            currentY += 2.5;
            return;
          }

          if (tag === "UL" || tag === "OL") {
            const isOrdered = tag === "OL";
            const items = Array.from(el.querySelectorAll(":scope > li"));
            items.forEach((li, idx) => {
              const rawText = li.textContent?.replace(/\s+/g, " ").trim();
              if (!rawText) return;
              const bullet = isOrdered ? `${idx + 1}.` : "•";
              doc.setFont("helvetica", "normal");
              doc.setFontSize(9.5);
              doc.setTextColor(51, 65, 85);
              const lines = doc.splitTextToSize(rawText, contentWidth - 7);
              lines.forEach((line: string, lineIdx: number) => {
                checkPageBreak(5);
                if (lineIdx === 0) {
                  doc.setFont("helvetica", "bold");
                  doc.setTextColor(241, 136, 0);
                  doc.text(bullet, marginX + 1, currentY);
                  doc.setFont("helvetica", "normal");
                  doc.setTextColor(51, 65, 85);
                }
                doc.text(line, marginX + 7, currentY);
                currentY += 4.5;
              });
              currentY += 1;
            });
            currentY += 2;
            return;
          }

          if (tag === "BLOCKQUOTE") {
            const rawText = el.textContent?.replace(/\s+/g, " ").trim();
            if (!rawText) return;
            checkPageBreak(12);
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9.5);
            doc.setTextColor(71, 85, 105);
            const lines = doc.splitTextToSize(rawText, contentWidth - 8);
            const bqStart = currentY;
            for (const line of lines) {
              checkPageBreak(5);
              doc.text(line, marginX + 6, currentY);
              currentY += 4.5;
            }
            doc.setDrawColor(241, 136, 0);
            doc.setLineWidth(0.8);
            doc.line(marginX + 1, bqStart - 2, marginX + 1, currentY);
            currentY += 3;
            return;
          }

          if (tag === "TABLE") {
            try {
              autoTable(doc, {
                html: el as HTMLTableElement,
                startY: currentY,
                margin: { left: marginX, right: marginX, top: contentStartY, bottom: 25 },
                theme: "striped",
                styles: {
                  font: "helvetica",
                  fontSize: 8.5,
                  cellPadding: 2.5,
                  textColor: [51, 65, 85],
                },
                headStyles: {
                  fillColor: [241, 136, 0],
                  textColor: [255, 255, 255],
                  fontStyle: "bold",
                },
                alternateRowStyles: {
                  fillColor: [248, 250, 252],
                },
              });
              const lastTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
              if (lastTable?.finalY) {
                currentY = lastTable.finalY + 6;
              }
            } catch (e) {
              console.warn("Could not render table in PDF:", e);
            }
            return;
          }

          if (tag === "IMG") {
            await renderInlineImage(el);
            return;
          }

          // Fallback text rendering
          const fallbackText = el.textContent?.replace(/\s+/g, " ").trim();
          if (fallbackText) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.5);
            doc.setTextColor(51, 65, 85);
            const lines = doc.splitTextToSize(fallbackText, contentWidth);
            for (const line of lines) {
              checkPageBreak(5);
              doc.text(line, marginX, currentY);
              currentY += 4.5;
            }
            currentY += 2;
          }
        };

        for (const child of Array.from(parsed.body.children)) {
          await renderElement(child);
        }
      }

      // 7. Stamping Header and Footer on all pages
      const pageCount = doc.getNumberOfPages();
      const pageLabel = locale === "nl" ? "Pagina" : "Page";
      const ofLabel = locale === "nl" ? "van" : "of";
      const headerRight = locale === "nl" ? "BUSINESSLABELS BLOG" : "BUSINESSLABELS BLOG";

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // --- HEADER ---
        if (i === 1) {
          if (logoBase64) {
            doc.addImage(logoBase64, "PNG", marginX, 10, 41, 8);
          } else {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(241, 136, 0);
            doc.text("Businesslabels", marginX, 16);
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(148, 163, 184);
          doc.text(headerRight, marginX + contentWidth, 15, { align: "right" });
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(marginX, 22, marginX + contentWidth, 22);
        } else {
          if (logoBase64) {
            doc.addImage(logoBase64, "PNG", marginX, 10, 31, 6);
          }
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          const shortTitle = post.title.length > 55 ? post.title.slice(0, 52) + "..." : post.title;
          doc.text(shortTitle, marginX + contentWidth, 14, { align: "right" });
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(marginX, 20, marginX + contentWidth, 20);
        }

        // --- FOOTER ---
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(marginX, 272, marginX + contentWidth, 272);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          "Businesslabels B.V.   |   T: +31 318 590 465   |   E: verkoop@businesslabels.nl   |   W: businesslabels.nl",
          marginX,
          278
        );
        doc.text(`${pageLabel} ${i} ${ofLabel} ${pageCount}`, marginX + contentWidth, 278, { align: "right" });

        if (post.url) {
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text(post.url, marginX, 283);
        }
      }

      // Download file
      const safeSlug = (post.slug || post.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const fileName = `${safeSlug || "businesslabels-artikel"}.pdf`;
      doc.save(fileName);

      toast.success(
        locale === "nl" ? "PDF succesvol gedownload" : "PDF downloaded successfully"
      );
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error(
        locale === "nl"
          ? "Fout bij het genereren van de PDF"
          : "Failed to generate PDF"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      type="button"
      className="text-brand font-bold flex items-center gap-2 hover:text-brand underline disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      {isGenerating ? (
        <svg
          className="h-4 w-4 animate-spin text-current shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
      <span>
        {isGenerating
          ? locale === "nl"
            ? "PDF genereren..."
            : "Generating PDF..."
          : label || (locale === "nl" ? "Download als PDF" : "Download as PDF")}
      </span>
    </button>
  );
}
