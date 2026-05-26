import { Metadata } from 'next';
import CustomMadeFormClient from './CustomMadeFormClient';

export const metadata: Metadata = {
  title: 'Custom-made Form — Businesslabels',
  description:
    'Need a custom label? Fill in our easy form and we will get back to you within 1 business day with a free, no-obligation quote.',
};

export default function CustomMadeFormPage() {
  return <CustomMadeFormClient />;
}
