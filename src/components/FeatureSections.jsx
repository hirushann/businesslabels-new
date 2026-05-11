'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

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
  
  return (
    <section className="w-full px-10 py-24 bg-slate-50 flex flex-col gap-24">
      <div className="max-w-360 mx-auto w-full flex flex-col gap-24">
        {sections.map((section, index) => (
          <div
            key={section.key}
            className={`flex items-center gap-12 ${section.imageLeft ? 'flex-row' : 'flex-row-reverse'}`}
          >
            {/* Image */}
            <div className="flex-1 h-96 relative rounded-xl overflow-hidden">
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
            <div className="flex-1 flex flex-col gap-12">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <h3 className="text-neutral-800 text-4xl font-bold font-['Segoe_UI'] leading-[48px]">
                    {t(`features.${section.key}Title`)}
                  </h3>
                  <p className="text-neutral-700 text-lg font-normal font-['Segoe_UI'] leading-7">
                    {t(`features.${section.key}Desc`)}
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  {Array.from({ length: section.bullets }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="1.5" y="1.5" width="13" height="13" rx="6.5" stroke="#22C55E" />
                        <path d="M5 8l2 2 4-4" stroke="#22C55E" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-neutral-700 text-lg font-normal font-['Segoe_UI'] leading-7">
                        {t(`features.${section.key}Bullet${i + 1}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href={section.href}
                className="px-7 py-4 bg-amber-500 rounded-full inline-flex items-center gap-2.5 text-white text-lg font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors self-start"
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
