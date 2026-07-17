import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Phone, 
  Mail, 
  Monitor, 
  MonitorPlay,
  BookOpen, 
  Wrench, 
  Laptop, 
  Settings, 
  Truck, 
  CheckCircle2,
  Home,
  Download,
  ArrowRight,
  Printer,
  Package
} from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useTranslations, useLocale } from 'next-intl';
import { localePath } from '@/lib/i18n/utils';
import AvailabilityStatus from "@/app/contact-us/AvailabilityStatus";
import CTABanner from "@/components/CTABanner";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("supportPage");
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function SupportPage() {
  const t = useTranslations('supportPage');
  const locale = useLocale();
  return (
    <div className="relative bg-white min-h-screen font-sans overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/10 rounded-full blur-[120px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute top-[40%] left-0 w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-[120px] pointer-events-none transform -translate-x-1/3" />

      {/* Container */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-12 relative z-10">
        {/* Glow top left of contact cards */}
        <div className="size-48 -left-12 top-[460px] absolute bg-brand/25 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="max-w-360 mx-auto flex flex-col gap-10">
        
        {/* HERO SECTION */}
        <section className="w-full py-12 md:py-16 px-6 md:px-12 relative mt-8 max-w-360 rounded-[24px] mx-auto overflow-hidden shadow-2xl bg-zinc-800 bg-[url('/images/archive-banner.jpg')] bg-cover bg-center">
          {/* Background Image Setup */}
          <div className="absolute inset-0 bg-black/20 z-0" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent z-0" />
          
          <div className="max-w-360 mx-auto flex flex-col relative z-10">
            {/* Breadcrumbs inside Hero */}
            <div className="flex items-center gap-2 text-white/80 text-sm font-medium mb-6">
              <Home className="w-4 h-4" />
              <span>/</span>
              <span>{t('breadcrumbSupport')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 text-white">
              {t('heroTitle')}
            </h1>
            <p className="text-lg text-slate-200 leading-relaxed max-w-6xl">
              {t('heroDesc')}
            </p>
          </div>
        </section>

        {/* CONTACT CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300">
            <Phone className="w-14 h-14 text-neutral-500 mb-6" strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-slate-800 mb-4">{t('callTitle')}</h3>
            <a href="tel:+31318590465" className="text-lg font-bold text-slate-700 hover:text-sky-600 mb-2 transition-colors">+31 (0)318 590 465</a>
            <AvailabilityStatus />
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300">
            <Mail className="w-14 h-14 text-neutral-500 mb-6" strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-slate-800 mb-4">{t('emailTitle')}</h3>
            <a href="mailto:verkoop@businesslabels.nl" className="text-lg font-bold text-slate-700 hover:text-sky-600 mb-2 transition-colors">verkoop@businesslabels.nl</a>
            <p className="text-sm text-slate-400 font-medium">{t('emailTime')}</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300">
            <Monitor className="w-14 h-14 text-neutral-500 mb-6" strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-slate-800 mb-4">{t('remoteTitle')}</h3>
            <a href="https://download.teamviewer.com/download/TeamViewerQS.exe" target="_blank" rel="noopener noreferrer" className="text-base sm:text-lg font-bold text-brand hover:text-brand mb-2 flex items-center gap-2 justify-center transition-colors">
              <Download className="w-5 h-5" /> {t('downloadTv')}
            </a>
            <p className="text-sm text-slate-400 font-medium">{t('remoteDesc')}</p>
          </div>
        </section>

        {/* FREE SUPPORT BANNER */}
        <section>
          <div className="bg-[#fffdf8] border border-orange-100 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_4px_20px_-4px_rgba(255,165,0,0.05)]">
            <div className="max-w-3xl">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {t('freeSupportTitle')}
              </h3>
              <p className="text-slate-600 font-medium">
                {t('freeSupportDesc')}
              </p>
            </div>
            {/* TeamViewer Logo Image */}
            <div className="shrink-0">
              <Image 
                src="/images/teamviewer.png" 
                alt="TeamViewer" 
                width={280} 
                height={70} 
                className="w-[280px] h-auto object-contain"
              />
            </div>
          </div>
        </section>

        {/* KNOWLEDGE BASE BANNER */}
        <section>
          <div className="bg-[#f8f9fa] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-3xl">
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                {t('kbTitle')}
              </h3>
              <p className="text-slate-500 text-sm">
                {t('kbDesc')}
              </p>
            </div>
            <Link href={localePath('/kennisbank-overzicht', locale)} className="shrink-0 bg-[#ea7a0e] hover:bg-[#d66e0a] text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> {t('kbButton')}
            </Link>
          </div>
        </section>

        {/* SERVICES & PRICING */}
        <section className="flex flex-col gap-6 mt-4">
          <div>
            <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight">{t('servicesTitle')}</h2>
          </div>

          <div className="flex flex-col gap-4">
            {/* Service Item 1: Remote Printer Support */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex-1 lg:max-w-[520px] flex flex-col gap-3 justify-center items-start w-full">
                <div className="flex justify-start items-center gap-3">
                  <div className="w-8 h-8 px-3 bg-[#FFF7EB] shadow-sm rounded-lg flex justify-center items-center shrink-0">
                    <Monitor className="w-5 h-5 text-brand shrink-0" />
                  </div>
                  <h3 className="text-[20px] font-bold text-[#222222] leading-snug">{t('s1Title')}</h3>
                </div>
                <p className="self-stretch text-[#444444] text-[16px] font-normal leading-relaxed">{t('s1Desc')}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 font-medium mb-1">{t('idealFor')}</div>
                <p className="text-sm text-slate-700 font-bold leading-relaxed">{t.rich('s1Ideal', { br: () => <br /> })}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="lg:w-48 lg:text-right w-full pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-2xl font-bold text-brand">{t('s1Price')} <span className="text-xl font-semibold text-brand/70">{t('s1PriceUnit')}</span></div>
                <div className="text-xs text-slate-400 mt-1 font-medium">{t('billedHourly')}</div>
              </div>
            </div>

            {/* Service Item 2: Remote Software Support */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex-1 lg:max-w-[520px] flex flex-col gap-3 justify-center items-start w-full">
                <div className="flex justify-start items-center gap-3">
                  <div className="w-8 h-8 px-3 bg-[#FFF7EB] shadow-sm rounded-lg flex justify-center items-center shrink-0">
                    <Settings className="w-5 h-5 text-brand shrink-0" />
                  </div>
                  <h3 className="text-[20px] font-bold text-[#222222] leading-snug">{t('s2Title')}</h3>
                </div>
                <p className="self-stretch text-[#444444] text-[16px] font-normal leading-relaxed">{t('s2Desc')}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 font-medium mb-1">{t('idealFor')}</div>
                <p className="text-sm text-slate-700 font-bold leading-relaxed">{t.rich('s2Ideal', { br: () => <br /> })}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="lg:w-48 lg:text-right w-full pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-2xl font-bold text-brand">{t('s2Price')} <span className="text-xl font-semibold text-brand/70">{t('s2PriceUnit')}</span></div>
                <div className="text-xs text-slate-400 mt-1 font-medium">{t('billedHourly')}</div>
              </div>
            </div>

            {/* Service Item 3: Hardware Repair */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex-1 lg:max-w-[520px] flex flex-col gap-3 justify-center items-start w-full">
                <div className="flex justify-start items-center gap-3">
                  <div className="w-8 h-8 px-3 bg-[#FFF7EB] shadow-sm rounded-lg flex justify-center items-center shrink-0">
                    <Printer className="w-5 h-5 text-brand shrink-0" />
                  </div>
                  <h3 className="text-[20px] font-bold text-[#222222] leading-snug">{t('s3Title')}</h3>
                </div>
                <p className="self-stretch text-[#444444] text-[16px] font-normal leading-relaxed">{t('s3Desc')}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 font-medium mb-1">{t('idealFor')}</div>
                <p className="text-sm text-slate-700 font-bold leading-relaxed">{t.rich('s3Ideal', { br: () => <br /> })}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="lg:w-48 lg:text-right w-full pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-2xl font-bold text-brand">{t('s3Price')} <span className="text-xl font-semibold text-brand/70">{t('s3PriceUnit')}</span></div>
                <div className="text-xs text-slate-400 mt-1 font-medium">{t('billedHourly')}</div>
              </div>
            </div>

            {/* Service Item 4: On-site Service */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex-1 lg:max-w-[520px] flex flex-col gap-3 justify-center items-start w-full">
                <div className="flex justify-start items-center gap-3">
                  <div className="w-8 h-8 px-3 bg-[#FFF7EB] shadow-sm rounded-lg flex justify-center items-center shrink-0">
                    <Package className="w-5 h-5 text-brand shrink-0" />
                  </div>
                  <h3 className="text-[20px] font-bold text-[#222222] leading-snug">{t('s4Title')}</h3>
                </div>
                <p className="self-stretch text-[#444444] text-[16px] font-normal leading-relaxed">{t('s4Desc')}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 font-medium mb-1">{t('idealFor')}</div>
                <p className="text-sm text-slate-700 font-bold leading-relaxed">{t.rich('s4Ideal', { br: () => <br /> })}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="lg:w-48 lg:text-right w-full pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-2xl font-bold text-brand">{t('s4Price')} <span className="text-xl font-semibold text-brand/70">{t('s4PriceUnit')}</span></div>
                <div className="text-xs text-slate-400 mt-1 font-medium">{t('s4PriceDesc')}</div>
              </div>
            </div>

            {/* Service Item 5: Loan Equipment */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex-1 lg:max-w-[520px] flex flex-col gap-3 justify-center items-start w-full">
                <div className="flex justify-start items-center gap-3">
                  <div className="w-8 h-8 px-3 bg-[#FFF7EB] shadow-sm rounded-lg flex justify-center items-center shrink-0 text-brand">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0">
                      <path d="M18.1669 8.33357C18.5474 10.2013 18.2762 12.1431 17.3984 13.8351C16.5206 15.527 15.0893 16.8669 13.3431 17.6313C11.597 18.3957 9.64154 18.5384 7.80293 18.0355C5.96433 17.5327 4.35368 16.4147 3.23958 14.8681C2.12548 13.3214 1.57529 11.4396 1.68074 9.53639C1.78619 7.63318 2.54092 5.82364 3.81906 4.40954C5.0972 2.99545 6.8215 2.06226 8.7044 1.76561C10.5873 1.46897 12.515 1.82679 14.166 2.7794" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7.5 9.16536L10 11.6654L18.3333 3.33203" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-[20px] font-bold text-[#222222] leading-snug">{t('s5Title')}</h3>
                </div>
                <p className="self-stretch text-[#444444] text-[16px] font-normal leading-relaxed">{t('s5Desc')}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 font-medium mb-1">{t('idealFor')}</div>
                <p className="text-sm text-slate-700 font-bold leading-relaxed">{t.rich('s5Ideal', { br: () => <br /> })}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="lg:w-48 lg:text-right w-full pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-2xl font-bold text-slate-800">{t('s5Price')}</div>
                <div className="text-xs text-slate-400 mt-1 font-medium">{t('s5PriceDesc')}</div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-slate-400 font-medium mt-4 leading-relaxed">
            {t('bottomText')}
          </p>
        </section>
      </div>
    </div>

      {/* FULL WIDTH LOWER SECTION */}
      <section className="bg-slate-50/50 border-t border-slate-100 py-24 relative z-10 px-4 sm:px-6 lg:px-10 overflow-hidden">
        {/* Glow bottom right */}
        <div className="size-48 -right-12 -bottom-12 absolute bg-brand/25 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="max-w-360 mx-auto w-full flex flex-col gap-24 relative z-10">
          
          {/* Top Row: What We Help With */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 pr-0 lg:pr-12">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">{t('helpTitle')}</h2>
              <ul className="space-y-5">
                {[
                  t('help1'),
                  t('help2'),
                  t('help3'),
                  t('help4'),
                  t('help5'),
                  t('help6'),
                  t('help7')
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-1">
                      <path d="M13.6242 6.24822C13.9096 7.64903 13.7062 9.10536 13.0478 10.3743C12.3895 11.6433 11.316 12.6483 10.0064 13.2215C8.69675 13.7948 7.23018 13.9018 5.85122 13.5247C4.47227 13.1476 3.26428 12.3091 2.42871 11.1491C1.59314 9.98913 1.18049 8.57775 1.25958 7.15034C1.33866 5.72293 1.90471 4.36578 2.86332 3.30521C3.82193 2.24463 5.11515 1.54474 6.52733 1.32226C7.93951 1.09977 9.38528 1.36814 10.6235 2.0826" stroke="#888888" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5.625 6.875L7.5 8.75L13.75 2.5" stroke="#888888" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[15px] text-slate-600 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <img src="/find_the_right_printer.jpeg" alt="Printer repair" className="w-full h-auto object-cover rounded-3xl shadow-lg aspect-[4/3] lg:aspect-auto lg:h-[400px]" />
            </div>
          </div>

          {/* Bottom Row: How Remote Support Works */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-1 lg:order-1">
              <img src="/labelprinters.jpeg" alt="Remote support" className="w-full h-auto object-cover rounded-3xl shadow-lg aspect-[4/3] lg:aspect-auto lg:h-[400px]" />
            </div>
            <div className="order-2 lg:order-2 pl-0 lg:pl-12">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">{t('howTitle')}</h2>
              <div className="space-y-6">
                {[
                  t('how1'),
                  t('how2'),
                  t('how3'),
                  t('how4')
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="text-slate-400 font-medium shrink-0 pt-0.5 w-6">
                      0{idx + 1}.
                    </div>
                    <p className="text-[15px] text-slate-600 font-medium">{item}</p>
                  </div>
                ))}
                
                <div className="pt-6">
                  <a href="https://download.teamviewer.com/download/TeamViewerQS.exe" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand font-bold hover:text-orange-600 transition-colors text-[15px] underline underline-offset-4 decoration-orange-500/30 hover:decoration-orange-500">
                    <Download className="w-5 h-5" /> {t('downloadQs')}
                  </a>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* CTA SECTION */}
      <CTABanner />

    </div>
  );
}
