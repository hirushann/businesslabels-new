'use client';

import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Laptop,
  Warehouse,
  Factory,
  PenTool,
  Droplet,
  CheckCircle2,
  Gauge,
  LifeBuoy,
  Puzzle,
  Layers,
  Sparkles,
  Package,
  Truck,
  Headset,
  Award
} from 'lucide-react';

export default function EpsonLabelprintersPageClient() {
  return (
    <div className="bg-white">
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-neutral-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[120px]" />
        
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-8">
            <Breadcrumbs
              items={[
                { label: 'Kennis', href: '/knowledge' },
                { label: 'Epson labelprinters' },
              ]}
            />
          </div>

          <div className="flex flex-col items-center gap-12 lg:flex-row">
            <div className="flex-1">
              <h1 className="text-4xl font-black uppercase tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                Epson labelprinters
              </h1>
              
              <div className="mt-6 flex flex-col gap-4 text-lg leading-relaxed text-neutral-600">
                <p>
                  Als je opzoek bent naar een kleuren labelprinter vind je bij Businesslabels 
                  de Epson labelprinters. Al sinds 2014 heeft Businesslabels als onderdeel van 
                  Smart2B B.V. een vergaande samenwerking met Epson. De Epson labelprinters 
                  bepalen dan ook een groot deel van het assortiment van Businesslabels.
                </p>
                <p>
                  Maar waarom zou je moeten kiezen voor een Epson ColorWorks labelprinter? 
                  Wat maakt een labelprinter van Epson uniek? Welke modellen zijn er op de markt 
                  en hoe kies je het juiste model uit de Epson ColorWorks serie?
                </p>
                <p>
                  Als eerste begint dat bij een goed, passend en gedegen advies op maat. Maar ook 
                  met het lezen van informatie over de printers kom je al snel een heel eind.
                </p>
              </div>

              <div className="mt-8">
                <a
                  href="https://businesslabels.nl/brand/epson-nl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-brand/25 transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-brand/40"
                >
                  Alle Epson producten bekijken
                </a>
              </div>
            </div>

            <div className="flex-1">
              <img
                src="https://businesslabels.nl/wp-content/uploads/2021/08/Epson-label-printers-ColorWorks-series-1.png"
                alt="Epson labelprinter lineup"
                className="w-full max-w-[600px] object-contain drop-shadow-xl"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Categorieën Intro ─────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[900px] text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-neutral-900 sm:text-4xl">
            De Epson labelprinters in 3 categorieën
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-neutral-600">
            Net als de traditionele thermische labelprinters, kun je ook de Epson labelprinters 
            opdelen in 3 categorieën of segmenten. Het verschil is bij Epson printers echter iets 
            anders. De opdeling wordt ook gebruikt voor de categorisering in de webshop van 
            Businesslabels onder de "Kleuren labelprinters". Het begrijpen van deze segmenten 
            kan het zoeken en kiezen van een passende printer een stuk eenvoudiger maken. Voor 
            passend advies <Link href="/contact-us/" className="font-semibold text-brand underline hover:text-brand">neem je eenvoudig contact op</Link>.
          </p>
        </div>
      </section>

      {/* ── Categorieën Grid ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          
          {/* Desktop */}
          <div className="group flex flex-col items-center rounded-3xl bg-neutral-50 p-8 text-center ring-1 ring-neutral-100 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:ring-amber-200">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
              <Laptop className="h-8 w-8" strokeWidth={2} />
            </div>
            <h3 className="mt-6 text-2xl font-black uppercase tracking-tight text-neutral-900">
              Desktop
            </h3>
            <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-neutral-600">
              <p>Desktop kleuren labelprinters zijn de instapmodellen onder de Epson labelprinters.</p>
              <p>Het zijn compacte printers die eenvoudig op een bureau passen. Door o.a. deze compacte vormgeving zijn ze uiterst flexibel inzetbaar.</p>
              <p>Naast de fysieke eigenschappen ligt de printsnelheid wat lager dan bij andere modellen. De resolutie van bijv. de <a href="https://businesslabels.nl/product/colorworks-tm-c3500/" className="font-semibold text-brand hover:underline">Epson C3500</a> is afgestemd op deze basisbehoefte.</p>
            </div>
          </div>

          {/* Midrange */}
          <div className="group flex flex-col items-center rounded-3xl bg-neutral-50 p-8 text-center ring-1 ring-neutral-100 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:ring-amber-200">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-brand transition-transform group-hover:scale-110">
              <Warehouse className="h-8 w-8" strokeWidth={2} />
            </div>
            <h3 className="mt-6 text-2xl font-black uppercase tracking-tight text-neutral-900">
              Midrange
            </h3>
            <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-neutral-600">
              <p>Midrange kleuren labelprinters vallen zoals het woord al zegt in het midden segment.</p>
              <p>Sinds de komst van de <a href="https://businesslabels.nl/epson_c6000-series/" className="font-semibold text-brand hover:underline">Epson C6000 series</a> is dit het meest verkochte segment. Ze combineren betaalbaarheid met naadloze schaalbaarheid.</p>
              <p>Midrange printers zijn in vele soorten en maten verkrijgbaar en de keuze tussen de verschillende modellen is hier het grootst.</p>
            </div>
          </div>

          {/* Industrieel */}
          <div className="group flex flex-col items-center rounded-3xl bg-neutral-50 p-8 text-center ring-1 ring-neutral-100 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:ring-amber-200">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-white transition-transform group-hover:scale-110">
              <Factory className="h-8 w-8" strokeWidth={2} />
            </div>
            <h3 className="mt-6 text-2xl font-black uppercase tracking-tight text-neutral-900">
              Industrieel
            </h3>
            <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-neutral-600">
              <p>Industriële kleuren labelprinters zijn de echte krachtpatsers onder de labelprinters.</p>
              <p>Ze onderscheiden zich voornamelijk door een enorm hoge printsnelheid. Zo print een <a href="https://businesslabels.nl/product/colorworks-tm-c7500/" className="font-semibold text-brand hover:underline">Epson C7500</a> met een snelheid van maar liefst 30cm per seconde zonder in te leveren op kwaliteit.</p>
              <p>De Epson labelprinters uit dit segment zijn speciaal gebouwd als onvermoeibare productie machines.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── Geschiedenis Quote ────────────────────────────────────────────────── */}
      <section className="bg-neutral-900 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-10 md:flex-row md:items-start">
            <div className="shrink-0">
              <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-neutral-800 bg-white">
                <img 
                  src="https://businesslabels.nl/wp-content/uploads/2020/06/Epson-ColorWorks-C3400.png"
                  alt="Epson ColorWorks TM-C3400"
                  className="h-full w-full object-contain p-4"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <svg className="mx-auto mb-4 h-10 w-10 text-brand/50 md:mx-0" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
              </svg>
              <p className="text-lg italic leading-relaxed text-neutral-300">
                De Epson TM-C3400 was de eerste Epson labelprinter uit de ColorWorks series. Met de introductie van deze Epson Desktop kleuren labelprinter zette Epson de eerste stap naar het aanbieden van kleuren labelprinters. In 2014 werd de opvolger, de Epson TM-C3500, geïntroduceerd. De Epson C3500 labelprinter is een sterk verbeterde versie van de Epson C3400. Van de vele technische verschillen is de meest zichtbare verbetering de 4 losse cartridges. Hierdoor zijn de gemiddelde printkosten sterk verlaagd.
              </p>
              <div className="mt-6">
                <p className="font-black uppercase tracking-wider text-white">Epson ColorWorks TM-C3400</p>
                <p className="text-sm text-neutral-500">De eerste Epson ColorWorks labelprinter</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Waarom Epson? ─────────────────────────────────────────────────────── */}
      <section className="bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mx-auto max-w-[900px] text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-neutral-900 sm:text-4xl">
              Waarom kiezen voor een Epson labelprinter?
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              Er zijn vele soorten en verschillende merken labelprinters. Bij Businesslabels bieden we 
              labelprinters aan van hoge kwaliteit. De Epson labelprinter behoort tot een hoogwaardige printer. 
              Deze printer heeft verschillende specificaties die de printer zo uniek maken. Maar waarom 
              adviseren wij de Epson labelprinter?
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* 1 */}
            <div className="flex flex-col">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-brand">
                <PenTool className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Eigen techniek</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-neutral-600">
                <p>Voor alle printers die Epson produceert heeft Epson de techniek zelf ontwikkeld.</p>
                <p>Voor de Epson kleuren labelprinters is een unieke en geheel nieuwe printkop technologie ontwikkeld, die tevens in grootformaat en kantoorprinters wordt toegepast.</p>
              </div>
            </div>

            {/* 2 */}
            <div className="flex flex-col">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                <Droplet className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Epson inkten</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-neutral-600">
                <p>De pigment inkten die gebruikt worden zorgen voor een zeer duurzame afdruk: water, alcohol, aceton of Uv-licht vormen geen probleem.</p>
                <p>De inktkosten per afdruk zijn bovendien tot wel 60% lager dan die van concurrerende merken.</p>
              </div>
            </div>

            {/* 3 */}
            <div className="flex flex-col">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Betrouwbaar</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-neutral-600">
                <p>De Epson labelprinters zijn uitermate betrouwbaar, mede door de speciale piëzo printkop technologie die zorgt voor het onderhoud van de printkoppen.</p>
                <p>Mede hierdoor hoeft de printkop van een Epson labelprinter vrijwel nooit vervangen te worden.</p>
              </div>
            </div>

            {/* 4 */}
            <div className="flex flex-col">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <Gauge className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Extreem snel</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-neutral-600">
                <p>Voor toepassingen waarbij snelheid van groot belang is zijn er de TM-C7500 modellen.</p>
                <p>Deze zijn in staat om met een snelheid van 30 cm per seconde labels in kleur te printen, zonder in te leveren op fotorealistische afdrukkwaliteit.</p>
              </div>
            </div>

            {/* 5 */}
            <div className="flex flex-col">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <LifeBuoy className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Garantie &amp; ondersteuning</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-neutral-600">
                <p>Hoe betrouwbaar ook, er kan altijd iets mis gaan. Gelukkig kunt u bij ons altijd bellen zodat we het probleem meestal direct samen op kunnen lossen.</p>
                <p>Voor veel modellen komt er binnen de garantie zelfs een Epson monteur ter plaatse.</p>
              </div>
            </div>

            {/* 6 */}
            <div className="flex flex-col">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Puzzle className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Integratie mogelijkheden</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-neutral-600">
                <p>Uiteraard zijn alle modellen voorzien van complete Windows drivers, maar ook Mac en Linux worden ondersteund bij o.a. de C6000 series.</p>
                <p>Daarnaast is er volledige integratie in SAP mogelijk en is de ESC/Label programmeertaal beschikbaar.</p>
              </div>
            </div>

            {/* 7 */}
            <div className="flex flex-col">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Layers className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Ruime model keuze</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-neutral-600">
                <p>Epson labelprinters worden aangeboden in verschillende uitvoeringen. Vanaf een instap model tot een industriële krachtpatser.</p>
                <p>Zo biedt Epson voor vrijwel iedere toepassing een passende labelprinter.</p>
              </div>
            </div>

            {/* 8 */}
            <div className="flex flex-col">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Sparkles className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Onderhoudsvrij</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-neutral-600">
                <p>De Epson labelprinters doen hun eigen onderhoud. De gebruiker heeft hier dus vrijwel geen omkijken naar.</p>
                <p>Zolang de omgeving en de printer netjes stofvrij gehouden worden, doet de printer zelf de rest. Onbezorgd labels printen.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Support Quote ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 py-20 text-white">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-[100px]" />
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-10 md:flex-row md:items-start">
            <div className="shrink-0">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-brand shadow-xl">
                <Headset className="h-10 w-10" strokeWidth={2} />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-xl font-medium leading-relaxed">
                "Zolang de labelprinter goed werkt is alles fantastisch. Maar wat als de Epson labelprinter besluit om vervelend te gaan doen? Storingen zijn heel vervelend, zeker omdat het altijd gebeurt als het net even niet uitkomt. Voor klanten van Businesslabels is de oplossing eenvoudig want support is gratis. Dus even bellen of mailen en het probleem wordt samen doorgelopen en vaak opgelost. Gratis support is slechts 1 van de vele voordelen als je de Epson labelprinters bij Businesslabels koopt!"
              </p>
              <div className="mt-8">
                <Link href="/support-2/" className="inline-block rounded-full bg-neutral-900 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg">
                  Gratis support via Businesslabels
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Garantie & Coverplus ────────────────────────────────────────────── */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mx-auto max-w-[900px] text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-neutral-900 sm:text-4xl">
              Epson standaard garantie en Coverplus
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              Aanvullend op onze gratis service op afstand, hebben Epson printers standaard 1 jaar garantie. 
              Afhankelijk van het model en de toepassing kan er gekozen worden voor diverse Epson 
              Coverplus pakketten voor het uitbreiden van de garantie tot wel 5 jaar.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* RTB */}
            <div className="flex flex-col items-center rounded-3xl bg-neutral-50 p-8 text-center ring-1 ring-neutral-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200">
                <Package className="h-7 w-7" strokeWidth={2} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">Return to base (RTB)</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                Voor de desktop printers wordt standaard gewerkt met RTB garantie. Dit houdt in dat de printer teruggestuurd moet worden indien reparatie noodzakelijk is. Dit is kostenefficiënt en goed te versturen met standaard pakketdiensten.
              </p>
            </div>

            {/* Onsite */}
            <div className="flex flex-col items-center rounded-3xl bg-neutral-50 p-8 text-center ring-1 ring-neutral-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200">
                <Truck className="h-7 w-7" strokeWidth={2} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">Onsite Service (OS)</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                Voor zwaardere printers komt er een service monteur langs om de printer ter plaatse te repareren. Mocht dit niet lukken, wordt deze vaak omgewisseld ("Onsite Swap" zoals bij de C7500).
              </p>
            </div>

            {/* Garantie afhandeling */}
            <div className="flex flex-col items-center rounded-3xl bg-neutral-50 p-8 text-center ring-1 ring-neutral-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200">
                <Headset className="h-7 w-7" strokeWidth={2} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">Garantie afhandeling</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                Als de printer weigert, belt u ons. We lopen mogelijke oorzaken door, en sluiten gebruikersfouten uit. Helpt dit niet, dan verzorgen wij de melding bij Epson om de garantie soepel in gang te zetten.
              </p>
            </div>

            {/* Coverplus */}
            <div className="flex flex-col items-center rounded-3xl bg-neutral-50 p-8 text-center ring-1 ring-neutral-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand shadow-sm ring-1 ring-neutral-200">
                <Award className="h-7 w-7" strokeWidth={2} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">Epson Coverplus</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                Stilstand kan kostbaar zijn. Met Coverplus pakketten kan de garantietermijn (zowel RTB als OS) verlengd worden tot 5 jaar. Dit biedt ultieme zekerheid in vitale bedrijfsprocessen.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Conclusion / CTA ──────────────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 bg-neutral-50 px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900 sm:text-3xl">
            De kracht van kleur in uw productie
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-neutral-600">
            Het afdrukken van labels in kleur heeft vele voordelen. De meest voor de hand liggende is 
            het printen van variabele informatie in kleur, direct op het moment van printen. 
            Dit voorkomt gigantische voorraden van voorgedrukte etiketten en biedt ultieme flexibiliteit.
          </p>
          <div className="mt-8">
            <Link 
              href="/contact-us/"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-brand/25 transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-brand/40"
            >
              Neem contact op voor advies
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
