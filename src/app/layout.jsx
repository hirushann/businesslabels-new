import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import { HelpProvider } from "@/components/HelpProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { getServerLocale } from "@/lib/i18n/server";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from '@/lib/i18n/getMessages';

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: "BusinessLabels — Labels for Epson ColorWorks Printers",
  description:
    "Expert-selected labels, accessories and printers. Epson ColorWorks Gold Partner. Order from 1 roll with free support.",
};

export default async function RootLayout({ children }) {
  const locale = await getServerLocale();
  const messages = await getMessages(locale);

  return (
    <html lang={locale} className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <body className="bg-white min-h-screen flex flex-col" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider>
            <WishlistProvider>
              <HelpProvider>
                <Header />
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
