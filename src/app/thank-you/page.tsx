"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/components/CartProvider";
import { localePath } from "@/lib/i18n/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";

type OrderDetails = {
  id?: number | string;
  number?: string;
  status?: string | null;
  total?: number | string;
  subtotal?: number | string;
  shipping_amount?: number | string;
  tax_amount?: number | string;
  discount_amount?: number | string;
  discount_total?: number | string;
  payment_method?: string;
  purchase_reference?: string;
  purchase_ref?: string;
  original_checkout_payload?: Record<string, any>;
  billing_address?: {
    name?: string;
    firstname?: string;
    lastname?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    postcode?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  shipping_address?: {
    name?: string;
    firstname?: string;
    lastname?: string;
    company?: string;
    address1?: string;
    address2?: string;
    address?: string;
    city?: string;
    postcode?: string;
    postalcode?: string;
    country?: string;
    country_id?: string;
  };
  items?: Array<{
    id?: number | string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    main_image?: string;
    images?: string[] | Array<{ url?: string; main_image?: string } | string>;
  }>;
  order_items?: Array<{
    id?: number | string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    main_image?: string;
    images?: string[] | Array<{ url?: string; main_image?: string } | string>;
  }>;
  line_items?: Array<{
    id?: number | string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    main_image?: string;
    images?: string[] | Array<{ url?: string; main_image?: string } | string>;
  }>;
};

// Helper to format values as Euro
function formatEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function readStringValue(source: Record<string, any> | null | undefined, keys: string[]): string {
  if (!source) return "";
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
  }
  return "";
}

function readNumberValue(source: Record<string, any> | null | undefined, keys: string[]): number | null {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const normalized = Number(value.replace(/[^\d.-]/g, ""));
      if (Number.isFinite(normalized)) {
        return normalized;
      }
    }
  }
  return null;
}

export default function ThankYouPage() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order_number");
  const { clearCart } = useCart();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  useEffect(() => {
    // Clear the cart as soon as we reach the thank you page with an order number
    if (orderNumber) {
      clearCart();
    }
  }, [clearCart, orderNumber]);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/checkout?number=${orderNumber}`);
        if (response.ok) {
          const json = await response.json();
          setOrder(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch order details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="bg-[#FAFBFD] px-5 py-24 min-h-[70vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
          <div className="text-neutral-500 font-bold">{t("thankYou.loading")}</div>
        </div>
      </div>
    );
  }

  const isRealOrder = !!order;
  const isSuccess = !isRealOrder || order?.status === "processing" || order?.status === "completed" || order?.status === "pending";

  const billingAddress = order?.billing_address;
  const shippingAddress = order?.shipping_address;
  const payload = order?.original_checkout_payload || {};

  const personalName = [
    readStringValue(order, ["billing_firstname", "billing_first_name"]) || readStringValue(payload, ["billing_firstname", "billing_first_name"]) || billingAddress?.firstname,
    readStringValue(order, ["billing_lastname", "billing_last_name"]) || readStringValue(payload, ["billing_lastname", "billing_last_name"]) || billingAddress?.lastname
  ].filter(Boolean).join(" ") || billingAddress?.name || (isRealOrder ? "" : "Alex Growder");

  const personalPhone = readStringValue(order, ["billing_phone", "phone"]) || readStringValue(payload, ["billing_phone", "phone"]) || billingAddress?.phone || (isRealOrder ? "" : "+88035654823");
  const personalEmail = readStringValue(order, ["billing_email", "email"]) || readStringValue(payload, ["billing_email", "email"]) || billingAddress?.email || (isRealOrder ? "" : "demo123@gmail.com");

  const shippingNameFormatted = shippingAddress?.name || [
    readStringValue(order, ["shipping_firstname", "shipping_first_name"]),
    readStringValue(order, ["shipping_lastname", "shipping_last_name"])
  ].filter(Boolean).join(" ") || personalName;

  const shippingStreet = shippingAddress?.address1 || shippingAddress?.address2 || shippingAddress?.address || readStringValue(order, ["shipping_address_1", "shipping_address"]) || (isRealOrder ? "" : "123 Example Street");
  const shippingCity = shippingAddress?.city || readStringValue(order, ["shipping_city"]) || (isRealOrder ? "" : "City");
  const shippingPostcode = shippingAddress?.postcode || shippingAddress?.postalcode || readStringValue(order, ["shipping_postalcode", "shipping_postcode"]) || (isRealOrder ? "" : "ST 90210");
  const shippingCountry = shippingAddress?.country || shippingAddress?.country_id || readStringValue(order, ["shipping_country_id", "shipping_country"]) || (isRealOrder ? "" : "United States");

  const fullShippingAddress = [shippingStreet, shippingCity, shippingPostcode, shippingCountry].filter(Boolean).join(", ") || (isRealOrder ? "" : "123 Example Street, City, ST 90210");

  const rawPaymentMethod = readStringValue(order, ["payment_method", "payment_method_title"]) || readStringValue(payload, ["payment_method", "payment_method_title"]);
  const paymentMethodLabel = rawPaymentMethod === "creditcard" || rawPaymentMethod === "credit_card"
    ? "Visa ending in *****4242"
    : rawPaymentMethod === "ideal"
    ? "iDEAL"
    : rawPaymentMethod === "banktransfer"
    ? "Bank Transfer"
    : rawPaymentMethod || (isRealOrder ? "" : "Visa ending in *****4242");

  const purchaseReference = readStringValue(order, ["notes"]) || readStringValue(payload, ["notes"]) || readStringValue(order, ["purchase_reference", "purchase_ref"]) || (isRealOrder ? "" : "PR-213321");

  // Totals calculations
  const subtotal = isRealOrder ? (readNumberValue(order, ["subtotal"]) ?? 0) : 4704.67;
  const shipping = isRealOrder ? (readNumberValue(order, ["shipping_amount", "shipping_total"]) ?? 0) : 100.00;
  const tax = isRealOrder ? (readNumberValue(order, ["tax_amount", "tax_total"]) ?? 0) : 988.00;
  const discount = isRealOrder ? (readNumberValue(order, ["discount_amount", "discount_total"]) ?? 0) : -100.00;
  const total = isRealOrder ? (readNumberValue(order, ["total", "grand_total"]) ?? 0) : 5792.67;

  // Order Items
  const itemsList = isRealOrder
    ? (order.items ?? order.order_items ?? order.line_items ?? [])
    : [
        { id: 1, name: "Epson CW-C6500Ae MK", quantity: 12, price: 18.99, total: 18.99, main_image: "" },
        { id: 2, name: "1000D, 100 x 150 mm", quantity: 12, price: 18.99, total: 18.99, main_image: "" },
        { id: 3, name: "Epson CW-C6500Ae MK", quantity: 12, price: 18.99, total: 18.99, main_image: "" },
      ];

  const orderId = orderNumber || readStringValue(order, ["number", "id"]) || "89201";

  // PDF Generation logic using dynamic jsPDF import
  const handleDownloadPDF = async () => {
    setIsPdfGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Helper function to load image
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = src;
          img.onload = () => resolve(img);
          img.onerror = (err) => reject(err);
        });
      };

      // Load logo image
      let logoImg: HTMLImageElement | null = null;
      try {
        logoImg = await loadImage("/logo.png");
      } catch (e) {
        console.error("Failed to load logo image:", e);
      }

      // Colors
      const primaryColor = [241, 136, 0]; // Orange
      const darkColor = [34, 34, 34];
      const grayColor = [136, 136, 136];

      // Header Brand or Logo
      if (logoImg) {
        const aspectRatio = logoImg.width / logoImg.height;
        const logoHeight = 12; // mm
        const logoWidth = logoHeight * aspectRatio;
        doc.addImage(logoImg, "PNG", 15, 12, logoWidth, logoHeight);
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("Businesslabels", 15, 20);
      }

      // Title
      doc.setFontSize(16);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      const titleY = logoImg ? 32 : 32;
      doc.text(`Order Confirmation #${orderId}`, 15, titleY);

      // Metainfo
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      
      let infoY = titleY + 6;
      doc.text(`Date: ${new Date().toLocaleDateString(locale === "nl" ? "nl-NL" : "en-US")}`, 15, infoY);
      
      // Mollie ID / Transaction ID
      const mollieId = readStringValue(order, ["transaction_id", "mollie_payment_id", "mollie_id"]) || readStringValue(payload, ["transaction_id", "mollie_payment_id", "mollie_id"]);
      if (mollieId) {
        infoY += 6;
        doc.text(`Mollie ID: ${mollieId}`, 15, infoY);
      }
      
      if (purchaseReference) {
        infoY += 6;
        doc.text(`Purchase Reference: ${purchaseReference}`, 15, infoY);
      }
      
      infoY += 10;
      doc.text(`Payment: ${paymentMethodLabel}`, 15, infoY);

      // Shipping & Billing columns
      const detailsY = infoY + 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text("Personal details", 15, detailsY);
      doc.text("Shipping address", 110, detailsY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      // Personal
      let personalY = detailsY + 6;
      doc.text(personalName, 15, personalY);
      if (personalPhone) doc.text(personalPhone, 15, personalY += 5);
      if (personalEmail) doc.text(personalEmail, 15, personalY += 5);

      // Shipping
      let shippingY = detailsY + 6;
      doc.text(shippingNameFormatted, 110, shippingY);
      doc.text(shippingStreet, 110, shippingY += 5);
      doc.text(`${shippingPostcode} ${shippingCity}`, 110, shippingY += 5);
      doc.text(shippingCountry, 110, shippingY += 5);

      // Items Table Header starts dynamic to avoid any overlap with address lines
      let tableY = Math.max(personalY, shippingY) + 12;
      doc.setFillColor(237, 242, 247);
      doc.rect(15, tableY, 180, 8, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text("Product", 18, tableY + 5);
      doc.text("Qty", 125, tableY + 5);
      doc.text("Price", 145, tableY + 5);
      doc.text("Total", 175, tableY + 5);

      // Items List
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      let itemY = tableY + 8;

      itemsList.forEach((item) => {
        itemY += 6;
        doc.text(item.name || "Product", 18, itemY);
        doc.text(String(item.quantity), 125, itemY);
        doc.text(formatEuro(item.price), 145, itemY);
        doc.text(formatEuro(item.total), 175, itemY);

        // Border below item
        doc.setDrawColor(237, 242, 247);
        doc.line(15, itemY + 2, 195, itemY + 2);
        itemY += 2;
      });

      // Totals
      let totalsY = itemY + 12;
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal", 130, totalsY);
      doc.text(formatEuro(subtotal), 175, totalsY);

      doc.text("Shipping", 130, totalsY += 6);
      doc.text(formatEuro(shipping), 175, totalsY);

      doc.text("VAT (21%)", 130, totalsY += 6);
      doc.text(formatEuro(tax), 175, totalsY);

      if (discount !== 0) {
        doc.setTextColor(221, 51, 51);
        doc.text("Discount", 130, totalsY += 6);
        doc.text(formatEuro(discount), 175, totalsY);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      }

      // Grand Total
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Total incl. VAT", 130, totalsY += 8);
      doc.text(formatEuro(total), 175, totalsY);

      // Save PDF
      doc.save(`Order_Confirmation_${orderId}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF invoice:", err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col items-center relative overflow-hidden">
      {/* Blurred background orange circle on the left */}
      <div className="absolute left-[-150px] top-[15%] w-[380px] h-[380px] rounded-full bg-[#F18800]/10 blur-[120px] pointer-events-none z-0" />

      {/* Breadcrumb section aligned with Header (max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-0) */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-0 mt-8 mb-8 self-start relative z-10">
        <Breadcrumbs
          items={[
            { label: t("thankYou.successTitle") || "Order Confirmed" },
          ]}
        />
      </div>

      <div className="w-full max-w-[816px] px-4 pb-16 flex flex-col justify-start items-center gap-10 z-10">
        {/* Success Header */}
        <div className="flex flex-col justify-start items-center gap-6 text-center animate-in fade-in slide-in-from-top-4 duration-500">
          <img
            className="w-[180px] h-[180px] object-contain hover:scale-105 transition-transform duration-300"
            src="/thankyou.png"
            alt="Order Confirmation Mascot"
          />
          <div className="flex flex-col gap-3">
            <h1 className="text-[#222222] text-3xl md:text-[40px] font-bold leading-tight font-sans">
              {isSuccess ? t("thankYou.successTitle") : t("thankYou.pendingTitle")}
            </h1>
            <div style={{ color: "#444444", fontSize: "18px", fontFamily: "Segoe UI", fontWeight: 400, lineHeight: "23.40px", wordWrap: "break-word" }}>
              {t("thankYou.orderPlaced", { number: orderId })}
            </div>
          </div>
        </div>

        {/* main container card */}
        <div className="w-full bg-white shadow-[2px_4px_20px_rgba(109,109,120,0.10)] rounded-2xl md:rounded-[12px] border border-[#EDF2F7] p-6 md:p-8 flex flex-col md:flex-row gap-8 md:gap-10 animate-in fade-in zoom-in-95 duration-500 relative">
          
          {/* Left Column: Order Summary */}
          <div className="flex-1 flex flex-col gap-6">
            <h2 className="text-[#000000] text-xl md:text-[22px] font-bold tracking-tight border-b border-[#EDF2F7] pb-3">
              {t("thankYou.orderSummary") || "Order Summary"}
            </h2>
            
            {/* Items List */}
            <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
              {itemsList.map((item, index) => {
                const rawImage = item.main_image || 
                  (Array.isArray(item.images) && item.images.length > 0 
                    ? (typeof item.images[0] === 'string' ? item.images[0] : (item.images[0]?.url || item.images[0]?.main_image)) 
                    : "");
                const imageSrc = toDisplayImageUrl(rawImage);
                return (
                  <div key={item.id || index} className="flex items-center gap-3">
                    <div className="w-[62px] h-[62px] p-1.5 bg-[#EDF2F7] overflow-hidden rounded-lg justify-center align-items-center flex shrink-0 border border-slate-100">
                      {imageSrc ? (
                        <img className="w-full h-full object-contain" src={imageSrc} alt={item.name} />
                      ) : (
                        <svg className="w-7 h-7 text-neutral-400 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#444444] text-[15px] md:text-[16px] font-bold leading-tight line-clamp-2">
                          {item.name}
                        </span>
                        <span className="text-[#888888] text-[13px] md:text-[14px]">
                          {item.quantity} {item.quantity === 1 ? "Item" : "Items"}
                        </span>
                      </div>
                      <span className="text-[#222222] text-[16px] md:text-[18px] font-bold shrink-0">
                        {formatEuro(item.total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Separator line */}
            <div className="w-full h-px bg-[#EDF2F7]"></div>

            {/* Pricing Breakdowns */}
            <div className="flex flex-col gap-3.5">
              <div className="flex justify-between items-center text-[#222222] text-[16px] md:text-[18px] font-bold">
                <span>{t("checkout.subtotal") || "Subtotal"}</span>
                <span>{formatEuro(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-[#222222] text-[16px] md:text-[18px] font-bold">
                <span>{t("checkout.shipping") || "Shipping"}</span>
                <span>{formatEuro(shipping)}</span>
              </div>
              <div className="flex justify-between items-center text-[#222222] text-[16px] md:text-[18px] font-bold">
                <span>VAT (21%)</span>
                <span>{formatEuro(tax)}</span>
              </div>
              
              {discount !== 0 && (
                <div className="flex justify-between items-center text-[#DD3333] text-[16px] md:text-[18px] font-bold">
                  <span>Discount</span>
                  <span>-{formatEuro(Math.abs(discount))}</span>
                </div>
              )}

              {/* Separator line before total */}
              <div className="w-full h-px bg-[#D9E3ED] my-1"></div>

              <div className="flex justify-between items-center text-[#222222] text-[18px] md:text-[20px] font-bold">
                <span>{t("thankYou.totalInclVat") || "Total incl. VAT"}</span>
                <span className="font-semibold text-[18px] md:text-[20px]">{formatEuro(total)}</span>
              </div>
            </div>
          </div>

          {/* Desktop Vertical divider */}
          <div className="hidden md:block w-px bg-[#D9E3ED] self-stretch"></div>

          {/* Right Column: Delivery Details */}
          <div className="flex-1 flex flex-col gap-4">
            <h2 className="text-[#000000] text-xl md:text-[22px] font-bold tracking-tight border-b border-[#EDF2F7] pb-3">
              {t("thankYou.deliveryDetails") || "Delivery Details"}
            </h2>

            {/* Detail Blocks */}
            <div className="flex flex-col gap-4">
              {/* Personal info */}
              {personalName && (
                <div className="w-full p-4 bg-white rounded-xl border border-[#E0E7EE] flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                      <mask id="mask0_2394_14751" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="28" height="28">
                        <rect width="28" height="28" fill="#D9D9D9"/>
                      </mask>
                      <g mask="url(#mask0_2394_14751)">
                        <path d="M5.3959 25.6654C5.08479 25.6654 4.80284 25.539 4.55007 25.2862C4.29729 25.0334 4.1709 24.7515 4.1709 24.4404V21.3779C4.1709 19.6279 4.71534 18.082 5.80423 16.7404C6.89312 15.3987 8.29312 14.5431 10.0042 14.1737C9.22645 14.7181 8.62368 15.4036 8.1959 16.2299C7.76812 17.0563 7.55423 17.9459 7.55423 18.8987V24.4404C7.55423 24.6543 7.5834 24.8681 7.64173 25.082C7.70007 25.2959 7.79729 25.4904 7.9334 25.6654H5.3959ZM9.6834 25.6654C9.35284 25.6654 9.06604 25.5438 8.82298 25.3008C8.57993 25.0577 8.4584 24.7709 8.4584 24.4404V18.8987C8.4584 17.5376 8.93965 16.3806 9.90215 15.4279C10.8646 14.4751 12.0265 13.9987 13.3876 13.9987H18.9001C20.2612 13.9987 21.4181 14.4751 22.3709 15.4279C23.3237 16.3806 23.8001 17.5376 23.8001 18.8987V20.7654C23.8001 22.1265 23.3237 23.2834 22.3709 24.2362C21.4181 25.189 20.2612 25.6654 18.9001 25.6654H9.6834ZM14.0001 11.5487C12.7167 11.5487 11.6278 11.1015 10.7334 10.207C9.83895 9.31259 9.39173 8.2237 9.39173 6.94036C9.39173 5.65703 9.83895 4.56814 10.7334 3.6737C11.6278 2.77925 12.7167 2.33203 14.0001 2.33203C15.2834 2.33203 16.3723 2.77925 17.2667 3.6737C18.1612 4.56814 18.6084 5.65703 18.6084 6.94036C18.6084 8.2237 18.1612 9.31259 17.2667 10.207C16.3723 11.1015 15.2834 11.5487 14.0001 11.5487Z" fill="#888888"/>
                      </g>
                    </svg>
                    <span className="text-[#222222] text-[16px] md:text-[18px] font-bold">{t("thankYou.personalInfo") || "Personal info"}</span>
                  </div>
                  <div className="text-[#444444] text-[15px] md:text-[16px] font-normal leading-relaxed flex flex-col">
                    <span>{personalName}</span>
                    {personalPhone && <span>{personalPhone}</span>}
                    {personalEmail && <span>{personalEmail}</span>}
                  </div>
                </div>
              )}

              {/* Shipping address */}
              {fullShippingAddress && (
                <div className="w-full p-4 bg-white rounded-xl border border-[#E0E7EE] flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="shrink-0 text-[#888888]">
                      <mask id="mask0_shipping" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="28" height="28">
                        <rect width="28" height="28" fill="#D9D9D9"/>
                      </mask>
                      <g mask="url(#mask0_shipping)">
                        <path d="M8.95384 24.6883C7.65106 24.0369 6.99967 23.1959 6.99967 22.1654C6.99967 21.6987 7.14065 21.2661 7.42259 20.8674C7.70454 20.4688 8.09829 20.1237 8.60384 19.832L10.4413 21.5529C10.2663 21.6306 10.0768 21.7181 9.87259 21.8154C9.66842 21.9126 9.50801 22.0293 9.39134 22.1654C9.64412 22.4765 10.2275 22.7487 11.1413 22.982C12.0552 23.2154 13.008 23.332 13.9997 23.332C14.9913 23.332 15.949 23.2154 16.8726 22.982C17.7962 22.7487 18.3844 22.4765 18.6372 22.1654C18.5011 22.0098 18.3261 21.8834 18.1122 21.7862C17.8983 21.689 17.6941 21.6015 17.4997 21.5237L19.308 19.7737C19.8525 20.0848 20.2705 20.4397 20.5622 20.8383C20.8538 21.2369 20.9997 21.6793 20.9997 22.1654C20.9997 23.1959 20.3483 24.0369 19.0455 24.6883C17.7427 25.3397 16.0608 25.6654 13.9997 25.6654C11.9386 25.6654 10.2566 25.3397 8.95384 24.6883ZM13.9997 22.1654C11.258 20.1431 9.21148 18.1793 7.86009 16.2737C6.5087 14.3681 5.83301 12.5015 5.83301 10.6737C5.83301 9.29314 6.08092 8.08273 6.57676 7.04245C7.07259 6.00217 7.7094 5.13203 8.48717 4.43203C9.26495 3.73203 10.14 3.20703 11.1122 2.85703C12.0844 2.50703 13.0469 2.33203 13.9997 2.33203C14.9525 2.33203 15.915 2.50703 16.8872 2.85703C17.8594 3.20703 18.7344 3.73203 19.5122 4.43203C20.29 5.13203 20.9268 6.00217 21.4226 7.04245C21.9184 8.08273 22.1663 9.29314 22.1663 10.6737C22.1663 12.5015 21.4906 14.3681 20.1393 16.2737C18.7879 18.1793 16.7413 20.1431 13.9997 22.1654ZM13.9997 12.832C14.6413 12.832 15.1906 12.6036 15.6476 12.1466C16.1045 11.6897 16.333 11.1404 16.333 10.4987C16.333 9.85703 16.1045 9.30773 15.6476 8.85078C15.1906 8.39384 14.6413 8.16537 13.9997 8.16537C13.358 8.16537 12.8087 8.39384 12.3518 8.85078C11.8948 9.30773 11.6663 9.85703 11.6663 10.4987C11.6663 11.1404 11.8948 11.6897 12.3518 12.1466C12.8087 12.6036 13.358 12.832 13.9997 12.832Z" fill="currentColor"/>
                      </g>
                    </svg>
                    <span className="text-[#222222] text-[16px] md:text-[18px] font-bold">{t("thankYou.shippingAddress") || "Shipping address"}</span>
                  </div>
                  <div className="text-[#444444] text-[15px] md:text-[16px] font-normal leading-relaxed">
                    {fullShippingAddress}
                  </div>
                </div>
              )}

              {/* Payment method */}
              {paymentMethodLabel && (
                <div className="w-full p-4 bg-white rounded-xl border border-[#E0E7EE] flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <svg width="33" height="28" viewBox="0 0 33 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                      <path d="M31 8.53906V7.0625C31 5.37112 29.6289 4 27.9375 4H6.0625C4.37112 4 3 5.37112 3 7.0625V8.53906C3 8.61158 3.02881 8.68113 3.08009 8.73241C3.13137 8.78369 3.20092 8.8125 3.27344 8.8125H30.7266C30.7991 8.8125 30.8686 8.78369 30.9199 8.73241C30.9712 8.68113 31 8.61158 31 8.53906ZM3 10.8359V20.1875C3 21.8789 4.37112 23.25 6.0625 23.25H27.9375C29.6289 23.25 31 21.8789 31 20.1875V10.8359C31 10.7634 30.9712 10.6939 30.9199 10.6426C30.8686 10.5913 30.7991 10.5625 30.7266 10.5625H3.27344C3.20092 10.5625 3.13137 10.5913 3.08009 10.6426C3.02881 10.6939 3 10.7634 3 10.8359ZM10 18C10 18.4832 9.60822 18.875 9.125 18.875H8.25C7.76678 18.875 7.375 18.4832 7.375 18V17.125C7.375 16.6418 7.76678 16.25 8.25 16.25H9.125C9.60822 16.25 10 16.6418 10 17.125V18Z" fill="#888888"/>
                    </svg>
                    <span className="text-[#222222] text-[16px] md:text-[18px] font-bold">{t("thankYou.paymentMethod") || "Payment method"}</span>
                  </div>
                  <div className="text-[#444444] text-[15px] md:text-[16px] font-normal leading-relaxed">
                    {paymentMethodLabel}
                  </div>
                </div>
              )}

              {/* Purchase Reference */}
              {purchaseReference && (
                <div className="w-full p-4 bg-white rounded-xl border border-[#E0E7EE] flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <svg width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                      <mask id="mask0_2486_7330" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="29" height="29">
                        <rect width="29" height="29" fill="#D9D9D9"/>
                      </mask>
                      <g mask="url(#mask0_2486_7330)">
                        <path d="M3.625 25.1391V3.1474C3.625 3.00642 3.68542 2.91076 3.80625 2.86042C3.92708 2.81007 4.03785 2.83524 4.13854 2.93594L5.01458 3.81198C5.13542 3.93281 5.27639 3.99323 5.4375 3.99323C5.59861 3.99323 5.73958 3.93281 5.86042 3.81198L6.82708 2.84531C6.94792 2.72448 7.08889 2.66406 7.25 2.66406C7.41111 2.66406 7.55208 2.72448 7.67292 2.84531L8.63958 3.81198C8.76042 3.93281 8.90139 3.99323 9.0625 3.99323C9.22361 3.99323 9.36458 3.93281 9.48542 3.81198L10.4521 2.84531C10.5729 2.72448 10.7139 2.66406 10.875 2.66406C11.0361 2.66406 11.1771 2.72448 11.2979 2.84531L12.2646 3.81198C12.3854 3.93281 12.5264 3.99323 12.6875 3.99323C12.8486 3.99323 12.9896 3.93281 13.1104 3.81198L14.0771 2.84531C14.1979 2.72448 14.3389 2.66406 14.5 2.66406C14.6611 2.66406 14.8021 2.72448 14.9229 2.84531L15.8896 3.81198C16.0104 3.93281 16.1514 3.99323 16.3125 3.99323C16.4736 3.99323 16.6146 3.93281 16.7354 3.81198L17.7021 2.84531C17.8229 2.72448 17.9639 2.66406 18.125 2.66406C18.2861 2.66406 18.4271 2.72448 18.5479 2.84531L19.5146 3.81198C19.6354 3.93281 19.7764 3.99323 19.9375 3.99323C20.0986 3.99323 20.2396 3.93281 20.3604 3.81198L21.3271 2.84531C21.4479 2.72448 21.5889 2.66406 21.75 2.66406C21.9111 2.66406 22.0521 2.72448 22.1729 2.84531L23.1396 3.81198C23.2604 3.93281 23.4014 3.99323 23.5625 3.99323C23.7236 3.99323 23.8646 3.93281 23.9854 3.81198L24.8615 2.93594C24.9622 2.83524 25.0729 2.81007 25.1938 2.86042C25.3146 2.91076 25.375 3.00642 25.375 3.1474V25.1391C25.375 25.421 25.2542 25.6123 25.0125 25.713C24.7708 25.8137 24.5493 25.7634 24.3479 25.562L23.9854 25.1995C23.8646 25.0786 23.7236 25.0182 23.5625 25.0182C23.4014 25.0182 23.2604 25.0786 23.1396 25.1995L22.1729 26.1661C22.0521 26.287 21.9111 26.3474 21.75 26.3474C21.5889 26.3474 21.4479 26.287 21.3271 26.1661L20.3604 25.1995C20.2396 25.0786 20.0986 25.0182 19.9375 25.0182C19.7764 25.0182 19.6354 25.0786 19.5146 25.1995L18.5479 26.1661C18.4271 26.287 18.2861 26.3474 18.125 26.3474C17.9639 26.3474 17.8229 26.287 17.7021 26.1661L16.7354 25.1995C16.6146 25.0786 16.4736 25.0182 16.3125 25.0182C16.1514 25.0182 16.0104 25.0786 15.8896 25.1995L14.9229 26.1661C14.8021 26.287 14.6611 26.3474 14.5 26.3474C14.3389 26.3474 14.1979 26.287 14.0771 26.1661L13.1104 25.1995C12.9896 25.0786 12.8486 25.0182 12.6875 25.0182C12.5264 25.0182 12.3854 25.0786 12.2646 25.1995L11.2979 26.1661C11.1771 26.287 11.0361 26.3474 10.875 26.3474C10.7139 26.3474 10.5729 26.287 10.4521 26.1661L9.48542 25.1995C9.36458 25.0786 9.22361 25.0182 9.0625 25.0182C8.90139 25.0182 8.76042 25.0786 8.63958 25.1995L7.67292 26.1661C7.55208 26.287 7.41111 26.3474 7.25 26.3474C7.08889 26.3474 6.94792 26.287 6.82708 26.1661L5.86042 25.1995C5.73958 25.0786 5.59861 25.0182 5.4375 25.0182C5.27639 25.0182 5.13542 25.0786 5.01458 25.1995L4.65208 25.562C4.45069 25.7634 4.22917 25.8137 3.9875 25.713C3.74583 25.6123 3.625 25.421 3.625 25.1391ZM8.45833 20.5474H20.5417C20.884 20.5474 21.171 20.4316 21.4026 20.2C21.6342 19.9684 21.75 19.6814 21.75 19.3391C21.75 18.9967 21.6342 18.7097 21.4026 18.4781C21.171 18.2465 20.884 18.1307 20.5417 18.1307H8.45833C8.11597 18.1307 7.82899 18.2465 7.5974 18.4781C7.3658 18.7097 7.25 18.9967 7.25 19.3391C7.25 19.6814 7.3658 19.9684 7.5974 20.2C7.82899 20.4316 8.11597 20.5474 8.45833 20.5474ZM8.45833 15.7141H20.5417C20.884 15.7141 21.171 15.5983 21.4026 15.3667C21.6342 15.1351 21.75 14.8481 21.75 14.5057C21.75 14.1634 21.6342 13.8764 21.4026 13.6448C21.171 13.4132 20.884 13.2974 20.5417 13.2974H8.45833C8.11597 13.2974 7.82899 13.4132 7.5974 13.6448C7.3658 13.8764 7.25 14.1634 7.25 14.5057C7.25 14.8481 7.3658 15.1351 7.5974 15.3667C7.82899 15.5983 8.11597 15.7141 8.45833 15.7141ZM8.45833 10.8807H20.5417C20.884 10.8807 21.171 10.7649 21.4026 10.5333C21.6342 10.3017 21.75 10.0148 21.75 9.67239C21.75 9.33003 21.6342 9.04305 21.4026 8.81146C21.171 8.57986 20.884 8.46406 20.5417 8.46406H8.45833C8.11597 8.46406 7.82899 8.57986 7.5974 8.81146C7.3658 9.04305 7.25 9.33003 7.25 9.67239C7.25 10.0148 7.3658 10.3017 7.5974 10.5333C7.82899 10.7649 8.11597 10.8807 8.45833 10.8807Z" fill="#888888"/>
                      </g>
                    </svg>
                    <span className="text-[#222222] text-[16px] md:text-[18px] font-bold">{t("thankYou.purchaseReference") || "Purchase Reference"}</span>
                  </div>
                  <div className="text-[#444444] text-[15px] md:text-[16px] font-normal leading-relaxed">
                    {purchaseReference}
                  </div>
                </div>
              )}
            </div>

            {/* Continue Shopping Action */}
            <Link
              href={localePath("/product", locale)}
              className="mt-4 w-full h-[52px] bg-[#F18800] rounded-full justify-center items-center flex text-white text-[18px] font-bold transition-all hover:bg-[#d67700] hover:shadow-lg hover:shadow-amber-500/10 active:scale-[0.98] cursor-pointer"
            >
              {t("thankYou.continueShopping") || "Continue Shopping"}
            </Link>

            {/* Download Invoice PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isPdfGenerating}
              className="flex justify-center items-center gap-1.5 cursor-pointer group mt-0 self-center transition-all disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="transition-colors">
                <path d="M8.65215 12.1985C8.85814 12.4047 9.19199 12.4045 9.39785 12.1985L11.6572 9.93921C11.8632 9.73335 11.8632 9.39937 11.6572 9.19351C11.4513 8.98752 11.1175 8.98752 10.9115 9.19351L9.55234 10.5527V6.74219C9.55234 6.45091 9.31614 6.21484 9.025 6.21484C8.73372 6.21484 8.49765 6.45091 8.49765 6.74219V10.5527L7.13851 9.19351C6.93251 8.98752 6.59867 8.98752 6.39267 9.19351C6.18682 9.39937 6.18682 9.73335 6.39267 9.93921L8.65215 12.1985Z" className="fill-[#F18800] group-hover:fill-[#d67700] transition-colors"/>
                <path d="M11.2844 13.5547H6.76562C6.47449 13.5547 6.23828 13.7908 6.23828 14.082C6.23828 14.3732 6.47449 14.6094 6.76562 14.6094H11.2844C11.5756 14.6094 11.8118 14.3732 11.8118 14.082C11.8118 13.7908 11.5757 13.5547 11.2844 13.5547Z" className="fill-[#F18800] group-hover:fill-[#d67700] transition-colors"/>
                <path d="M14.1093 0H6.20151C6.06171 0 5.92754 0.0556183 5.82866 0.154495L2.43965 3.5435C2.34077 3.64238 2.28516 3.77655 2.28516 3.91635V16.343C2.28516 17.2566 3.02852 18 3.94217 18H14.1093C15.0204 18 15.7663 17.2634 15.7663 16.343V1.65701C15.7663 0.745972 15.0298 0 14.1093 0ZM6.239 1.23555V3.35152C6.239 3.68372 5.96887 3.95384 5.63667 3.95384H3.52071L6.239 1.23555ZM14.7117 16.343C14.7117 16.6711 14.4465 16.9453 14.1093 16.9453H3.94217C3.61011 16.9453 3.33984 16.675 3.33984 16.343V5.00867H5.63667C6.55032 5.00867 7.29369 4.2653 7.29369 3.35165V1.05469H14.1093C14.4375 1.05469 14.7117 1.32001 14.7117 1.65701V16.343Z" className="fill-[#F18800] group-hover:fill-[#d67700] transition-colors"/>
              </svg>
              <span className="text-[#F18800] text-[18px] font-bold underline decoration-solid group-hover:text-[#d67700] transition-colors">
                {isPdfGenerating ? t("common.loading") : t("thankYou.downloadConfirmation") || "download order confirmation"}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
