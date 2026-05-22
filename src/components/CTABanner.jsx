"use client";

import Image from 'next/image';
import LocaleLink from '@/components/LocaleLink';
import { useHelp } from './HelpProvider';
import { useTranslations } from 'next-intl';

export default function CTABanner() {
  const t = useTranslations();
  const { openHelp } = useHelp();
  return (
    <section className="relative min-h-[400px] lg:h-120 w-full py-16 lg:py-12 overflow-hidden flex items-center">
      {/* Background */}
      <Image
        src="/images/cta_image.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-black/50 via-black/50 to-black/0" />
      <div className="absolute inset-0 bg-gradient-to-br from-stone-700/70 to-yellow-950/60" />

      {/* Content */}
      <div className="relative z-10 w-full px-4 md:px-8 lg:px-10 h-full flex items-center justify-center">
        <div className="max-w-360 w-full flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-center text-white text-3xl md:text-4xl font-bold font-['Segoe_UI'] leading-tight md:leading-[48px]">
              {t('cta.title')}
            </h2>
            <p className="text-center text-slate-100 text-base md:text-lg font-normal font-['Segoe_UI'] leading-relaxed md:leading-7">
              {t('cta.subtitle')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <LocaleLink
              href="/products"
              className="w-full sm:w-auto justify-center px-7 py-4 bg-amber-500 rounded-full flex items-center gap-2.5 text-white text-lg font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors"
            >
              {t('cta.browseProducts')}
            </LocaleLink>
            <button
              type="button"
              onClick={openHelp}
              className="w-full sm:w-auto justify-center px-7 py-4 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm flex items-center gap-2.5 text-white text-lg font-semibold font-['Segoe_UI'] leading-6 hover:bg-white/20 transition-colors"
            >
              {t('cta.talkToExpert')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
