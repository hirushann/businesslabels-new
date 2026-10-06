// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import DownloadBlogPdfButton from "./DownloadBlogPdfButton";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock jspdf
const mockSave = vi.fn();
const mockAddImage = vi.fn();
const mockText = vi.fn();
const mockTextWithLink = vi.fn();
const mockAddPage = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetDrawColor = vi.fn();
const mockSetLineWidth = vi.fn();
const mockLine = vi.fn();
const mockSetPage = vi.fn();
const mockGetNumberOfPages = vi.fn(() => 1);
const mockSplitTextToSize = vi.fn((text: string) => [text]);
const mockGetImageProperties = vi.fn(() => ({ width: 100, height: 100, fileType: "PNG" }));

vi.mock("jspdf", () => {
  return {
    default: vi.fn(function MockJsPDF() {
      return {
        save: mockSave,
        addImage: mockAddImage,
        text: mockText,
        textWithLink: mockTextWithLink,
        addPage: mockAddPage,
        setFont: mockSetFont,
        setFontSize: mockSetFontSize,
        setTextColor: mockSetTextColor,
        setDrawColor: mockSetDrawColor,
        setLineWidth: mockSetLineWidth,
        line: mockLine,
        setPage: mockSetPage,
        getNumberOfPages: mockGetNumberOfPages,
        splitTextToSize: mockSplitTextToSize,
        getImageProperties: mockGetImageProperties,
      };
    }),
  };
});

// Mock jspdf-autotable
vi.mock("jspdf-autotable", () => ({
  default: vi.fn(),
}));

// Mock FileReader for jsdom
class MockFileReader {
  onloadend: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;
  result: string = "data:image/png;base64,mockbase64";

  readAsDataURL() {
    setTimeout(() => {
      if (this.onloadend) this.onloadend();
    }, 0);
  }
}

describe("DownloadBlogPdfButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.FileReader = MockFileReader as unknown as typeof FileReader;
    // Mock global fetch to return dummy blob
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      blob: () => Promise.resolve(new Blob(["mock-image-data"], { type: "image/png" })),
    } as unknown as Response);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders with default Dutch label when locale is nl", () => {
    render(
      <DownloadBlogPdfButton
        post={{
          title: "Test Blog Post",
          content: "<p>Dit is een test inhoud.</p>",
          slug: "test-blog-post",
          url: "https://businesslabels.nl/blog/test-blog-post",
        }}
        locale="nl"
      />
    );

    expect(screen.getByText("Download als PDF")).toBeDefined();
  });

  it("renders with default English label when locale is en", () => {
    render(
      <DownloadBlogPdfButton
        post={{
          title: "Test Blog Post",
          content: "<p>This is a test content.</p>",
          slug: "test-blog-post",
          url: "https://businesslabels.nl/en/blog/test-blog-post",
        }}
        locale="en"
      />
    );

    expect(screen.getByText("Download as PDF")).toBeDefined();
  });

  it("renders custom label when provided", () => {
    render(
      <DownloadBlogPdfButton
        post={{
          title: "Test Blog Post",
          content: "<p>Content</p>",
          url: "https://businesslabels.nl/blog/test-blog-post",
        }}
        label="Download Article (PDF)"
      />
    );

    expect(screen.getByText("Download Article (PDF)")).toBeDefined();
  });

  it("triggers PDF generation and download on button click", async () => {
    render(
      <DownloadBlogPdfButton
        post={{
          title: "Epson BK vs MK",
          content: "<h2>Kiezen</h2><p>Paragraaf over inkt.</p><ul><li>Punt 1</li></ul>",
          excerpt: "Korte samenvatting over Epson keuzes.",
          authorName: "Levi van der Molen",
          date: "02 jun 2026",
          category: "Article",
          image: "/Schaap-BK-print.jpg",
          slug: "epson-bk-vs-mk",
          url: "https://businesslabels.nl/blog/epson-bk-vs-mk",
        }}
        locale="nl"
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith("epson-bk-vs-mk.pdf");
    });
  });
});
