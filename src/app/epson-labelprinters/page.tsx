import type { Metadata } from 'next';
import EpsonLabelprintersPageClient from './EpsonLabelprintersPageClient';

export const metadata: Metadata = {
  title: 'Epson Labelprinters — Desktop, Midrange & Industrieel | Businesslabels',
  description:
    'Waarom kiezen voor een Epson ColorWorks labelprinter? Ontdek de unieke printkoptechnologie, betrouwbaarheid en de verschillende categorieën: Desktop, Midrange en Industrieel.',
};

export default function EpsonLabelprintersPage() {
  return <EpsonLabelprintersPageClient />;
}
