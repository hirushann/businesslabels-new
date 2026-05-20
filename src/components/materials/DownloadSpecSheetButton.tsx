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
      let footerLogoBase64 = "";
      try {
        logoBase64 = await getBase64ImageFromUrl("/logo.png");
      } catch (err) {
        console.warn("Failed to load header logo:", err);
      }
      try {
        footerLogoBase64 = await getBase64ImageFromUrl("/footerlogo.png");
      } catch (err) {
        console.warn("Failed to load footer logo:", err);
      }

      let currentY = 38;

      // Draw Material Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(16, 24, 40); // Dark neutral (#101828)
      const titleLines = doc.splitTextToSize(materialTitle, 180);
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
        const subtitleLines = doc.splitTextToSize(materialSubtitle, 180);
        doc.text(subtitleLines, 15, currentY);
        currentY += subtitleLines.length * 5;
      }
      currentY += 8;

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
        currentY = (doc as any).lastAutoTable.finalY + 12;
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

        if (footerLogoBase64) {
          doc.addImage(footerLogoBase64, "PNG", 15, 275, 31, 6);
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
