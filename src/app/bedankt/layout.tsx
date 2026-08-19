import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {
    canonical: null,
    languages: {
      en: null,
      nl: null,
      'x-default': null,
    },
  },
};

export default function ThankYouLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
