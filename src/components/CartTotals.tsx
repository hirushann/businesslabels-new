export default function CartTotals({
  totalExclVatLabel,
  totalInclVatLabel,
  totalExclVat,
  totalInclVat,
  isBusinessCustomer,
  className = "",
}: {
  totalExclVatLabel: string;
  totalInclVatLabel: string;
  totalExclVat: string;
  totalInclVat: string;
  isBusinessCustomer: boolean;
  className?: string;
}) {
  const primary = isBusinessCustomer
    ? { key: "excl-vat", label: totalExclVatLabel, value: totalExclVat }
    : { key: "incl-vat", label: totalInclVatLabel, value: totalInclVat };
  const secondary = isBusinessCustomer
    ? { key: "incl-vat", label: totalInclVatLabel, value: totalInclVat }
    : { key: "excl-vat", label: totalExclVatLabel, value: totalExclVat };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div data-cart-total={primary.key} className="flex items-center justify-between text-xl font-bold text-ink">
        <span>{primary.label}</span>
        <span>{primary.value}</span>
      </div>
      <div data-cart-total={secondary.key} className="flex items-center justify-between text-sm font-normal text-subtle">
        <span>{secondary.label}</span>
        <span>{secondary.value}</span>
      </div>
    </div>
  );
}
