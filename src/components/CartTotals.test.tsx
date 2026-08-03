import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CartTotals from "./CartTotals";
import { isBusinessCustomerProfile } from "@/hooks/useIsBusinessCustomer";

describe("CartTotals", () => {
  it("renders excl.-VAT as the primary total for B2B customers", () => {
    const html = renderToStaticMarkup(
      <CartTotals
        totalExclVatLabel="Total excl. VAT"
        totalInclVatLabel="Total incl. VAT"
        totalExclVat="€100.00"
        totalInclVat="€121.00"
        isBusinessCustomer={true}
      />,
    );

    expect(html.indexOf('data-cart-total="excl-vat"')).toBeLessThan(html.indexOf('data-cart-total="incl-vat"'));
    expect(html).toContain('data-cart-total="excl-vat" class="flex items-center justify-between text-xl font-bold');
    expect(html).toContain('data-cart-total="incl-vat" class="flex items-center justify-between text-sm font-normal');
  });

  it("renders incl.-VAT as the primary total for normal customers", () => {
    const html = renderToStaticMarkup(
      <CartTotals
        totalExclVatLabel="Total excl. VAT"
        totalInclVatLabel="Total incl. VAT"
        totalExclVat="€100.00"
        totalInclVat="€121.00"
        isBusinessCustomer={false}
      />,
    );

    expect(html.indexOf('data-cart-total="incl-vat"')).toBeLessThan(html.indexOf('data-cart-total="excl-vat"'));
    expect(html).toContain('data-cart-total="incl-vat" class="flex items-center justify-between text-xl font-bold');
    expect(html).toContain('data-cart-total="excl-vat" class="flex items-center justify-between text-sm font-normal');
  });

  it("uses explicit customer type first and company details as the existing fallback", () => {
    expect(isBusinessCustomerProfile({ is_company: true })).toBe(true);
    expect(isBusinessCustomerProfile({ data: { company_name: "Business Labels BV" } })).toBe(true);
    expect(isBusinessCustomerProfile({ customer_type: "b2c", company_name: "Old value" })).toBe(false);
    expect(isBusinessCustomerProfile({ company_name: "Business Labels BV" })).toBe(true);
    expect(isBusinessCustomerProfile({})).toBe(false);
  });
});
