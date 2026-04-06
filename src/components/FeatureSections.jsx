import Image from 'next/image';
import Link from 'next/link';

const sections = [
  {
    title: 'Find the Right Printer',
    desc: 'Expert guidance to choose the perfect Epson ColorWorks printer for your business needs.',
    bullets: ['Free expert consultation', '2-week test printer loan', 'Sample prints with your design'],
    cta: 'Explore Printers',
    href: '/printers',
    image: '/find_the_right_printer.jpeg',
    imageLeft: false,
  },
  {
    title: 'Find Labels & Materials',
    desc: 'Already have a printer? Find compatible labels with our Diamondlabels brand - known for best material selection and quality.',
    bullets: ['Order from 1 roll - no high MOQ', 'Free custom ICC profiles', 'Expert material knowledge'],
    cta: 'Explore Labels',
    href: '/labels',
    image: '/find_labels_and_materials.jpeg',
    imageLeft: true,
  },
  {
    title: 'Quick Reorder',
    desc: "Returning customer? Quickly reorder your favorite products or browse new materials for your next project.",
    bullets: ['View order history', 'Saved favorites & preferences', 'Priority support'],
    cta: 'Reorder Now',
    href: '/account',
    image: '/quick_reorder.jpeg',
    imageLeft: false,
  },
];

export default function FeatureSections() {
  return (
    <section className="w-full px-10 py-24 bg-slate-50 flex flex-col gap-24">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-24">
        {sections.map((section) => (
          <div
            key={section.title}
            className={`flex items-center gap-12 ${section.imageLeft ? 'flex-row' : 'flex-row-reverse'}`}
          >
            {/* Image */}
            <div className="flex-1 h-96 relative rounded-xl overflow-hidden">
              <Image
                src={section.image}
                alt={section.title}
                fill
                className="object-cover object-center"
              />
            </div>
            {/* Content */}
            <div className="flex-1 flex flex-col gap-12">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <h3 className="text-neutral-800 text-4xl font-bold font-['Segoe_UI'] leading-[48px]">
                    {section.title}
                  </h3>
                  <p className="text-neutral-700 text-lg font-normal font-['Segoe_UI'] leading-7">
                    {section.desc}
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  {section.bullets.map((b) => (
                    <div key={b} className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="1.5" y="1.5" width="13" height="13" rx="6.5" stroke="#22C55E" />
                        <path d="M5 8l2 2 4-4" stroke="#22C55E" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-neutral-700 text-lg font-normal font-['Segoe_UI'] leading-7">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href={section.href}
                className="px-7 py-4 bg-amber-500 rounded-full inline-flex items-center gap-2.5 text-white text-lg font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors self-start"
              >
                {section.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
