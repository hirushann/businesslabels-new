'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocalePath } from '@/hooks/useLocalePath';

const sections = [
  {
    key: 'section1',
    href: '/product-category/labelprinters',
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
                  <h3 className="text-neutral-800 text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight lg:leading-[48px]">
                    {t(`features.${section.key}Title`)}
                  </h3>
                  <p className="text-neutral-700 text-base sm:text-lg font-light leading-relaxed sm:leading-7">
                    {t(`features.${section.key}Desc`)}
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  {Array.from({ length: section.bullets }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-1 shrink-0">
                        <path d="M16.3519 7.49963C16.6944 9.1806 16.4503 10.9282 15.6603 12.451C14.8703 13.9737 13.5821 15.1797 12.0106 15.8676C10.439 16.5556 8.67914 16.684 7.0244 16.2314C5.36965 15.7788 3.92007 14.7727 2.91738 13.3807C1.91469 11.9887 1.41951 10.2951 1.51442 8.58217C1.60933 6.86928 2.28858 5.24069 3.43891 3.968C4.58924 2.69531 6.14111 1.85545 7.83572 1.58847C9.53034 1.32148 11.2653 1.64352 12.7512 2.50088" stroke="#00C950" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6.75 8.25L9 10.5L16.5 3" stroke="#00C950" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-neutral-700 text-base sm:text-lg font-light leading-normal sm:leading-7">
                        {t(`features.${section.key}Bullet${i + 1}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href={localePath(section.href)}
                className="px-7 py-4 bg-brand rounded-full inline-flex items-center gap-2.5 text-white text-base sm:text-lg font-normal leading-6 hover:bg-brand-hover transition-colors self-start"
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
