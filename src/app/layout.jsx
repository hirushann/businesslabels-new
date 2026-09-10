import "./globals.css";
import { GoogleTagManager } from "@next/third-parties/google";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import { HelpProvider } from "@/components/HelpProvider";
import Header from "@/components/Header";


import StoreNotice from "@/components/StoreNotice";
import MaintenancePage from "@/components/MaintenancePage";
import { isMaintenanceMode } from "@/lib/maintenance";


import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { getServerLocale } from "@/lib/i18n/server";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from '@/lib/i18n/getMessages';
import { localizedSeoPaths } from '@/lib/i18n/utils';
import { LOCALE_PATH_HEADER } from '@/lib/i18n/config';
import ReCaptchaProvider from '@/components/ReCaptchaProvider';

import { cookies, headers } from "next/headers";
import { ScrollToTop } from "@/components/ScrollToTop";

const isStaging = process.env.NEXT_PUBLIC_APP_ENV === 'staging' || process.env.VERCEL_ENV === 'preview';
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

export async function generateMetadata() {
  if (isMaintenanceMode()) {
    return {
      title: 'Onderhoud — Businesslabels',
      description: 'Businesslabels is tijdelijk offline voor onderhoud. Bel of mail ons, we helpen je direct verder.',
      robots: { index: false, follow: false },
    };
  }
  const locale = await getServerLocale();
  const messages = await getMessages(locale);
  const requestHeaders = await headers();
  const paths = localizedSeoPaths(requestHeaders.get(LOCALE_PATH_HEADER) || '/');
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://businesslabels.nl").replace(/\/$/, '');
  const absolute = (path) => `${siteUrl}${path === '/' ? '' : path}`;

  return {
    metadataBase: new URL(siteUrl),
    title: messages.pages.homeMetadataTitle,
    description: messages.pages.homeMetadataDescription,
    alternates: {
      canonical: absolute(paths[locale]),
      languages: {
        en: absolute(paths.en),
        nl: absolute(paths.nl),
        'x-default': absolute(paths.nl),
      },
    },
    robots: { index: true, follow: true },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }) {
  if (isMaintenanceMode()) {
    return (
      <html lang="nl" suppressHydrationWarning>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="robots" content="noindex, nofollow" />
          <meta name="description" content="Businesslabels is tijdelijk offline voor onderhoud. Bel of mail ons, we helpen je direct verder." />
          <link rel="icon" href="/favicon.ico" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        </head>
        <body suppressHydrationWarning>
          <MaintenancePage />
        </body>
      </html>
    );
  }

  const locale = await getServerLocale();
  const messages = await getMessages(locale);
  const cookieStore = await cookies();
  const hasAuthToken = !!(cookieStore.get("auth_token")?.value || cookieStore.get("auth_session")?.value);

  return (
    <html lang={locale} className="font-sans" suppressHydrationWarning>
      <body className="bg-white min-h-screen flex flex-col" suppressHydrationWarning>
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <ScrollToTop />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider>
            <WishlistProvider>
              <HelpProvider>
                <ReCaptchaProvider>
                  <Header hasAuthToken={hasAuthToken} />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </ReCaptchaProvider>
              </HelpProvider>
            </WishlistProvider>
          </CartProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
    </html>
  );
}
// Force reload layout cache 1
