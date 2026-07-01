import { searchPrinters, parsePrinterSearchParams } from './src/lib/search/printers';

async function test() {
  const params = parsePrinterSearchParams(new URLSearchParams());
  const result = await searchPrinters(params);
  
  console.log("First 24 printers from searchPrinters on server:");
  result.printers.forEach((p, idx) => {
    console.log(`${idx + 1}. ID: ${p.id}, Name: ${p.name}, Featured: ${p.featured}`);
  });
}

test().catch(console.error);
