import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("brands");
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

const brands = [
  {
    name: 'EPSON',
    href: '/brand/epson',
    logo: '/brands/epson.jpg',
  },
  {
    name: 'GoDEX',
    href: '/brand/godex',
    logo: '/brands/godex.png',
  },
  {
    name: 'SII',
    href: '/brand/sii',
    logo: '/brands/sii.png',
  },
  {
    name: 'diamondlabels',
    href: '/brand/diamondlabels-nl',
    logo: '/brands/diamondlabels.png',
  },
  {
    name: 'EXPO BADGE',
    href: '/brand/expo_badge',
    logo: '/brands/expobadge.png',
  },
];

export default async function BrandsPage() {
  const t = await getTranslations();
  const title = t('common.brands');

  return (
    <div className="relative min-h-screen bg-[#fafbfe]">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <section className="relative w-full px-4 md:px-10 pt-12 pb-24">
        <div className="max-w-360 mx-auto w-full flex flex-col gap-10">
          <div className="w-full">
            <Breadcrumbs
              className="text-slate-500"
              items={[{ label: title }]}
            />
          </div>

          <div className="w-full text-left">
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">
              {title}
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed font-medium">
              {t('common.brandsDescription')}
            </p>
          </div>

          <div className="w-full grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {brands.map((brand) => (
              <Link
                key={brand.name}
                href={brand.href}
                className="group relative flex flex-col items-center bg-white rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(80,100,121,0.08)] hover:border-brand/20 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                {/* Highlight bar on hover */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-10" />

                {/* Full-width logo wrapper */}
                <div className="w-full aspect-[16/10] relative flex items-center justify-center bg-slate-50/50 border-b border-slate-100 group-hover:bg-slate-50/20 transition-colors p-6 overflow-hidden">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    className="object-contain p-4 transform group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                  />
                </div>

                {/* Text section */}
                <div className="w-full p-5 flex items-center justify-between bg-white">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-brand transition-colors uppercase tracking-[0.1em]">
                    {brand.name}
                  </span>
                  <svg
                    className="w-4 h-4 text-slate-400 group-hover:text-brand group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
