import "./globals.css";
import { GoogleTagManager } from "@next/third-parties/google";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import { HelpProvider } from "@/components/HelpProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { getServerLocale } from "@/lib/i18n/server";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from '@/lib/i18n/getMessages';

import { cookies } from "next/headers";
import { ScrollToTop } from "@/components/ScrollToTop";
import CanonicalTag from "@/components/CanonicalTag";

const isStaging = process.env.NEXT_PUBLIC_APP_ENV === 'staging' || process.env.VERCEL_ENV === 'preview';
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://businesslabels.nl"),
  title: "Businesslabels — Labels for Epson ColorWorks Printers",
  description:
    "Expert-selected labels, accessories and printers. Epson ColorWorks Gold Partner. Order from 1 roll with free support.",
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }) {
  const locale = await getServerLocale();
  const messages = await getMessages(locale);
  const cookieStore = await cookies();
  const hasAuthToken = !!(cookieStore.get("auth_token")?.value || cookieStore.get("auth_session")?.value);

  return (
    <html lang={locale} className="font-sans" suppressHydrationWarning>
      <head>
        <CanonicalTag />
      </head>
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
                <Header hasAuthToken={hasAuthToken} />
                <main className="flex-1">{children}</main>
                <Footer />
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
