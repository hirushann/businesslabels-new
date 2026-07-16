import { getServerLocale } from "@/lib/i18n/server";
import { getTranslations } from "next-intl/server";
import FaqClient from "./FaqClient";

export async function generateMetadata() {
  const t = await getTranslations('faqPage');
  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
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

  return (
    <FaqClient 
      pagesList={pagesList} 
      initialPageData={initialPageData} 
      locale={locale} 
    />
  );
}
