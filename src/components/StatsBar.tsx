const stats = [
  {
    value: '12k+',
    label: 'Active users',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.3327 28V25.3333C21.3327 23.9188 20.7708 22.5623 19.7706 21.5621C18.7704 20.5619 17.4138 20 15.9993 20H7.99935C6.58486 20 5.22831 20.5619 4.22811 21.5621C3.22792 22.5623 2.66602 23.9188 2.66602 25.3333V28" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M11.9993 14.6667C14.9449 14.6667 17.3327 12.2789 17.3327 9.33333C17.3327 6.38781 14.9449 4 11.9993 4C9.05383 4 6.66602 6.38781 6.66602 9.33333C6.66602 12.2789 9.05383 14.6667 11.9993 14.6667Z" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M29.334 28.0005V25.3338C29.3331 24.1521 28.9398 23.0042 28.2158 22.0702C27.4918 21.1363 26.4782 20.4693 25.334 20.1738" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21.334 4.17383C22.4812 4.46756 23.498 5.13476 24.2242 6.07024C24.9503 7.00572 25.3444 8.15627 25.3444 9.34049C25.3444 10.5247 24.9503 11.6753 24.2242 12.6107C23.498 13.5462 22.4812 14.2134 21.334 14.5072" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: 'Free',
    label: 'Expert support',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 18.6667H8C8.70724 18.6667 9.38552 18.9476 9.88562 19.4477C10.3857 19.9478 10.6667 20.6261 10.6667 21.3333V25.3333C10.6667 26.0406 10.3857 26.7189 9.88562 27.219C9.38552 27.719 8.70724 28 8 28H6.66667C5.95942 28 5.28115 27.719 4.78105 27.219C4.28095 26.7189 4 26.0406 4 25.3333V16C4 12.8174 5.26428 9.76516 7.51472 7.51472C9.76516 5.26428 12.8174 4 16 4C19.1826 4 22.2348 5.26428 24.4853 7.51472C26.7357 9.76516 28 12.8174 28 16V25.3333C28 26.0406 27.719 26.7189 27.219 27.219C26.7189 27.719 26.0406 28 25.3333 28H24C23.2928 28 22.6145 27.719 22.1144 27.219C21.6143 26.7189 21.3333 26.0406 21.3333 25.3333V21.3333C21.3333 20.6261 21.6143 19.9478 22.1144 19.4477C22.6145 18.9476 23.2928 18.6667 24 18.6667H28" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: '2k+',
    label: 'Products in stock',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.6667 28.9729C15.0721 29.2069 15.5319 29.3301 16 29.3301C16.4681 29.3301 16.9279 29.2069 17.3333 28.9729L26.6667 23.6395C27.0717 23.4057 27.408 23.0695 27.6421 22.6647C27.8761 22.2598 27.9995 21.8005 28 21.3329V10.6662C27.9995 10.1986 27.8761 9.73929 27.6421 9.33443C27.408 8.92956 27.0717 8.59336 26.6667 8.35954L17.3333 3.02621C16.9279 2.79216 16.4681 2.66895 16 2.66895C15.5319 2.66895 15.0721 2.79216 14.6667 3.02621L5.33333 8.35954C4.92835 8.59336 4.59197 8.92956 4.35795 9.33443C4.12392 9.73929 4.00048 10.1986 4 10.6662V21.3329C4.00048 21.8005 4.12392 22.2598 4.35795 22.6647C4.59197 23.0695 4.92835 23.4057 5.33333 23.6395L14.6667 28.9729Z" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 29.3333V16" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.38672 9.33301L16.0001 15.9997L27.6134 9.33301" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 5.69336L22 12.56" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: '1 roll',
    label: 'Minimum order',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 16C4 18.3734 4.70379 20.6935 6.02236 22.6668C7.34094 24.6402 9.21509 26.1783 11.4078 27.0866C13.6005 27.9948 16.0133 28.2324 18.3411 27.7694C20.6689 27.3064 22.8071 26.1635 24.4853 24.4853C26.1635 22.8071 27.3064 20.6689 27.7694 18.3411C28.2324 16.0133 27.9948 13.6005 27.0866 11.4078C26.1783 9.21509 24.6402 7.34094 22.6668 6.02236C20.6935 4.70379 18.3734 4 16 4C12.6453 4.01262 9.42529 5.32163 7.01333 7.65333L4 10.6667" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 4V10.6667H10.6667" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

    ),
  },
];

export default function StatsBar() {
  return (
    <div className="w-full px-10 py-8 bg-slate-50 border-b border-slate-100">
      <div className="max-w-360 mx-auto w-full grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex-1 rounded-[10px] flex justify-center items-center gap-4">
            {/* Icon box */}
            <div className="p-4 bg-white rounded-lg shadow border border-gray-100 flex items-center justify-center shrink-0">
              {stat.icon}
            </div>
            {/* Text */}
            <div className="flex flex-col gap-[3px]">
              <span className="text-neutral-800 text-2xl font-bold font-['Segoe_UI']">{stat.value}</span>
              <span className="text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-6">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
