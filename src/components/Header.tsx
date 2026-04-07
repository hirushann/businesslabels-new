'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import SearchOverlay from './search/SearchOverlay';

const navItems = [
  { label: 'Home', href: '/', active: true },
  { label: 'Printers', href: '/printers', dropdown: true },
  { label: 'Accessories', href: '/accessories', dropdown: true },
  { label: 'Labels and tickets', href: '/labels', dropdown: true },
  { label: 'Resources', href: '/resources', dropdown: true },
  { label: 'Brands', href: '/brands' },
  { label: 'Support', href: '/support' },
];

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="w-full left-0 top-0 z-50 flex flex-col items-center">
      {/* Top bar */}
      <div className="w-full px-10 py-2.5 bg-sky-950 flex flex-col">
        <div className="max-w-[1440px] mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-end gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.33398 12.0003V4.00033C9.33398 3.6467 9.19351 3.30756 8.94346 3.05752C8.69341 2.80747 8.35427 2.66699 8.00065 2.66699H2.66732C2.3137 2.66699 1.97456 2.80747 1.72451 3.05752C1.47446 3.30756 1.33398 3.6467 1.33398 4.00033V11.3337C1.33398 11.5105 1.40422 11.68 1.52925 11.8051C1.65427 11.9301 1.82384 12.0003 2.00065 12.0003H3.33398" stroke="#F1F4F8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 12H6" stroke="#F1F4F8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12.6673 11.9997H14.0007C14.1775 11.9997 14.347 11.9294 14.4721 11.8044C14.5971 11.6794 14.6673 11.5098 14.6673 11.333V8.89967C14.667 8.74838 14.6153 8.60168 14.5207 8.48367L12.2007 5.58367C12.1383 5.50559 12.0592 5.44253 11.9692 5.39914C11.8792 5.35575 11.7806 5.33315 11.6807 5.33301H9.33398" stroke="#F1F4F8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.3333 13.3337C12.0697 13.3337 12.6667 12.7367 12.6667 12.0003C12.6667 11.2639 12.0697 10.667 11.3333 10.667C10.597 10.667 10 11.2639 10 12.0003C10 12.7367 10.597 13.3337 11.3333 13.3337Z" stroke="#F1F4F8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.66732 13.3337C5.4037 13.3337 6.00065 12.7367 6.00065 12.0003C6.00065 11.2639 5.4037 10.667 4.66732 10.667C3.93094 10.667 3.33398 11.2639 3.33398 12.0003C3.33398 12.7367 3.93094 13.3337 4.66732 13.3337Z" stroke="#F1F4F8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-white text-sm font-normal leading-5">
                Free shipping BeNeLux &amp; Germany from €500
              </span>
            </div>
            <div className="flex items-end gap-2">
              <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.16894 8.50174C1.04278 8.50217 0.919094 8.46679 0.812242 8.39972C0.705391 8.33265 0.619763 8.23664 0.565307 8.12284C0.510851 8.00904 0.489802 7.88213 0.504606 7.75684C0.519411 7.63156 0.56946 7.51304 0.64894 7.41507L7.24894 0.615071C7.29845 0.557925 7.36591 0.519308 7.44026 0.505559C7.51461 0.49181 7.59142 0.503746 7.65809 0.539407C7.72476 0.575068 7.77733 0.632335 7.80716 0.701809C7.837 0.771283 7.84233 0.848836 7.82227 0.921737L6.54227 4.93507C6.50453 5.03609 6.49185 5.14475 6.50533 5.25174C6.51881 5.35873 6.55805 5.46086 6.61967 5.54936C6.68129 5.63785 6.76346 5.71008 6.85912 5.75984C6.95479 5.80961 7.0611 5.83542 7.16894 5.83507H11.8356C11.9618 5.83464 12.0855 5.87002 12.1923 5.93709C12.2992 6.00416 12.3848 6.10017 12.4392 6.21397C12.4937 6.32777 12.5147 6.45468 12.4999 6.57997C12.4851 6.70525 12.4351 6.82376 12.3556 6.92174L5.75561 13.7217C5.7061 13.7789 5.63863 13.8175 5.56429 13.8312C5.48994 13.845 5.41312 13.8331 5.34645 13.7974C5.27978 13.7617 5.22722 13.7045 5.19738 13.635C5.16755 13.5655 5.16222 13.488 5.18227 13.4151L6.46227 9.40174C6.50002 9.30072 6.51269 9.19206 6.49921 9.08507C6.48573 8.97808 6.4465 8.87595 6.38488 8.78745C6.32326 8.69896 6.24109 8.62673 6.14542 8.57696C6.04976 8.5272 5.94344 8.50139 5.83561 8.50174H1.16894Z" stroke="#F1F4F8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-white text-sm font-normal leading-5">
                Fast delivery from stock
              </span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-end gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_89_3576)">
                <path d="M14.6669 11.2797V13.2797C14.6677 13.4654 14.6297 13.6492 14.5553 13.8193C14.4809 13.9894 14.3718 14.1421 14.235 14.2676C14.0982 14.3932 13.9367 14.4887 13.7608 14.5482C13.5849 14.6077 13.3985 14.6298 13.2136 14.6131C11.1622 14.3902 9.19161 13.6892 7.46028 12.5664C5.8495 11.5428 4.48384 10.1772 3.46028 8.56641C2.3336 6.82721 1.63244 4.84707 1.41361 2.78641C1.39695 2.60205 1.41886 2.41625 1.47795 2.24082C1.53703 2.0654 1.63199 1.9042 1.75679 1.76749C1.88159 1.63077 2.03348 1.52155 2.20281 1.44675C2.37213 1.37196 2.55517 1.33325 2.74028 1.33307H4.74028C5.06382 1.32989 5.37748 1.44446 5.62279 1.65543C5.8681 1.8664 6.02833 2.15937 6.07361 2.47974C6.15803 3.11978 6.31458 3.74822 6.54028 4.35307C6.62998 4.59169 6.64939 4.85102 6.59622 5.10033C6.54305 5.34964 6.41952 5.57848 6.24028 5.75974L5.39361 6.60641C6.34265 8.27544 7.72458 9.65737 9.39361 10.6064L10.2403 9.75974C10.4215 9.5805 10.6504 9.45697 10.8997 9.4038C11.149 9.35063 11.4083 9.37004 11.6469 9.45974C12.2518 9.68544 12.8802 9.84199 13.5203 9.92641C13.8441 9.97209 14.1399 10.1352 14.3513 10.3847C14.5627 10.6343 14.6751 10.9528 14.6669 11.2797Z" stroke="#F1F4F8" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                <defs>
                <clipPath id="clip0_89_3576">
                <rect width="16" height="16" fill="white"/>
                </clipPath>
                </defs>
              </svg>
              <span className="text-slate-100 text-sm font-semibold leading-5">+31 (0)318 590 465</span>
            </div>
            <div className="flex items-end gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.334 13.6663H4.66732C2.66732 13.6663 1.33398 12.6663 1.33398 10.333V5.66634C1.33398 3.33301 2.66732 2.33301 4.66732 2.33301H11.334C13.334 2.33301 14.6673 3.33301 14.6673 5.66634V10.333C14.6673 12.6663 13.334 13.6663 11.334 13.6663Z" stroke="white" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.3327 6L9.24601 7.66667C8.55935 8.21333 7.43268 8.21333 6.74601 7.66667L4.66602 6" stroke="white" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-slate-100 text-sm font-semibold lowercase leading-5">
                verkoop@businesslabels.nl
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav row */}
      <div className="w-full px-10 py-4 bg-white border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto w-full flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="BusinessLabels"
              width={205}
              height={40}
              priority
              className="w-auto"
            />
          </Link>

          {/* Search */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-96 px-4 py-3 rounded-full border border-slate-100 flex items-center gap-2 overflow-hidden text-left cursor-text"
            aria-label="Open product search"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6.75" cy="6.75" r="5.25" stroke="#9CA3AF" strokeWidth="1.5" />
              <path d="M11.5 11.5L14.5 14.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-zinc-500 text-sm font-normal leading-5">Search...</span>
          </button>

          {/* Right controls */}
          <div className="flex items-center gap-5">
            {/* Need help CTA */}
            <div className="pl-1.5 pr-8 py-2.5 bg-white rounded-full shadow border border-slate-100 flex items-center gap-2">
              <div className="flex items-center -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-1.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="5" r="2.5" fill="white" fillOpacity="0.8" />
                      <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" fill="white" fillOpacity="0.8" />
                    </svg>
                  </div>
                ))}
              </div>
              <span className="text-neutral-800 text-sm font-semibold leading-5">Need help?</span>
            </div>
            {/* Language */}
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 bg-sky-600 rounded-sm flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-sky-600 via-white to-sky-600" />
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="#6B7280" strokeWidth="1.33" strokeLinecap="round" />
              </svg>
            </div>
            {/* User */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="cursor-pointer">
              <circle cx="12" cy="8" r="4" stroke="#404040" strokeWidth="1.5" />
              <path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="#404040" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {/* Wishlist */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="cursor-pointer">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#404040" strokeWidth="1.5" />
            </svg>
            {/* Cart */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 22C8.55228 22 9 21.5523 9 21C9 20.4477 8.55228 20 8 20C7.44772 20 7 20.4477 7 21C7 21.5523 7.44772 22 8 22Z" stroke="#444444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 22C19.5523 22 20 21.5523 20 21C20 20.4477 19.5523 20 19 20C18.4477 20 18 20.4477 18 21C18 21.5523 18.4477 22 19 22Z" stroke="#444444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.05078 2.04999H4.05078L6.71078 14.47C6.80836 14.9248 7.06145 15.3315 7.42649 15.6198C7.79153 15.9082 8.24569 16.0603 8.71078 16.05H18.4908C18.946 16.0493 19.3873 15.8933 19.7418 15.6078C20.0963 15.3224 20.3429 14.9245 20.4408 14.48L22.0908 7.04999H5.12078" stroke="#444444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="w-full px-10 py-2 relative bg-gray-50 border-t border-violet-50">
        <div className="max-w-[1440px] mx-auto w-full flex justify-between items-center">
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-end gap-2 relative ${
                  item.active
                    ? 'text-sky-950 font-semibold'
                    : 'text-stone-500 font-normal hover:text-sky-950 transition-colors'
                } text-base font-['Segoe_UI'] leading-5`}
              >
                {item.label}
                {item.dropdown && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" />
                  </svg>
                )}
                {item.active && (
                  <span className="absolute -bottom-2 left-0 w-11 h-0.5 bg-sky-950 rounded" />
                )}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/custom" className="text-amber-500 text-base font-semibold leading-6">
              Custom-made Form
            </Link>
            <Link
              href="/finder"
              className="px-4 py-2 bg-amber-500 rounded-full flex items-center gap-2 text-white text-base font-semibold hover:bg-amber-600 transition-colors"
            >
              Product Finder
            </Link>
          </div>
        </div>
      </div>

      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
    </header>
  );
}
