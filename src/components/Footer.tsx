import Image from 'next/image';
import Link from 'next/link';

const trustItems = [
  {
    title: 'Epson Gold Partner',
    sub: 'Certified compatibility',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25.795 21.4834L28.32 35.6934C28.3483 35.8607 28.3248 36.0327 28.2527 36.1863C28.1806 36.3399 28.0633 36.4679 27.9165 36.5531C27.7698 36.6382 27.6005 36.6766 27.4313 36.6629C27.2622 36.6493 27.1012 36.5843 26.97 36.4767L21.0033 31.9984C20.7153 31.7832 20.3654 31.6669 20.0058 31.6669C19.6463 31.6669 19.2964 31.7832 19.0083 31.9984L13.0317 36.4751C12.9005 36.5825 12.7398 36.6473 12.5708 36.661C12.4019 36.6746 12.2328 36.6364 12.0861 36.5515C11.9394 36.4666 11.8221 36.3389 11.7499 36.1856C11.6776 36.0323 11.6538 35.8606 11.6817 35.6934L14.205 21.4834" stroke="#F18800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 23.3335C25.5228 23.3335 30 18.8563 30 13.3335C30 7.81065 25.5228 3.3335 20 3.3335C14.4772 3.3335 10 7.81065 10 13.3335C10 18.8563 14.4772 23.3335 20 23.3335Z" stroke="#F18800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    ),
  },
  {
    title: '12,000+ Customers',
    sub: 'Trusted worldwide',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M26.6667 35V31.6667C26.6667 29.8986 25.9643 28.2029 24.7141 26.9526C23.4638 25.7024 21.7681 25 20 25H10C8.2319 25 6.53621 25.7024 5.28597 26.9526C4.03572 28.2029 3.33334 29.8986 3.33334 31.6667V35" stroke="#F18800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 18.3333C18.6819 18.3333 21.6667 15.3486 21.6667 11.6667C21.6667 7.98477 18.6819 5 15 5C11.3181 5 8.33334 7.98477 8.33334 11.6667C8.33334 15.3486 11.3181 18.3333 15 18.3333Z" stroke="#F18800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M36.6667 35.0001V31.6668C36.6656 30.1897 36.1739 28.7548 35.269 27.5873C34.364 26.4199 33.0969 25.5861 31.6667 25.2168" stroke="#F18800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M26.6667 5.2168C28.1007 5.58397 29.3717 6.41797 30.2794 7.58731C31.1871 8.75666 31.6798 10.1948 31.6798 11.6751C31.6798 13.1554 31.1871 14.5936 30.2794 15.7629C29.3717 16.9323 28.1007 17.7663 26.6667 18.1335" stroke="#F18800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Secure Payments',
    sub: 'Safe & encrypted',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M33.3334 21.6666C33.3334 29.9999 27.5 34.1666 20.5667 36.5833C20.2036 36.7063 19.8093 36.7004 19.45 36.5666C12.5 34.1666 6.66669 29.9999 6.66669 21.6666V9.99994C6.66669 9.55791 6.84228 9.13399 7.15484 8.82142C7.4674 8.50886 7.89133 8.33327 8.33335 8.33327C11.6667 8.33327 15.8334 6.33327 18.7334 3.79994C19.0864 3.49827 19.5356 3.33252 20 3.33252C20.4644 3.33252 20.9136 3.49827 21.2667 3.79994C24.1834 6.34994 28.3334 8.33327 31.6667 8.33327C32.1087 8.33327 32.5326 8.50886 32.8452 8.82142C33.1578 9.13399 33.3334 9.55791 33.3334 9.99994V21.6666Z" stroke="#F18800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 19.9998L18.3333 23.3332L25 16.6665" stroke="#F18800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Fast Shipping',
    sub: 'Next day available',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.3334 29.9998V9.99984C23.3334 9.11578 22.9822 8.26794 22.3571 7.64281C21.7319 7.01769 20.8841 6.6665 20 6.6665H6.66671C5.78265 6.6665 4.93481 7.01769 4.30968 7.64281C3.68456 8.26794 3.33337 9.11578 3.33337 9.99984V28.3332C3.33337 28.7752 3.50897 29.1991 3.82153 29.5117C4.13409 29.8242 4.55801 29.9998 5.00004 29.9998H8.33337" stroke="#F18800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M25 30H15" stroke="#F18800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M31.6667 30.0002H35C35.4421 30.0002 35.866 29.8246 36.1786 29.512C36.4911 29.1994 36.6667 28.7755 36.6667 28.3335V22.2502C36.666 21.8719 36.5367 21.5052 36.3 21.2102L30.5 13.9602C30.3442 13.765 30.1464 13.6073 29.9214 13.4988C29.6964 13.3904 29.4498 13.3339 29.2 13.3335H23.3334" stroke="#F18800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M28.3333 33.3332C30.1743 33.3332 31.6667 31.8408 31.6667 29.9998C31.6667 28.1589 30.1743 26.6665 28.3333 26.6665C26.4924 26.6665 25 28.1589 25 29.9998C25 31.8408 26.4924 33.3332 28.3333 33.3332Z" stroke="#F18800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.6667 33.3332C13.5077 33.3332 15 31.8408 15 29.9998C15 28.1589 13.5077 26.6665 11.6667 26.6665C9.82576 26.6665 8.33337 28.1589 8.33337 29.9998C8.33337 31.8408 9.82576 33.3332 11.6667 33.3332Z" stroke="#F18800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    ),
  },
];

const footerLinks = {
  Products: ['Label Printers', 'Label Rolls', 'Ink & Supplies', 'Special Labels'],
  'Popular Printers': ['Epson C3500', 'Epson C6000', 'Epson C7500', 'Compare Models'],
  'Support & Services': ['Expert Advice', 'Test Printer Loan', 'Sample Prints', 'Ink Calculator', 'Help Center'],
};

export default function Footer() {
  return (
    <footer className="w-full flex flex-col">
      {/* Trust bar */}
      <div
        className="w-full px-10 py-8"
        style={{
          background:
            'linear-gradient(0deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03)), linear-gradient(0deg, #101828, #101828)',
        }}
      >
        <div className="max-w-[1512px] mx-auto w-full grid grid-cols-4 gap-4">
          {trustItems.map((item) => (
            <div key={item.title} className="flex justify-center items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-100 text-xl font-bold font-['Segoe_UI']">{item.title}</span>
                <span className="text-white/80 text-base font-normal font-['Segoe_UI'] leading-6">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="w-full pt-14 bg-gray-900 flex flex-col gap-4">
        <div className="max-w-[1512px] mx-auto w-full px-10 flex gap-8">
          {/* Brand column */}
          <div className="w-[480px] flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              {/* Logo */}
              <div>
                <Image
                  src="/footerlogo.png"
                  alt="BusinessLabels"
                  width={205}
                  height={40}
                  className="h-10 w-auto"
                />
              </div>

              <div>
                <p className="text-white/80 text-base font-normal font-['Segoe_UI'] leading-5">
                  BusinessLabels is onderdeel van Smart2B BV
                </p>
              </div>
              {/* Partner logos placeholder */}
              {/* <div className="flex flex-col gap-2">
                <div className="w-[276px] h-14 bg-white/10 rounded-md flex items-center justify-center">
                  <span className="text-white/60 text-sm">Epson ColorWorks Partner</span>
                </div>
                <div className="w-[276px] h-14 bg-white/10 rounded-md flex items-center justify-center">
                  <span className="text-white/60 text-sm">Diamondlabels</span>
                </div>
              </div>
              <p className="text-white/80 text-base font-normal font-['Segoe_UI'] leading-5">
                BusinessLabels is part of{' '}
                <Link href="#" className="text-white/80 font-semibold underline">Smart2B BV</Link>
              </p> */}
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-end gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.6669 11.2797V13.2797C14.6677 13.4654 14.6297 13.6492 14.5553 13.8193C14.4809 13.9894 14.3718 14.1421 14.235 14.2676C14.0982 14.3932 13.9367 14.4887 13.7608 14.5482C13.5849 14.6077 13.3985 14.6298 13.2136 14.6131C11.1622 14.3902 9.19161 13.6892 7.46028 12.5664C5.8495 11.5428 4.48384 10.1772 3.46028 8.56641C2.3336 6.82721 1.63244 4.84707 1.41361 2.78641C1.39695 2.60205 1.41886 2.41625 1.47795 2.24082C1.53703 2.0654 1.63199 1.9042 1.75679 1.76749C1.88159 1.63077 2.03348 1.52155 2.20281 1.44675C2.37213 1.37196 2.55517 1.33325 2.74028 1.33307H4.74028C5.06382 1.32989 5.37748 1.44446 5.62279 1.65543C5.8681 1.8664 6.02833 2.15937 6.07361 2.47974C6.15803 3.11978 6.31458 3.74822 6.54028 4.35307C6.62998 4.59169 6.64939 4.85102 6.59622 5.10033C6.54305 5.34964 6.41952 5.57848 6.24028 5.75974L5.39361 6.60641C6.34265 8.27544 7.72458 9.65737 9.39361 10.6064L10.2403 9.75974C10.4215 9.5805 10.6504 9.45697 10.8997 9.4038C11.149 9.35063 11.4083 9.37004 11.6469 9.45974C12.2518 9.68544 12.8802 9.84199 13.5203 9.92641C13.8441 9.97209 14.1399 10.1352 14.3513 10.3847C14.5627 10.6343 14.6751 10.9528 14.6669 11.2797Z" stroke="#F1F4F8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span className="text-slate-100 text-sm font-semibold leading-5">+31 (0)318 590 465</span>
              </div>
              <div className="flex items-end gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.334 13.6663H4.66732C2.66732 13.6663 1.33398 12.6663 1.33398 10.333V5.66634C1.33398 3.33301 2.66732 2.33301 4.66732 2.33301H11.334C13.334 2.33301 14.6673 3.33301 14.6673 5.66634V10.333C14.6673 12.6663 13.334 13.6663 11.334 13.6663Z" stroke="white" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.3327 6L9.24601 7.66667C8.55935 8.21333 7.43268 8.21333 6.74601 7.66667L4.66602 6" stroke="white" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span className="text-slate-100 text-sm font-semibold lowercase leading-5">
                  verkoop@businesslabels.nl
                </span>
              </div>
            </div>
            <div>
              <svg width="92" height="34" viewBox="0 0 92 34" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.8"><rect width="92" height="34" rx="4" fill="#1E2939"/><g clip-path="url(#clip0_207_89)"><path fill-rule="evenodd" clip-rule="evenodd" d="M82.6239 8H66.4322C65.6578 8 65 8.58029 65 9.29514V24.704C65 25.4197 65.4316 26 66.206 26H82.3977C83.173 26 84 25.4197 84 24.704V9.29514C84 8.58029 83.3992 8 82.6239 8Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M82.6239 8H66.4322C65.6578 8 65 8.58029 65 9.29514V24.704C65 25.4197 65.4316 26 66.206 26H82.3977C83.173 26 84 25.4197 84 24.704V9.29514C84 8.58029 83.3992 8 82.6239 8ZM72.2381 14.8571H74.7959V16.0923H74.8239C75.2139 15.4263 76.3656 14.75 77.7897 14.75C80.523 14.75 81.2857 16.1249 81.2857 18.6714V23.4286H78.5714V19.1403C78.5714 18.0003 78.091 17 76.9673 17C75.6029 17 74.9524 17.8751 74.9524 19.3117V23.4286H72.2381V14.8571ZM67.7143 23.4286H70.4286V14.8571H67.7143V23.4286ZM70.7679 11.8571C70.768 12.0682 70.7242 12.2771 70.639 12.4721C70.5539 12.6671 70.429 12.8443 70.2715 12.9936C70.1141 13.1429 69.9272 13.2613 69.7214 13.3421C69.5156 13.4229 69.2951 13.4645 69.0723 13.4646C68.8496 13.4646 68.629 13.4231 68.4232 13.3424C68.2174 13.2617 68.0304 13.1434 67.8728 12.9942C67.7153 12.845 67.5903 12.6679 67.5051 12.4729C67.4198 12.278 67.3759 12.069 67.3759 11.858C67.3759 11.4319 67.5545 11.0233 67.8724 10.722C68.1904 10.4206 68.6217 10.2513 69.0714 10.2512C69.5212 10.251 69.9526 10.4202 70.2707 10.7213C70.5888 11.0225 70.7677 11.4311 70.7679 11.8571Z" fill="#0275B9"/><path d="M62.2857 23.4289H59.7524V22.4081H59.7252C59.1616 23.0269 58.1826 23.5361 56.5233 23.5361C54.2614 23.5361 52.3134 21.9238 52.3134 19.1526C52.3134 16.5126 54.2333 14.7503 56.6083 14.7503C58.0786 14.7503 58.9915 15.2458 59.5443 15.8783H59.5714V10.5718H62.2857V23.4289ZM57.2905 16.6789C55.7389 16.6789 54.8667 17.7272 54.8667 19.1209C54.8667 20.5155 55.7389 21.6075 57.2905 21.6075C58.844 21.6075 59.7524 20.5438 59.7524 19.1209C59.7524 17.6586 58.844 16.6789 57.2905 16.6789ZM51.1219 22.0481C50.4813 22.8341 49.1621 23.5361 47.0323 23.5361C44.1914 23.5361 42.3819 21.7532 42.3819 18.9529C42.3819 16.4646 44.0204 14.7503 47.1119 14.7503C49.7819 14.7503 51.4286 16.4115 51.4286 19.3335C51.4286 19.6249 51.3788 19.9146 51.3788 19.9146H44.9423L44.9577 20.1795C45.1359 20.9183 45.7249 21.8218 47.0767 21.8218C48.2565 21.8218 49.0653 21.2209 49.4309 20.7503L51.1219 22.0481ZM48.8165 18.2852C48.8346 17.3818 48.1343 16.4646 47.0305 16.4646C45.7168 16.4646 45.0156 17.4366 44.9423 18.2861H48.8165V18.2852Z" fill="white"/><path d="M42.381 14.8574H39.2143L36.0476 18.2859V10.5717H33.3333V23.4288H36.0476V19.1431L39.3943 23.4288H42.599L38.7619 18.7428L42.381 14.8574ZM22.4762 14.8574H25.034V16.0925H25.062C25.452 15.4265 26.6037 14.7502 28.0278 14.7502C30.7611 14.7502 31.5238 16.3934 31.5238 18.6717V23.4288H28.8095V19.1405C28.8095 17.8788 28.3291 17.0002 27.2054 17.0002C25.841 17.0002 25.1905 18.0237 25.1905 19.3119V23.4288H22.4762V14.8574ZM17.9524 23.4288H20.6667V14.8574H17.9524V23.4288ZM19.3104 13.4002C19.5275 13.4051 19.7433 13.3688 19.9453 13.2934C20.1474 13.2181 20.3314 13.1053 20.4867 12.9615C20.642 12.8178 20.7655 12.6462 20.8497 12.4566C20.934 12.2671 20.9774 12.0635 20.9774 11.8578C20.9774 11.6521 20.934 11.4485 20.8497 11.259C20.7655 11.0694 20.642 10.8978 20.4867 10.7541C20.3314 10.6103 20.1474 10.4975 19.9453 10.4222C19.7433 10.3468 19.5275 10.3105 19.3104 10.3154C18.8853 10.3249 18.4809 10.4915 18.1837 10.7798C17.8866 11.068 17.7202 11.4549 17.7202 11.8578C17.7202 12.2607 17.8866 12.6476 18.1837 12.9358C18.4809 13.2241 18.8853 13.3907 19.3104 13.4002ZM10.7143 10.5717H8V23.4288H16.1429V20.8574H10.7143V10.5717Z" fill="white"/></g></g><defs><clipPath id="clip0_207_89"><rect width="76" height="18" fill="white" transform="translate(8 8)"/></clipPath></defs></svg>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="w-56 flex flex-col gap-5">
              <span className="text-white text-lg font-semibold font-['Segoe_UI'] leading-6">{title}</span>
              <div className="flex flex-col gap-4">
                {links.map((link) => (
                  <Link
                    key={link}
                    href="#"
                    className="text-white/80 text-base font-normal font-['Segoe_UI'] leading-5 hover:text-white transition-colors"
                  >
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="max-w-[1512px] mx-auto w-full px-10 pt-6 pb-10 border-t border-slate-800 flex justify-between items-center">
          <span className="text-white/60 text-sm font-normal font-['Segoe_UI'] leading-5">
            © 2026 BusinessLabels by Supplify. All rights reserved.
          </span>
          <div className="flex gap-5">
            {['Privacy Policy', 'Terms & Conditions', 'Cookie Policy'].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-white/60 text-sm font-normal font-['Segoe_UI'] leading-5 hover:text-white/80 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
