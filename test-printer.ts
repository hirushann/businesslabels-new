import { getPrinterById } from './src/lib/search/printers';
getPrinterById(201, 'nl').then(p => console.log('NL Content:', p?.content));
getPrinterById(201, 'en').then(p => console.log('EN Content:', p?.content));
