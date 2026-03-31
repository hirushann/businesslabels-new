import Image from 'next/image';
import Link from 'next/link';

const categories = [
  { name: 'Label Printers', href: '/printers', image: '/labelprinters.jpeg' },
  { name: 'Label Rolls', href: '/labels', image: '/labelrolls.png' },
  { name: 'Ink & Supplies', href: '/ink', image: '/inkandsupplies.png' },
  { name: 'Special Labels', href: '/special-labels', image: '/speciallabels.png' },
];

export default function CategorySection() {
  return (
    <section className="w-full px-10 py-28 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="w-48 h-48 absolute left-0 top-0 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />
      <div className="w-48 h-48 absolute right-52 bottom-0 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />

      <div className="max-w-[1512px] mx-auto w-full flex flex-col gap-12">
        <h2 className="text-center text-neutral-800 text-4xl font-bold font-['Segoe_UI'] leading-[48px]">
          Browse by Category
        </h2>
        <div className="grid grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="relative h-96 bg-white rounded-xl shadow border-2 border-gray-200 overflow-hidden group hover:border-amber-400 transition-colors"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover object-center"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-900/50 to-black/0" />
              {/* Label */}
              <div className="absolute bottom-6 left-6 flex items-center gap-2">
                <span className="text-white text-2xl font-semibold font-['Segoe_UI'] leading-7">{cat.name}</span>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.8225 4.44751L15.375 9.00001L10.8225 13.5525" stroke="white" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.625 9H15.2475" stroke="white" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
