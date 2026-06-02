import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("menus.resources.knowledgeTitle")} — Businesslabels`,
    description: t("menus.resources.knowledgeDesc"),
  };
}

const KNOWLEDGE_ARTICLES = [
  {
    title: "Labels+Kleur = Geweldig!",
    description: "Waarom zelf kleurenlabels printen geweldig is! We gaan je hier alles over uitleggen. Welke opties zijn er, waar moet je op letten en de verschillen die je kan maken als je labels zelf in kleur print.",
    href: "#",
  },
  {
    title: "Waarom Epson?",
    description: "Sinds 2014 zijn we trotse partner van Epson ColorWorks maar het gaat bij ons verder dan dat. Omdat we kleur “ademen” bij Businesslabels zie je bij ons in het bedrijf veel Epson voorbij komen.",
    href: "#",
  },
  {
    title: "Goedkope inkt, wel of niet?",
    description: "Goedkope inkt klinkt heel verleidelijk, want printen met een inkjet printer is vooral duur door de inkt. Maar is dat wel echt zo? Wat klopt wel en wat klopt niet. En waarom is het wel of juist niet verstandig?",
    href: "#",
  },
  {
    title: "ICC profielen voor kleur",
    description: "De juiste kleur uit je printer krijgen is een behoorlijke uitdaging. Maar met de Epson ondersteuning voor ICC profielen wordt dit een stuk makkelijker. Wat een ICC profiel is, hoe je deze gebruikt en meer.",
    href: "#",
  },
  {
    title: "Epson CoverPlus",
    description: "Alle Epson ColorWorks labelprinters zijn standaard voorzien van 1 jaar garantie. Maar wat als je meer zekerheid zoekt? In die gevallen bied Epson de CoverPlus pakketten. Hoe dat werkt en wat het dekt lees je hier.",
    href: "#",
  },
  {
    title: "Printer problemen?",
    description: "Problemen met het printen van uw labels? Businesslabels bied voor haar klanten de gratis support aan! Tijdens kantoor uren staat ons support team klaar om u op afstand snel en efficiënt te helpen.",
    href: "#",
  },
  {
    title: "Bezoeker badges maken",
    description: "Bezoekersbadges maken is niet moeilijk. Zowel vooraf als live zijn deze gemakkelijk zelf in kleur te printen. Met de producten van ExpoBadge en de Epson TM-C3500 kleurenlabel printers.",
    href: "#",
  },
  {
    title: "De nieuwe Epson CW-C4000",
    description: "In januari 2022 heeft Epson de nieuwe Epson CW-C4000 aangekondigd. Wat gaat deze nieuwe printer ons bieden? Welke mogelijkheden heeft deze Epson CW-C4000? Businesslabels zocht het uit.",
    href: "#",
  },
  {
    title: "Epson labelprinters",
    description: "Businesslabels bied voor het printen van labels in kleur de Epson labelprinters uit de Colorworks series aan. Waarom zou je voor een Epson label printer moeten kiezen en waar moet je op letten?",
    href: "#",
  },
  {
    title: "Epson nieuws",
    description: "Lees hier het persbericht van Epson aangaande de aankondiging van de Epson CW-C4000. Epson lanceert een nieuwe Epson ColorWorks printer. Het wat en waarom lees je hier.",
    href: "#",
  },
  {
    title: "Zelf badges bedrukken",
    description: "Staat uw evenement binnenkort op de planning en wilt u uw eigen badges bedrukken? Dat kan met de ExpoBadges van Diamondlabels! Dankzij de ExpoBadges kunt u heel gemakkelijk en snel labels printen.",
    href: "#",
  },
  {
    title: "Verzendetiketten printen",
    description: "Bent u op zoek naar verzendetiketten? Dan is Businesslabels uw juiste partner. Bijna iedere pakketdienst en andere logistieke organisaties gebruiken verzendetiketten voor het versturen van pakketten.",
    href: "#",
  },
  {
    title: "Bieretiketten",
    description: "Bierbrouwen vraagt veel aandacht, geduld en passie. Bierbrouwen begint vaak als hobby en groeit dan uit tot meer. Wanneer de hobby over gaat in commercieel bierbrouwen, komen de flesjes in de winkelschappen.",
    href: "#",
  },
  {
    title: "GHS labels printen",
    description: "Verpakt uw bedrijf chemische producten? Of wordt er veel gewerkt met chemische stoffen? Dan bent u veelal verplicht om goedgekeurde GHS etiketten te gebruiken. Hoe u deze print leest u hier.",
    href: "#",
  },
  {
    title: "Verzendetiketten zonder problemen",
    description: "Bij het printen van verzendetiketten gaat er nog wel eens wat verkeerd. Problemen met de afdruk kwaliteit? Of weten welk verzendetiket u nodig heeft? Businesslabels legt het uit!",
    href: "#",
  },
  {
    title: "Kaartprinter voor evenementen",
    description: "Gaat u een evenement organiseren en heeft u een kaartprinter nodig om al uw gasten van een badge te voorzien? Businesslabels heeft de badge printer die u zoekt! De ExpoBadge printers.",
    href: "#",
  },
  {
    title: "Nicelabel, software op maat",
    description: "Voor het automatiseren van label print processen of het “gewoon” eenvoudig printen van labels kan Businesslabels helpen door het bieden van complete maatwerk oplossingen. Hiervoor wordt NiceLabel gebruikt.",
    href: "#",
  },
  {
    title: "Waarom zelf printen in kleur?",
    description: "Een kleurenlabelprinter wordt met de dag meer gebruikt. Waar voorheen de labels veelal voorgedrukt werden door de drukker, worden ze meer en meer zelf geprint.",
    href: "#",
  }
];

export default async function KnowledgeBaseArchive() {
  const t = await getTranslations();

  return (
    <div className="relative min-h-screen bg-[#fafbfe]">
      <section className="relative mx-auto max-w-360 px-4 pt-12 pb-24 sm:px-6 lg:px-8">
        <div className="mb-10">
          <Breadcrumbs
            className="text-slate-500"
            items={[{ label: t("menus.resources.knowledgeTitle") }]}
          />
        </div>

        <div className="rounded-[32px] bg-white p-8 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.18)] ring-1 ring-slate-100 sm:p-12">
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
                {t("faqPage.browseByTopic")}
              </span>
              <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900 sm:text-4xl">
                {t("menus.resources.knowledgeTitle")}
              </h1>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {KNOWLEDGE_ARTICLES.map((article, index) => (
              <Link
                key={index}
                href={article.href}
                className="group flex flex-col overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-12px_rgba(241,136,0,0.25)] hover:ring-amber-200"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-50 border-b border-slate-100">
                  <div className="flex h-full w-full items-center justify-center text-slate-200 transition-transform duration-500 group-hover:scale-105 group-hover:text-amber-100">
                    <BookOpen className="h-16 w-16" />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 transition-colors group-hover:text-amber-600">
                    {article.title}
                  </h2>
                  
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">
                    {article.description}
                  </p>

                  <div className="mt-auto pt-6">
                    <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-600 transition-colors group-hover:text-amber-700">
                      {t("common.readArticle")}
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 transition-transform group-hover:translate-x-1 group-hover:bg-amber-200">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
