import type { Metadata } from 'next';
import EpsonCWC4000PageClient from './EpsonCWC4000PageClient';

export const metadata: Metadata = {
  title: 'Epson CW-C4000 ColorWorks Labelprinter — Preview & Specificaties | Businesslabels',
  description:
    'Ontdek de nieuwe Epson CW-C4000 ColorWorks labelprinter. Desktop model met Precision Core printkop, 1200×1200 dpi en UltraChrome DL inkten. Bekijk specs, snelheden en prijzen.',
};

export default function EpsonCWC4000Page() {
  return <EpsonCWC4000PageClient />;
}
