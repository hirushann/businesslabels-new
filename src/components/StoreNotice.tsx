'use client';

import { useTranslations } from 'next-intl';

export default function StoreNotice() {
  const t = useTranslations('storeNotice');

  return (
    <aside
      aria-label="Store Notice"
      className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white shadow-sm border-b border-amber-700/30"
    >
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-10 py-2 sm:py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center text-xs sm:text-sm font-medium">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center justify-center size-5 rounded-full bg-white/20 text-white shrink-0">
            <svg
              className="size-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <span className="leading-snug">
            {t.rich('message', {
              phone: (chunks) => (
                <a
                  href="tel:+31318590465"
                  className="font-bold underline underline-offset-2 hover:text-amber-100 transition-colors"
                >
                  {chunks}
                </a>
              ),
              email: (chunks) => (
                <a
                  href="mailto:verkoop@businesslabels.nl"
                  className="font-bold underline underline-offset-2 hover:text-amber-100 transition-colors"
                >
                  {chunks}
                </a>
              ),
            })}
          </span>
        </div>

        <div className="hidden lg:inline-flex items-center gap-2 pl-3 border-l border-white/25 text-xs font-semibold">
          <a
            href="tel:+31318590465"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/15 hover:bg-black/25 text-white transition-colors"
            aria-label="Call +31 318 590 465"
          >
            <svg
              className="size-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>+31 318 590 465</span>
          </a>
          <a
            href="mailto:verkoop@businesslabels.nl"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/15 hover:bg-black/25 text-white transition-colors lowercase"
            aria-label="Email verkoop@businesslabels.nl"
          >
            <svg
              className="size-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>verkoop@businesslabels.nl</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
