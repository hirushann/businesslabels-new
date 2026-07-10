'use client';

import Link from 'next/link';
import Image from 'next/image';

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

export default function BrandsMenu() {
  return (
    <div className="w-[90vw] max-w-[720px] flex flex-col">
      <div className="p-6 bg-white rounded-xl shadow-[0px_10px_20px_0px_rgba(80,100,121,0.15)] border border-slate-100 flex flex-col items-center">
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={brand.href}
              className="group flex flex-col items-center transition-all duration-300"
            >
              <div className="w-full aspect-video relative flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 group-hover:border-brand/30 group-hover:bg-white group-hover:shadow-lg transition-all overflow-hidden p-3">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  fill
                  className="object-contain p-1"
                  sizes="(max-width: 640px) 50vw, 150px"
                />
              </div>
              <div className="mt-3 text-center text-[10px] font-bold text-slate-400 group-hover:text-brand transition-colors uppercase tracking-[0.1em]">
                {brand.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
