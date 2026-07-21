'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { localePath } from '@/lib/i18n/utils';

type SearchResult = {
  id: number;
  title: string;
  slug: string;
  type?: string;
  categories?: Array<{ name: string }>;
  translations?: Array<Record<string, any>>;
};

type KnowledgeSearchBarProps = {
  apiBaseUrl: string;
  placeholder?: string;
};

export default function KnowledgeSearchBar({ apiBaseUrl, placeholder }: KnowledgeSearchBarProps) {
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      try {
        const url = `${apiBaseUrl.replace(/\/$/, "")}/api/posts?type=kennisbank&locale=${locale}&search=${encodeURIComponent(query)}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          // We limit to 5 on the frontend for the dropdown
          setResults((json.data || []).slice(0, 5));
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Failed to fetch search results:", err);
        setResults([]);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query, apiBaseUrl, locale]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form action="/blog" method="GET" className="w-full bg-white rounded-full p-2 pl-6 flex items-center gap-3 shadow-lg hover:shadow-xl transition-shadow focus-within:ring-4 focus-within:ring-white/20 relative z-20">
        <Search className="w-6 h-6 text-gray-400 flex-shrink-0" />
        <input 
          type="text" 
          name="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder || "Search for guides, tips, and recommendations..."}
          className="flex-1 bg-transparent border-none outline-none text-zinc-700 text-lg placeholder:text-zinc-400 py-2"
          autoComplete="off"
        />
      </form>

      {/* Dropdown */}
      {isFocused && query.length >= 2 && (
        <div 
          className="absolute top-[100%] mt-2 left-0 right-0 md:-right-16 z-30 bg-white shadow-lg overflow-hidden rounded-xl border border-[#EDF2F7] flex flex-col justify-start items-start"
        >
          {results.length > 0 ? (
            results.map((result) => {
              const category = result.categories?.[0]?.name || 'Uncategorized';
              const typeLabel = result.type 
                ? (result.type.toLowerCase() === 'faq' ? 'FAQ' : 'Article')
                : 'Article';
              const categoryColor = typeLabel === 'FAQ' ? '#444444' : '#479EF5';

              const translation = result.translations?.find((t) => t[locale])?.[locale];
              const title = translation?.title || result.title;
              const slug = translation?.slug || result.slug;

              return (
                <Link 
                  href={localePath(`/blog/${slug}`, locale)} 
                  key={result.id}
                  onClick={() => setIsFocused(false)}
                  className="w-full hover:bg-slate-50 transition-colors self-stretch px-4 py-3.5 border-b border-[#EDF2F7] justify-start items-start gap-3 inline-flex"
                >
                  <div className="pt-1 justify-start items-start flex">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#888888" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 13.9995L11.1334 11.1328" stroke="#888888" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 flex flex-col justify-start items-start gap-1.5 inline-flex">
                    <div className="text-[#222222] text-base font-bold leading-[19.2px] break-words">
                      {title}
                    </div>
                    <div className="justify-start items-center gap-2 inline-flex">
                      <div className="text-[#888888] text-sm font-normal leading-[18.2px] break-words">
                        {typeLabel}
                      </div>
                      <div className="w-1 h-1 opacity-50 bg-[#888888] rounded-full"></div>
                      <div className="text-sm font-normal leading-[18.2px] break-words" style={{ color: categoryColor }}>
                        {category}
                      </div>
                    </div>
                  </div>
                  <div className="pt-0.5 justify-start items-start flex">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="#888888" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="p-6 text-center text-gray-500 w-full">
              No articles found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
