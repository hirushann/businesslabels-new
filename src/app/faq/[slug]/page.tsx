import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, ChevronRight, HelpCircle, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Accordion from "@/components/Accordion";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getServerLocale } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/utils";
import { unescapeHtml } from "@/lib/utils";
import { FaqSupportCta } from "./FaqSupportCta";
import { sectionIcon } from "./section-icon";

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

/**
 * Returns the FAQ page payload — a single response containing every
 * supported locale's content. The frontend picks the active locale's
 * block, so language switches don't require a fresh API call.
 */
async function getFaqPage(slug: string): Promise<FaqPageData | null> {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  if (!apiBaseUrl) return null;

  try {
    const url = `${apiBaseUrl.replace(/\/$/, "")}/api/faq/slug/${encodeURIComponent(slug)}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data as FaqPageData) ?? null;
  } catch (err) {
    console.error("Failed to fetch FAQ page:", err);
    return null;
  }
}

/** Picks the active locale's content with a graceful fallback to main_locale. */
function pickLocaleContent(page: FaqPageData, locale: string): FaqLocaleContent {
  return (
    page.locales[locale] ??
    page.locales[page.main_locale] ??
    Object.values(page.locales)[0]
  );
}

/** Build the per-locale public URL for this FAQ page, used for redirects + hreflang. */
function faqUrlFor(page: FaqPageData, locale: string): string | null {
  const slug = page.slugs[locale] ?? page.slugs[page.main_locale];
  if (!slug) return null;
  return localePath(`/faq/${slug}`, locale);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerLocale();
  const page = await getFaqPage(slug);

  if (!page) {
    const t = await getTranslations();
    return { title: t("pages.pageNotFound") };
  }

  const content = pickLocaleContent(page, locale);

  // Build hreflang map so search engines + crawlers learn the slug per locale.
  const languages: Record<string, string> = {};
  for (const loc of page.available_locales) {
    const url = faqUrlFor(page, loc);
    if (url) languages[loc] = url;
  }
  const canonical = faqUrlFor(page, locale);

  return {
    title: content.meta.meta_title || content.title || "FAQ",
    description: content.meta.meta_description ?? undefined,
    alternates: {
      canonical: canonical ?? undefined,
      languages,
    },
  };
}

export default async function FaqHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getServerLocale();
  const [page, t] = await Promise.all([
    getFaqPage(slug),
    getTranslations("faqPage"),
  ]);

  if (!page) notFound();

  // Canonical-slug redirect: if the URL slug doesn't match the active locale's slug,
  // bounce to the locale-correct URL. Keeps URLs in sync with the displayed language
  // and gives search engines a single canonical URL per locale.
  const canonicalSlug = page.slugs[locale];
  if (canonicalSlug && canonicalSlug !== slug) {
    redirect(localePath(`/faq/${canonicalSlug}`, locale));
  }

  const content = pickLocaleContent(page, locale);
  const sections = content.sections ?? [];
  const totalQuestions = sections.reduce((sum, s) => sum + (s.items?.length ?? 0), 0);
  const questionLabel = (count: number) => (count === 1 ? t("question") : t("questions"));

  return (
    <div className="relative min-h-screen bg-white">
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
            items={[{ label: content.title ?? t("breadcrumb") }]}
          />

          <div className="mt-10 grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-400 ring-1 ring-amber-400/30">
                <Sparkles className="h-3.5 w-3.5" />
                {t("helpCenter")}
              </span>
              <h1 className="mt-6 text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                {content.title}
              </h1>
              {content.intro && (
                <div
                  className="cms-content prose prose-invert mt-7 max-w-2xl text-lg leading-relaxed text-sky-100/80 [&_a]:text-amber-400 [&_a]:underline prose-headings:text-white prose-strong:text-white prose-li:marker:text-amber-400/70"
                  dangerouslySetInnerHTML={{ __html: unescapeHtml(content.intro) }}
                />
              )}
            </div>

            {page.hero_image && (
              <div className="relative lg:col-span-5">
                {/* Polaroid-style card: top tag bar + image */}
                <div className="overflow-hidden rounded-[28px] bg-white p-3 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.45)] ring-1 ring-white/10">
                  {/* Header strip with FAQ tag + dot indicators */}
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-900">
                      <HelpCircle className="h-4 w-4 text-amber-500" strokeWidth={2.4} />
                      {t("breadcrumb")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="h-2 w-2 rounded-full bg-slate-200" />
                      <span className="h-2 w-2 rounded-full bg-slate-200" />
                    </span>
                  </div>

                  {/* Image frame */}
                  <div className="relative aspect-[5/4] overflow-hidden rounded-[20px] bg-slate-100">
                    <img
                      src={page.hero_image_preview || page.hero_image}
                      alt={content.title ?? ""}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Footer caption inside the card */}
                  <div className="flex items-center justify-between px-3 py-3">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {content.title}
                    </p>
                    {totalQuestions > 0 && (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.4} />
                        {totalQuestions} {questionLabel(totalQuestions)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────  TOPIC NAVIGATION  ────────────────────── */}
      {sections.length > 0 && (
        <section className="relative mx-auto -mt-24 max-w-360 px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-white p-8 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.18)] ring-1 ring-slate-100 sm:p-12">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
                  {t("browseByTopic")}
                </span>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900 sm:text-4xl">
                  {t("whatCanWeHelpWith")}
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                {t("tapTopic")}
              </p>
            </div>

            <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sections.map((s, i) => {
                const Icon = sectionIcon(s.icon);
                const itemCount = s.items?.length ?? 0;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.anchor}`}
                      className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:from-amber-50/60 hover:to-white hover:shadow-[0_18px_36px_-18px_rgba(241,136,0,0.45)]"
                    >
                      <div className="absolute right-5 top-5 text-xs font-black text-slate-200 transition-colors group-hover:text-amber-300">
                        {String(i + 1).padStart(2, "0")}
                      </div>

                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm ring-1 ring-slate-100 transition-all duration-300 group-hover:bg-amber-500 group-hover:text-white group-hover:ring-amber-500">
                        {Icon ? (
                          <Icon className="h-7 w-7" strokeWidth={2} />
                        ) : (
                          <span className="text-base font-black">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold uppercase tracking-tight text-slate-900 transition-colors group-hover:text-amber-700">
                          {s.name}
                        </p>
                        {s.subtitle && (
                          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">
                            {s.subtitle}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 group-hover:border-amber-100">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {itemCount} {questionLabel(itemCount)}
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 group-hover:bg-amber-500 group-hover:text-white">
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ──────────────────────────  SECTIONS  ─────────────────────────── */}
      <div className="mx-auto max-w-360 space-y-20 px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
        {sections.map((section, idx) => {
          const Icon = sectionIcon(section.icon);
          const itemCount = section.items?.length ?? 0;
          return (
            <section
              id={section.anchor}
              key={section.id}
              className="scroll-mt-24"
            >
              <div className="grid gap-10 lg:grid-cols-12">
                {/* Section header — sticky on lg */}
                <header className="lg:col-span-4">
                  <div className="lg:sticky lg:top-24">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
                        {t("topicLabel")} {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="h-px flex-1 bg-gradient-to-r from-amber-300/60 to-transparent" />
                    </div>

                    <div className="mt-5 flex items-start gap-4">
                      {Icon && (
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25">
                          <Icon className="h-7 w-7" strokeWidth={2} />
                        </span>
                      )}
                      <div className="min-w-0">
                        <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 sm:text-4xl">
                          {section.name}
                        </h2>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {itemCount} {questionLabel(itemCount)}
                        </p>
                      </div>
                    </div>

                    {section.subtitle && (
                      <p className="mt-5 text-base leading-relaxed text-slate-600">
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                </header>

                {/* Accordion list */}
                <div className="lg:col-span-8">
                  {section.items && section.items.length > 0 ? (
                    <div className="space-y-3">
                      {section.items.map((item, itemIdx) => (
                        <Accordion
                          key={item.id}
                          title={item.question ?? ""}
                          defaultOpen={itemIdx === 0}
                          size="default"
                          className="!bg-white !outline-slate-200 transition-all duration-300 hover:!outline-amber-300 hover:shadow-[0_18px_36px_-24px_rgba(15,23,42,0.18)]"
                          headerClassName="!text-slate-900"
                          contentClassName="border-t border-slate-100 pt-6"
                        >
                          <div
                            className="cms-content prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-base prose-p:leading-relaxed prose-p:text-slate-600 prose-a:font-semibold prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-ul:my-3 prose-li:my-1 prose-li:text-slate-600 prose-li:marker:text-amber-500 prose-img:rounded-2xl"
                            dangerouslySetInnerHTML={{
                              __html: unescapeHtml(item.answer ?? ""),
                            }}
                          />
                        </Accordion>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
                      <p className="text-sm text-slate-500">
                        {t("emptySection")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ────────────────────────  SUPPORT CTA  ────────────────────────── */}
      <FaqSupportCta title={content.support.title} text={content.support.text} />
    </div>
  );
}
