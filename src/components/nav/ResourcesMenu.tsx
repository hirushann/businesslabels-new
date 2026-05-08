'use client';

import Link from 'next/link';

const columnOne = [
  {
    title: 'Software',
    description: 'Software to design and print labels',
    href: '/resources/software',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 18L22 12L16 6" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6L2 12L8 18" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    title: 'Recycling Program',
    description: 'Return and recycle used labels and ribbons',
    href: '/resources/recycling',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.00001 19H4.81501C4.49958 19.0009 4.18927 18.9203 3.91418 18.7659C3.6391 18.6116 3.40859 18.3887 3.24501 18.119C3.08792 17.8481 3.00486 17.5407 3.00415 17.2275C3.00345 16.9144 3.08514 16.6066 3.24101 16.335L7.19601 9.5" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 19H19.203C19.5169 18.9975 19.8249 18.9144 20.0974 18.7585C20.3699 18.6027 20.5978 18.3793 20.759 18.11C20.9139 17.8398 20.9954 17.5339 20.9954 17.2225C20.9954 16.9111 20.9139 16.6051 20.759 16.335L19.533 14.215" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 16L11 19L14 22" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.29298 13.596L7.19598 9.5L3.09998 10.598" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.34399 5.811L10.437 3.919C10.5939 3.6454 10.8189 3.41701 11.0902 3.25599C11.3614 3.09497 11.6696 3.00679 11.985 3C12.2979 2.99942 12.6055 3.08116 12.8769 3.23703C13.1482 3.39289 13.3738 3.6174 13.531 3.888L17.474 10.731" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.378 9.63301L17.474 10.731L18.571 6.63501" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    title: 'Knowledge',
    description: 'Guides and resources to help you learn',
    href: '/resources/knowledge',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 7V21" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 18C2.73478 18 2.48043 17.8946 2.29289 17.7071C2.10536 17.5196 2 17.2652 2 17V4C2 3.73478 2.10536 3.48043 2.29289 3.29289C2.48043 3.10536 2.73478 3 3 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7C12 5.93913 12.4214 4.92172 13.1716 4.17157C13.9217 3.42143 14.9391 3 16 3H21C21.2652 3 21.5196 3.10536 21.7071 3.29289C21.8946 3.48043 22 3.73478 22 4V17C22 17.2652 21.8946 17.5196 21.7071 17.7071C21.5196 17.8946 21.2652 18 21 18H15C14.2044 18 13.4413 18.3161 12.8787 18.8787C12.3161 19.4413 12 20.2044 12 21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H3Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    title: 'Videos',
    description: 'Watch demos, tutorials, and how-to videos',
    href: '/resources/videos',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 13L21.223 16.482C21.2983 16.5321 21.3858 16.5609 21.4761 16.5652C21.5664 16.5695 21.6563 16.5493 21.736 16.5066C21.8157 16.4639 21.8824 16.4004 21.9289 16.3228C21.9754 16.2452 22 16.1565 22 16.066V7.87002C22 7.78204 21.9768 7.69562 21.9328 7.61947C21.8887 7.54332 21.8253 7.48014 21.7491 7.43632C21.6728 7.3925 21.5863 7.36958 21.4983 7.36988C21.4103 7.37017 21.324 7.39368 21.248 7.43802L16 10.5" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18H14C15.1046 18 16 17.1046 16 16V8C16 6.89543 15.1046 6 14 6Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
];

const columnTwo = [
  {
    title: 'Blogs',
    description: 'Tips and insights on labeling and printing',
    href: '/blogs',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7L15 2Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V6C14 6.53043 14.2107 7.03914 14.5858 7.41421C14.9609 7.78929 15.4696 8 16 8H20" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 9H8" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 13H8" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 17H8" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    title: 'Faq',
    description: 'Find answers to common questions',
    href: '/resources/faq',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.08997 8.99996C9.32507 8.33163 9.78912 7.76807 10.3999 7.40909C11.0107 7.05012 11.7289 6.9189 12.4271 7.03867C13.1254 7.15844 13.7588 7.52148 14.215 8.06349C14.6713 8.60549 14.921 9.29148 14.92 9.99996C14.92 12 11.92 13 11.92 13" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 17H12.01" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    title: 'Sitemap',
    description: 'Overview of pages to help navigation',
    href: '/resources/sitemap',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.106 5.55302C14.3836 5.69173 14.6897 5.76395 15 5.76395C15.3103 5.76395 15.6164 5.69173 15.894 5.55302L19.553 3.72302C19.7056 3.64678 19.8751 3.61083 20.0455 3.61858C20.2159 3.62634 20.3814 3.67755 20.5265 3.76735C20.6715 3.85714 20.7911 3.98253 20.874 4.1316C20.9569 4.28067 21.0003 4.44846 21 4.61902V17.383C20.9999 17.5687 20.9481 17.7506 20.8505 17.9085C20.7528 18.0664 20.6131 18.194 20.447 18.277L15.894 20.554C15.6164 20.6927 15.3103 20.7649 15 20.7649C14.6897 20.7649 14.3836 20.6927 14.106 20.554L9.894 18.448C9.6164 18.3093 9.31033 18.2371 9 18.2371C8.68967 18.2371 8.3836 18.3093 8.106 18.448L4.447 20.278C4.29436 20.3543 4.12473 20.3902 3.95426 20.3824C3.78379 20.3746 3.61816 20.3233 3.47312 20.2334C3.32808 20.1435 3.20846 20.018 3.12565 19.8688C3.04284 19.7196 2.99958 19.5517 3 19.381V6.61802C3.0001 6.43235 3.05189 6.25039 3.14956 6.09249C3.24722 5.93459 3.38692 5.80701 3.553 5.72402L8.106 3.44702C8.3836 3.3083 8.68967 3.23608 9 3.23608C9.31033 3.23608 9.6164 3.3083 9.894 3.44702L14.106 5.55302Z" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 5.76404V20.764" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 3.23596V18.236" stroke="#F18800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
];

function MenuColumn({ items }: { items: typeof columnOne }) {
  return (
    <div className="flex-1 inline-flex flex-col justify-start items-start gap-6">
      {items.map((item, i) => (
        <div key={item.title} className="w-full">
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
          {i < items.length - 1 && (
            <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-gray-100 mt-6" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ResourcesMenu() {
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
