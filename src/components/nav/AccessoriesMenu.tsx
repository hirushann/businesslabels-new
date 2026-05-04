'use client';

import Link from 'next/link';
import Image from 'next/image';

const menuItems = [
  {
    title: 'RE & Unwinders',
    description: 'For efficient label rewinding and smooth handling',
    href: '/accessories/rewinders-unwinders',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12C21 13.78 20.4722 15.5201 19.4832 17.0001C18.4943 18.4802 17.0887 19.6337 15.4442 20.3149C13.7996 20.9961 11.99 21.1743 10.2442 20.8271C8.49836 20.4798 6.89472 19.6226 5.63604 18.364C4.37737 17.1053 3.5202 15.5016 3.17294 13.7558C2.82567 12.01 3.0039 10.2004 3.68509 8.55585C4.36628 6.91131 5.51983 5.50571 6.99987 4.51677C8.47991 3.52784 10.22 3 12 3C14.52 3 16.93 4 18.74 5.74L21 8" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 3V8H16" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    ),
  },
  {
    title: 'Applicators & Dispensers',
    description: 'For easy label application and quick dispensing',
    href: '/accessories/applicators-dispensers',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 11V6C18 5.46957 17.7893 4.96086 17.4142 4.58579C17.0391 4.21071 16.5304 4 16 4C15.4696 4 14.9609 4.21071 14.5858 4.58579C14.2107 4.96086 14 5.46957 14 6" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 10V4C14 3.46957 13.7893 2.96086 13.4142 2.58579C13.0391 2.21071 12.5304 2 12 2C11.4696 2 10.9609 2.21071 10.5858 2.58579C10.2107 2.96086 10 3.46957 10 4V6" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 10.5V6C10 5.46957 9.78929 4.96086 9.41421 4.58579C9.03914 4.21071 8.53043 4 8 4C7.46957 4 6.96086 4.21071 6.58579 4.58579C6.21071 4.96086 6 5.46957 6 6V14" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 8C18 7.46957 18.2107 6.96086 18.5858 6.58579C18.9608 6.21071 19.4695 6 20 6C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V14C22 16.1217 21.1571 18.1566 19.6568 19.6569C18.1565 21.1571 16.1217 22 14 22H12C9.19998 22 7.49998 21.14 6.00998 19.66L2.40998 16.06C2.06592 15.6789 1.88157 15.1802 1.89511 14.6669C1.90864 14.1537 2.11903 13.6653 2.4827 13.303C2.84638 12.9406 3.33548 12.7319 3.84875 12.7202C4.36202 12.7085 4.86014 12.8946 5.23998 13.24L6.99998 15" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    ),
  },
  {
    title: 'Printers Ad-Ons',
    description: 'Accessories to enhance and expand your printer setup',
    href: '/accessories/printer-addons',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.39 4.38997C15.5157 4.5158 15.6727 4.60582 15.8448 4.65077C16.0169 4.69571 16.1978 4.69394 16.369 4.64564C16.5402 4.59735 16.6954 4.50427 16.8186 4.37601C16.9418 4.24775 17.0286 4.08894 17.07 3.91597C17.1738 3.48386 17.3909 3.08724 17.699 2.76694C18.007 2.44665 18.3949 2.21425 18.8226 2.09369C19.2503 1.97313 19.7025 1.96876 20.1324 2.08104C20.5624 2.19331 20.9547 2.41817 21.2689 2.73246C21.5831 3.04675 21.8078 3.4391 21.9199 3.86912C22.0321 4.29913 22.0275 4.75127 21.9068 5.17896C21.7861 5.60665 21.5536 5.99443 21.2332 6.30238C20.9128 6.61033 20.5161 6.8273 20.084 6.93097C19.911 6.97236 19.7522 7.05915 19.6239 7.18237C19.4957 7.30559 19.4026 7.46078 19.3543 7.63196C19.306 7.80314 19.3042 7.9841 19.3492 8.15619C19.3941 8.32828 19.4842 8.48526 19.61 8.61097L21.293 10.293C21.5172 10.5171 21.695 10.7833 21.8163 11.0761C21.9376 11.369 22.0001 11.6829 22.0001 12C22.0001 12.317 21.9376 12.6309 21.8163 12.9238C21.695 13.2167 21.5172 13.4828 21.293 13.707L19.61 15.39C19.4843 15.5158 19.3273 15.6058 19.1552 15.6508C18.9831 15.6957 18.8022 15.6939 18.631 15.6456C18.4598 15.5973 18.3046 15.5043 18.1814 15.376C18.0582 15.2477 17.9714 15.0889 17.93 14.916C17.8262 14.4839 17.6091 14.0872 17.301 13.7669C16.993 13.4466 16.6051 13.2142 16.1774 13.0937C15.7496 12.9731 15.2975 12.9688 14.8675 13.081C14.4375 13.1933 14.0453 13.4182 13.7311 13.7325C13.4169 14.0467 13.1922 14.4391 13.08 14.8691C12.9679 15.2991 12.9724 15.7513 13.0931 16.179C13.2138 16.6066 13.4464 16.9944 13.7668 17.3024C14.0872 17.6103 14.4838 17.8273 14.916 17.931C15.089 17.9724 15.2478 18.0591 15.376 18.1824C15.5043 18.3056 15.5974 18.4608 15.6457 18.632C15.694 18.8031 15.6957 18.9841 15.6508 19.1562C15.6058 19.3283 15.5158 19.4853 15.39 19.611L13.707 21.293C13.4828 21.5171 13.2167 21.695 12.9238 21.8163C12.6309 21.9376 12.317 22.0001 12 22.0001C11.683 22.0001 11.369 21.9376 11.0762 21.8163C10.7833 21.695 10.5171 21.5171 10.293 21.293L8.60999 19.61C8.48428 19.4841 8.32729 19.3941 8.15521 19.3492C7.98312 19.3042 7.80216 19.306 7.63098 19.3543C7.4598 19.4026 7.3046 19.4957 7.18138 19.6239C7.05816 19.7522 6.97138 19.911 6.92999 20.084C6.82618 20.5161 6.60907 20.9127 6.30102 21.233C5.99297 21.5533 5.6051 21.7857 5.17737 21.9062C4.74964 22.0268 4.29751 22.0312 3.86753 21.9189C3.43755 21.8066 3.04527 21.5818 2.73109 21.2675C2.4169 20.9532 2.19217 20.5608 2.08004 20.1308C1.96791 19.7008 1.97242 19.2487 2.09313 18.821C2.21383 18.3933 2.44635 18.0055 2.76675 17.6976C3.08715 17.3896 3.48385 17.1726 3.91599 17.069C4.08896 17.0276 4.24777 16.9408 4.37603 16.8176C4.50429 16.6943 4.59737 16.5391 4.64566 16.368C4.69396 16.1968 4.69573 16.0158 4.65078 15.8437C4.60584 15.6717 4.51581 15.5147 4.38999 15.389L2.70699 13.707C2.48281 13.4828 2.30499 13.2167 2.18366 12.9238C2.06234 12.6309 1.9999 12.317 1.9999 12C1.9999 11.6829 2.06234 11.369 2.18366 11.0761C2.30499 10.7833 2.48281 10.5171 2.70699 10.293L4.38999 8.60997C4.51569 8.48414 4.67268 8.39411 4.84476 8.34917C5.01685 8.30423 5.19781 8.30599 5.36899 8.35429C5.54017 8.40259 5.69537 8.49566 5.81859 8.62393C5.94181 8.75219 6.02859 8.91099 6.06999 9.08397C6.17379 9.51607 6.3909 9.91269 6.69895 10.233C7.00701 10.5533 7.39487 10.7857 7.8226 10.9062C8.25033 11.0268 8.70246 11.0312 9.13244 10.9189C9.56242 10.8066 9.9547 10.5818 10.2689 10.2675C10.5831 9.95319 10.8078 9.56083 10.9199 9.13082C11.0321 8.7008 11.0275 8.24867 10.9068 7.82098C10.7861 7.39329 10.5536 7.0055 10.2332 6.69755C9.91282 6.3896 9.51612 6.17263 9.08399 6.06897C8.91101 6.02757 8.75221 5.94079 8.62394 5.81757C8.49568 5.69435 8.40261 5.53915 8.35431 5.36797C8.30601 5.19679 8.30424 5.01583 8.34919 4.84374C8.39413 4.67166 8.48416 4.51467 8.60999 4.38897L10.293 2.70697C10.5171 2.48279 10.7833 2.30497 11.0762 2.18364C11.369 2.06232 11.683 1.99988 12 1.99988C12.317 1.99988 12.6309 2.06232 12.9238 2.18364C13.2167 2.30497 13.4828 2.48279 13.707 2.70697L15.39 4.38997Z" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    ),
  },
  {
    title: 'Miscellaneous',
    description: "Other tools and items that don't fit in a specific category",
    href: '/accessories/miscellaneous',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    ),
  },
];

export default function AccessoriesMenu() {
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
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 4.66666V14" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.00004 12C1.82323 12 1.65366 11.9298 1.52864 11.8047C1.40361 11.6797 1.33337 11.5101 1.33337 11.3333V2.66667C1.33337 2.48986 1.40361 2.32029 1.52864 2.19526C1.65366 2.07024 1.82323 2 2.00004 2H5.33337C6.04062 2 6.7189 2.28095 7.21899 2.78105C7.71909 3.28115 8.00004 3.95942 8.00004 4.66667C8.00004 3.95942 8.28099 3.28115 8.78109 2.78105C9.28119 2.28095 9.95946 2 10.6667 2H14C14.1769 2 14.3464 2.07024 14.4714 2.19526C14.5965 2.32029 14.6667 2.48986 14.6667 2.66667V11.3333C14.6667 11.5101 14.5965 11.6797 14.4714 11.8047C14.3464 11.9298 14.1769 12 14 12H10C9.46961 12 8.9609 12.2107 8.58583 12.5858C8.21075 12.9609 8.00004 13.4696 8.00004 14C8.00004 13.4696 7.78933 12.9609 7.41425 12.5858C7.03918 12.2107 6.53047 12 6.00004 12H2.00004Z" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  <span className="text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5 group-hover:text-amber-500 transition-colors">
                    Read this article
                  </span>
                </Link>
                <Link href="/support/expert" className="self-stretch inline-flex justify-start items-end gap-2 group">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.26671 13.3333C6.53909 13.986 8.00276 14.1628 9.39397 13.8318C10.7852 13.5009 12.0124 12.6839 12.8545 11.5281C13.6967 10.3723 14.0983 8.9538 13.9871 7.5281C13.8759 6.1024 13.2591 4.7633 12.2479 3.75212C11.2367 2.74093 9.89763 2.12416 8.47193 2.01293C7.04623 1.90171 5.62769 2.30335 4.47192 3.14549C3.31615 3.98762 2.49917 5.21486 2.16819 6.60607C1.83721 7.99727 2.014 9.46094 2.66671 10.7333L1.33337 14.6667L5.26671 13.3333Z" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  <span className="text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5 group-hover:text-amber-500 transition-colors">
                    Talk to an expert
                  </span>
                </Link>
                <Link href="/resources/knowledge-base" className="self-stretch inline-flex justify-start items-end gap-2 group">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5.33334C11.3137 5.33334 14 4.43791 14 3.33334C14 2.22877 11.3137 1.33334 8 1.33334C4.68629 1.33334 2 2.22877 2 3.33334C2 4.43791 4.68629 5.33334 8 5.33334Z" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 3.33334V12.6667C2 13.1971 2.63214 13.7058 3.75736 14.0809C4.88258 14.456 6.4087 14.6667 8 14.6667C9.5913 14.6667 11.1174 14.456 12.2426 14.0809C13.3679 13.7058 14 13.1971 14 12.6667V3.33334" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 8C2 8.53043 2.63214 9.03914 3.75736 9.41421C4.88258 9.78929 6.4087 10 8 10C9.5913 10 11.1174 9.78929 12.2426 9.41421C13.3679 9.03914 14 8.53043 14 8" stroke="#F18800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
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
        href="/accessories"
        className="self-stretch px-6 py-4 bg-amber-500 rounded-bl-xl rounded-br-xl inline-flex justify-between items-center hover:bg-amber-600 transition-colors"
      >
        <span className="text-white text-base font-semibold font-['Segoe_UI'] leading-6">
          All Accessories
        </span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.8225 4.44751L15.375 9.00001L10.8225 13.5525" stroke="white" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.625 9H15.2475" stroke="white" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </Link>
    </div>
  );
}
