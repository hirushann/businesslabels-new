import Image from 'next/image';

const features = [
  {
    title: 'Large Stock, Order from 1 Roll',
    desc: 'Flexible order quantities for testing and small businesses.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 17L13.5 8.5L8.5 13.5L2 7" stroke="#F18800" stroke-width="1.5" strokeLinecap="round" stroke-linejoin="round"/><path d="M16 17H22V11" stroke="#F18800" stroke-width="1.5" strokeLinecap="round" stroke-linejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Epson ColorWorks Gold Partner',
    desc: 'Deep printer knowledge and authorized label partner status',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 17L13 19C13.197 19.197 13.4308 19.3532 13.6882 19.4598C13.9456 19.5665 14.2214 19.6213 14.5 19.6213C14.7786 19.6213 15.0544 19.5665 15.3118 19.4598C15.5692 19.3532 15.803 19.197 16 19C16.197 18.803 16.3532 18.5692 16.4598 18.3118C16.5665 18.0544 16.6213 17.7786 16.6213 17.5C16.6213 17.2214 16.5665 16.9456 16.4598 16.6882C16.3532 16.4308 16.197 16.197 16 16" stroke="#F18800" stroke-width="1.5" strokeLinecap="round" stroke-linejoin="round"/><path d="M14.0002 13.9995L16.5002 16.4995C16.8981 16.8974 17.4376 17.1208 18.0002 17.1208C18.5628 17.1208 19.1024 16.8974 19.5002 16.4995C19.8981 16.1017 20.1215 15.5621 20.1215 14.9995C20.1215 14.4369 19.8981 13.8974 19.5002 13.4995L15.6202 9.61953C15.0577 9.05773 14.2952 8.74217 13.5002 8.74217C12.7052 8.74217 11.9427 9.05773 11.3802 9.61953L10.5002 10.4995C10.1024 10.8974 9.56284 11.1208 9.00023 11.1208C8.43762 11.1208 7.89805 10.8974 7.50023 10.4995C7.1024 10.1017 6.87891 9.56214 6.87891 8.99953C6.87891 8.43692 7.1024 7.89735 7.50023 7.49953L10.3102 4.68953C11.2225 3.77967 12.4121 3.20008 13.6909 3.0425C14.9696 2.88492 16.2644 3.15836 17.3702 3.81953L17.8402 4.09953C18.266 4.35651 18.7723 4.44564 19.2602 4.34953L21.0002 3.99953" stroke="#F18800" stroke-width="1.5" strokeLinecap="round" stroke-linejoin="round"/><path d="M21 3L22 14H20" stroke="#F18800" stroke-width="1.5" strokeLinecap="round" stroke-linejoin="round"/><path d="M3 3L2 14L8.5 20.5C8.89782 20.8978 9.43739 21.1213 10 21.1213C10.5626 21.1213 11.1022 20.8978 11.5 20.5C11.8978 20.1022 12.1213 19.5626 12.1213 19C12.1213 18.4374 11.8978 17.8978 11.5 17.5" stroke="#F18800" stroke-width="1.5" strokeLinecap="round" stroke-linejoin="round"/><path d="M3 4H11" stroke="#F18800" stroke-width="1.5" strokeLinecap="round" stroke-linejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Diamondlabels Quality Materials',
    desc: 'Best material selection and custom ICC profiles under our brand.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.4768 12.8896L16.9918 21.4156C17.0087 21.516 16.9946 21.6192 16.9514 21.7114C16.9081 21.8036 16.8377 21.8803 16.7497 21.9314C16.6616 21.9825 16.56 22.0055 16.4586 21.9974C16.3571 21.9892 16.2605 21.9502 16.1818 21.8856L12.6018 19.1986C12.4289 19.0695 12.219 18.9998 12.0033 18.9998C11.7875 18.9998 11.5776 19.0695 11.4048 19.1986L7.81875 21.8846C7.74007 21.9491 7.64361 21.988 7.54225 21.9962C7.44088 22.0044 7.33942 21.9815 7.25141 21.9305C7.16341 21.8796 7.09303 21.803 7.04967 21.711C7.00631 21.619 6.99204 21.516 7.00875 21.4156L8.52275 12.8896" stroke="#F18800" stroke-width="1.5" strokeLinecap="round" stroke-linejoin="round"/><path d="M12 14C15.3137 14 18 11.3137 18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 11.3137 8.68629 14 12 14Z" stroke="#F18800" stroke-width="1.5" strokeLinecap="round" stroke-linejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Free Support for Loyal Customers',
    desc: 'Low waiting times, informal tone, real help from people who care',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 14H6C6.53043 14 7.03914 14.2107 7.41421 14.5858C7.78929 14.9609 8 15.4696 8 16V19C8 19.5304 7.78929 20.0391 7.41421 20.4142C7.03914 20.7893 6.53043 21 6 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H18C17.4696 21 16.9609 20.7893 16.5858 20.4142C16.2107 20.0391 16 19.5304 16 19V16C16 15.4696 16.2107 14.9609 16.5858 14.5858C16.9609 14.2107 17.4696 14 18 14H21" stroke="#F18800" stroke-width="1.5" strokeLinecap="round" stroke-linejoin="round"/>
      </svg>
    ),
  },
];

export default function WhyChooseUs() {
  return (
    <section className="w-full px-10 py-24 bg-slate-50">
      <div className="max-w-[1512px] mx-auto w-full flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-center text-neutral-800 text-4xl font-bold font-['Segoe_UI'] leading-[48px]">
            Why Choose BusinessLabels
          </h2>
          <p className="text-center text-neutral-700 text-lg font-normal font-['Segoe_UI'] leading-7">
            We believe in people-first communication. Our small team provides expert knowledge, quick support, and honest advice.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-12 items-center">
          {/* Left image column */}
          <div className="flex-1 relative h-[500px] rounded-xl overflow-hidden">
            <Image
              src="/whychoose.png"
              alt="Why choose BusinessLabels"
              fill
              className="object-cover object-center"
            />
          </div>

          {/* Right feature cards */}
          <div className="flex-1 flex flex-col gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] border border-neutral-100 flex items-center gap-4"
              >
                {/* Icon box — paste your SVG paths inside the data array above */}
                <div className="w-12 h-12 bg-orange-50 rounded-lg shadow-sm flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <h3 className="text-neutral-800 text-2xl font-semibold font-['Segoe_UI'] leading-7">{f.title}</h3>
                  <p className="text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-6">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
