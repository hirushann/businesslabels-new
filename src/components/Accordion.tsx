"use client";

import { useState } from "react";

type AccordionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  size?: "default" | "compact";
};

function AccordionIcon({ isOpen, size = "default" }: { isOpen: boolean; size?: "default" | "compact" }) {
  const iconClassName =
    size === "compact"
      ? "relative flex h-4 w-4 shrink-0 items-center justify-center text-amber-500 transition-transform duration-300 ease-out"
      : "relative flex h-5 w-5 shrink-0 items-center justify-center text-amber-500 transition-transform duration-300 ease-out";
  const horizontalClassName = size === "compact" ? "absolute h-0.5 w-4 rounded-full bg-current" : "absolute h-0.5 w-5 rounded-full bg-current";
  const verticalClassName =
    size === "compact"
      ? "absolute h-4 w-0.5 rounded-full bg-current transition-opacity duration-200 ease-out"
      : "absolute h-5 w-0.5 rounded-full bg-current transition-opacity duration-200 ease-out";

  return (
    <span
      className={iconClassName}
      style={{ transform: isOpen ? "rotate(0deg)" : "rotate(90deg)" }}
      aria-hidden="true"
    >
      <span className={horizontalClassName} />
      <span
        className={verticalClassName}
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
  size = "default",
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const headerSizeClassName = size === "compact" ? "min-h-12 px-4 py-3" : "min-h-20 px-6 py-6";
  const titleClassName = size === "compact" ? "text-neutral-700 text-base font-semibold" : "text-neutral-700 text-2xl font-bold";
  const contentSizeClassName = size === "compact" ? "px-4 pb-4" : "px-6 pb-6";

  return (
    <div
      className={`bg-gray-50 rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10 ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between gap-3 text-left ${headerSizeClassName} ${headerClassName}`}
      >
        <h2 className={titleClassName}>{title}</h2>
        <AccordionIcon isOpen={isOpen} size={size} />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className={`${contentSizeClassName} ${contentClassName}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
