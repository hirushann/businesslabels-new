const fs = require('fs');

const path = 'src/app/custom-made-form/CustomMadeFormClient.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  ['What are the dimensions?', '{t("enterSize")}'],
  ['Enter the size in millimeters. Not sure of the exact size? An estimate is fine.', '{t("enterSizeDesc")}'],
  ['Diameter (mm)', '{t("diameter")}'],
  ['Type here...', '{t("diameter")}'],
  ['Have an unusual size or unsure? Enter an estimate and mention it in the notes.', ''], // Or map it
  ['Step 2 of 5', ''], // actually I can just do string replacements for the important stuff.
];

// Let's do a more robust approach: regex replacing text inside elements
// Since we have specific texts, let's just use exact string replacements
const exactReplacements = {
  'What are the dimensions?': '{t("enterSize")}',
  'Enter the size in millimeters. Not sure of the exact size? An estimate is fine.': '{t("enterSizeDesc")}',
  'Diameter (mm)': '{t("diameter")}',
  'Which printer model do you use?': '{t("selectPrinter")}',
  'Search for your printer. Not in the list? Just type it in.': '{t("selectPrinterDesc")}',
  'Search by brand or model - e.g. Epson CW C7500': '{t("searchPrinter")}',
  'I don\\\'t know my printer model': '{t("unknownPrinter")}',
  'Which material suits you?': '{t("selectMaterial")}',
  'Choose the material for your label. Not sure? We\\\'re happy to advise.': '{t("selectMaterialDesc")}',
  'I\\\'m not sure yet — please advise me': '{t("unknownMaterial")}',
  'Material code': 'Material code',
  'Search for material by name or code - e.g. Matte paper': '{t("searchMaterial")}',
  'Contact Details': '{t("contactDetails")}',
  'Almost there! Please provide your details to receive the quote.': '{t("contactDetailsDesc")}',
  '>Company<': '>{t("company")}<',
  '>Email<': '>{t("email")}<',
  '>Phone (Optional)<': '>{t("phone")}<',
  '>Additional comments<': '>{t("comments")}<',
  '>Submit Request<': '>{t("submitRequest")}<',
  'placeholder="Company"': 'placeholder={t("company")}',
  'placeholder="Email"': 'placeholder={t("email")}',
  'placeholder="Phone (Optional)"': 'placeholder={t("phone")}',
  'placeholder="Additional comments"': 'placeholder={t("comments")}',
  'placeholder="Type here..."': 'placeholder={t("enterSize")}',
  'placeholder="Search by brand or model - e.g. Epson CW C7500"': 'placeholder={t("searchPrinter")}',
  'placeholder="Search for material by name or code - e.g. Matte paper"': 'placeholder={t("searchMaterial")}',
  '>Preview your label<': '>{t("previewLabel")}<',
  '>Based on your selections<': '>{t("previewDesc")}<',
  '>Select a shape to see preview<': '>{t("selectShapePreview")}<',
  '>Printer: <': '>{t("printerLbl")} <',
  '>Material: <': '>{t("materialLbl")} <',
  '>Need help or advice?<': '>{t("helpTitle")}<',
  'label: \\\'Call Us\\\'': 'label: t("callUs")',
  'label: \\\'Email\\\'': 'label: t("emailBtn")',
  'label: \\\'WhatsApp\\\'': 'label: t("whatsappBtn")',
  '\\\'Response within 1 business day\\\'': 't("benefit1Title")',
  '\\\'We get back to you quickly\\\'': 't("benefit1Desc")',
  '\\\'No obligation\\\'': 't("benefit2Title")',
  '\\\'The quote is completely free\\\'': 't("benefit2Desc")',
  '\\\'Expert advice\\\'': 't("benefit3Title")',
  '\\\'We help you find the right solution\\\'': 't("benefit3Desc")'
};

for (const [key, value] of Object.entries(exactReplacements)) {
  content = content.split(key).join(value);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
