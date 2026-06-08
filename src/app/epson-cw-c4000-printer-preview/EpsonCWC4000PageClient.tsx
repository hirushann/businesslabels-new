'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// ─── Data ─────────────────────────────────────────────────────────────────────

const SPECS = [
  { text: 'Seriële Precision Core TFP printkop technologie' },
  { text: 'Nozzle Verificatie Technologie met automatische compensatie en volledig zelf onderhoudend' },
  { text: 'UltraChrome DL pigment inkten, CMYK in separate cartridges' },
  { text: '2.7" kleuren display met 9 bedieningsknoppen voor eenvoudige bediening en optimale controle' },
  { text: 'Kleurcorrectie door gebruik van ICC profilering en RGB spotkleur vervanging' },
  { text: 'Afdruk resolutie van maximaal 1200 × 1200 dpi' },
  { text: 'Afdruk breedte van maximaal 108 mm en lengte van maximaal 406 mm per pagina' },
  { text: 'Automatisch snijmes welke eventueel zelf te vervangen is wanneer nodig' },
  { text: 'Optioneel te voorzien van WiFi middels een WiFi dongle' },
  { text: 'De printer weegt 13 kg (gewicht incl. verpakking ca. 17,5 kg)' },
  { text: 'Formaat van 310 × 283 × 285 mm (B×D×H)' },
  { text: 'Detectie methode voor GAP, Blackmark & Eindeloos' },
  { text: 'Gebruik interne labelrol of de externe toevoer' },
];

const SPEED_MODES = [
  { label: 'Max Snelheid', dpi: '300 × 600 dpi', pct: 100, mm: '100 mm/s' },
  { label: 'Snelheid',     dpi: '600 × 600 dpi', pct: 75,  mm: '70 mm/s'  },
  { label: 'Normaal',      dpi: '600 × 600 dpi', pct: 60,  mm: '48 mm/s'  },
  { label: 'Kwaliteit',    dpi: '600 × 1200 dpi',pct: 40,  mm: '18 mm/s'  },
  { label: 'Max Kwaliteit',dpi: '1200 × 1200 dpi',pct:16,  mm: '8 mm/s'   },
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
    title: 'CW-C4000 printer',
    price: '€1.579,20',
    note: 'excl. BTW — zowel BK als MK model',
    desc: 'De Epson CW-C4000 is iets duurder dan de TM-C3500 maar biedt ongekend veel afdruk kwaliteit voor de prijs.',
    href: 'https://businesslabels.nl/product-categorie/labelprinters/kleuren-labelprinters-nl/desktop-labelprinters-nl/',
  },
  {
    id: 'ink',
    title: 'Inkt cartridges',
    price: '€32,96',
    note: 'per cartridge — CMYK + 2× zwart',
    desc: 'Vier aparte 50ml cartridges: Zwart BK, Zwart MK, Cyaan, Magenta & Geel. Lagere inktkosten per afdruk dan de TM-C3500.',
    href: 'https://businesslabels.nl/product-categorie/labelprinters/verbruiksmaterialen-nl/inkt-cartridges-nl/inkt-epson-cw-c4000/',
  },
  {
    id: 'maintenance',
    title: 'Maintenance box',
    price: '€30,90',
    note: 'vervanging bij vol',
    desc: 'Vangt de afvalinkt op die vrijkomt bij onderhoud van de printkop, net als bij de andere ColorWorks printers.',
    href: 'https://businesslabels.nl/product/epson-maintenance-box-cw-c4000/',
  },
  {
    id: 'wifi',
    title: 'WiFi dongle',
    price: '€108,-',
    note: 'optionele uitbreiding',
    desc: 'Voeg draadloze verbinding toe via de dongle aan de achterkant. WiFi instelling via het display van de printer.',
    href: 'https://businesslabels.nl/product/wifi-dongle-epson-c4000/',
  },
  {
    id: 'cutter',
    title: 'Snijmes vervanging',
    price: '€210,-',
    note: 'zelf te vervangen',
    desc: 'Voor het eerst in zijn soort vervangbaar door de gebruiker. Verwachte levensduur tot 1,5 miljoen snijbewegingen.',
    href: 'https://businesslabels.nl/product/autocutter-cw-c4000/',
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
      ? 'bg-amber-500'
      : index === 1
      ? 'bg-amber-400'
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
      <div className="pointer-events-none absolute left-0 top-[8%] h-80 w-80 rounded-full bg-amber-400/10 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-[30%] h-80 w-80 rounded-full bg-blue-400/8 blur-[150px]" />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: 'Kennis', href: '/knowledge' },
              { label: 'Epson CW-C4000 — Preview' },
            ]}
          />
        </div>

        <div className="flex flex-col items-center gap-12 lg:flex-row">
          {/* Left: copy */}
          <div className="flex-1">
            <span className="inline-block rounded-full bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-600 ring-1 ring-amber-200">
              Aangekondigd: 18 januari 2022
            </span>

            <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-neutral-800 sm:text-5xl lg:text-6xl">
              Epson CW-C4000 ColorWorks
            </h1>

            <p className="mt-6 max-w-xl leading-relaxed text-neutral-500">
              Op 18 januari 2022 maakte Epson de komst van de Epson CW-C4000
              ColorWorks wereldkundig. De komst van deze nieuwe reeks was lang
              verwacht maar toch een grote verrassing. Met deze aanvulling groeit het
              aanbod en daarmee de kracht van de Epson ColorWorks printer serie
              opnieuw.
            </p>
            <p className="mt-3 max-w-xl leading-relaxed text-neutral-500">
              Maar wat heeft deze nieuwe kleuren label printer te bieden? Lees het
              verder op deze pagina of bekijk de productpagina van de Epson CW-C4000.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                id="cwc4000-hero-cta"
                href="https://businesslabels.nl/product-categorie/labelprinters/kleuren-labelprinters-nl/desktop-labelprinters-nl/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:bg-amber-600 hover:shadow-amber-500/40 active:scale-[0.98]"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17H3M17 17l-4-4m4 4l-4 4M7 7h14M7 7l4-4M7 7l4 4" />
                </svg>
                Bekijk de productpagina &amp; bestel direct
              </a>

              <Link
                id="cwc4000-hero-contact"
                href="/contact-us/"
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-neutral-700 ring-1 ring-neutral-200 transition-all duration-200 hover:bg-neutral-50 hover:ring-amber-400 active:scale-[0.98]"
              >
                Advies aanvragen
              </Link>
            </div>
          </div>

          {/* Right: printer image */}
          <div className="flex flex-1 items-center justify-center">
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute inset-[-24px] rounded-full bg-amber-400/15 blur-2xl" />
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
            Desktop printer met ongekende afdruk kwaliteit
          </h2>
          <p className="mx-auto mt-6 max-w-3xl leading-relaxed text-neutral-500">
            De Epson CW-C4000 inkjet label printer is een desktop model — compact, bureaugeschikt,
            en ideaal voor kleine tot middelgrote oplagen. Aan de buitenkant doet de printer sterk
            denken aan de{' '}
            <a href="https://businesslabels.nl/printers/epson-colorworks-tm-c3500/" className="font-semibold text-amber-500 underline hover:text-amber-600" target="_blank" rel="noopener noreferrer">
              Epson TM-C3500
            </a>
            , terwijl de techniek aan de binnenkant overeenkomt met de{' '}
            <a href="https://businesslabels.nl/epson_c6000-series/" className="font-semibold text-amber-500 underline hover:text-amber-600" target="_blank" rel="noopener noreferrer">
              Epson CW-C6000 series
            </a>
            . Zo beschikt de CW-C4000 over dezelfde printkop en gelijke afdrukresolutie als de
            C6000 printers — inclusief de keuze uit twee typen zwarte inkt.
          </p>
        </div>
      </section>

      {/* ── Specs + Speed ─────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start">

          {/* Left: spec list */}
          <div className="flex-1 lg:max-w-sm xl:max-w-md">
            <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-800">
              De feiten op een rij
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              Specificaties van de Epson CW-C4000 ColorWorks label printer zoals
              door Epson bekendgemaakt.
            </p>

            <ul className="mt-6 flex flex-col gap-3">
              {SPECS.map((s, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-600 ring-1 ring-neutral-100">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-[10px] font-black">
                    {i + 1}
                  </span>
                  {s.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: speed bars */}
          <div ref={speedRef} className="flex-1">
            <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-800">
              Afdruk snelheid vs. afdruk kwaliteit
            </h2>
            <p className="mt-3 leading-relaxed text-neutral-500">
              Afdruksnelheid en kwaliteit beïnvloeden elkaar. Hoe hoger de kwaliteit,
              hoe lager de snelheid. Bij de stand{' '}
              <strong className="font-semibold text-neutral-700">"Normaal"</strong> is de
              resolutie gelijk aan "Snelheid" maar print de kop 2,5× over het
              materiaal — essentieel voor minder snel drogende materialen zoals glanzend
              label materiaal.
            </p>

            <div className="mt-8 flex flex-col gap-5">
              {SPEED_MODES.map((m, i) => (
                <SpeedBar
                  key={m.label}
                  {...m}
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
                    <th className="px-4 py-3 text-left font-bold text-neutral-700">Instelling</th>
                    <th className="px-4 py-3 text-left font-bold text-neutral-700">Resolutie</th>
                    <th className="px-4 py-3 text-right font-bold text-neutral-700">Snelheid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {SPEED_MODES.map((m) => (
                    <tr key={m.label} className="hover:bg-amber-50/50 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-neutral-700">{m.label}</td>
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
              Dan de eerste vraag die gesteld wordt:
            </h2>
            <p className="mt-2 text-3xl font-black uppercase tracking-tight text-amber-400 sm:text-4xl">
              "Wat gaat dat kosten?"
            </p>
          </div>

          {/* Accessory carousel */}
          <div className="mb-14">
            <AccessoryCarousel />
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {PRICING.map((item) => (
              <a
                key={item.id}
                id={`cwc4000-price-${item.id}`}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-4 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:ring-amber-400/50"
              >
                <p className="text-sm font-bold uppercase tracking-wider text-white/60">
                  {item.title}
                </p>
                <div>
                  <p className="text-3xl font-black text-amber-400">{item.price}</p>
                  <p className="mt-0.5 text-xs text-white/40">{item.note}</p>
                </div>
                <p className="flex-1 text-xs leading-relaxed text-white/60">{item.desc}</p>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 transition-all group-hover:gap-2.5">
                  Bekijk
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── BK vs MK ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-3xl font-black uppercase tracking-tight text-neutral-800 sm:text-4xl">
          De keuze: BK of MK uitvoering?
        </h2>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* BK */}
          <div className="flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-neutral-50 to-white p-8 ring-1 ring-neutral-200 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-black px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
                  BK — Dye Black
                </span>
                <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-neutral-800">
                  CW-C4000 BK
                </h3>
              </div>
              <div className="shrink-0 size-12 rounded-xl bg-neutral-900 flex items-center justify-center">
                <div className="size-5 rounded-full bg-white/90" />
              </div>
            </div>

            <p className="leading-relaxed text-neutral-500">
              De BK uitvoering is de meest universeel inzetbare uitvoering. Voorzien van
              de{' '}
              <strong className="font-semibold text-neutral-700">zwart BK inkt cartridge</strong>
              {' '}— geschikt voor alle soorten inkjet materiaal. Schakel eenvoudig tussen
              glanzende en matte labels.
            </p>
            <p className="leading-relaxed text-neutral-500">
              Op{' '}
              <strong className="font-semibold text-neutral-700">glanzende materialen</strong>{' '}
              presteert de BK uitvoering het best, met scherpe details en diep donkere
              zwarten. Op matte materialen presteert de BK prima maar zijn zwarte
              opdrukken iets minder vol zwart — met name bij grote zwarte vlakken.
            </p>

            <div className="mt-auto">
              <div className="mb-3 flex flex-wrap gap-2">
                {['Glanzende labels', 'Kunststof', 'DIA715', 'DIA725', 'Universeel'].map((tag) => (
                  <span key={tag} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                    {tag}
                  </span>
                ))}
              </div>
              <a
                id="cwc4000-bk-cta"
                href="https://businesslabels.nl/product/colorworks-cw-c4000-bk/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-all duration-200 hover:bg-neutral-700 active:scale-[0.98]"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m1-9l2 9" />
                </svg>
                Bekijken &amp; bestellen — BK
              </a>
            </div>
          </div>

          {/* MK */}
          <div className="flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-amber-50 to-white p-8 ring-1 ring-amber-200 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-amber-500 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
                  MK — Matte Black
                </span>
                <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-neutral-800">
                  CW-C4000 MK
                </h3>
              </div>
              <div className="shrink-0 size-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <div className="size-5 rounded-full bg-neutral-700" />
              </div>
            </div>

            <p className="leading-relaxed text-neutral-500">
              De MK uitvoering is uitgerust met de{' '}
              <strong className="font-semibold text-neutral-700">matte zwart (MK) inkt cartridge</strong>.
              Deze is bij uitstek geschikt voor matte papieren en papieren label materialen.
              De diepzwarte matte kleuren geven een premium uitstraling op mat papier.
            </p>
            <p className="leading-relaxed text-neutral-500">
              Op{' '}
              <strong className="font-semibold text-neutral-700">matte materialen</strong>{' '}
              levert de MK uitvoering superieure zwart-kwaliteit ten opzichte van de BK.
              Op glanzende materialen presteert de MK minder dan de BK versie — kies
              dus bewust op basis van uw primaire labelmateriaal.
            </p>

            <div className="mt-auto">
              <div className="mb-3 flex flex-wrap gap-2">
                {['Matte labels', 'Papier', 'Premium zwart', 'Farmaceutisch'].map((tag) => (
                  <span key={tag} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {tag}
                  </span>
                ))}
              </div>
              <a
                id="cwc4000-mk-cta"
                href="https://businesslabels.nl/product/colorworks-cw-c4000-mk/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-amber-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:bg-amber-600 active:scale-[0.98]"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m1-9l2 9" />
                </svg>
                Bekijken &amp; bestellen — MK
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-r from-amber-500 to-amber-600 py-16">
        <div className="mx-auto max-w-[1440px] px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            Meer informatie of advies nodig?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-amber-100">
            Businesslabels adviseert dagelijks over de aanschaf van label printers en
            materialen. Neem contact op — we helpen u graag de juiste keuze te maken.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              id="cwc4000-cta-contact"
              href="/contact-us/"
              className="inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-amber-600 shadow-lg transition-all duration-200 hover:bg-amber-50 active:scale-[0.98]"
            >
              Neem contact op
            </a>
            <a
              id="cwc4000-cta-product"
              href="https://businesslabels.nl/product-categorie/labelprinters/kleuren-labelprinters-nl/desktop-labelprinters-nl/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-amber-400/30 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white ring-1 ring-white/20 transition-all duration-200 hover:bg-amber-400/50 active:scale-[0.98]"
            >
              Bekijk alle desktop printers
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
