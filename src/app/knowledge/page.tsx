import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  ChevronRight,
  BookOpen,
  Palette,
  Printer,
  Droplet,
  ShieldCheck,
  LifeBuoy,
  IdCard,
  Newspaper,
  Package,
  Beer,
  FlaskConical,
  PackageCheck,
  Ticket,
  Settings,
  Tag,
  PenTool,
  Headset,
  RotateCw,
  Wine,
  Factory,
  Leaf
} from "lucide-react";
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
    href: "/waarom-zelf-kleurenlabels-printen-geweldig-is",
    icon: Palette,
  },
  {
    title: "Waarom Epson?",
    description: "Sinds 2014 zijn we trotse partner van Epson ColorWorks maar het gaat bij ons verder dan dat. Omdat we kleur “ademen” bij Businesslabels zie je bij ons in het bedrijf veel Epson voorbij komen.",
    href: "/waarom-epson-colorworks",
    icon: Printer,
  },
  {
    title: "Goedkope inkt, wel of niet?",
    description: "Goedkope inkt klinkt heel verleidelijk, want printen met een inkjet printer is vooral duur door de inkt. Maar is dat wel echt zo? Wat klopt wel en wat klopt niet. En waarom is het wel of juist niet verstandig?",
    href: "/goedkope-inkt-blijkt-kostbaar",
    icon: Droplet,
  },
  {
    title: "ICC profielen voor kleur",
    description: "De juiste kleur uit je printer krijgen is een behoorlijke uitdaging. Maar met de Epson ondersteuning voor ICC profielen wordt dit een stuk makkelijker. Wat een ICC profiel is, hoe je deze gebruikt en meer.",
    href: "/epson-colorworks-icm-kleurprofielen/",
    icon: Palette,
  },
  {
    title: "Epson CoverPlus",
    description: "Alle Epson ColorWorks labelprinters zijn standaard voorzien van 1 jaar garantie. Maar wat als je meer zekerheid zoekt? In die gevallen bied Epson de CoverPlus pakketten. Hoe dat werkt en wat het dekt lees je hier.",
    href: "/epson-coverplus",
    icon: ShieldCheck,
  },
  {
    title: "Printer problemen?",
    description: "Problemen met het printen van uw labels? Businesslabels bied voor haar klanten de gratis support aan! Tijdens kantoor uren staat ons support team klaar om u op afstand snel en efficiënt te helpen.",
    href: "/support/",
    icon: LifeBuoy,
  },
  {
    title: "Bezoeker badges maken",
    description: "Bezoekersbadges maken is niet moeilijk. Zowel vooraf als live zijn deze gemakkelijk zelf in kleur te printen. Met de producten van ExpoBadge en de Epson TM-C3500 kleurenlabel printers.",
    href: "/badge-maken/",
    icon: IdCard,
  },
  {
    title: "De nieuwe Epson CW-C4000",
    description: "In januari 2022 heeft Epson de nieuwe Epson CW-C4000 aangekondigd. Wat gaat deze nieuwe printer ons bieden? Welke mogelijkheden heeft deze Epson CW-C4000? Businesslabels zocht het uit.",
    href: "/epson-cw-c4000-printer-preview/",
    icon: Printer,
  },
  {
    title: "Epson labelprinters",
    description: "Businesslabels bied voor het printen van labels in kleur de Epson labelprinters uit de Colorworks series aan. Waarom zou je voor een Epson label printer moeten kiezen en waar moet je op letten?",
    href: "/epson-colorworks-labelprinters/",
    icon: Printer,
  },
  {
    title: "Epson nieuws",
    description: "Lees hier het persbericht van Epson aangaande de aankondiging van de Epson CW-C4000. Epson lanceert een nieuwe Epson ColorWorks printer. Het wat en waarom lees je hier.",
    href: "/news-cw-c4000-announced-epson/",
    icon: Newspaper,
  },
  {
    title: "Zelf badges bedrukken",
    description: "Staat uw evenement binnenkort op de planning en wilt u uw eigen badges bedrukken? Dat kan met de ExpoBadges van Diamondlabels! Dankzij de ExpoBadges kunt u heel gemakkelijk en snel labels printen.",
    href: "/zelf-uw-badges-bedrukken-tijdens-uw-evenement/",
    icon: IdCard,
  },
  {
    title: "Verzendetiketten printen",
    description: "Bent u op zoek naar verzendetiketten? Dan is Businesslabels uw juiste partner. Bijna iedere pakketdienst en andere logistieke organisaties gebruiken verzendetiketten voor het versturen van pakketten.",
    href: "/verzend-etiketten/",
    icon: Package,
  },
  {
    title: "Bieretiketten",
    description: "Bierbrouwen vraagt veel aandacht, geduld en passie. Bierbrouwen begint vaak als hobby en groeit dan uit tot meer. Wanneer de hobby over gaat in commercieel bierbrouwen, komen de flesjes in de winkelschappen.",
    href: "/bierfles-labels-printen/",
    icon: Beer,
  },
  {
    title: "GHS labels printen",
    description: "Verpakt uw bedrijf chemische producten? Of wordt er veel gewerkt met chemische stoffen? Dan bent u veelal verplicht om goedgekeurde GHS etiketten te gebruiken. Hoe u deze print leest u hier.",
    href: "/ghs-labels/",
    icon: FlaskConical,
  },
  {
    title: "Verzendetiketten zonder problemen",
    description: "Bij het printen van verzendetiketten gaat er nog wel eens wat verkeerd. Problemen met de afdruk kwaliteit? Of weten welk verzendetiket u nodig heeft? Businesslabels legt het uit!",
    href: "/probleemloos-verzendlabels-printen/",
    icon: PackageCheck,
  },
  {
    title: "Kaartprinter voor evenementen",
    description: "Gaat u een evenement organiseren en heeft u een kaartprinter nodig om al uw gasten van een badge te voorzien? Businesslabels heeft de badge printer die u zoekt! De ExpoBadge printers.",
    href: "/een-kaartprinter-op-uw-eigen-evenement/",
    icon: Ticket,
  },
  {
    title: "Nicelabel, software op maat",
    description: "Voor het automatiseren van label print processen of het “gewoon” eenvoudig printen van labels kan Businesslabels helpen door het bieden van complete maatwerk oplossingen. Hiervoor wordt NiceLabel gebruikt.",
    href: "/wijnetiketten-printen/",
    icon: Settings,
  },
  {
    title: "Waarom zelf printen in kleur?",
    description: "Een kleurenlabelprinter wordt met de dag meer gebruikt. Waar voorheen de labels veelal voorgedrukt werden door de drukker, worden ze meer en meer zelf geprint.",
    href: "/kleurenlabelprinter/",
    icon: Palette,
  },
  {
    title: "Bieretiketten printen, hoe?",
    description: "Bieretiketten kun je eenvoudig zelf printen. Zelfs als je werkt met statiegeld flessen is dat door de speciale DIA600B van Diamondlabels geen enkele moeite. Maar hoe ga je tewerk? Waar start je en wat heb je nodig? We nemen je mee in alle stappen om tot de mooiste bieretiketten te komen die je geheel in eigen beheer in hoge kwaliteit print.",
    href: "/labelsoftware-keuze-hulp/",
    icon: Beer,
  },
  {
    title: "De Diamondlabels banderol!",
    description: "Diamondlabels introduceert die nieuwe Diamondlabels banderol. Met de nieuwste technieken en door innovatief gebruik van productie processen heeft Diamondlabels een nieuw type banderol weten te maken. Hierdoor ben je niet langer gebonden aan een lengte maar ben je 100% flexibel. Gebruik de banderol als wikkel om je cadeau verpakkingen en bied volledige personalisatie aan via welke weg dan ook.",
    href: "/de-innovatieve-diamondlabels-banderol/",
    icon: Tag,
  },
  {
    title: "Ontwerpen en printen van labels",
    description: "Je hebt een Epson kleuren label printer en misschien zelfs je labels al binnen en dan komt de vraag, wat ga je op de labels printen? Hoe maak je nou een passend design, welke software heb je wel of niet nodig en wat zijn de verschillen. Tal van vragen die we hier zo duidelijk mogelijk uit leggen.",
    href: "/labelsoftware-keuze-hulp/",
    icon: PenTool,
  },
  {
    title: "Advies nodig?",
    description: "Businesslabels adviseert dagelijks (potentiele) klanten en gebruikers over de aanschaf van labels en labelprinters. Uiteraard helpt Businesslabels ook jouw graag met het vinden van een passend oplossing. Neem daarom gerust contact op voor advies. We helpen dan graag met het vinden van de juiste printer, software en/of labelmaterialen voor jouw toepassing!",
    href: "/contact-us/",
    icon: Headset,
  },
  {
    title: "Alles over de Epson CW-C6000 series",
    description: "De Epson CW-C6000 series bevat kleurenlabelprinters geschikt voor het printen van hoogwaardige labels en tickets in kleur. Het samenbrengen van kleurbeheer en vele andere tools uit de verschillende Epson divisies heeft deze serie tot een echte alles kunnen gemaakt.",
    href: "/epson_c6000-series/",
    icon: Printer,
  },
  {
    title: "CLP labeling voor chemische stoffen",
    description: "CLP labels zijn bedoeld voor verpakkingen met chemische stoffen en zijn voorzien van verplichte kenmerken. CLP labels moeten voldoen aan een compleet boekwerk aan richtlijnen en verplichtingen. Hoe deze eenvoudig en voordelig zelf te printen zijn leest u hier.",
    href: "/clp-labeling/",
    icon: FlaskConical,
  },
  {
    title: "Label re- en unwinders",
    description: "Voor het opwikkelen en afwikkelen van labelrollen bestaan er diverse soorten technieken en oplossingen. Iedere techniek heeft zijn eigen voor en nadelen. Welke techniek en welke soort het beste past is van een aantal factoren afhankelijk. Hier leest u meer over wat past bij welke toepassing",
    href: "/label-rewinders-en-unwinders/",
    icon: RotateCw,
  },
  {
    title: "Luxe wijnetiketten",
    description: "Een gepersonaliseerde wijnfles is ideaal als (relatie) geschenk. Maar een wijnetiket heeft meer uitstraling nodig dan alleen een mooie opdruk. Hoe print je wijnetiketten die een echte luxe uitstraling geven? Businesslabels vertelt u graag hoe en wat u daarvoor nodig heeft.",
    href: "/wijnetiketten-printen/",
    icon: Wine,
  },
  {
    title: "Label applicatoren",
    description: "Label geprint en weer opgerold, maar dat plakken de hele dag. Als het plakken van de labels te arbeidsintensief wordt, kan een label applicator de oplossing zijn waar op gewacht wordt. Wat is een label applicator en wat doet het? Businesslabels legt het graag uit. ",
    href: "/label-applicatoren/",
    icon: Factory,
  },
  {
    title: "FSC®-certificering",
    description: "Wij zijn trots op onze FSC®-certificering, FSC-C016391. Let op onze FSC-gecertificeerde producten. Door producten met dit label te kopen, draagt u bij aan de bescherming van de bossen in de wereld.",
    href: "/fsc-certificering/",
    icon: Leaf,
  },
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
            {KNOWLEDGE_ARTICLES.map((article, index) => {
              const IconComponent = article.icon || BookOpen;
              return (
                <Link
                  key={index}
                  href={article.href}
                  className="group flex flex-col overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-12px_rgba(241,136,0,0.25)] hover:ring-amber-200"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-50 border-b border-slate-100">
                    <div className="flex h-full w-full items-center justify-center text-slate-200 transition-transform duration-500 group-hover:scale-105 group-hover:text-amber-100">
                      <IconComponent className="h-16 w-16" />
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
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
