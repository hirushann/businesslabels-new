import type { Metadata } from 'next';
import BadgeMakenPageClient from './BadgeMakenPageClient';

export const metadata: Metadata = {
  title: 'Badge maken — Evenement badges printen | Businesslabels',
  description:
    'Maak en ontwerp uw eigen badge tijdens uw evenement met de ExpoBadges van Diamondlabels. Snel, goedkoop en eenvoudig te printen op de Epson TM-C3500.',
};

export default function BadgeMakenPage() {
  return <BadgeMakenPageClient />;
}
