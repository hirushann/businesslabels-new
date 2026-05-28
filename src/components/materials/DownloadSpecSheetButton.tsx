"use client";

import { useState } from "react";

interface DownloadSpecSheetButtonProps {
  materialId: number;
  materialTitle: string;
  materialCode: string;
  materialSubtitle?: string;
  hasUploadedSpecSheet: boolean;
  specSheetUrl: string;
  aboutRows: { label: string; value: string }[];
  specRows: { label: string; value: string }[];
  variant: "link" | "button";
  downloadLabel: string;
  materialImage?: string;
  description?: string;

  // Localized text for PDF
  pdfTitleLabel: string;          // "PRODUCTSPECIFICATIE"
  aboutThisMaterialLabel: string; // "Over dit materiaal"
  specificationsLabel: string;    // "Specificaties"
  pageLabel: string;              // "Pagina"
  ofLabel: string;                // "van"
}

// Utility to convert image URL to Base64 data URL
const getBase64ImageFromUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);
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

export default function DownloadSpecSheetButton({
  materialTitle,
  materialCode,
  materialSubtitle,
  hasUploadedSpecSheet,
  specSheetUrl,
  aboutRows,
  specRows,
  variant,
  downloadLabel,
  materialImage,
  description,
  pdfTitleLabel,
  aboutThisMaterialLabel,
  specificationsLabel,
  pageLabel,
  ofLabel,
}: DownloadSpecSheetButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (hasUploadedSpecSheet) {
      // Direct download of the uploaded PDF from Laravel
      window.open(specSheetUrl, "_blank");
      return;
    }

    // Client-side PDF generation
    setIsGenerating(true);
    try {
      // Dynamically import jsPDF and autoTable to keep bundles lightweight
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Load logo assets asynchronously
      let logoBase64 = "";
      try {
        logoBase64 = await getBase64ImageFromUrl("/logo.png");
      } catch (err) {
        console.warn("Failed to load header logo:", err);
      }

      let materialImageBase64 = "";
      if (materialImage) {
        try {
          // If the image starts with /, it's local. If it's absolute, proxy it or fetch directly.
          materialImageBase64 = await getBase64ImageFromUrl(materialImage);
        } catch (err) {
          console.warn("Failed to load material image for PDF:", err);
        }
      }

      let currentY = 38;
      
      // We will place the image on the right. Max width 70mm, Max height 70mm.
      let imgDrawH = 0;
      if (materialImageBase64) {
        try {
          const imgProps = doc.getImageProperties(materialImageBase64);
          const ratio = imgProps.width / imgProps.height;
          let drawW = 70;
          let drawH = 70 / ratio;
          if (drawH > 70) {
            drawH = 70;
            drawW = 70 * ratio;
          }
          imgDrawH = drawH;
          const imgX = 195 - drawW; // Right align to margin
          doc.addImage(materialImageBase64, imgProps.fileType || "PNG", imgX, currentY, drawW, drawH);
        } catch (err) {
          console.warn("Failed to draw material image:", err);
        }
      }

      // Draw Material Title (limit width so it doesn't overlap image)
      const textMaxWidth = materialImageBase64 ? 100 : 180;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(16, 24, 40); // Dark neutral (#101828)
      const titleLines = doc.splitTextToSize(materialTitle, textMaxWidth);
      doc.text(titleLines, 15, currentY);
      currentY += titleLines.length * 8;

      // Draw Material Code (Badge/Subtitle)
      if (materialCode) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(217, 119, 6); // Amber-600 (#D97706)
        doc.text(materialCode.toUpperCase(), 15, currentY);
        currentY += 6;
      }

      // Draw Material Subtitle
      if (materialSubtitle) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128); // Gray-500
        const subtitleLines = doc.splitTextToSize(materialSubtitle, textMaxWidth);
        doc.text(subtitleLines, 15, currentY);
        currentY += subtitleLines.length * 5;
      }
      currentY += 4;

      // Draw Description (wrap next to the image)
      let descriptionEndY = currentY;
      if (description) {
        const stripHtml = (html: string) => {
          const tmp = document.createElement("DIV");
          tmp.innerHTML = html;
          return tmp.textContent || tmp.innerText || "";
        };
        const cleanDesc = stripHtml(description).replace(/\s+/g, " ").trim();
        if (cleanDesc) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(75, 85, 99); // Gray-600
          const descLines = doc.splitTextToSize(cleanDesc, textMaxWidth);
          doc.text(descLines, 15, currentY);
          descriptionEndY = currentY + descLines.length * 4.5;
        }
      }

      // Now ensure we are below BOTH the left column (title/desc) and right column (image) before tables
      const contentStartY = Math.max(descriptionEndY, 38 + imgDrawH) + 8;
      currentY = contentStartY;

      // Draw Table 1: Over dit materiaal
      if (aboutRows.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(16, 24, 40);
        doc.text(aboutThisMaterialLabel, 15, currentY);
        currentY += 5;

        autoTable(doc, {
          startY: currentY,
          margin: { left: 15, right: 15, top: 32, bottom: 32 },
          body: aboutRows.map((row) => [row.label, row.value]),
          showHead: false,
          styles: {
            font: "helvetica",
            fontSize: 9.5,
            cellPadding: 3.5,
            lineColor: [243, 244, 246], // Gray-100
            lineWidth: 0.1,
          },
          columnStyles: {
            0: { fontStyle: "normal", textColor: [107, 114, 128], cellWidth: 60 },
            1: { fontStyle: "bold", textColor: [16, 24, 40] },
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251], // Gray-50
          },
          theme: "striped",
        });
        currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      }

      // Draw Table 2: Specifications
      if (specRows.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(16, 24, 40);
        doc.text(specificationsLabel, 15, currentY);
        currentY += 5;

        autoTable(doc, {
          startY: currentY,
          margin: { left: 15, right: 15, top: 32, bottom: 32 },
          body: specRows.map((row) => [row.label, row.value]),
          showHead: false,
          styles: {
            font: "helvetica",
            fontSize: 9.5,
            cellPadding: 3.5,
            lineColor: [243, 244, 246],
            lineWidth: 0.1,
          },
          columnStyles: {
            0: { fontStyle: "normal", textColor: [107, 114, 128], cellWidth: 60 },
            1: { fontStyle: "bold", textColor: [16, 24, 40] },
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251],
          },
          theme: "striped",
        });
      }

      // Apply Header, Footer and Page Numbering on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // --- HEADER ---
        if (logoBase64) {
          doc.addImage(logoBase64, "PNG", 15, 10, 41, 8); // 41x8mm preserves approx 5:1 ratio
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(16, 24, 40);
        doc.text(pdfTitleLabel.toUpperCase(), 195, 15, { align: "right" });

        doc.setDrawColor(229, 231, 235); // Gray-200
        doc.setLineWidth(0.3);
        doc.line(15, 23, 195, 23);

        // --- FOOTER ---
        doc.line(15, 272, 195, 272);

        if (logoBase64) {
          doc.addImage(logoBase64, "PNG", 15, 275, 31, 6);
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(107, 114, 128); // Gray-500
        doc.text(
          "T: +31 (0)318 590 465   |   E: verkoop@businesslabels.nl   |   W: businesslabels.nl",
          195,
          279,
          { align: "right" }
        );

        doc.setFontSize(7.5);
        doc.text(
          `${pageLabel} ${i} ${ofLabel} ${pageCount}`,
          195,
          284,
          { align: "right" }
        );
      }

      // Download file
      const fileName = `${materialCode || materialTitle.toLowerCase().replace(/\s+/g, "-")}-specs.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const pdfIcon = (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 3H7A2 2 0 0 0 5 5V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V8L14 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3V8H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const loaderIcon = (
    <svg className="h-4 w-4 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  if (variant === "button") {
    return (
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        type="button"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-base font-semibold leading-6 text-neutral-700 transition-all hover:border-amber-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isGenerating ? loaderIcon : pdfIcon}
        <span>{isGenerating ? "Genereren..." : downloadLabel}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      type="button"
      className="inline-flex items-center gap-1.5 font-semibold text-amber-600 transition-colors hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isGenerating ? loaderIcon : pdfIcon}
      <span>{isGenerating ? "Laden..." : downloadLabel}</span>
    </button>
  );
}
