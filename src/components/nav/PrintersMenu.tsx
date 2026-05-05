'use client';

import Link from 'next/link';
import Image from 'next/image';

const menuItems = [
  {
    title: 'Color Label Printers',
    description: 'For high-quality, full-color labels and branding',
    href: '/category/color-labelprinters',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V16C22 16.5304 21.7893 17.0391 21.4142 17.4142C21.0391 17.7893 20.5304 18 20 18H18" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 9V3C6 2.73478 6.10536 2.48043 6.29289 2.29289C6.48043 2.10536 6.73478 2 7 2H17C17.2652 2 17.5196 2.10536 17.7071 2.29289C17.8946 2.48043 18 2.73478 18 3V9" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 14H7C6.44772 14 6 14.4477 6 15V21C6 21.5523 6.44772 22 7 22H17C17.5523 22 18 21.5523 18 21V15C18 14.4477 17.5523 14 17 14Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    title: 'Thermal Label Printers',
    description: 'For fast, low-cost labels with short-term use',
    href: '/category/thermal-labelprinters-labelprinters',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.99999 14C3.81076 14.0006 3.62522 13.9476 3.46495 13.847C3.30467 13.7464 3.17623 13.6024 3.09454 13.4317C3.01286 13.261 2.98129 13.0706 3.00349 12.8827C3.0257 12.6947 3.10077 12.517 3.21999 12.37L13.12 2.17C13.1943 2.08428 13.2955 2.02635 13.407 2.00573C13.5185 1.9851 13.6337 2.00301 13.7337 2.0565C13.8337 2.10999 13.9126 2.19589 13.9573 2.3001C14.0021 2.40431 14.0101 2.52064 13.98 2.63L12.06 8.65C12.0034 8.80152 11.9844 8.96452 12.0046 9.125C12.0248 9.28549 12.0837 9.43868 12.1761 9.57142C12.2685 9.70417 12.3918 9.81251 12.5353 9.88716C12.6788 9.9618 12.8382 10.0005 13 10H20C20.1892 9.99935 20.3748 10.0524 20.535 10.153C20.6953 10.2536 20.8238 10.3976 20.9054 10.5683C20.9871 10.739 21.0187 10.9294 20.9965 11.1173C20.9743 11.3053 20.8992 11.483 20.78 11.63L10.88 21.83C10.8057 21.9157 10.7045 21.9736 10.593 21.9943C10.4815 22.0149 10.3663 21.997 10.2663 21.9435C10.1663 21.89 10.0874 21.8041 10.0427 21.6999C9.99791 21.5957 9.98991 21.4793 10.02 21.37L11.94 15.35C11.9966 15.1985 12.0156 15.0355 11.9954 14.875C11.9752 14.7145 11.9163 14.5613 11.8239 14.4286C11.7315 14.2958 11.6082 14.1875 11.4647 14.1128C11.3212 14.0382 11.1617 13.9995 11 14H3.99999Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    title: 'Starterkits',
    description: 'Everything you need to get started quickly',
    href: '/category/starterkits',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16V7.99999C20.9996 7.64927 20.9071 7.3048 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.26999L13 2.26999C12.696 2.09446 12.3511 2.00204 12 2.00204C11.6489 2.00204 11.304 2.09446 11 2.26999L4 6.26999C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.3048 3.00036 7.64927 3 7.99999V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 22V12" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.28998 7L12 12L20.71 7" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.5 4.27L16.5 9.42" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    title: 'Consumables',
    description: 'Labels, ribbons, and essentials for daily printing',
    href: '/category/consumables',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 22C8.55228 22 9 21.5523 9 21C9 20.4477 8.55228 20 8 20C7.44772 20 7 20.4477 7 21C7 21.5523 7.44772 22 8 22Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 22C19.5523 22 20 21.5523 20 21C20 20.4477 19.5523 20 19 20C18.4477 20 18 20.4477 18 21C18 21.5523 18.4477 22 19 22Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.04999 2.04999H4.04999L6.70999 14.47C6.80757 14.9248 7.06066 15.3315 7.4257 15.6198C7.79074 15.9082 8.24489 16.0603 8.70999 16.05H18.49C18.9452 16.0493 19.3865 15.8933 19.741 15.6078C20.0956 15.3224 20.3421 14.9245 20.44 14.48L22.09 7.04999H5.11999" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
];

export default function PrintersMenu() {
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
        href="/printers"
        className="self-stretch px-6 py-4 bg-amber-500 rounded-bl-xl rounded-br-xl inline-flex justify-between items-center hover:bg-amber-600 transition-colors"
      >
        <span className="text-white text-base font-semibold font-['Segoe_UI'] leading-6">
          All Label Printers
        </span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.8225 4.44751L15.375 9.00001L10.8225 13.5525" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.625 9H15.2475" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </Link>
    </div>
  );
}
