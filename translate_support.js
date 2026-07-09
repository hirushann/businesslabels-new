const fs = require('fs');
const path = './src/lib/i18n/messages.js';
let messages = fs.readFileSync(path, 'utf8');

const enSupportPage = `    supportPage: {
      heroTitle: "We help you get your printer working.",
      heroDesc: "Our support team is available to help you through various channels, including phone calls, email correspondence, and remote sessions via TeamViewer. Please note that we currently do not offer support via WhatsApp.",
      breadcrumbHome: "Home",
      breadcrumbSupport: "Support",
      callTitle: "Call Us",
      callTime: "Mon - Fri, 8:30 - 17:00",
      emailTitle: "Email",
      emailTime: "Response within 1 business day",
      remoteSupportTitle: "Remote Support",
      downloadTeamViewer: "Download TeamViewer",
      scheduledAfterContact: "Scheduled after contact",
      freeSupportTitle: "FREE Remote Support for regular customers (Fair use)",
      freeSupportDesc: "As a thank you for your continued partnership, regular customers enjoy FREE Remote Support via TeamViewer.",
      knowledgeBaseTitle: "Try the Knowledge Base first",
      knowledgeBaseDesc: "A solution is documented for most common problems. Search our guides before calling — it's faster.",
      searchKnowledgeBase: "Search Knowledge Base",
      servicesPricingTitle: "Services & Pricing",
      remotePrinterSupportTitle: "Remote Printer Support",
      remotePrinterSupportDesc: "We connect via TeamViewer and walk through printer settings, driver configuration, and print profile adjustments with you in real-time.",
      idealFor: "Ideal for",
      remotePrinterSupportIdeal: "Printer is not printing correctly, wrong colors, streaks,<br />or driver problems on Windows.",
      billedHourly: "billed hourly, excl. VAT",
      remoteSoftwareSupportTitle: "Remote Software Support",
      remoteSoftwareSupportDesc: "Help with label design software such as NiceLabel or BarTender — configuration, templates, print profiles, and integration with your systems.",
      remoteSoftwareSupportIdeal: "Software doesn't connect to printer, label output<br />doesn't match the design, or new software installation.",
      hardwareRepairTitle: "Hardware Repair & Diagnosis",
      hardwareRepairDesc: "Diagnosis and repair of components for certified brands (Epson, Godex). Includes assessment and, where possible, resolution in the same session.",
      hardwareRepairIdeal: "Printer shows hardware errors, mechanical<br />failures, or component damage.",
      onSiteServiceTitle: "On-site Service",
      onSiteServiceDesc: "A technician visits for issues that cannot be resolved remotely — complex setups, multi-printer configurations, or hardware replacement.",
      onSiteServiceIdeal: "Remote support did not resolve the issue, or<br />physical access to the printer is required.",
      exclTravelCosts: "excl. travel costs + VAT",
      loanEquipmentTitle: "Loan Equipment",
      loanEquipmentDesc: "We can provide a temporary replacement printer while your device is being repaired. Availability and costs depend on the required model.",
      loanEquipmentIdeal: "Your printer is broken and production cannot<br />wait for the repair to be completed.",
      onRequest: "On request",
      availabilityVaries: "availability varies by model",
      pricingDisclaimer: "All prices are excluding VAT. Support is available for printers purchased via BusinessLabels. Windows systems are generally covered for standard questions at no extra cost. Other operating systems may have limited or paid support. On-site service does not include travel costs.",
      whatWeHelpWithTitle: "What we help you with",
      whatWeHelpWithList: [
        "Printer is not recognized by computer or software",
        "Incorrect colors or unexpected print output",
        "Banding, streaks, or poor print quality",
        "Installation and configuration of drivers",
        "Media type settings and ICC profile configuration",
        "NiceLabel, Bartender, or other label software",
        "Network printer connectivity issues"
      ],
      howRemoteWorksTitle: "How Remote Support works",
      howRemoteWorksList: [
        "You contact us by phone or email and describe the problem.",
        "We schedule a TeamViewer session at a time that suits you.",
        "You install TeamViewer QuickSupport — no account required.",
        "We connect, view your screen, and go through the settings together."
      ],
      downloadTeamViewerQuickSupport: "Download TeamViewer QuickSupport"
    },
`;

const nlSupportPage = `    supportPage: {
      heroTitle: "Wij helpen u om uw printer werkend te krijgen.",
      heroDesc: "Ons supportteam is beschikbaar om u via verschillende kanalen te helpen, waaronder telefoongesprekken, e-mailcorrespondentie en sessies op afstand via TeamViewer. Houd er rekening mee dat we momenteel geen ondersteuning bieden via WhatsApp.",
      breadcrumbHome: "Home",
      breadcrumbSupport: "Support",
      callTitle: "Bellen",
      callTime: "Ma – Vrij, 8:30 – 17:00",
      emailTitle: "E-mail",
      emailTime: "Reactie binnen 1 werkdag",
      remoteSupportTitle: "Hulp op afstand",
      downloadTeamViewer: "Download TeamViewer",
      scheduledAfterContact: "Gepland na contact",
      freeSupportTitle: "GRATIS Hulp op afstand voor vaste klanten (Fair use)",
      freeSupportDesc: "Als bedankje voor uw voortdurende samenwerking genieten vaste klanten van GRATIS Hulp op afstand via TeamViewer.",
      knowledgeBaseTitle: "Probeer eerst de Kennisbank",
      knowledgeBaseDesc: "Voor de meeste veelvoorkomende problemen is een oplossing gedocumenteerd. Zoek in onze handleidingen voordat u belt — dat is sneller.",
      searchKnowledgeBase: "Kennisbank doorzoeken",
      servicesPricingTitle: "Diensten & Tarieven",
      remotePrinterSupportTitle: "Printerondersteuning op afstand",
      remotePrinterSupportDesc: "We maken verbinding via TeamViewer en nemen in realtime de printerinstellingen, stuurprogrammaconfiguratie en aanpassingen van printprofielen met u door.",
      idealFor: "Ideaal voor",
      remotePrinterSupportIdeal: "Printer print niet correct, verkeerde kleuren, strepen,<br />of driverproblemen op Windows.",
      billedHourly: "per uur gefactureerd, excl. btw",
      remoteSoftwareSupportTitle: "Softwareondersteuning op afstand",
      remoteSoftwareSupportDesc: "Hulp bij labelontwerpsoftware zoals NiceLabel of BarTender — configuratie, sjablonen, printprofielen en integratie met uw systemen.",
      remoteSoftwareSupportIdeal: "Software maakt geen verbinding met de printer, labeluitvoer<br />komt niet overeen met het ontwerp, of nieuwe software-installatie.",
      hardwareRepairTitle: "Hardware Reparatie & Diagnose",
      hardwareRepairDesc: "Diagnose en reparatie van componenten voor gecertificeerde merken (Epson, Godex). Inclusief beoordeling en, waar mogelijk, oplossing in dezelfde sessie.",
      hardwareRepairIdeal: "Printer toont hardwarefouten, mechanische<br />storingen of schade aan componenten.",
      onSiteServiceTitle: "Service op locatie",
      onSiteServiceDesc: "Een technicus komt langs voor problemen die niet op afstand kunnen worden opgelost — complexe opstellingen, multi-printer opstellingen of vervanging van hardware.",
      onSiteServiceIdeal: "Ondersteuning op afstand heeft het probleem niet opgelost, of<br />fysieke toegang tot de printer is vereist.",
      exclTravelCosts: "excl. reiskosten + btw",
      loanEquipmentTitle: "Leenapparatuur",
      loanEquipmentDesc: "Wij kunnen een tijdelijke vervangende printer leveren terwijl uw apparaat wordt gerepareerd. Beschikbaarheid en kosten zijn afhankelijk van het benodigde model.",
      loanEquipmentIdeal: "Uw printer is defect en de productie kan niet<br />wachten tot de reparatie is voltooid.",
      onRequest: "Op aanvraag",
      availabilityVaries: "beschikbaarheid varieert per model",
      pricingDisclaimer: "Alle prijzen zijn exclusief btw. Ondersteuning is beschikbaar voor printers aangeschaft via BusinessLabels. Windows-systemen worden voor standaardvragen doorgaans zonder extra kosten gedekt. Andere besturingssystemen hebben mogelijk beperkte of betaalde ondersteuning. Service op locatie is exclusief reiskosten.",
      whatWeHelpWithTitle: "Waarmee wij u helpen",
      whatWeHelpWithList: [
        "Printer wordt niet herkend door computer of software",
        "Onjuiste kleuren of onverwachte printuitvoer",
        "Banding, strepen of slechte printkwaliteit",
        "Installatie en configuratie van stuurprogramma's",
        "Mediatype-instellingen en ICC-profiel configuratie",
        "NiceLabel, Bartender of andere labelsoftware",
        "Netwerkprinter connectiviteitsproblemen"
      ],
      howRemoteWorksTitle: "Hoe Hulp op afstand werkt",
      howRemoteWorksList: [
        "U neemt telefonisch of per e-mail contact met ons op en omschrijft het probleem.",
        "We plannen een TeamViewer-sessie op een moment dat het u uitkomt.",
        "U installeert TeamViewer QuickSupport — geen account nodig.",
        "We maken verbinding, bekijken uw scherm en nemen samen de instellingen door."
      ],
      downloadTeamViewerQuickSupport: "Download TeamViewer QuickSupport"
    },
`;

const badgePageMatches = [...messages.matchAll(/    badgePage: \{/g)];
if (badgePageMatches.length >= 2) {
    const firstIndex = badgePageMatches[0].index;
    const secondIndex = badgePageMatches[1].index;
    
    messages = messages.substring(0, firstIndex) + enSupportPage + messages.substring(firstIndex, secondIndex) + nlSupportPage + messages.substring(secondIndex);
    fs.writeFileSync(path, messages);
    console.log('Successfully injected translations!');
} else {
    console.log('Could not find badgePage');
}
