'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconSend() {
  return (
    <svg
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  );
}

function IconCoffee() {
  return (
    <svg
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"
      />
    </svg>
  );
}

function IconPrint() {
  return (
    <svg
      className="size-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm1-4h.01M9 3h6v4H9V3z"
      />
    </svg>
  );
}

function IconBadge() {
  return (
    <svg
      className="size-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
      />
    </svg>
  );
}

function IconEuro() {
  return (
    <svg
      className="size-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h7.5M8 13.5h7.5"
      />
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────



// ─── Sub-components ───────────────────────────────────────────────────────────

function BenefitCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-neutral-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:ring-amber-200">
      <div className="flex size-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-neutral-800">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{desc}</p>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  t,
}: {
  product: {
    id: number;
    slug: string;
    name: string;
    sku: string;
    subtitle: string;
    price: string;
    priceBtw: string;
    specs: string[];
    imgSrc: string;
    imgAlt: string;
    href: string;
  };
  t: any;
}) {
  return (
    <a
      href={product.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:ring-amber-200"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-50">
        <img
          src={product.imgSrc}
          alt={product.imgAlt}
          className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h3 className="text-base font-bold text-neutral-800 transition-colors group-hover:text-amber-600 leading-snug">
            {product.name}
          </h3>
          <p className="mt-1 text-xs font-medium text-neutral-400">
            SKU: {product.sku}
          </p>
        </div>

        <ul className="flex flex-col gap-1">
          {product.specs.map((s) => (
            <li key={s} className="flex items-start gap-2 text-xs text-neutral-500">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
              {s}
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          <p className="text-2xl font-black text-neutral-800">{product.price}</p>
          <p className="text-xs text-neutral-400">{t('productSubtitleLabel', { price: product.priceBtw })}</p>
        </div>

        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-500 transition-colors group-hover:text-amber-600">
          {t('viewProduct')}
          <span className="flex size-6 items-center justify-center rounded-full bg-amber-100 transition-transform group-hover:translate-x-1 group-hover:bg-amber-200">
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BadgeMakenPageClient() {
  const t = useTranslations('badgePage');

  const BENEFITS = [
    {
      icon: <IconBadge />,
      title: t('benefit1Title'),
      desc: t('benefit1Desc'),
    },
    {
      icon: <IconEuro />,
      title: t('benefit2Title'),
      desc: t('benefit2Desc'),
    },
    {
      icon: <IconPrint />,
      title: t('benefit3Title'),
      desc: t('benefit3Desc'),
    },
  ];

  const PRODUCTS = [
    {
      id: 60134,
      slug: 'expobadge-25360911-w120-11',
      name: 'ExpoBand W120-11',
      sku: '25360911',
      subtitle: 'MAT Scheurbestendig papier, Permanent',
      price: '€30,69',
      priceBtw: '€37,13',
      specs: [
        'Kern: 38',
        'Max buiten diameter: 101',
        'Labels per rol: 100',
        'Materiaal: DIA050S',
      ],
      imgSrc:
        'https://businesslabels.nl/wp-content/uploads/2021/08/25360911-11-600x600.png',
      imgAlt: 'ExpoBand W120-11',
      href: '/product/expobadge-25360911-w120-11/',
    },
    {
      id: 82487,
      slug: 'expobadge-25350988-t180-branded',
      name: 'ExpoBadge T180 Branded, 96×134 mm FSC® CERTIFIED',
      sku: '25350988',
      subtitle: 'MAT Papier, Geen (ticket)',
      price: '€163,58',
      priceBtw: '€197,93',
      specs: [
        'Badge formaat: 96,5 x 134 mm',
        'Aantal hangogen: 3',
        'Badge type: Butterfly zonder lijm',
        'FSC® gecertificeerd incl. logo op rug',
      ],
      imgSrc:
        'https://businesslabels.nl/wp-content/uploads/2023/07/25350983-HR-600x600.png',
      imgAlt: 'ExpoBadge T180 Branded',
      href: '/product/expobadge-25350988-t180-branded/',
    },
    {
      id: 74354,
      slug: 'expobadge-25350985-t180s-fsc',
      name: 'ExpoBadge T180S, 96×82 mm FSC® CERTIFIED',
      sku: '25350985',
      subtitle: 'MAT Papier, Geen (ticket)',
      price: '€123,39',
      priceBtw: '€149,30',
      specs: [
        'Badge formaat: 96,5 x 82 mm',
        'Aantal hangogen: 3',
        'Badge type: Butterfly zonder lijm',
        'FSC® gecertificeerd',
      ],
      imgSrc:
        'https://businesslabels.nl/wp-content/uploads/2023/07/25350985-600x600.png',
      imgAlt: 'ExpoBadge T180S',
      href: '/product/expobadge-25350985-t180s-fsc/',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute left-0 top-[5%] h-72 w-72 rounded-full bg-amber-400/10 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-[35%] h-72 w-72 rounded-full bg-blue-400/10 blur-[140px]" />
      <div className="pointer-events-none absolute left-1/2 top-[70%] h-96 w-96 -translate-x-1/2 rounded-full bg-amber-300/8 blur-[160px]" />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: t('breadcrumb') }]} />
        </div>

        <div className="flex flex-col items-center gap-16 lg:flex-row">
          {/* Left: copy */}
          <div className="flex-1">
            <span className="inline-block rounded-full bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-600 ring-1 ring-amber-200">
              {t('heroTag')}
            </span>

            <h1 className="mt-4 text-5xl font-black uppercase tracking-tight text-neutral-800 sm:text-6xl lg:text-7xl">
              {t('heroTitle')}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-500">
              {t('heroDesc')}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                id="badge-maken-proefpakket-btn"
                href="mailto:verkoop@businesslabels.nl?subject=Aanvraag%20ExpoBadge%20proefpakket&body=Beste%20Businesslabels%2C%20%20Hierbij%20geef%20ik%20aan%20graag%20een%20proefpakket%20van%20ExpoBadge%20te%20ontvangen."
                className="inline-flex items-center gap-2.5 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-bold text-white uppercase tracking-wide shadow-lg shadow-amber-500/25 transition-all duration-200 hover:bg-amber-600 hover:shadow-amber-500/40 active:scale-[0.98]"
              >
                <IconSend />
                {t('heroBtnSample')}
              </a>

              <Link
                id="badge-maken-advies-btn"
                href="/contact-us/"
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-neutral-700 uppercase tracking-wide ring-1.5 ring-neutral-200 transition-all duration-200 hover:bg-neutral-50 hover:ring-amber-400 active:scale-[0.98]"
              >
                <IconCoffee />
                {t('heroBtnAdvice')}
              </Link>
            </div>
          </div>

          {/* Right: event images */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="grid grid-cols-2 gap-4">
              <div className="overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5">
                <img
                  src="https://businesslabels.nl/wp-content/uploads/2020/05/MMR4169.jpg"
                  alt="Bezoekersbadge evenement"
                  className="h-full w-full object-cover aspect-square"
                  loading="lazy"
                />
              </div>
              <div className="overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 mt-8">
                <img
                  src="https://businesslabels.nl/wp-content/uploads/2020/05/MMR4168.jpg"
                  alt="Badge maken op evenement"
                  className="h-full w-full object-cover aspect-square"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits strip ────────────────────────────────────────────────────── */}
      <section className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {BENEFITS.map((b) => (
              <BenefitCard key={b.title} {...b} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Goedkoper badges maken ─────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
          {/* Text */}
          <div className="flex-1">
            <h2 className="text-3xl font-black uppercase tracking-tight text-neutral-800 sm:text-4xl">
              {t('cheaperTitle')}
            </h2>
            <p className="mt-6 leading-relaxed text-neutral-500">
              {t('cheaperDesc')}
            </p>

            <div className="mt-8 rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-100">
              <p className="text-sm font-semibold text-amber-800">
                {t('cheaperTip', { percent: t('cheaperTipHighlight') })}
              </p>
            </div>
          </div>

          {/* Visual stat */}
          <div className="flex flex-1 items-center justify-center">
            <div className="relative flex size-64 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl shadow-amber-400/40">
              <div className="text-center text-white">
                <p className="text-6xl font-black">40%</p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-wider opacity-90">
                  {t('savings')}
                </p>
              </div>
              {/* Decorative ring */}
              <div className="pointer-events-none absolute inset-[-12px] rounded-full ring-1 ring-amber-300/60" />
              <div className="pointer-events-none absolute inset-[-24px] rounded-full ring-1 ring-amber-200/40" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Hoe werkt het? ────────────────────────────────────────────────────── */}
      <section className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-16 lg:flex-row lg:items-center">
            {/* Three event photos */}
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="overflow-hidden rounded-xl shadow-md ring-1 ring-black/5">
                  <img
                    src="https://businesslabels.nl/wp-content/uploads/2020/05/ExpoBadge-en-aanmelder.nl1-1.jpg"
                    alt="ExpoBadge op evenement"
                    className="h-full w-full object-cover aspect-[3/4]"
                    loading="lazy"
                  />
                </div>
                <div className="overflow-hidden rounded-xl shadow-md ring-1 ring-black/5 mt-6">
                  <img
                    src="https://businesslabels.nl/wp-content/uploads/2020/05/front_top02-Aangepast.png"
                    alt="Epson TM-C3500 printer"
                    className="h-full w-full object-contain bg-white aspect-[3/4]"
                    loading="lazy"
                  />
                </div>
                <div className="overflow-hidden rounded-xl shadow-md ring-1 ring-black/5">
                  <img
                    src="https://businesslabels.nl/wp-content/uploads/2020/05/Entree-EventSummit-20191-1.jpg"
                    alt="EventSummit entree"
                    className="h-full w-full object-cover aspect-[3/4]"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="flex-1 flex flex-col gap-10">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-neutral-800 sm:text-4xl">
                  {t('howTitle')}
                </h2>
                <p className="mt-4 leading-relaxed text-neutral-500">
                  {t('howDesc')}
                </p>
              </div>

              {/* Steps list */}
              <ol className="flex flex-col gap-6">
                {[
                  {
                    step: '01',
                    title: t('step1Title'),
                    desc: t('step1Desc'),
                  },
                  {
                    step: '02',
                    title: t('step2Title'),
                    desc: t('step2Desc'),
                  },
                  {
                    step: '03',
                    title: t('step3Title'),
                    desc: t('step3Desc'),
                  },
                ].map((item) => (
                  <li key={item.step} className="flex items-start gap-5">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-sm font-black text-white">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="font-bold text-neutral-800">{item.title}</h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-neutral-500">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <a
                id="badge-maken-advies-link"
                href="/contact-us/"
                className="inline-flex w-fit items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-neutral-700 ring-1.5 ring-neutral-200 shadow-sm transition-all duration-200 hover:bg-neutral-50 hover:ring-amber-400 active:scale-[0.98]"
              >
                <IconCoffee />
                {t('adviceBtn')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Epson TM-C3500 ────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-800 to-neutral-900 shadow-2xl">
          <div className="flex flex-col gap-0 lg:flex-row">
            {/* Text */}
            <div className="flex flex-1 flex-col justify-center gap-6 p-10 sm:p-14">
              <span className="w-fit rounded-full bg-amber-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-400">
                {t('printerTag')}
              </span>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                Epson TM-C3500
              </h2>
              <p className="leading-relaxed text-neutral-300">
                {t('printerDesc')}
              </p>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t('specWeight'), value: t('specWeightVal') },
                  { label: t('specPrintWidth'), value: t('specPrintWidthVal') },
                  { label: t('specPrintTech'), value: t('specPrintTechVal') },
                  { label: t('specInterface'), value: t('specInterfaceVal') },
                ].map((spec) => (
                  <div
                    key={spec.label}
                    className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10"
                  >
                    <p className="text-xs font-medium text-neutral-400">{spec.label}</p>
                    <p className="mt-0.5 text-sm font-bold text-white">{spec.value}</p>
                  </div>
                ))}
              </div>

              <a
                id="badge-maken-printer-link"
                href="/product/colorworks-tm-c3500/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2.5 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-amber-500/30 transition-all duration-200 hover:bg-amber-400 active:scale-[0.98]"
              >
                {t('viewPrinterBtn')}
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Printer visual */}
            <div className="flex flex-1 items-center justify-center bg-white/5 p-10">
              <img
                src="https://businesslabels.nl/wp-content/uploads/2020/05/front_top02-Aangepast.png"
                alt="Epson TM-C3500 ColorWorks labelprinter"
                className="max-h-72 object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Products ──────────────────────────────────────────────────────────── */}
      <section className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="inline-block rounded-full bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-600 ring-1 ring-amber-200">
              {t('productsTag')}
            </span>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-tight text-neutral-800 sm:text-4xl">
              {t('productsTitle')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-neutral-500">
              {t('productsDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Meer informatie / CTA ─────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-14 text-center shadow-2xl shadow-amber-500/30">
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            {t('ctaTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-amber-100">
            {t('ctaDesc')}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              id="badge-maken-offerte-btn"
              href="mailto:VERKOOP@BUSINESSLABELS.NL"
              className="inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-amber-600 shadow-lg transition-all duration-200 hover:bg-amber-50 active:scale-[0.98]"
            >
              <IconSend />
              {t('ctaBtnQuote')}
            </a>

            <a
              id="badge-maken-tel-btn"
              href="tel:+31318590465"
              className="inline-flex items-center gap-2.5 rounded-full bg-amber-400/30 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white ring-1 ring-white/20 transition-all duration-200 hover:bg-amber-400/50 active:scale-[0.98]"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +31 318 590 465
            </a>

            <a
              id="badge-maken-maatwerk-btn"
              href="/custom-made-form/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-amber-400/30 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white ring-1 ring-white/20 transition-all duration-200 hover:bg-amber-400/50 active:scale-[0.98]"
            >
              {t('ctaBtnCustom')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
