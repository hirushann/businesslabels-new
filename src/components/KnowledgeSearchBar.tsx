'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type SearchResult = {
  id: number;
  title: string;
  slug: string;
  categories?: Array<{ name: string }>;
};

type KnowledgeSearchBarProps = {
  apiBaseUrl: string;
};

export default function KnowledgeSearchBar({ apiBaseUrl }: KnowledgeSearchBarProps) {
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
        const url = `${apiBaseUrl.replace(/\/$/, "")}/api/posts?search=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          // We limit to 5 on the frontend for the dropdown
          setResults((json.data || []).slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch search results:", err);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query, apiBaseUrl]);

  return (
    <div className="relative w-full lg:w-[55%]" ref={dropdownRef}>
      <form action="/blogs" method="GET" className="w-full bg-white rounded-full p-2 pl-6 flex items-center gap-3 shadow-lg hover:shadow-xl transition-shadow focus-within:ring-4 focus-within:ring-white/20 relative z-20">
        <Search className="w-6 h-6 text-gray-400 flex-shrink-0" />
        <input 
          type="text" 
          name="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search for guides, tips, and recommendations..." 
          className="flex-1 bg-transparent border-none outline-none text-zinc-700 text-lg font-['Segoe_UI'] placeholder:text-zinc-400 py-2"
          autoComplete="off"
        />
      </form>

      {/* Dropdown */}
      {isFocused && query.length >= 2 && (
        <div className="absolute top-[100%] mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-30 flex flex-col">
          {results.length > 0 ? (
            results.map((result) => {
              const category = result.categories?.[0]?.name || 'Uncategorized';
              return (
                <Link 
                  href={`/blogs/${result.slug}`} 
                  key={result.id}
                  className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors"
                  onClick={() => setIsFocused(false)}
                >
                  <div className="flex items-center gap-4">
                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-zinc-800 font-medium font-['Segoe_UI']">{result.title}</span>
                      <span className="text-sm text-gray-500 font-['Segoe_UI'] mt-0.5">
                        Article • {category}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              );
            })
          ) : (
            <div className="p-6 text-center text-gray-500 font-['Segoe_UI']">
              No articles found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
