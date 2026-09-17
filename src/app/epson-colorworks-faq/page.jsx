import { getServerLocale } from "@/lib/i18n/server";
import { getTranslations } from "next-intl/server";
import FaqClient from "./FaqClient";
import { buildFaqSchema, buildBreadcrumbSchema } from "@/lib/seo/structuredData";

export async function generateMetadata({ searchParams }) {
  const search = await searchParams;
  const topic = search?.topic;
  const locale = await getServerLocale();
  const t = await getTranslations('faqPage');
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://businesslabels.nl").replace(/\/$/, "");

  if (topic) {
    const pageData = await getFaqPage(topic);
    if (pageData) {
      const loc = pageData.locales?.[locale] ?? pageData.locales?.[pageData.main_locale];
      const title = loc?.title ? `${loc.title} — Epson ColorWorks FAQ` : t('metadataTitle');
      const description = loc?.description || t('metadataDescription');
      const nlSlug = pageData.slugs?.nl ?? topic;
      const enSlug = pageData.slugs?.en ?? topic;
      const nlPath = `/epson-colorworks-faq?topic=${encodeURIComponent(nlSlug)}`;
      const enPath = `/en/epson-colorworks-faq?topic=${encodeURIComponent(enSlug)}`;
      const canonicalPath = locale === 'en' ? enPath : nlPath;

      return {
        title,
        description,
        alternates: {
          canonical: `${siteUrl}${canonicalPath}`,
          languages: {
            nl: `${siteUrl}${nlPath}`,
            en: `${siteUrl}${enPath}`,
            'x-default': `${siteUrl}${nlPath}`,
          },
        },
      };
    }
  }

  const nlPath = '/epson-colorworks-faq';
  const enPath = '/en/epson-colorworks-faq';
  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
    alternates: {
      canonical: `${siteUrl}${locale === 'en' ? enPath : nlPath}`,
      languages: {
        nl: `${siteUrl}${nlPath}`,
        en: `${siteUrl}${enPath}`,
        'x-default': `${siteUrl}${nlPath}`,
      },
    },
  };
}

async function getFaqPagesList() {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  if (!apiBaseUrl) return [];

  try {
    const url = `${apiBaseUrl.replace(/\/$/, "")}/api/faq`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Failed to fetch FAQ pages list:", err);
    return [];
  }
}

async function getFaqPage(slug) {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  if (!apiBaseUrl) return null;

  try {
    const url = `${apiBaseUrl.replace(/\/$/, "")}/api/faq/slug/${encodeURIComponent(slug)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("Failed to fetch FAQ page:", err);
    return null;
  }
}

export default async function FaqHubPage({ searchParams }) {
  const locale = await getServerLocale();
  const pagesList = await getFaqPagesList();
  
  let initialPageData = null;
  const search = await searchParams;
  const topic = search?.topic;

  if (topic) {
    initialPageData = await getFaqPage(topic);
  }

  if (!initialPageData && pagesList.length > 0) {
    // Get the slug for the active locale, fallback to main_locale
    const firstPage = pagesList[0];
    const slug = firstPage.slugs[locale] ?? firstPage.slugs[firstPage.main_locale];
    if (slug) {
      initialPageData = await getFaqPage(slug);
    }
  }

  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://businesslabels.nl").replace(/\/$/, "");
  const loc = initialPageData?.locales?.[locale] ?? initialPageData?.locales?.[initialPageData?.main_locale];
  const faqItems = (loc?.sections || []).flatMap(section => 
    (section.items || []).map(item => ({
      question: item.question,
      answer: item.answer,
    }))
  );
  const faqSchema = faqItems.length > 0 ? buildFaqSchema(faqItems) : null;
  const breadcrumbItems = [
    { name: 'Home', url: locale === 'en' ? '/en' : '/' },
    { name: 'Epson ColorWorks FAQ', url: locale === 'en' ? '/en/epson-colorworks-faq' : '/epson-colorworks-faq' },
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems, siteUrl);

  return (
    <>
      {faqSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([faqSchema, breadcrumbSchema]) }}
        />
      ) : (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <FaqClient 
        pagesList={pagesList} 
        initialPageData={initialPageData} 
        locale={locale} 
      />
    </>
  );
}
