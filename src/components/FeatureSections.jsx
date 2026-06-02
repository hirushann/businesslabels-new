'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocalePath } from '@/hooks/useLocalePath';

const sections = [
  {
    key: 'section1',
    href: '/printers',
    image: '/find_the_right_printer.jpeg',
    imageLeft: false,
    bullets: 3,
  },
  {
    key: 'section2',
    href: '/category/labels-en-tickets',
    image: '/find_labels_and_materials.jpeg',
    imageLeft: true,
    bullets: 3,
  },
  {
    key: 'section3',
    href: '/my-account?tab=favourites',
    image: '/quick_reorder.jpeg',
    imageLeft: false,
    bullets: 3,
  },
];

export default function FeatureSections() {
  const t = useTranslations();
  const localePath = useLocalePath();
  
  return (
    <section className="w-full px-4 md:px-8 lg:px-10 py-16 lg:py-24 bg-slate-50 flex flex-col gap-16 lg:gap-24">
      <div className="max-w-360 mx-auto w-full flex flex-col gap-16 lg:gap-24">
        {sections.map((section, index) => (
          <div
            key={section.key}
            className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-12 ${section.imageLeft ? '' : 'lg:flex-row-reverse'}`}
          >
            {/* Image */}
            <div className="w-full lg:flex-1 h-64 sm:h-96 relative rounded-xl overflow-hidden">
              <Image
                src={section.image}
                alt={t(`features.${section.key}Title`)}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={index === 0}
                className="object-cover object-center"
              />
            </div>
            {/* Content */}
            <div className="w-full lg:flex-1 flex flex-col gap-8 lg:gap-12">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <h3 className="text-neutral-800 text-2xl sm:text-3xl lg:text-4xl font-bold font-['Segoe_UI'] leading-tight lg:leading-[48px]">
                    {t(`features.${section.key}Title`)}
                  </h3>
                  <p className="text-neutral-700 text-base sm:text-lg font-normal font-['Segoe_UI'] leading-relaxed sm:leading-7">
                    {t(`features.${section.key}Desc`)}
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  {Array.from({ length: section.bullets }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-1 shrink-0">
                        <rect x="1.5" y="1.5" width="13" height="13" rx="6.5" stroke="#22C55E" />
                        <path d="M5 8l2 2 4-4" stroke="#22C55E" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-neutral-700 text-base sm:text-lg font-normal font-['Segoe_UI'] leading-normal sm:leading-7">
                        {t(`features.${section.key}Bullet${i + 1}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href={localePath(section.href)}
                className="px-7 py-4 bg-amber-500 rounded-full inline-flex items-center gap-2.5 text-white text-base sm:text-lg font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors self-start"
              >
                {t(`features.${section.key}Cta`)}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
