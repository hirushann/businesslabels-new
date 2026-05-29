import { getPrinterById } from './src/lib/search/printers.js';
getPrinterById(25, 'nl').then(p => console.log('NL Content:', p?.content));
getPrinterById(25, 'en').then(p => console.log('EN Content:', p?.content));
