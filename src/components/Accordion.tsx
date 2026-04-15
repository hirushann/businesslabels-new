"use client";

import { useState } from "react";

type AccordionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
};

function AccordionIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span
      className="relative flex h-5 w-5 shrink-0 items-center justify-center text-amber-500 transition-transform duration-300 ease-out"
      style={{ transform: isOpen ? "rotate(0deg)" : "rotate(90deg)" }}
      aria-hidden="true"
    >
      <span className="absolute h-0.5 w-5 rounded-full bg-current" />
      <span
        className="absolute h-5 w-0.5 rounded-full bg-current transition-opacity duration-200 ease-out"
        style={{ opacity: isOpen ? 0 : 1 }}
      />
    </span>
  );
}

export default function Accordion({
  title,
  defaultOpen = true,
  children,
  className = "",
  headerClassName = "",
  contentClassName = "",
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`bg-gray-50 rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10 ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className={`flex min-h-20 w-full items-center justify-between gap-4 px-6 py-6 text-left ${headerClassName}`}
      >
        <h2 className="text-neutral-700 text-2xl font-bold">{title}</h2>
        <AccordionIcon isOpen={isOpen} />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className={`px-6 pb-6 ${contentClassName}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
