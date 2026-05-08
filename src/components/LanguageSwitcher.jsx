'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config';
import { useLocale } from '@/lib/i18n/LocaleProvider';

function FlagEN({ className }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#fff" strokeWidth="2.4" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#C8102E" strokeWidth="1.2" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="3.2" />
      <path d="M12 0v16M0 8h24" stroke="#C8102E" strokeWidth="1.6" />
    </svg>
  );
}

function FlagNL({ className }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="5.34" y="0" fill="#AE1C28" />
      <rect width="24" height="5.34" y="5.34" fill="#fff" />
      <rect width="24" height="5.34" y="10.66" fill="#21468B" />
    </svg>
  );
}

const FLAG_BY_LOCALE = {
  en: FlagEN,
  nl: FlagNL,
};

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const ActiveFlag = FLAG_BY_LOCALE[locale] ?? FlagEN;
  const activeLabel = LOCALE_LABELS[locale]?.short ?? locale.toUpperCase();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change language, current language ${activeLabel}`}
      >
        <ActiveFlag className="w-6 h-4 rounded-sm overflow-hidden" />
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M4 6L8 10L12 6" stroke="#6B7280" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 top-full mt-2 min-w-40 bg-white rounded-md shadow-lg border border-slate-100 py-1 z-50"
        >
          {LOCALES.map((code) => {
            const Flag = FLAG_BY_LOCALE[code];
            const isActive = code === locale;
            return (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    setLocale(code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 ${
                    isActive ? 'font-semibold text-sky-950' : 'text-neutral-700'
                  }`}
                >
                  <Flag className="w-5 h-3.5 rounded-sm overflow-hidden shrink-0" />
                  <span>{LOCALE_LABELS[code].name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
