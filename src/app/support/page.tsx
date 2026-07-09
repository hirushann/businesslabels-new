import React from 'react';
import Link from 'next/link';
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
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useTranslations } from 'next-intl';
import { OpeningStatus } from "@/components/OpeningStatus";
import CTABanner from "@/components/CTABanner";

export default function SupportPage() {
  const t = useTranslations('supportPage');
  return (
    <div className="relative bg-white min-h-screen font-sans overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[120px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute top-[40%] left-0 w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-[120px] pointer-events-none transform -translate-x-1/3" />

      {/* Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-0 py-12 relative z-10 flex flex-col gap-10">
        
        {/* HERO SECTION */}
        <section className="relative rounded-2xl overflow-hidden shadow-xl bg-slate-900 min-h-[340px] flex flex-col justify-center px-10 sm:px-16">
          {/* Background Image Setup */}
          <div className="absolute inset-0 bg-[url('/find_the_right_printer.jpeg')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/90 via-neutral-900/60 to-transparent"></div>
          
          <div className="relative z-10 max-w-4xl pt-6">
            {/* Breadcrumbs inside Hero */}
            <div className="flex items-center gap-2 text-white/80 text-sm font-medium mb-6">
              <Home className="w-4 h-4" />
              <span>/</span>
              <span>{t('breadcrumbSupport')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 text-white">
              {t('heroTitle')}
            </h1>
            <p className="text-lg text-slate-200 leading-relaxed max-w-3xl">
              {t('heroDesc')}
            </p>
          </div>
        </section>

        {/* CONTACT CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300">
            <Phone className="w-14 h-14 text-neutral-500 mb-6" strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-slate-800 mb-4">{t('callTitle')}</h3>
            <a href="tel:+31318590465" className="text-lg font-semibold text-slate-700 hover:text-sky-600 mb-2 transition-colors">+31 (0)318 590 465</a>
            <OpeningStatus />
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300">
            <Mail className="w-14 h-14 text-neutral-500 mb-6" strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-slate-800 mb-4">{t('emailTitle')}</h3>
            <a href="mailto:verkoop@businesslabels.nl" className="text-lg font-semibold text-slate-700 hover:text-sky-600 mb-2 transition-colors">verkoop@businesslabels.nl</a>
            <p className="text-sm text-slate-400 font-medium">{t('emailTime')}</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300">
            <Monitor className="w-14 h-14 text-neutral-500 mb-6" strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-slate-800 mb-4">{t('remoteSupportTitle')}</h3>
            <a href="https://download.teamviewer.com/download/TeamViewerQS.exe" target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-amber-500 hover:text-amber-600 mb-2 flex items-center gap-2 justify-center transition-colors">
              <Download className="w-5 h-5" /> {t('downloadTeamViewer')}
            </a>
            <p className="text-sm text-slate-400 font-medium">{t('scheduledAfterContact')}</p>
          </div>
        </section>

        {/* FREE SUPPORT BANNER */}
        <section>
          <div className="bg-[#fffdf8] border border-orange-100 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_4px_20px_-4px_rgba(255,165,0,0.05)]">
            <div className="max-w-3xl">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                GRATIS Hulp op afstand voor vaste klanten (Fair use)
              </h3>
              <p className="text-slate-600 font-medium">
                Als bedankje voor uw voortdurende samenwerking genieten vaste klanten van GRATIS Hulp op afstand via TeamViewer.
              </p>
            </div>
            {/* Custom TeamViewer Logo mimicking the image */}
            <div className="shrink-0 flex items-center gap-3">
               <div className="w-12 h-12 bg-[#0060C5] rounded-lg flex items-center justify-center relative overflow-hidden">
                 <div className="flex items-center justify-center relative z-10 w-full h-full">
                    <ArrowRight className="w-6 h-6 text-white absolute ml-1.5" strokeWidth={3} />
                    <ArrowRight className="w-6 h-6 text-white absolute -ml-1.5 rotate-180" strokeWidth={3} />
                 </div>
                 <div className="absolute inset-0 border-2 border-[#0060C5] rounded-lg opacity-50 bg-white m-[2px]" />
                 <div className="absolute inset-0 bg-[#0060C5] rounded-full m-[4px]" />
               </div>
               <span className="text-[#0060C5] text-[28px] font-bold tracking-tight font-sans">TeamViewer</span>
            </div>
          </div>
        </section>

        {/* KNOWLEDGE BASE BANNER */}
        <section>
          <div className="bg-[#f8f9fa] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-3xl">
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                Probeer eerst de Kennisbank
              </h3>
              <p className="text-slate-500 text-sm">
                Voor de meeste veelvoorkomende problemen is een oplossing gedocumenteerd. Zoek in onze handleidingen voordat u belt — dat is sneller.
              </p>
            </div>
            <Link href="/knowledge" className="shrink-0 bg-[#ea7a0e] hover:bg-[#d66e0a] text-white px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> {t('searchKnowledgeBase')}
            </Link>
          </div>
        </section>

        {/* SERVICES & PRICING */}
        <section className="flex flex-col gap-6 mt-4">
          <div>
            <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight">{t('servicesPricingTitle')}</h2>
          </div>

          <div className="flex flex-col gap-4">
            {/* Service Item */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex-1 lg:max-w-[420px]">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0"><Monitor className="w-5 h-5"/></div>
                  <h3 className="text-lg font-bold text-slate-800">{t('remotePrinterSupportTitle')}</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed ml-14">{t('remotePrinterSupportDesc')}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 font-medium mb-1">{t('idealFor')}</div>
                <p className="text-sm text-slate-700 font-semibold leading-relaxed">{t.rich('remotePrinterSupportIdeal', { br: () => <br /> })}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="lg:w-48 lg:text-right w-full pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-2xl font-bold text-orange-500">€100 <span className="text-xl font-semibold text-orange-500/70">/ uur</span></div>
                <div className="text-xs text-slate-400 mt-1 font-medium">{t('billedHourly')}</div>
              </div>
            </div>

            {/* Service Item */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex-1 lg:max-w-[420px]">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0"><Settings className="w-5 h-5"/></div>
                  <h3 className="text-lg font-bold text-slate-800">{t('remoteSoftwareSupportTitle')}</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed ml-14">{t('remoteSoftwareSupportDesc')}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 font-medium mb-1">Ideaal voor</div>
                <p className="text-sm text-slate-700 font-semibold leading-relaxed">{t.rich('remoteSoftwareSupportIdeal', { br: () => <br /> })}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="lg:w-48 lg:text-right w-full pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-2xl font-bold text-orange-500">€120 <span className="text-xl font-semibold text-orange-500/70">/ uur</span></div>
                <div className="text-xs text-slate-400 mt-1 font-medium">per uur gefactureerd, excl. btw</div>
              </div>
            </div>

            {/* Service Item */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex-1 lg:max-w-[420px]">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0"><Printer className="w-5 h-5"/></div>
                  <h3 className="text-lg font-bold text-slate-800">{t('hardwareRepairTitle')}</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed ml-14">{t('hardwareRepairDesc')}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 font-medium mb-1">Ideaal voor</div>
                <p className="text-sm text-slate-700 font-semibold leading-relaxed">{t.rich('hardwareRepairIdeal', { br: () => <br /> })}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="lg:w-48 lg:text-right w-full pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-2xl font-bold text-orange-500">€100 <span className="text-xl font-semibold text-orange-500/70">/ uur</span></div>
                <div className="text-xs text-slate-400 mt-1 font-medium">per uur gefactureerd, excl. btw</div>
              </div>
            </div>

            {/* Service Item */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex-1 lg:max-w-[420px]">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0"><Package className="w-5 h-5"/></div>
                  <h3 className="text-lg font-bold text-slate-800">{t('onSiteServiceTitle')}</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed ml-14">{t('onSiteServiceDesc')}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 font-medium mb-1">Ideaal voor</div>
                <p className="text-sm text-slate-700 font-semibold leading-relaxed">{t.rich('onSiteServiceIdeal', { br: () => <br /> })}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="lg:w-48 lg:text-right w-full pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-2xl font-bold text-orange-500">€145 <span className="text-xl font-semibold text-orange-500/70">/ uur</span></div>
                <div className="text-xs text-slate-400 mt-1 font-medium">{t('exclTravelCosts')}</div>
              </div>
            </div>

            {/* Service Item */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex-1 lg:max-w-[420px]">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5"/></div>
                  <h3 className="text-lg font-bold text-slate-800">{t('loanEquipmentTitle')}</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed ml-14">{t('loanEquipmentDesc')}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 font-medium mb-1">Ideaal voor</div>
                <p className="text-sm text-slate-700 font-semibold leading-relaxed">{t.rich('loanEquipmentIdeal', { br: () => <br /> })}</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100"></div>
              <div className="lg:w-48 lg:text-right w-full pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-2xl font-bold text-slate-800">{t('onRequest')}</div>
                <div className="text-xs text-slate-400 mt-1 font-medium">{t('availabilityVaries')}</div>
              </div>
            </div>

          </div>
          
          <p className="text-sm text-slate-400 font-medium mt-4 leading-relaxed max-w-4xl">
            Alle prijzen zijn exclusief btw. Ondersteuning is beschikbaar voor printers aangeschaft via BusinessLabels. Windows-systemen worden voor standaardvragen doorgaans zonder extra kosten gedekt. Andere besturingssystemen hebben mogelijk beperkte of betaalde ondersteuning. Service op locatie is exclusief reiskosten.
          </p>
        </section>
      </div>

      {/* FULL WIDTH LOWER SECTION */}
      <section className="bg-slate-50/50 border-t border-slate-100 py-24 relative z-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-24">
          
          {/* Top Row: What We Help With */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 pr-0 lg:pr-12">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">{t('whatWeHelpWithTitle')}</h2>
              <ul className="space-y-5">
                {[
                  "Printer wordt niet herkend door computer of software",
                  "Onjuiste kleuren of onverwachte printuitvoer",
                  "Banding, strepen of slechte printkwaliteit",
                  "Installatie en configuratie van stuurprogramma's",
                  "Mediatype-instellingen en ICC-profiel configuratie",
                  "NiceLabel, Bartender of andere labelsoftware",
                  "Netwerkprinter connectiviteitsproblemen"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" strokeWidth={1.5} />
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
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">{t('howRemoteWorksTitle')}</h2>
              <div className="space-y-6">
                {[
                  "U neemt telefonisch of per e-mail contact met ons op en omschrijft het probleem.",
                  "We plannen een TeamViewer-sessie op een moment dat het u uitkomt.",
                  "U installeert TeamViewer QuickSupport — geen account nodig.",
                  "We maken verbinding, bekijken uw scherm en nemen samen de instellingen door."
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="text-slate-400 font-medium shrink-0 pt-0.5 w-6">
                      0{idx + 1}.
                    </div>
                    <p className="text-[15px] text-slate-600 font-medium">{item}</p>
                  </div>
                ))}
                
                <div className="pt-6">
                  <a href="https://download.teamviewer.com/download/TeamViewerQS.exe" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-orange-500 font-bold hover:text-orange-600 transition-colors text-[15px] underline underline-offset-4 decoration-orange-500/30 hover:decoration-orange-500">
                    <Download className="w-5 h-5" /> {t('downloadTeamViewerQuickSupport')}
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
