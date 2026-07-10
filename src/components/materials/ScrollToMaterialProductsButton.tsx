"use client";

import type { ReactNode } from "react";

type ScrollToMaterialProductsButtonProps = {
  targetId: string;
  children: ReactNode;
};

export default function ScrollToMaterialProductsButton({
  targetId,
  children,
}: ScrollToMaterialProductsButtonProps) {
  const href = `#${targetId}`;

  return (
    <a
      href={href}
      onClick={(event) => {
        const target = document.getElementById(targetId);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", href);
      }}
      className="flex h-12 items-center justify-center rounded-full bg-brand px-4 text-base font-bold leading-6 text-white transition-colors hover:bg-brand-hover"
    >
      {children}
    </a>
  );
}
