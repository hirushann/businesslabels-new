const { searchCatalogProducts, parseCatalogSearchParams } = require('./src/lib/search/products');
const { searchPrinters, parsePrinterSearchParams } = require('./src/lib/search/printers');

async function test() {
  const productsParams = parseCatalogSearchParams(new URLSearchParams(), "en");
  const response = await searchCatalogProducts(productsParams);
  console.log("EN:", response.products[0].product.name, response.products[0].product.subtitle);

  const productsParamsNL = parseCatalogSearchParams(new URLSearchParams(), "nl");
  const responseNL = await searchCatalogProducts(productsParamsNL);
  console.log("NL:", responseNL.products[0].product.name, responseNL.products[0].product.subtitle);
}

test().catch(console.error);
