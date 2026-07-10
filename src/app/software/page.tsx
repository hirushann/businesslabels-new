import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'software' });
  return {
    title: `${t('title')} • BusinessLabels`,
    description: t('intro'),
  };
}

export default async function SoftwarePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations('software');

  const products = [
    {
      id: 'nicelabel',
      title: t('products.nicelabel.title'),
      desc: t('products.nicelabel.desc'),
      logo: '/images/Nicelablogo.png', // Assuming logo path, fallback to styling if missing
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      hover: 'group-hover:border-indigo-300',
      links: [
        { label: t('products.nicelabel.buy'), href: 'https://www.nicelabel.com/buy-online/?uid=03180' },
        { label: t('products.nicelabel.choiceHelper'), href: 'https://www.nicelabel.com/buy-online/?uid=03180' },
        { label: t('products.nicelabel.customApp'), href: 'https://businesslabels.nl/nicelabel-costum-application/' },
      ],
    },
    {
      id: 'affinity',
      title: t('products.affinity.title'),
      desc: t('products.affinity.desc'),
      logo: '/images/Affinity_Design.png',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      hover: 'group-hover:border-emerald-300',
      links: [
        { label: t('products.affinity.info'), href: 'https://affinity.serif.com/en-gb/designer/' },
        { label: t('products.affinity.buy'), href: '#' },
      ],
    },
    {
      id: 'nicelabelSe',
      title: t('products.nicelabelSe.title'),
      desc: t('products.nicelabelSe.desc'),
      logo: '/images/Nicelablogo.png',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      hover: 'group-hover:border-blue-300',
      links: [
        { label: t('products.nicelabelSe.download'), href: 'https://www.nicelabel.com/nicelabel-for-epson?uid=03180' },
      ],
    },
    {
      id: 'godex',
      title: t('products.godex.title'),
      desc: t('products.godex.desc'),
      logo: '/images/Godex-log0.png',
      bg: 'bg-brand-soft',
      border: 'border-amber-100',
      hover: 'group-hover:border-amber-300',
      links: [
        { label: t('products.godex.overview'), href: 'https://www.godexintl.com/product-list/Software?locale=en' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <div className="relative bg-white pt-16 pb-20 overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-brand-soft opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-80 h-80 rounded-full bg-blue-50 opacity-50 blur-3xl"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              {t('title')}
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              {t('intro')}
            </p>
          </div>
        </div>
      </div>

      {/* Categories: Logical vs Graphical */}
      <div className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-10 max-w-5xl mx-auto">
          {/* Logical Labels */}
          <div className="bg-white p-8 lg:p-10 rounded-2xl md:rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-start hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('logical.title')}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t('logical.desc')}
            </p>
          </div>

          {/* Graphical Labels */}
          <div className="bg-white p-8 lg:p-10 rounded-2xl md:rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-start hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-brand-soft rounded-2xl flex items-center justify-center mb-6 text-brand">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r="2.5"></circle>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="6" cy="6" r="3"></circle>
                <path d="M19 11v10"></path>
                <path d="M15 15h8"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('graphical.title')}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t('graphical.desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Software Grid */}
      <div className="container mx-auto px-4 mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                <div className={`w-full aspect-[4/3] rounded-xl mb-6 flex items-center justify-center \${product.bg} border \${product.border} \${product.hover} transition-all duration-300 p-4 overflow-hidden relative`}>
                  {product.logo ? (
                    <Image
                      src={product.logo}
                      alt={product.title}
                      fill
                      className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-center font-bold text-slate-400 text-lg group-hover:scale-105 transition-transform duration-500">
                      {product.title}
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-brand transition-colors">
                  {product.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-grow">
                  {product.desc}
                </p>

                <div className="flex flex-col gap-2 mt-auto">
                  {product.links.map((link, idx) => (
                    <Link
                      key={idx}
                      href={link.href}
                      className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-lg bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-brand transition-colors"
                    >
                      {link.label}
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
