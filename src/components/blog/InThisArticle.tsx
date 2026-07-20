"use client";

import { useEffect, useState } from "react";

interface HeadingItem {
  text: string;
  id: string;
}

interface InThisArticleProps {
  headings: HeadingItem[];
  title: string;
}

export default function InThisArticle({ headings, title }: InThisArticleProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    // Set initial active ID to the first heading
    setActiveId(headings[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) {
          setActiveId(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "0px 0px -60% 0px",
        threshold: 0.1,
      }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => {
      headings.forEach((heading) => {
        const el = document.getElementById(heading.id);
        if (el) observer.unobserve(el);
      });
    };
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 100; // Offset for sticky site header
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      // Update URL hash without jumping
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <div className="w-full p-5 relative bg-white rounded-xl shadow-[2px_4px_20px_rgba(109,109,120,0.06)] border border-[#EDF2F7] flex flex-col items-start gap-4">
      <div className="text-neutral-800 text-2xl font-semibold leading-7">{title}</div>
      <div className="w-full flex flex-col items-start gap-3 pl-3 border-l-2 border-slate-100 relative">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className={`w-full text-left transition-colors relative py-0.5 text-sm ${
                isActive
                  ? "text-neutral-800 font-bold"
                  : "text-neutral-500 font-normal hover:text-brand"
              }`}
            >
              {isActive && (
                <div className="absolute left-[-14px] top-0 bottom-0 w-[2px] bg-brand"></div>
              )}
              {heading.text}
            </a>
          );
        })}
      </div>
    </div>
  );
}
