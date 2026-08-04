import Accordion from "@/components/Accordion";
import { htmlToText } from "@/lib/utils";

export function hasProductDescription(description?: string | null): boolean {
  if (!description) return false;

  const text = htmlToText(description).toLocaleLowerCase().replace(/\.$/, "");
  return Boolean(text && text !== "no product description available");
}

export default function ProductDescriptionAccordion({
  title,
  description,
}: {
  title: string;
  description?: string | null;
}) {
  if (!hasProductDescription(description)) return null;

  return (
    <Accordion title={title}>
      <div
        className="text-neutral-700 text-base font-normal leading-6 cms-content [&_a]:text-brand [&_a]:underline hover:[&_a]:text-[var(--brand-hover)] [&_a]:transition-colors"
        dangerouslySetInnerHTML={{ __html: description! }}
      />
    </Accordion>
  );
}
