'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import CTABanner from '@/components/CTABanner';
import { useLocalePath } from '@/hooks/useLocalePath';

// Simple SVG Icons for Accordion state
const ChevronIcon = ({ open }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-300 ${open ? 'rotate-180 text-brand' : 'text-slate-900'}`}
  >
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FaqItem = ({ question, answer, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div 
      className={`self-stretch p-5 rounded-xl outline outline-1 outline-offset-[-1px] transition-all cursor-pointer ${open ? 'bg-gradient-to-br from-orange-50 to-white outline-orange-100 outline-2 outline-offset-[-2px]' : 'bg-white outline-slate-200 hover:outline-slate-300'}`}
      onClick={() => setOpen(!open)}
    >
      <div className="self-stretch inline-flex justify-between items-start">
        <div className="flex-1 justify-start text-neutral-800 text-lg md:text-xl font-bold leading-6 pr-4">{question}</div>
        <div className="size-6 relative overflow-hidden flex-shrink-0 flex items-center justify-center">
            {open ? (
              <div className="w-4 h-[1.50px] absolute bg-brand transition-all duration-300 transform rotate-180"></div>
            ) : (
              <>
                <div className="w-4 h-[1.50px] absolute bg-gray-900 transition-all duration-300"></div>
                <div className="w-[1.50px] h-4 absolute bg-gray-900 transition-all duration-300"></div>
              </>
            )}
        </div>
      </div>
      <div 
        className="w-full overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '1000px' : '0px', opacity: open ? 1 : 0, marginTop: open ? '16px' : '0px' }}
      >
        <div className="text-neutral-700 text-base font-normal leading-6 cms-content prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-base prose-p:leading-relaxed prose-p:text-slate-600 prose-a:font-semibold prose-a:text-brand prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-ul:my-3 prose-li:my-1 prose-li:text-slate-600 prose-li:marker:text-brand" dangerouslySetInnerHTML={{ __html: answer || "More information about this topic will be provided soon." }} />
      </div>
    </div>
  );
};

export default function FaqClient({ pagesList, initialPageData, locale }) {
  const lp = useLocalePath();
  const t = useTranslations('faqPage');
  const [activePageData, setActivePageData] = useState(initialPageData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to extract locale content safely
  const getLocaleContent = (pageData) => {
    if (!pageData || !pageData.locales) return null;
    return pageData.locales[locale] ?? pageData.locales[pageData.main_locale] ?? Object.values(pageData.locales)[0];
  };

  const getPageTitle = (page) => {
    if (!page || !page.locales) return "Unknown";
    const loc = page.locales[locale] ?? page.locales[page.main_locale] ?? Object.values(page.locales)[0];
    return loc?.title || "Unknown";
  };

  const activeContent = useMemo(() => getLocaleContent(activePageData), [activePageData, locale]);

  const loadFaqPage = async (pageSummary) => {
    if (activePageData?.id === pageSummary.id) return;
    
    setLoading(true);
    setError(null);
    
    const slug = pageSummary.slugs[locale] ?? pageSummary.slugs[pageSummary.main_locale];
    
    try {
      const response = await fetch(`/api/faq/slug/${encodeURIComponent(slug)}`);
      if (!response.ok) {
        throw new Error('Failed to load FAQ details');
      }
      const data = await response.json();
      setActivePageData(data.data || data);
      
      // Optionally scroll to top of content
      window.scrollTo({ top: 300, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError("Failed to load FAQ content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!pagesList || pagesList.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-500">
        No FAQs available at the moment.
      </div>
    );
  }

  const sections = activeContent?.sections || [];

  return (
    <div className="relative bg-white min-h-screen pb-0">
      {/* Background Decorators */}
      <div className="size-48 left-0 top-[454px] absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none" />
      <div className="size-48 right-0 top-[1200px] absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none" />

      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="max-w-360 mx-auto py-10 flex flex-col gap-4">
            {/* Breadcrumb */}
            <div className="h-4 inline-flex justify-start items-center gap-2">
              <Link href={lp('/')} className="text-zinc-500 hover:text-brand transition-colors flex items-center">
                <Home className="w-4 h-4" />
              </Link>
              <span className="text-zinc-500 text-sm font-normal leading-5">/</span>
              <Link href={lp('/kennisbank-overzicht')} className="text-zinc-500 hover:text-brand transition-colors text-sm font-normal leading-5">
                {t('knowledgeCenter')}
              </Link>
              <span className="text-zinc-500 text-sm font-normal leading-5">/</span>
              <span className="text-neutral-700 text-sm font-bold leading-5">{t('breadcrumb')}</span>
            </div>

          {/* Hero Section */}
          <div className="w-full mt-6 p-6 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col lg:flex-row justify-between items-stretch gap-10">
            <div className="w-full lg:w-[620px] flex flex-col justify-between items-start gap-8 lg:gap-0">
              <div className="flex flex-col items-start gap-4">
                <h1 className="text-neutral-800 text-3xl md:text-4xl font-bold capitalize leading-tight md:leading-[48px]">
                  {activeContent?.title || "Frequently asked questions"}
                </h1>
                {activeContent?.intro ? (
                  <div 
                    className="text-neutral-700 text-base md:text-lg font-normal leading-6 cms-content" 
                    dangerouslySetInnerHTML={{ __html: activeContent.intro }}
                  />
                ) : (
                  <p className="text-neutral-700 text-base md:text-lg font-normal leading-6">
                    It seems so easy: buy a printer and just start printing. But which printer should you get? What should you look out for? Do I really want to print my own labels, and if so, why or why not? <br/><br/>
                    On this page, we have listed as many questions as possible that we deal with and answer almost daily.
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start gap-4 mt-8">
                <p className="text-neutral-700 text-base md:text-lg font-normal leading-6">
                  {activeContent?.support?.title || "Still unsure? Or is your question not listed?"}
                </p>
                <Link href={lp('/contact-us')} className="h-12 px-7 py-4 bg-brand rounded-[50px] inline-flex justify-center items-center hover:bg-brand-hover transition-colors">
                  <span className="text-white text-base md:text-lg font-medium leading-6">Talk to Expert</span>
                </Link>
              </div>
            </div>
            <div className="w-full lg:flex-1 relative rounded-xl overflow-hidden h-64 lg:h-auto min-h-[240px] lg:min-h-[390px] bg-slate-100 flex items-center justify-center">
              {activePageData?.hero_image || activePageData?.hero_image_preview ? (
                <img 
                  src={activePageData.hero_image_preview || activePageData.hero_image} 
                  alt="FAQ Hero" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-400">
                  [ FAQ Hero Image ]
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area: Sidebar + FAQ List */}
          <div className="w-full mt-12 flex flex-col lg:flex-row items-start gap-10">
            
            {/* Sidebar / Tabs */}
            <div className="w-full lg:w-80 p-4 lg:p-6 lg:sticky lg:top-24 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col items-start gap-4 overflow-hidden shrink-0">
              {/* Desktop view (Vertical with active indicator line) */}
              <div className="hidden lg:flex relative pl-4 flex-col items-start w-full">
                {/* Active Indicator Line */}
                <div 
                  className="w-0.5 absolute bg-brand left-0 transition-all duration-300 rounded-full"
                  style={{ 
                    height: '24px',
                    top: `${pagesList.findIndex(p => p.id === activePageData?.id) * 48 + 12}px` 
                  }}
                ></div>

                {pagesList.map((page) => {
                  const isActive = activePageData?.id === page.id;
                  return (
                    <div 
                      key={page.id}
                      onClick={() => loadFaqPage(page)}
                      className={`h-12 flex items-center w-full text-base cursor-pointer transition-colors ${isActive ? 'text-neutral-700 font-bold' : 'text-zinc-500 font-normal hover:text-brand'}`}
                    >
                      {getPageTitle(page)}
                    </div>
                  );
                })}
              </div>

              {/* Mobile/Tablet view (Horizontal tabs) */}
              <div className="flex lg:hidden flex-row gap-2 overflow-x-auto w-full pb-1 scrollbar-thin snap-x snap-mandatory">
                {pagesList.map((page) => {
                  const isActive = activePageData?.id === page.id;
                  return (
                    <button 
                      key={page.id}
                      onClick={() => loadFaqPage(page)}
                      className={`px-4 py-2 text-sm rounded-full whitespace-nowrap snap-align-none transition-colors border ${
                        isActive 
                          ? 'bg-brand text-white border-brand font-medium' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {getPageTitle(page)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FAQ Sections */}
            <div className="flex-1 w-full flex flex-col gap-14 pb-20 relative">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-start justify-center pt-20">
                  <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg outline outline-red-100">
                  {error}
                </div>
              )}

              {!loading && !error && sections.length === 0 && (
                <div className="p-10 border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl text-center text-slate-500">
                  No sections available for this topic yet.
                </div>
              )}

              {!loading && !error && sections.map((section) => (
                <div 
                  key={section.id} 
                  id={section.anchor || `section-${section.id}`}
                  className="flex flex-col items-start gap-6 pt-4"
                >
                  {/* Hiding section name and subtitle as requested */}
                  {/*
                  <div className="flex flex-col items-start gap-4">
                    <h2 className="text-neutral-800 text-3xl font-bold leading-10">
                      {section.name}
                    </h2>
                    {section.subtitle && (
                      <p className="text-neutral-700 text-base font-normal leading-6">
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                  */}
                  <div className="w-full flex flex-col items-start gap-4">
                    {(section.items || []).map((item, index) => (
                      <FaqItem 
                        key={item.id || index} 
                        question={item.question} 
                        answer={item.answer} 
                        defaultOpen={index === 0} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Pre-footer CTA */}
      <CTABanner />
    </div>
  );
}
