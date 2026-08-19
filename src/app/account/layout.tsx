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

export default function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
