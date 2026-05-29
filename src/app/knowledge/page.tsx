import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ChevronRight, Sparkles, HelpCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getServerLocale } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/utils";
import { unescapeHtml } from "@/lib/utils";

type FaqItem = {
  id: number;
  question: string | null;
  answer: string | null;
};

type FaqSection = {
  id: number;
  anchor: string;
  name: string | null;
  subtitle: string | null;
  icon: string | null;
  items?: FaqItem[];
};

type FaqLocaleContent = {
  title: string | null;
  intro: string | null;
  support: { title: string; text: string };
  meta: { meta_title: string | null; meta_description: string | null };
  sections?: FaqSection[];
};

type FaqPageData = {
  id: number;
  status: string;
  hero_image: string | null;
  hero_image_preview: string | null;
  main_locale: string;
  available_locales: string[];
  slugs: Record<string, string | null>;
  locales: Record<string, FaqLocaleContent>;
};

async function getFaqPages(): Promise<FaqPageData[]> {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  if (!apiBaseUrl) return [];

  try {
    const url = `${apiBaseUrl.replace(/\/$/, "")}/api/faq`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data as FaqPageData[]) ?? [];
  } catch (err) {
    console.error("Failed to fetch FAQ list:", err);
    return [];
  }
}

function pickLocaleContent(page: FaqPageData, locale: string): FaqLocaleContent {
  return (
    page.locales[locale] ??
    page.locales[page.main_locale] ??
    Object.values(page.locales)[0]
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("menus.resources.knowledgeTitle")} — Businesslabels`,
    description: t("menus.resources.knowledgeDesc"),
  };
}

export default async function KnowledgeBaseArchive() {
  const locale = await getServerLocale();
  const t = await getTranslations();
  const faqPages = await getFaqPages();

  // Calculate total questions across all pages to show in hero (optional stats)
  const totalQuestions = faqPages.reduce((sum, page) => {
    const content = pickLocaleContent(page, locale);
    const sections = content.sections ?? [];
    return sum + sections.reduce((secSum, s) => secSum + (s.items?.length ?? 0), 0);
  }, 0);

  const questionLabel = (count: number) => (count === 1 ? t("faqPage.question") : t("faqPage.questions"));

  return (
    <div className="relative min-h-screen bg-[#fafbfe]">
      {/* ────────────────────────────  HERO  ──────────────────────────── */}
      <section className="relative overflow-hidden bg-sky-950 pb-32 pt-12 text-white sm:pb-40 sm:pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='2' cy='2' r='1.5' fill='white'/></svg>\")",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            className="text-white/60"
            items={[{ label: t("menus.resources.knowledgeTitle") }]}
          />

          <div className="mt-10 grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-400 ring-1 ring-amber-400/30">
                <BookOpen className="h-3.5 w-3.5" />
                {t("menus.resources.knowledgeTitle")}
              </span>
              <h1 className="mt-6 text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                {t("faqPage.helpCenter")}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-sky-100/80">
                {t("menus.resources.knowledgeDesc")}
              </p>

              {totalQuestions > 0 && (
                <div className="mt-10 flex flex-wrap items-center gap-8">
                  <div>
                    <div className="text-4xl font-black tracking-tight text-amber-400">
                      {totalQuestions}
                    </div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                      {t("faqPage.questionsAnswered")}
                    </div>
                  </div>
                  <div className="h-12 w-px bg-white/15" />
                  <div>
                    <div className="text-4xl font-black tracking-tight text-amber-400">
                      {faqPages.length}
                    </div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                      {t("faqPage.topics")}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative lg:col-span-5 hidden lg:block">
               {/* Decorative Element matching aesthetic */}
               <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-sky-500/20 rounded-[40px] blur-3xl" />
               <div className="relative rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm shadow-2xl">
                 <HelpCircle className="h-32 w-32 text-amber-400/50 mx-auto" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────  ARCHIVE GRID  ────────────────────── */}
      <section className="relative mx-auto -mt-24 max-w-360 px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white p-8 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.18)] ring-1 ring-slate-100 sm:p-12">
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
                {t("faqPage.browseByTopic")}
              </span>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900 sm:text-4xl">
                {t("faqPage.whatCanWeHelpWith")}
              </h2>
            </div>
          </div>

          {faqPages.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {faqPages.map((page) => {
                const content = pickLocaleContent(page, locale);
                const canonicalSlug = page.slugs[locale] ?? page.slugs[page.main_locale];
                if (!canonicalSlug) return null;

                const url = localePath(`/faq/${canonicalSlug}`, locale);
                const sections = content.sections ?? [];
                const pageQuestionCount = sections.reduce((sum, s) => sum + (s.items?.length ?? 0), 0);

                return (
                  <Link
                    key={page.id}
                    href={url}
                    className="group flex flex-col overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-12px_rgba(241,136,0,0.25)] hover:ring-amber-200"
                  >
                    {/* Image Header */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                      {page.hero_image_preview || page.hero_image ? (
                        <img
                          src={page.hero_image_preview || page.hero_image || ""}
                          alt={content.title ?? ""}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
                          <BookOpen className="h-12 w-12" />
                        </div>
                      )}
                      
                      {/* Topic tag overlaid on image */}
                      <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 backdrop-blur-md shadow-sm">
                        {pageQuestionCount} {questionLabel(pageQuestionCount)}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-1 flex-col p-6 sm:p-8">
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 transition-colors group-hover:text-amber-600">
                        {content.title}
                      </h3>
                      
                      {content.intro && (
                        <div 
                           className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500"
                           dangerouslySetInnerHTML={{ __html: unescapeHtml(content.intro) }}
                        />
                      )}

                      <div className="mt-auto pt-6">
                        <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-600 transition-colors group-hover:text-amber-700">
                          {t("common.readArticle")}
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 transition-transform group-hover:translate-x-1 group-hover:bg-amber-200">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-base text-slate-500">
                {t("faqPage.emptySection")}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
