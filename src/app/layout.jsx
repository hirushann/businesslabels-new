import "./globals.css";
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

export const metadata = {
  title: "Businesslabels — Labels for Epson ColorWorks Printers",
  description:
    "Expert-selected labels, accessories and printers. Epson ColorWorks Gold Partner. Order from 1 roll with free support.",
};

export default async function RootLayout({ children }) {
  const locale = await getServerLocale();
  const messages = await getMessages(locale);
  const cookieStore = await cookies();
  const hasAuthToken = !!(cookieStore.get("auth_token")?.value || cookieStore.get("auth_session")?.value);

  return (
    <html lang={locale} className="font-sans" suppressHydrationWarning>
      <body className="bg-white min-h-screen flex flex-col" suppressHydrationWarning>
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
    </html>
  );
}
// Force reload layout cache 1
