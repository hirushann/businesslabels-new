import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("terms");
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function TermsAndConditions() {
  const t = await getTranslations();
  const locale = await getLocale();
  const title = t("footer.legal.terms");

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
              ? 'Lees onze algemene voorwaarden zorgvuldig door. Hierin staan al onze afspraken helder uitgelegd.' 
              : 'Please read our terms and conditions carefully. They clearly explain all our agreements.'}
          </p>
        </div>

        <div className="rounded-[32px] bg-white p-8 sm:p-12 lg:p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
          <div className="max-w-none text-slate-600 text-base sm:text-lg
            [&_h1]:text-2xl [&_h1]:font-black [&_h1]:uppercase [&_h1]:tracking-tight [&_h1]:text-slate-900 [&_h1]:mb-6 [&_h1]:mt-14 [&_h1:first-child]:mt-0
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mb-5 [&_h2]:mt-12
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
<h1>ALGEMENE VOORWAARDEN SMART2B B.V.</h1>
<p><span style="text-decoration: underline;"><em>Versie: mei 2025</em></span></p>
<p>Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, overeenkomsten en leveringen van Smart2B B.V. en haar geregistreerde handelsnamen, waaronder Businesslabels.nl, IDbeheer.nl, Smart2B.nl en Kleurenlabelprinter.nl. De klant erkent dat hij handelt in de uitoefening van zijn beroep of bedrijf. Smart2B B.V. levert uitsluitend aan zakelijke klanten (B2B).</p>
<p>Voor vragen over deze voorwaarden kun je contact opnemen via:</p>
<p>📧 sales@smart2b.nl</p>
<p>📞 +31(0)318 590 212</p>
<h1>INHOUDSOPGAVE</h1>
<ol>
<li>Definities</li>
<li>Identiteit van Smart2B B.V.</li>
<li>Toepasselijkheid</li>
<li>Aanbiedingen en totstandkoming van overeenkomsten</li>
<li>Prijzen en betaling</li>
<li>Annulering</li>
<li>Levering en risico-overgang</li>
<li>Eigendomsvoorbehoud</li>
<li>Aansprakelijkheid</li>
<li>Overmacht</li>
<li>Intellectueel eigendom</li>
<li>Klachten</li>
<li>Toepasselijk recht en bevoegde rechter</li>
<li>Conversie</li>
<li>Geen herroepingsrecht</li>
</ol>
<p><strong>ARTIKEL 1 – Definities</strong></p>
<p>In deze voorwaarden wordt verstaan onder:</p>
<p><strong>Klant</strong>: de rechtspersoon of natuurlijke persoon die handelt in de uitoefening van zijn beroep of bedrijf en een overeenkomst aangaat met Smart2B B.V. of één van haar geregistreerde handelsnamen. Smart2B B.V. levert uitsluitend aan zakelijke klanten. Overeenkomsten met consumenten in de zin van artikel 6:230g BW worden niet aangegaan.</p>
<p><strong>Overeenkomst</strong>: een overeenkomst tussen Smart2B B.V. (of een van haar geregistreerde handelsnamen) en een klant voor de verkoop van producten en/of diensten, waarbij uitsluitend B2B-transacties plaatsvinden.</p>
<p><strong>Dag</strong>: kalenderdag.</p>
<p><strong>ARTIKEL 2 – Identiteit van Smart2B B.V.</strong></p>
<p>Smart2B B.V.</p>
<p>Lenderinkweg 8</p>
<p>6733 AX WEKEROM</p>
<p>Tel: +31(0)318 590 212</p>
<p>E-mailadres: sales@Smart2B.nl</p>
<p>KvK-nummer: 71774599</p>
<p>BTW-identificatienummer: NL858844217B01</p>
<p><strong>Smart2B handelend onder diverse handelsnamen waaronder, maar niet exclusief, de onderstaande handelsnamen:</strong></p>
<ul>
<li>Smart2B B.V.</li>
<li>IDbeheer</li>
<li>Businesslabels</li>
<li>Hortiprint</li>
<li>Kleurenlabelprinter.nl</li>
<li>ExpoBadge<strong><br /></strong></li>
</ul>
<p><strong>ARTIKEL 3 – Toepasselijkheid</strong></p>
<ol>
<li>Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, offertes, rechtsbetrekkingen en overeenkomsten waarbij Smart2B B.V., handelend onder één van haar handelsnamen, goederen en/of diensten levert aan zakelijke klanten.</li>
<li>Afwijkingen op deze voorwaarden zijn slechts geldig indien schriftelijk overeengekomen.</li>
<li>De toepasselijkheid van algemene voorwaarden van de klant wordt uitdrukkelijk uitgesloten, tenzij schriftelijk anders overeengekomen.</li>
</ol>
<p><strong>ARTIKEL 4 – Aanbiedingen en totstandkoming van overeenkomsten</strong></p>
<ol>
<li>Alle aanbiedingen en offertes van Smart2B B.V. zijn vrijblijvend, tenzij uitdrukkelijk anders vermeld.</li>
<li>Een overeenkomst komt tot stand zodra Smart2B B.V. de opdracht van de klant schriftelijk of per e-mail bevestigt of wanneer Smart2B B.V. met de uitvoering van de opdracht is begonnen.</li>
</ol>
<p><strong>ARTIKEL 5 – Prijzen en betaling</strong></p>
<ol>
<li>Alle vermelde prijzen zijn exclusief btw en andere heffingen van overheidswege.</li>
<li>Betaling dient te geschieden binnen 30 dagen na factuurdatum, tenzij schriftelijk anders is overeengekomen.</li>
<li>Bij niet-tijdige betaling is de klant van rechtswege in verzuim. Smart2B B.V. is gerechtigd wettelijke handelsrente en incassokosten in rekening te brengen.</li>
<li>Smart2B B.V. is in dat geval gerechtigd haar verplichtingen op te schorten, waaronder het uitstellen van leveringen of het stopzetten van toegang tot diensten.</li>
</ol>
<p><strong>ARTIKEL 6 – Annulering</strong></p>
<ol>
<li>Annulering van geplaatste orders is uitsluitend mogelijk na schriftelijke instemming van Smart2B B.V.</li>
<li>In geval van annulering kunnen annuleringskosten in rekening worden gebracht, afhankelijk van het stadium van de uitvoering.</li>
</ol>
<p><strong>ARTIKEL 7 – Levering en risico-overgang</strong></p>
<ol>
<li>De opgegeven leveringstermijnen zijn indicatief en geen fatale termijnen, tenzij schriftelijk anders overeengekomen. Vertragingen in levering kunnen onder geen beding leiden tot schadevergoeding tenzij vooraf specifiek schriftelijk vastgelegd.</li>
<li>Het risico van verlies, diefstal of beschadiging van de zaken gaat over op de klant op het moment van levering.</li>
</ol>
<p><strong>ARTIKEL 8 – Eigendomsvoorbehoud</strong></p>
<ol>
<li>Alle door Smart2B B.V. geleverde producten blijven eigendom van Smart2B B.V. totdat de klant alle verplichtingen uit de overeenkomst volledig is nagekomen.</li>
<li>Hieronder vallen in ieder geval de betaling van de overeengekomen prijs, eventuele rente, kosten en schadevergoedingen.</li>
<li>Zolang het eigendom niet is overgegaan, mag de klant de producten niet verpanden, doorverkopen of op andere wijze bezwaren tenzij vooraf schriftelijk anders overeengekomen.</li>
<li>Indien de klant in gebreke blijft, is Smart2B B.V. gerechtigd de goederen terug te nemen.</li>
</ol>
<p><strong>ARTIKEL 9 – Aansprakelijkheid</strong></p>
<ol>
<li>Smart2B B.V. is slechts aansprakelijk voor directe schade die het gevolg is van opzet of grove nalatigheid.</li>
<li>Aansprakelijkheid voor indirecte schade, waaronder gevolgschade, winstderving en schade door bedrijfsstagnatie, is uitgesloten.</li>
<li>In alle gevallen is de aansprakelijkheid beperkt tot het bedrag dat de klant voor de betreffende overeenkomst heeft betaald.</li>
</ol>
<p><strong>ARTIKEL 10 – Overmacht</strong></p>
<ol>
<li>Onder overmacht wordt verstaan iedere omstandigheid die buiten de macht van Smart2B B.V. ligt en die de nakoming van de verplichtingen tijdelijk of blijvend verhindert.</li>
<li>In geval van overmacht is Smart2B B.V. gerechtigd haar verplichtingen op te schorten of de overeenkomst geheel of gedeeltelijk te ontbinden.</li>
</ol>
<p><strong>ARTIKEL 11 – Intellectueel eigendom</strong></p>
<ol>
<li>Alle intellectuele eigendomsrechten met betrekking tot door Smart2B B.V. geleverde producten en diensten, blijven eigendom van Smart2B B.V. en/of haar licentiegevers, tenzij schriftelijk anders is overeengekomen.</li>
<li>Hieronder vallen uitdrukkelijk ook digitale bestanden zoals ontwerpen, digitale voorbeelden, opmaakbestanden, grafische producties, technische tekeningen, drukvoorbeelden, en overige digitaal aangestuurde of bewerkte materialen.</li>
<li>Ook indien voor de creatie, voorbereiding of opmaak van deze bestanden door de klant een vergoeding is betaald, blijven deze bestanden volledig eigendom van Smart2B B.V., tenzij schriftelijk en uitdrukkelijk anders overeengekomen.</li>
<li>Gebruik, vermenigvuldiging, bewerking, openbaarmaking of verspreiding van deze bestanden is uitsluitend toegestaan na voorafgaande schriftelijke toestemming van Smart2B B.V. Hiervoor kan een aanvullende vergoeding verschuldigd zijn.</li>
<li>Elk ongeautoriseerd gebruik of verspreiding van deze eigendommen zal onherroepelijk leiden tot een schadeclaim van ten minste €500,- per kalenderdag dat dit gebruik plaatsvindt, te vermeerderen met alle directe en indirecte gevolgschade, waaronder juridische en administratieve kosten.</li>
<li>De klant is verantwoordelijk voor het bewijzen van verkregen toestemming bij betwisting. Smart2B B.V. behoudt zich het recht voor toezicht te houden op het gebruik van haar intellectuele eigendom en zal hiertegen optreden bij schending.</li>
</ol>
<p><strong>ARTIKEL 12 – Klachten</strong></p>
<p>Klachten dienen binnen 7 dagen na levering schriftelijk en gemotiveerd te worden ingediend. Na deze termijn wordt aangenomen dat de levering correct is.</p>
<p><strong>ARTIKEL 13 – Toepasselijk recht en bevoegde rechter</strong></p>
<p>Op alle overeenkomsten is uitsluitend Nederlands recht van toepassing. Alle geschillen worden bij uitsluiting voorgelegd aan de bevoegde rechter in het arrondissement waarin Smart2B B.V. is gevestigd.</p>
<p><strong>ARTIKEL 14 – Conversie</strong></p>
<p>Indien enige bepaling van deze voorwaarden nietig of vernietigbaar blijkt, tast dit de geldigheid van de overige bepalingen niet aan. De ongeldige bepaling zal worden vervangen door een bepaling die zoveel mogelijk aansluit bij de bedoeling daarvan.</p>
<p><strong>ARTIKEL 15 – Geen herroepingsrecht</strong></p>
<p>De klant erkent dat hij handelt in de uitoefening van een beroep of bedrijf. Het wettelijke herroepingsrecht, zoals bedoeld in artikel 6:230o BW, is uitdrukkelijk uitgesloten. Smart2B B.V. levert uitsluitend aan zakelijke klanten (B2B).</p>
`;

const englishContent = `
<h1>GENERAL TERMS AND CONDITIONS OF SMART2B B.V.</h1>
<p><span style="text-decoration: underline;"><em>Version: May 2025</em></span></p>
<p>These general terms and conditions apply to all offers, agreements and deliveries of Smart2B B.V. and its registered trade names, including Businesslabels.nl, IDbeheer.nl, Smart2B.nl and Kleurenlabelprinter.nl. The customer acknowledges that they are acting in the course of their trade or profession. Smart2B B.V. supplies exclusively to business customers (B2B).</p>
<p>For questions regarding these terms and conditions, you can contact us at:</p>
<p>📧 sales@smart2b.nl</p>
<p>📞 +31(0)318 590 212</p>
<p><strong>TABLE OF CONTENTS</strong></p>
<ol>
<li>Definitions</li>
<li>Identity of Smart2B B.V.</li>
<li>Applicability</li>
<li>Offers and conclusion of agreements</li>
<li>Prices and payment</li>
<li>Cancellation</li>
<li>Delivery and transfer of risk</li>
<li>Retention of title</li>
<li>Liability</li>
<li>Force majeure</li>
<li>Intellectual property</li>
<li>Complaints</li>
<li>Applicable law and competent court</li>
<li>Severability</li>
<li>No right of withdrawal</li>
<li>Prevailing version</li>
</ol>
<h3>ARTICLE 1 – Definitions</h3>
<p>In these terms and conditions, the following definitions apply:</p>
<p><strong>Customer</strong>: the legal entity or natural person acting in the exercise of a profession or business and entering into an agreement with Smart2B B.V. or one of its registered trade names. Smart2B B.V. exclusively supplies to business customers. Agreements with consumers within the meaning of Article 6:230g of the Dutch Civil Code are not entered into.</p>
<p><strong>Agreement</strong>: an agreement between Smart2B B.V. (or one of its registered trade names) and a customer for the sale of products and/or services, which exclusively concerns B2B transactions.</p>
<p><strong>Day</strong>: calendar day.</p>
<h3>ARTICLE 2 – Identity of Smart2B B.V.</h3>
<p>Smart2B B.V.<br />Lenderinkweg 8<br />6733 AX WEKEROM<br />The Netherlands<br />Phone: +31(0)318 590 212<br />Email: sales@Smart2B.nl<br />Chamber of Commerce No.: 71774599<br />VAT ID: NL858844217B01</p>
<p>Smart2B operates under various registered trade names, including:<br />• Smart2B B.V.<br />• IDbeheer<br />• Businesslabels<br />• Hortiprint<br />• Kleurenlabelprinter.nl<br />• ExpoBadge</p>
<h3>ARTICLE 3 – Applicability</h3>
<ol>
<li>These general terms and conditions apply to all offers, quotations, legal relationships and agreements whereby Smart2B B.V., operating under any of its trade names, supplies goods and/or services to business customers.<br />2. Deviations from these conditions are only valid if agreed in writing.<br />3. The applicability of the customer’s general terms and conditions is expressly excluded, unless otherwise agreed in writing.</li>
</ol>
<h3>ARTICLE 4 – Offers and conclusion of agreements</h3>
<ol>
<li>All offers and quotations from Smart2B B.V. are without obligation, unless explicitly stated otherwise.<br />2. An agreement is concluded as soon as Smart2B B.V. confirms the customer&#8217;s order in writing or by email, or when Smart2B B.V. has commenced execution of the order.</li>
</ol>
<h3>ARTICLE 5 – Prices and payment</h3>
<ol>
<li>All stated prices are exclusive of VAT and other government-imposed levies.<br />2. Payment must be made within 30 days of the invoice date, unless otherwise agreed in writing.<br />3. In the event of late payment, the customer is legally in default. Smart2B B.V. is entitled to charge statutory commercial interest and collection costs.<br />4. In such a case, Smart2B B.V. is also entitled to suspend its obligations, including postponing deliveries or suspending access to services.</li>
</ol>
<h3>ARTICLE 6 – Cancellation</h3>
<ol>
<li>Cancellation of placed orders is only possible with the prior written consent of Smart2B B.V.<br />2. In the event of cancellation, cancellation costs may be charged depending on the stage of execution.</li>
</ol>
<h3>ARTICLE 7 – Delivery and transfer of risk</h3>
<ol>
<li>The indicated delivery times are indicative and not strict deadlines, unless expressly agreed otherwise in writing. Delays in delivery shall under no circumstances entitle the customer to compensation unless specifically agreed in writing in advance.<br />2. The risk of loss, theft or damage to the goods transfers to the customer at the moment of delivery.</li>
</ol>
<h3>ARTICLE 8 – Retention of title</h3>
<ol>
<li>All products delivered by Smart2B B.V. remain the property of Smart2B B.V. until the customer has fully complied with all obligations under the agreement.<br />2. This includes payment of the agreed price, any interest, costs and damages.<br />3. As long as ownership has not been transferred, the customer may not pledge, resell or otherwise encumber the products unless otherwise agreed in writing in advance.<br />4. If the customer fails to comply, Smart2B B.V. is entitled to reclaim the goods.</li>
</ol>
<h3>ARTICLE 9 – Liability</h3>
<ol>
<li>Smart2B B.V. is only liable for direct damage resulting from intent or gross negligence.<br />2. Liability for indirect damage, including consequential damage, loss of profit and business interruption, is excluded.<br />3. In all cases, liability is limited to the amount paid by the customer under the relevant agreement.</li>
</ol>
<h3>ARTICLE 10 – Force majeure</h3>
<ol>
<li>Force majeure includes any circumstance beyond the control of Smart2B B.V. that temporarily or permanently prevents the fulfillment of its obligations.<br />2. In case of force majeure, Smart2B B.V. is entitled to suspend its obligations or to dissolve the agreement in whole or in part.</li>
</ol>
<h3>ARTICLE 11 – Intellectual property</h3>
<p>1. All intellectual property rights related to products and services provided by Smart2B B.V. remain the property of Smart2B B.V. and/or its licensors, unless explicitly agreed otherwise in writing.</p>
<p>2. This explicitly includes digital files such as designs, digital previews, layout files, graphic productions, technical drawings, print proofs, and other digitally created or processed materials.</p>
<p>3. Even if a fee has been paid by the client for the creation, preparation, or layout of such files, these files remain the sole property of Smart2B B.V., unless expressly agreed otherwise in writing.</p>
<p>4. The use, reproduction, modification, publication, or distribution of these files is only permitted with the prior written consent of Smart2B B.V. A separate release fee may be required for such consent.</p>
<p>5. Any unauthorized use or distribution of these assets will irrevocably result in a claim for damages of at least €500 per calendar day of use, in addition to all direct and indirect consequential damages, including legal and administrative costs.</p>
<p>6. The client bears the burden of proof regarding any obtained permission in case of dispute. Smart2B B.V. reserves the right to monitor the use of its intellectual property and will take action against any infringements.</p>
<h3>ARTICLE 12 – Complaints</h3>
<p>Complaints must be submitted in writing and with reasons within 7 days of delivery. After this period, the delivery is deemed to be correct.</p>
<h3>ARTICLE 13 – Applicable law and competent court</h3>
<p>All agreements are governed exclusively by Dutch law. All disputes shall be submitted exclusively to the competent court in the district where Smart2B B.V. has its registered office.</p>
<h3>ARTICLE 14 – Severability</h3>
<p>If any provision of these terms and conditions is found to be null or void, the validity of the remaining provisions shall not be affected. The invalid provision shall be replaced by a provision that most closely reflects its intended purpose.</p>
<h3>ARTICLE 15 – No right of withdrawal</h3>
<p>The customer acknowledges that they are acting in the course of a trade or business. The statutory right of withdrawal, as referred to in Article 6:230o of the Dutch Civil Code, is expressly excluded. Smart2B B.V. supplies exclusively to business customers (B2B).</p>
<h3>ARTICLE 16 – Prevailing version</h3>
<p>This English translation is provided for convenience only. In case of discrepancies or interpretation issues, the Dutch version of these general terms and conditions shall prevail.</p>
`;
