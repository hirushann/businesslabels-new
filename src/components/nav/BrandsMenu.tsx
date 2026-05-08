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
    href: '/brand/diamondlabels',
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
    <div className="w-[832px] inline-flex flex-col justify-start items-start">
      <div className="self-stretch p-8 bg-white rounded-xl shadow-[0px_10px_20px_0px_rgba(80,100,121,0.15)] flex flex-col justify-start items-center">
        <div className="w-full flex flex-row items-center justify-between gap-8">
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={brand.href}
              className="flex-1 group transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-full h-20 relative flex items-center justify-center bg-gray-50/50 rounded-lg p-4 border border-gray-100 group-hover:border-amber-200 group-hover:bg-white group-hover:shadow-md transition-all">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 100vw, 150px"
                />
              </div>
              <div className="mt-2 text-center text-xs font-medium text-gray-500 group-hover:text-amber-600 transition-colors uppercase tracking-wider">
                {brand.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

