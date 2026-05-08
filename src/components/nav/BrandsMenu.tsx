'use client';

import Link from 'next/link';

const columnOne = [
  {
    title: 'EPSON',
    description: 'World-leading color and thermal label printing solutions',
    href: '/brand/epson',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M6 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V16C22 16.5304 21.7893 17.0391 21.4142 17.4142C21.0391 17.7893 20.5304 18 20 18H18"
          stroke="#F18800"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 9V3C6 2.73478 6.10536 2.48043 6.29289 2.29289C6.48043 2.10536 6.73478 2 7 2H17C17.2652 2 17.5196 2.10536 17.7071 2.29289C17.8946 2.48043 18 2.73478 18 3V9"
          stroke="#F18800"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 14H7C6.44772 14 6 14.4477 6 15V21C6 21.5523 6.44772 22 7 22H17C17.5523 22 18 21.5523 18 21V15C18 14.4477 17.5523 14 17 14Z"
          stroke="#F18800"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'SII',
    description: 'Precision thermal printer mechanisms and solutions',
    href: '/brand/sii',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 18L22 12L16 6" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6L2 12L8 18" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'GoDEX',
    description: 'High-performance desktop and industrial label printers',
    href: '/brand/godex',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3.99999 14C3.81076 14.0006 3.62522 13.9476 3.46495 13.847C3.30467 13.7464 3.17623 13.6023 3.09454 13.4316C3.01286 13.2609 2.98129 13.0706 3.00349 12.8826C3.0257 12.6947 3.10077 12.5169 3.21999 12.37L13.12 2.16998C13.1943 2.08426 13.2955 2.02634 13.407 2.00571C13.5185 1.98509 13.6337 2.00299 13.7337 2.05648C13.8337 2.10998 13.9126 2.19588 13.9573 2.30009C14.0021 2.4043 14.0101 2.52063 13.98 2.62998L12.06 8.64998C12.0034 8.8015 11.9844 8.9645 12.0046 9.12499C12.0248 9.28547 12.0837 9.43866 12.1761 9.57141C12.2685 9.70415 12.3918 9.8125 12.5353 9.88714C12.6788 9.96179 12.8382 10.0005 13 9.99998H20C20.1892 9.99934 20.3748 10.0524 20.535 10.153C20.6953 10.2536 20.8238 10.3976 20.9054 10.5683C20.9871 10.739 21.0187 10.9294 20.9965 11.1173C20.9743 11.3053 20.8992 11.483 20.78 11.63L10.88 21.83C10.8057 21.9157 10.7045 21.9736 10.593 21.9942C10.4815 22.0149 10.3663 21.997 10.2663 21.9435C10.1663 21.89 10.0874 21.8041 10.0427 21.6999C9.99791 21.5957 9.98991 21.4793 10.02 21.37L11.94 15.35C11.9966 15.1985 12.0156 15.0355 11.9954 14.875C11.9752 14.7145 11.9163 14.5613 11.8239 14.4286C11.7315 14.2958 11.6082 14.1875 11.4647 14.1128C11.3212 14.0382 11.1617 13.9995 11 14H3.99999Z"
          stroke="#F18800"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const columnTwo = [
  {
    title: 'diamondlabels',
    description: 'Premium labels and consumables for all printer brands',
    href: '/brand/diamondlabels',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 22C13.8565 22 15.637 21.2625 16.9497 19.9497C18.2625 18.637 19 16.8565 19 15C19 13 18 11.1 16 9.5C14 7.9 12.5 5.5 12 3C11.5 5.5 10 7.9 8 9.5C6 11.1 5 13 5 15C5 16.8565 5.7375 18.637 7.05025 19.9497C8.36301 21.2625 10.1435 22 12 22Z"
          stroke="#F18800"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'EXPO BADGE',
    description: 'On-demand color badge printing for events and exhibitions',
    href: '/brand/expo_badge',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z"
          stroke="#F18800"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M7 10H11" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 14H11" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 10H17" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 14H17" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function MenuColumn({ items }: { items: typeof columnOne }) {
  return (
    <div className="flex-1 inline-flex flex-col justify-start items-start gap-6">
      {items.map((item, i) => (
        <div key={item.title} className="w-full">
          <Link href={item.href} className="self-stretch inline-flex justify-start items-center gap-3 group">
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
              className="w-4 h-4 text-zinc-500 flex-shrink-0 rotate-[-90deg] group-hover:text-amber-500 transition-colors"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>
          {i < items.length - 1 && (
            <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-gray-100 mt-6" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BrandsMenu() {
  return (
    <div className="w-[832px] inline-flex flex-col justify-start items-start">
      <div className="self-stretch p-6 bg-white rounded-xl shadow-[0px_10px_20px_0px_rgba(80,100,121,0.15)] flex flex-col justify-start items-center gap-10">
        <div className="w-[784px] inline-flex justify-start items-start gap-6">
          <MenuColumn items={columnOne} />
          <MenuColumn items={columnTwo} />
        </div>
      </div>
    </div>
  );
}
