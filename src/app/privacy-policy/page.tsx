import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("footer.legal.privacy")} — Businesslabels`,
  };
}

export default async function PrivacyPolicy() {
  const t = await getTranslations();
  const locale = await getLocale();
  const title = t("footer.legal.privacy");

  const isNl = locale === "nl";

  return (
    <div className="relative min-h-screen bg-[#fafbfe]">
      <section className="relative mx-auto max-w-[1440px] px-4 pt-12 pb-24 sm:px-6 lg:px-2">
        <div className="mb-10">
          <Breadcrumbs
            className="text-slate-500"
            items={[{ label: title }]}
          />
        </div>

        <div className="mb-10 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">
            {title}
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
            {isNl 
              ? 'Lees hier hoe wij met uw persoonsgegevens omgaan en uw privacy waarborgen.' 
              : 'Read here how we handle your personal data and ensure your privacy.'}
          </p>
        </div>

        <div className="rounded-[32px] bg-white p-8 sm:p-12 lg:p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
          <div className="max-w-none text-slate-600 text-base sm:text-lg
            [&_h1]:text-2xl [&_h1]:font-black [&_h1]:uppercase [&_h1]:tracking-tight [&_h1]:text-slate-900 [&_h1]:mb-6 [&_h1]:mt-14 [&_h1:first-child]:mt-0
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mb-5 [&_h2]:mt-12 [&_h2:first-child]:mt-0
            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mb-5 [&_h3]:mt-12
            [&_p]:mb-6 [&_p]:leading-relaxed
            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-8 [&_ol_li]:mb-3 [&_ol_li]:pl-2 [&_ol]:marker:text-slate-400 [&_ol]:marker:font-semibold
            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-8 [&_ul_li]:mb-3 [&_ul_li]:pl-2 [&_ul]:marker:text-slate-400
            [&_strong]:font-semibold [&_strong]:text-slate-900
            [&_a]:text-brand [&_a]:font-medium hover:[&_a]:text-amber-700 [&_a]:transition-colors
          ">
            {isNl ? (
              <div dangerouslySetInnerHTML={{ __html: dutchContent }} />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: englishContent }} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const dutchContent = `
<p>Smart2B respecteert de privacy van u als bezoeker op één van onze websites en draagt er zorg voor dat de persoonlijke informatie die u ons verschaft vertrouwelijk wordt behandeld.</p>

<h2>Inleiding en toepasselijkheid privacyverklaring</h2>
<p>Om onze activiteiten goed uit te kunnen voeren, is het soms nodig om persoonsgegevens van u te verwerken. Dat doen we altijd zorgvuldig en in overeenstemming met de wet. Smart2B respecteert de privacy van u als bezoeker en draagt er zorg voor dat de persoonlijke informatie die u ons verschaft vertrouwelijk wordt behandeld. Deze privacyverklaring is van toepassing op de verwerking van alle persoonsgegevens verkregen vanuit een bezoek aan en gebruik van de website Smart2B.nl, Businesslabels.nl. en IDbeheer.nl. We verwerken de persoonsgegevens in overeenstemming met de wet- en regelgeving op het gebied van de bescherming van persoonsgegevens. In deze privacyverklaring wordt uitgelegd welke gegevens worden verwerkt, wat er met uw gegevens wordt gedaan en welke rechten u hebt.</p>

<h2>Wijze van verkrijging van persoonsgegevens</h2>
<p>Smart2B verzamelt slechts tot personen herleidbare informatie die uitdrukkelijk en vrijwillig door de bezoeker ter beschikking is gesteld. Smart2B verzamelt persoonsgegevens door het uitlezen van een informatie- of contactaanvraag, door de verwerking van sollicitaties en door het uitlezen voor bepaalde acties of evenementen. Deze informatie kan onder ander bestaan uit de naam, adres, bedrijfsnaam, bedrijfsadres, huidige functie, e-mailadres en telefoonnummer van de bezoeker.</p>

<h2>Doel van de verwerking</h2>
<p>Wij verwerken persoonsgegevens voor verschillende doelen, namelijk voor:</p>
<ul>
<li>Om u te bellen voor het geval dit nodig is om onze dienstverlening te kunnen uitvoeren</li>
<li>U te informeren over wijziging van onze diensten en producten</li>
<li>Het verzenden van onze nieuwsbrief en/of reclamefolder aan klanten</li>
<li>U de mogelijkheid te bieden een account aan te maken</li>
</ul>

<h2>Bewaartermijn</h2>
<p>De persoonsgegevens worden alleen voor boven gestelde doelen verwerkt. Smart2B bewaart uw persoonsgegevens niet langer dan noodzakelijk is voor de verwerking van de hierboven omschreven doeleinden, tenzij deze gegevens noodzakelijk zijn ter voldoening aan een wettelijke plicht.</p>

<h2>Beveiliging</h2>
<p>Wij gaan uiterst zorgvuldig om met de verwerking van uw gegevens. Smart2B treft voortdurend passende maatregelen om uw gegevens te beveiligen tegen verlies, ongeoorloofd gebruik of de wijziging ervan. Deze maatregelen zijn in lijn met de daarvoor geleden wettelijke eisen en richtlijnen.</p>

<h2>Gebruik van cookies</h2>
<p>Er wordt bij bezoek aan deze website gebruik gemaakt van cookies. Het gebruik hiervan vindt alleen plaats bij acceptatie van de cookies. U kunt in de cookie wall het gebruik van cookies en de hiermee verzamelde data weigeren. De cookies op onze website worden gebruikt voor het optimaal functioneren van de website en functies zoals inloggen, winkelwagen, favorieten en marketing functies (zie ook kop *Google).</p>

<h2>Derden</h2>
<p>De door ons verzamelde gegevens zijn nodig in het kader van de hierboven beschreven doeleinden. Uw persoonsgegevens worden niet met derden gedeeld tenzij er een wettelijke verplichting of rechtvaardiging is zoals het afsluiten van een verwerkersovereenkomst. Onze werknemers zijn verplicht om de vertrouwelijkheid van uw persoonsgegevens te respecteren. Ook wordt uw e-mailadres niet aan derden verstrekt.</p>

<h2>*Google</h2>
<p>Statistische gegevens van de website worden gedeeld met o.a. Google voor optimalisatie van de processen en prestaties van onze websites. Meer informatie hierover vindt u via deze link: <br />
De <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Privacy &amp; Voorwaarden-pagina</a> van Google.</p>

<h2>Aanpassen privacyverklaring</h2>
<p>Deze privacyverklaring kan zonder voorafgaande kennisgeving worden gewijzigd bij wijzigingen in de bedrijfsvoering van Smart2B. Wanneer u vervolgens gebruik blijft maken van onze diensten of websites bent u automatisch gebonden aan de voorwaarden van de gewijzigde privacyverklaring. Het is daarom raadzaam om regelmatig deze privacyverklaring te raadplegen.</p>
`;

const englishContent = `
<p>Smart2B respects the privacy of you as a visitor to any of our websites and ensures that the personal information you provide to us is treated confidentially.</p>

<h2>Introduction and Applicability of the Privacy Statement</h2>
<p>In order to perform our activities properly, it is sometimes necessary to process your personal data. We always do this carefully and in accordance with the law. Smart2B respects your privacy as a visitor and ensures that the personal information you provide to us is treated confidentially. This privacy statement applies to the processing of all personal data obtained from visiting and using the websites Smart2B.nl, Businesslabels.nl, and IDbeheer.nl. We process personal data in accordance with the laws and regulations concerning the protection of personal data. This privacy statement explains what data is processed, what is done with your data, and what your rights are.</p>

<h2>Method of Obtaining Personal Data</h2>
<p>Smart2B only collects personally identifiable information that is explicitly and voluntarily provided by the visitor. Smart2B collects personal data by reading information or contact requests, processing job applications, and through registrations for certain promotions or events. This information may include, among other things, the visitor's name, address, company name, company address, current job title, email address, and telephone number.</p>

<h2>Purpose of Processing</h2>
<p>We process personal data for various purposes, namely to:</p>
<ul>
<li>Call you if this is necessary to carry out our services</li>
<li>Inform you about changes to our services and products</li>
<li>Send our newsletter and/or promotional materials to customers</li>
<li>Offer you the possibility to create an account</li>
</ul>

<h2>Retention Period</h2>
<p>Personal data is processed only for the above-mentioned purposes. Smart2B does not retain your personal data longer than is necessary for the processing of the aforementioned purposes, unless this data is necessary to comply with a legal obligation.</p>

<h2>Security</h2>
<p>We handle the processing of your data with the utmost care. Smart2B continuously takes appropriate measures to secure your data against loss, unauthorized use, or alteration. These measures are in line with the applicable legal requirements and guidelines.</p>

<h2>Use of Cookies</h2>
<p>Cookies are used when visiting this website. Their use only occurs upon acceptance of the cookies. You can refuse the use of cookies and the data collected with them in the cookie wall. The cookies on our website are used for the optimal functioning of the website and features such as logging in, shopping cart, favorites, and marketing functions (see also heading *Google).</p>

<h2>Third Parties</h2>
<p>The data we collect is necessary in the context of the purposes described above. Your personal data will not be shared with third parties unless there is a legal obligation or justification, such as concluding a processing agreement. Our employees are obliged to respect the confidentiality of your personal data. Your email address will also not be provided to third parties.</p>

<h2>*Google</h2>
<p>Statistical data from the website is shared with, among others, Google to optimize the processes and performance of our websites. More information about this can be found via this link:<br />
Google's <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Privacy &amp; Terms page</a>.</p>

<h2>Adjusting Privacy Statement</h2>
<p>This privacy statement can be modified without prior notice in the event of changes to Smart2B's business operations. If you subsequently continue to use our services or websites, you are automatically bound by the terms of the modified privacy statement. It is therefore advisable to consult this privacy statement regularly.</p>
`;
