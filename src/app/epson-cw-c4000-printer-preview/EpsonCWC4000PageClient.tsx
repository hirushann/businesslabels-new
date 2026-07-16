'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// ─── Data ─────────────────────────────────────────────────────────────────────

const SPECS = [
  'spec1', 'spec2', 'spec3', 'spec4', 'spec5', 'spec6', 'spec7', 'spec8', 'spec9', 'spec10', 'spec11', 'spec12', 'spec13'
];

const SPEED_MODES = [
  { labelKey: 'speedModeMaxSpeed', dpi: '300 × 600 dpi', pct: 100, mm: '100 mm/s' },
  { labelKey: 'speedModeSpeed',     dpi: '600 × 600 dpi', pct: 75,  mm: '70 mm/s'  },
  { labelKey: 'speedModeNormal',      dpi: '600 × 600 dpi', pct: 60,  mm: '48 mm/s'  },
  { labelKey: 'speedModeQuality',    dpi: '600 × 1200 dpi',pct: 40,  mm: '18 mm/s'  },
  { labelKey: 'speedModeMaxQuality',dpi: '1200 × 1200 dpi',pct:16,  mm: '8 mm/s'   },
];

const CAROUSEL_ITEMS = [
  { src: 'https://businesslabels.nl/wp-content/uploads/2022/01/Epson-left-CW-C4000-LR-1-150x131.png',            alt: 'Printer CW-C4000'      },
  { src: 'https://businesslabels.nl/wp-content/uploads/2022/01/Epson_C4000e_maintenance_box_SJMB4000-1-e1643380482940-150x120.png', alt: 'Maintenance box'   },
  { src: 'https://businesslabels.nl/wp-content/uploads/2022/01/Epson_SJIC42P-BK_Black_C13T52M140-150x121.png',   alt: 'Cartridge Zwart BK'    },
  { src: 'https://businesslabels.nl/wp-content/uploads/2022/01/Epson_SJIC42P-MK_matt_Black_C13T52M540-150x121.png', alt: 'Cartridge Zwart MK' },
  { src: 'https://businesslabels.nl/wp-content/uploads/2022/01/Epson_SJIC42P-C_Cyan_C13T52M240-150x121.png',     alt: 'Cartridge Cyaan'       },
  { src: 'https://businesslabels.nl/wp-content/uploads/2022/01/Epson_SJIC42P-M_Magenta_C13T52M340-150x121.png', alt: 'Cartridge Magenta'      },
  { src: 'https://businesslabels.nl/wp-content/uploads/2022/01/Epson_SJIC42P-Y_Yellow_C13T52M440-150x121.png',  alt: 'Cartridge Geel'         },
  { src: 'https://businesslabels.nl/wp-content/uploads/2022/01/Epson-CW-C4000-paper-tray-part-150x121.png',     alt: 'Opvang bak'             },
  { src: 'https://businesslabels.nl/wp-content/uploads/2022/01/Epson-CW-C4000-WiFi-dongle-150x119.png',         alt: 'WiFi Dongle'            },
  { src: 'https://businesslabels.nl/wp-content/uploads/2022/01/Epson-Cw-C4000-auto-cutter-unit-150x104.png',    alt: 'Automatisch snijmes'    },
];

const PRICING = [
  {
    id: 'printer',
    titleKey: 'pricingTitlePrinter',
    price: '€1.579,20',
    noteKey: 'pricingNotePrinter',
    descKey: 'pricingDescPrinter',
    href: '/product-category/labelprinters/kleuren-labelprinters-nl/desktop-labelprinters-nl/',
  },
  {
    id: 'ink',
    titleKey: 'pricingTitleInk',
    price: '€32,96',
    noteKey: 'pricingNoteInk',
    descKey: 'pricingDescInk',
    href: '/product-category/labelprinters/verbruiksmaterialen-nl/inkt-cartridges-nl/inkt-epson-cw-c4000/',
  },
  {
    id: 'maintenance',
    titleKey: 'pricingTitleMaintenance',
    price: '€30,90',
    noteKey: 'pricingNoteMaintenance',
    descKey: 'pricingDescMaintenance',
    href: '/product/epson-maintenance-box-cw-c4000/',
  },
  {
    id: 'wifi',
    titleKey: 'pricingTitleWifi',
    price: '€108,-',
    noteKey: 'pricingNoteWifi',
    descKey: 'pricingDescWifi',
    href: '/product/wifi-dongle-epson-c4000/',
  },
  {
    id: 'cutter',
    titleKey: 'pricingTitleCutter',
    price: '€210,-',
    noteKey: 'pricingNoteCutter',
    descKey: 'pricingDescCutter',
    href: '/product/autocutter-cw-c4000/',
  },
];

// ─── Animated progress bar ────────────────────────────────────────────────────

function SpeedBar({
  label,
  dpi,
  pct,
  mm,
  index,
  animate,
}: {
  label: string;
  dpi: string;
  pct: number;
  mm: string;
  index: number;
  animate: boolean;
}) {
  const hue = 210 - index * 20; // shifts from blue-ish → amber
  const barColor =
    index === 0
      ? 'bg-brand'
      : index === 1
      ? 'bg-brand'
      : index === 2
      ? 'bg-amber-300'
      : index === 3
      ? 'bg-neutral-400'
      : 'bg-neutral-300';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <span className="text-sm font-bold text-neutral-700">{label}</span>
          <span className="ml-2 text-xs text-neutral-400">{dpi}</span>
        </div>
        <span className="shrink-0 text-sm font-black text-neutral-800">{mm}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
          style={{ width: animate ? `${pct}%` : '0%', transitionDelay: `${index * 120}ms` }}
        />
      </div>
    </div>
  );
}

// ─── Auto-scroll carousel ─────────────────────────────────────────────────────

function AccessoryCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const itemWidth = 160; // px
  const gap = 16;
  const stride = itemWidth + gap;
  const total = CAROUSEL_ITEMS.length;

  useEffect(() => {
    const id = setInterval(() => {
      setOffset((prev) => (prev + 1) % total);
    }, 1800);
    return () => clearInterval(id);
  }, [total]);

  // Duplicate items for seamless loop
  const doubled = [...CAROUSEL_ITEMS, ...CAROUSEL_ITEMS];

  return (
    <div className="relative w-full overflow-hidden py-2">
      <div
        ref={trackRef}
        className="flex gap-4 transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${offset * stride}px)` }}
      >
        {doubled.map((item, i) => (
          <figure
            key={i}
            className="shrink-0 w-40 flex flex-col items-center gap-2 rounded-2xl bg-white/10 px-3 py-4 ring-1 ring-white/15 backdrop-blur-sm"
          >
            <img
              src={item.src}
              alt={item.alt}
              className="h-20 w-full object-contain"
              loading="lazy"
            />
            <figcaption className="text-center text-xs font-medium text-white/80">
              {item.alt}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EpsonCWC4000PageClient() {
  const t = useTranslations('c4000Preview');
  // Animate progress bars when section enters view
  const speedRef = useRef<HTMLDivElement>(null);
  const [speedVisible, setSpeedVisible] = useState(false);

  useEffect(() => {
    const el = speedRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setSpeedVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute left-0 top-[8%] h-80 w-80 rounded-full bg-brand/10 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-[30%] h-80 w-80 rounded-full bg-blue-400/8 blur-[150px]" />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: t('breadcrumbKnowledge'), href: '/kennisbank-overzicht' },
              { label: t('breadcrumbCurrent') },
            ]}
          />
        </div>

        <div className="flex flex-col items-center gap-12 lg:flex-row">
          {/* Left: copy */}
          <div className="flex-1">
            <span className="inline-block rounded-full bg-brand-soft px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-brand ring-1 ring-amber-200">
              {t('heroTag')}
            </span>

            <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-neutral-800 sm:text-5xl lg:text-6xl">
              {t('heroTitle')}
            </h1>

            <p className="mt-6 max-w-xl leading-relaxed text-neutral-500">
              {t('heroDesc1')}
            </p>
            <p className="mt-3 max-w-xl leading-relaxed text-neutral-500">
              {t('heroDesc2')}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                id="cwc4000-hero-cta"
                href="/product-category/labelprinters/kleuren-labelprinters-nl/desktop-labelprinters-nl/"
                className="inline-flex items-center gap-2.5 rounded-full bg-brand px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-brand/25 transition-all duration-200 hover:bg-brand-hover hover:shadow-brand/40 active:scale-[0.98]"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17H3M17 17l-4-4m4 4l-4 4M7 7h14M7 7l4-4M7 7l4 4" />
                </svg>
                {t('heroBtnView')}
              </Link>

              <Link
                id="cwc4000-hero-contact"
                href="/contact-us/"
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-neutral-700 ring-1 ring-neutral-200 transition-all duration-200 hover:bg-neutral-50 hover:ring-brand active:scale-[0.98]"
              >
                {t('heroBtnContact')}
              </Link>
            </div>
          </div>

          {/* Right: printer image */}
          <div className="flex flex-1 items-center justify-center">
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute inset-[-24px] rounded-full bg-brand/15 blur-2xl" />
              <img
                src="https://businesslabels.nl/wp-content/uploads/2022/02/Epson-left-CW-C4000-Europe.png"
                alt="Epson CW-C4000 ColorWorks labelprinter"
                className="relative max-h-80 w-full object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-105"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Overview intro ────────────────────────────────────────────────────── */}
      <section className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-[900px] px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black uppercase tracking-tight text-neutral-800 sm:text-4xl">
            {t('overviewTitle')}
          </h2>
          <p className="mx-auto mt-6 max-w-3xl leading-relaxed text-neutral-500">
            {t('overviewDescPart1')}
            <Link href="/printers/epson-colorworks-tm-c3500/" className="font-semibold text-brand underline hover:text-brand">
              Epson TM-C3500
            </Link>
            {t('overviewDescPart2')}
            <Link href="/epson_c6000-series/" className="font-semibold text-brand underline hover:text-brand">
              Epson CW-C6000 series
            </Link>
            {t('overviewDescPart3')}
          </p>
        </div>
      </section>

      {/* ── Specs + Speed ─────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start">

          {/* Left: spec list */}
          <div className="flex-1 lg:max-w-sm xl:max-w-md">
            <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-800">
              {t('specsTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              {t('specsDesc')}
            </p>

            <ul className="mt-6 flex flex-col gap-3">
              {SPECS.map((s, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-600 ring-1 ring-neutral-100">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-brand text-[10px] font-black">
                    {i + 1}
                  </span>
                  {t(s as any)}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: speed bars */}
          <div ref={speedRef} className="flex-1">
            <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-800">
              {t('speedTitle')}
            </h2>
            <p className="mt-3 leading-relaxed text-neutral-500" dangerouslySetInnerHTML={{ __html: t('speedDesc') }} />

            <div className="mt-8 flex flex-col gap-5">
              {SPEED_MODES.map((m, i) => (
                <SpeedBar
                  key={m.labelKey}
                  label={t(m.labelKey as any)}
                  dpi={m.dpi}
                  pct={m.pct}
                  mm={m.mm}
                  index={i}
                  animate={speedVisible}
                />
              ))}
            </div>

            {/* Quick-read table */}
            <div className="mt-8 overflow-hidden rounded-2xl ring-1 ring-neutral-200">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-neutral-700">{t('tableColSetting')}</th>
                    <th className="px-4 py-3 text-left font-bold text-neutral-700">{t('tableColResolution')}</th>
                    <th className="px-4 py-3 text-right font-bold text-neutral-700">{t('tableColSpeed')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {SPEED_MODES.map((m) => (
                    <tr key={m.labelKey} className="hover:bg-brand-soft/50 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-neutral-700">{t(m.labelKey as any)}</td>
                      <td className="px-4 py-2.5 text-neutral-500">{m.dpi}</td>
                      <td className="px-4 py-2.5 text-right font-black text-neutral-800">{m.mm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing — dark section ─────────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-br from-neutral-900 to-neutral-800 py-20">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              {t('pricingQuestion1')}
            </h2>
            <p className="mt-2 text-3xl font-black uppercase tracking-tight text-amber-400 sm:text-4xl">
              {t('pricingQuestion2')}
            </p>
          </div>

          {/* Accessory carousel */}
          <div className="mb-14">
            <AccessoryCarousel />
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {PRICING.map((item) => (
              <Link
                key={item.id}
                id={`cwc4000-price-${item.id}`}
                href={item.href}
                className="group flex flex-col gap-4 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:ring-brand/50"
              >
                <p className="text-sm font-bold uppercase tracking-wider text-white/60">
                  {t(item.titleKey as any)}
                </p>
                <div>
                  <p className="text-3xl font-black text-amber-400">{item.price}</p>
                  <p className="mt-0.5 text-xs text-white/40">{t(item.noteKey as any)}</p>
                </div>
                <p className="flex-1 text-xs leading-relaxed text-white/60">{t(item.descKey as any)}</p>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 transition-all group-hover:gap-2.5">
                  {t('pricingBtnView')}
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BK vs MK ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-3xl font-black uppercase tracking-tight text-neutral-800 sm:text-4xl">
          {t('choiceTitle')}
        </h2>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* BK */}
          <div className="flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-neutral-50 to-white p-8 ring-1 ring-neutral-200 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-black px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
                  {t('bkTag')}
                </span>
                <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-neutral-800">
                  CW-C4000 BK
                </h3>
              </div>
              <div className="shrink-0 size-12 rounded-xl bg-neutral-900 flex items-center justify-center">
                <div className="size-5 rounded-full bg-white/90" />
              </div>
            </div>

            <p className="leading-relaxed text-neutral-500" dangerouslySetInnerHTML={{ __html: t('bkDesc1') }} />
            <p className="leading-relaxed text-neutral-500" dangerouslySetInnerHTML={{ __html: t('bkDesc2') }} />

            <div className="mt-auto">
              <div className="mb-3 flex flex-wrap gap-2">
                {t('bkTags').split(',').map((tag) => (
                  <span key={tag} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                    {tag.trim()}
                  </span>
                ))}
              </div>
              <Link
                id="cwc4000-bk-cta"
                href="/product/colorworks-cw-c4000-bk/"
                className="inline-flex items-center gap-2.5 rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-all duration-200 hover:bg-neutral-700 active:scale-[0.98]"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m1-9l2 9" />
                </svg>
                {t('bkBtn')}
              </Link>
            </div>
          </div>

          {/* MK */}
          <div className="flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-amber-50 to-white p-8 ring-1 ring-amber-200 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-brand px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
                  {t('mkTag')}
                </span>
                <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-neutral-800">
                  CW-C4000 MK
                </h3>
              </div>
              <div className="shrink-0 size-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <div className="size-5 rounded-full bg-neutral-700" />
              </div>
            </div>

            <p className="leading-relaxed text-neutral-500" dangerouslySetInnerHTML={{ __html: t('mkDesc1') }} />
            <p className="leading-relaxed text-neutral-500" dangerouslySetInnerHTML={{ __html: t('mkDesc2') }} />

            <div className="mt-auto">
              <div className="mb-3 flex flex-wrap gap-2">
                {t('mkTags').split(',').map((tag) => (
                  <span key={tag} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {tag.trim()}
                  </span>
                ))}
              </div>
              <Link
                id="cwc4000-mk-cta"
                href="/product/colorworks-cw-c4000-mk/"
                className="inline-flex items-center gap-2.5 rounded-full bg-brand px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-brand/25 transition-all duration-200 hover:bg-brand-hover active:scale-[0.98]"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m1-9l2 9" />
                </svg>
                {t('mkBtn')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-r from-amber-500 to-amber-600 py-16">
        <div className="mx-auto max-w-[1440px] px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            {t('ctaTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-amber-100">
            {t('ctaDesc')}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              id="cwc4000-cta-contact"
              href="/contact-us/"
              className="inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-brand shadow-lg transition-all duration-200 hover:bg-brand-soft active:scale-[0.98]"
            >
              {t('ctaBtnContact')}
            </Link>
            <Link
              id="cwc4000-cta-product"
              href="/product-category/labelprinters/kleuren-labelprinters-nl/desktop-labelprinters-nl/"
              className="inline-flex items-center gap-2.5 rounded-full bg-brand/30 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white ring-1 ring-white/20 transition-all duration-200 hover:bg-brand/50 active:scale-[0.98]"
            >
              {t('ctaBtnPrinters')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
