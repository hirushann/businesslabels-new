'use client';

import Link from 'next/link';
import Image from 'next/image';

const menuItems = [
  {
    title: 'Inkjet',
    description: 'For high-quality labels using ink-based printing',
    href: '/category/inkjet-printer-medialabels-and-tickets',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C13.8565 22 15.637 21.2625 16.9497 19.9497C18.2625 18.637 19 16.8565 19 15C19 13 18 11.1 16 9.5C14 7.9 12.5 5.5 12 3C11.5 5.5 10 7.9 8 9.5C6 11.1 5 13 5 15C5 16.8565 5.7375 18.637 7.05025 19.9497C8.36301 21.2625 10.1435 22 12 22Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    title: 'TD: Thermal Direct',
    description: 'For fast, ink-free labels with short-term use',
    href: '/category/thermal-direct',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.99999 14C3.81076 14.0006 3.62522 13.9476 3.46495 13.847C3.30467 13.7464 3.17623 13.6023 3.09454 13.4316C3.01286 13.2609 2.98129 13.0706 3.00349 12.8826C3.0257 12.6947 3.10077 12.5169 3.21999 12.37L13.12 2.16998C13.1943 2.08426 13.2955 2.02634 13.407 2.00571C13.5185 1.98509 13.6337 2.00299 13.7337 2.05648C13.8337 2.10998 13.9126 2.19588 13.9573 2.30009C14.0021 2.4043 14.0101 2.52063 13.98 2.62998L12.06 8.64998C12.0034 8.8015 11.9844 8.9645 12.0046 9.12499C12.0248 9.28547 12.0837 9.43866 12.1761 9.57141C12.2685 9.70415 12.3918 9.8125 12.5353 9.88714C12.6788 9.96179 12.8382 10.0005 13 9.99998H20C20.1892 9.99934 20.3748 10.0524 20.535 10.153C20.6953 10.2536 20.8238 10.3976 20.9054 10.5683C20.9871 10.739 21.0187 10.9294 20.9965 11.1173C20.9743 11.3053 20.8992 11.483 20.78 11.63L10.88 21.83C10.8057 21.9157 10.7045 21.9736 10.593 21.9942C10.4815 22.0149 10.3663 21.997 10.2663 21.9435C10.1663 21.89 10.0874 21.8041 10.0427 21.6999C9.99791 21.5957 9.98991 21.4793 10.02 21.37L11.94 15.35C11.9966 15.1985 12.0156 15.0355 11.9954 14.875C11.9752 14.7145 11.9163 14.5613 11.8239 14.4286C11.7315 14.2958 11.6082 14.1875 11.4647 14.1128C11.3212 14.0382 11.1617 13.9995 11 14H3.99999Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    title: 'TT: Thermal Transfer',
    description: 'For durable labels that last in tough conditions',
    href: '/category/thermal-transfer',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 14.5C9.16304 14.5 9.79893 14.2366 10.2678 13.7678C10.7366 13.2989 11 12.663 11 12C11 10.62 10.5 10 10 9C8.928 6.857 9.776 4.946 12 3C12.5 5.5 14 7.9 16 9.5C18 11.1 19 13 19 15C19 15.9193 18.8189 16.8295 18.4672 17.6788C18.1154 18.5281 17.5998 19.2997 16.9497 19.9497C16.2997 20.5998 15.5281 21.1154 14.6788 21.4672C13.8295 21.8189 12.9193 22 12 22C11.0807 22 10.1705 21.8189 9.32122 21.4672C8.47194 21.1154 7.70026 20.5998 7.05025 19.9497C6.40024 19.2997 5.88463 18.5281 5.53284 17.6788C5.18106 16.8295 5 15.9193 5 15C5 13.847 5.433 12.706 6 12C6 12.663 6.26339 13.2989 6.73223 13.7678C7.20107 14.2366 7.83696 14.5 8.5 14.5Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    title: 'Applications',
    description: 'Find printers by use case and industry needs',
    href: '/category/applicatoren',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
];

export default function LabelsMenu() {
  return (
    <div className="w-[832px] inline-flex flex-col justify-start items-start">
      <div className="self-stretch p-6 bg-white rounded-tl-xl rounded-tr-xl shadow-[0px_10px_20px_0px_rgba(80,100,121,0.15)] flex flex-col justify-start items-center gap-10">
        <div className="inline-flex justify-start items-start gap-6">
          {/* Left column: menu items */}
          <div className="w-[480px] inline-flex flex-col justify-start items-start gap-6">
            {menuItems.map((item, i) => (
              <div key={item.title}>
                <Link
                  href={item.href}
                  className="self-stretch inline-flex justify-start items-center gap-3 group"
                >
                  <div className="w-11 h-11 px-2.5 pt-2.5 bg-white rounded-md shadow-[0px_0.857px_1.714px_-0.857px_rgba(0,0,0,0.10),0px_0.857px_2.571px_0px_rgba(0,0,0,0.10)] inline-flex flex-col justify-start items-start flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
                    <div className="self-stretch text-neutral-800 text-xl font-semibold font-['Segoe_UI'] leading-6 group-hover:text-amber-500 transition-colors">
                      {item.title}
                    </div>
                    <div className="self-stretch text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5">
                      {item.description}
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-zinc-500 flex-shrink-0 rotate-[-90deg]"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Link>
                {i < menuItems.length - 1 && (
                  <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-gray-100 mt-6" />
                )}
              </div>
            ))}
          </div>

          {/* Right column: featured card */}
          <div className="w-72 self-stretch p-4 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-gray-100 inline-flex flex-col justify-start items-start gap-5 overflow-hidden">
            <div className="self-stretch h-40 relative rounded-lg overflow-hidden bg-gray-100">
              <Image
                src="https://placehold.co/246x153"
                alt="Which Label Printer should you pick?"
                fill
                className="object-cover rounded-lg"
                unoptimized
              />
            </div>
            <div className="self-stretch flex flex-col justify-start items-start gap-4">
              <div className="w-48 text-neutral-800 text-base font-semibold font-['Segoe_UI'] leading-5">
                Which Label Printer should you pick?
              </div>
              <div className="self-stretch flex flex-col justify-start items-start gap-3">
                <Link href="/resources/articles/label-printer-guide" className="self-stretch inline-flex justify-start items-end gap-2 group">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 4.66666V14" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.00004 12C1.82323 12 1.65366 11.9298 1.52864 11.8047C1.40361 11.6797 1.33337 11.5101 1.33337 11.3333V2.66667C1.33337 2.48986 1.40361 2.32029 1.52864 2.19526C1.65366 2.07024 1.82323 2 2.00004 2H5.33337C6.04062 2 6.7189 2.28095 7.21899 2.78105C7.71909 3.28115 8.00004 3.95942 8.00004 4.66667C8.00004 3.95942 8.28099 3.28115 8.78109 2.78105C9.28119 2.28095 9.95946 2 10.6667 2H14C14.1769 2 14.3464 2.07024 14.4714 2.19526C14.5965 2.32029 14.6667 2.48986 14.6667 2.66667V11.3333C14.6667 11.5101 14.5965 11.6797 14.4714 11.8047C14.3464 11.9298 14.1769 12 14 12H10C9.46961 12 8.9609 12.2107 8.58583 12.5858C8.21075 12.9609 8.00004 13.4696 8.00004 14C8.00004 13.4696 7.78933 12.9609 7.41425 12.5858C7.03918 12.2107 6.53047 12 6.00004 12H2.00004Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5 group-hover:text-amber-500 transition-colors">
                    Read this article
                  </span>
                </Link>
                <Link href="/support/expert" className="self-stretch inline-flex justify-start items-end gap-2 group">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.26671 13.3333C6.53909 13.986 8.00276 14.1628 9.39397 13.8318C10.7852 13.5009 12.0124 12.6839 12.8545 11.5281C13.6967 10.3723 14.0983 8.9538 13.9871 7.5281C13.8759 6.1024 13.2591 4.7633 12.2479 3.75212C11.2367 2.74093 9.89763 2.12416 8.47193 2.01293C7.04623 1.90171 5.62769 2.30335 4.47192 3.14549C3.31615 3.98762 2.49917 5.21486 2.16819 6.60607C1.83721 7.99727 2.014 9.46094 2.66671 10.7333L1.33337 14.6667L5.26671 13.3333Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5 group-hover:text-amber-500 transition-colors">
                    Talk to an expert
                  </span>
                </Link>
                <Link href="/resources/knowledge-base" className="self-stretch inline-flex justify-start items-end gap-2 group">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5.33334C11.3137 5.33334 14 4.43791 14 3.33334C14 2.22877 11.3137 1.33334 8 1.33334C4.68629 1.33334 2 2.22877 2 3.33334C2 4.43791 4.68629 5.33334 8 5.33334Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 3.33334V12.6667C2 13.1971 2.63214 13.7058 3.75736 14.0809C4.88258 14.456 6.4087 14.6667 8 14.6667C9.5913 14.6667 11.1174 14.456 12.2426 14.0809C13.3679 13.7058 14 13.1971 14 12.6667V3.33334" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 8C2 8.53043 2.63214 9.03914 3.75736 9.41421C4.88258 9.78929 6.4087 10 8 10C9.5913 10 11.1174 9.78929 12.2426 9.41421C13.3679 9.03914 14 8.53043 14 8" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5 group-hover:text-amber-500 transition-colors">
                    See our Knowledge Base
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA bar */}
      <Link
        href="/category/labels-en-tickets-en"
        className="self-stretch px-6 py-4 bg-amber-500 rounded-bl-xl rounded-br-xl inline-flex justify-between items-center hover:bg-amber-600 transition-colors"
      >
        <span className="text-white text-base font-semibold font-['Segoe_UI'] leading-6">
          All Labels and Tickets
        </span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.8225 4.44751L15.375 9.00001L10.8225 13.5525" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.625 9H15.2475" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </Link>
    </div>
  );
}
