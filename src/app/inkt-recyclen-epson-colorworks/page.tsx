import { Metadata } from 'next';
import RecyclePageClient from './RecyclePageClient';

export const metadata: Metadata = {
  title: 'Inkt Recyclen — Epson ColorWorks | Businesslabels',
  description:
    'Recycle your empty Epson ColorWorks ink cartridges and maintenance boxes for free. Request a collection box and arrange a free pickup through our recycling program.',
};

export default function RecyclePage() {
  return <RecyclePageClient />;
}
