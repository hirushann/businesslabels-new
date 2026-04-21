import Image from 'next/image';
import Link from 'next/link';

export default function CTABanner() {
  return (
    <section className="relative h-120 w-full py-12 overflow-hidden">
      {/* Background */}
      <Image
        src="/images/cta_image.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-black/50 via-black/50 to-black/0" />
      <div className="absolute inset-0 bg-gradient-to-br from-stone-700/70 to-yellow-950/60" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-[1440px] w-full flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-center text-white text-4xl font-bold font-['Segoe_UI'] leading-[48px]">
              Ready to find the perfect labels?
            </h2>
            <p className="text-center text-slate-100 text-lg font-normal font-['Segoe_UI'] leading-7">
              Join over 12,000 businesses who trust us for expert advice and high-quality products
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="px-7 py-4 bg-amber-500 rounded-full flex items-center gap-2.5 text-white text-lg font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors"
            >
              Browse Products
            </Link>
            <Link
              href="/contact"
              className="px-7 py-4 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm flex items-center gap-2.5 text-white text-lg font-semibold font-['Segoe_UI'] leading-6 hover:bg-white/20 transition-colors"
            >
              Talk to Expert
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
