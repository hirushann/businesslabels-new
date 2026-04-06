const reviews = [
  {
    quote: '"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took"',
    name: 'David Tui',
    role: 'Marketing Manager, HubSync',
    featured: false,
  },
  {
    quote: '"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took"',
    name: 'Sarah Mitchell',
    role: 'Software Engineer, Anydesk',
    featured: true,
  },
  {
    quote: '"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took"',
    name: 'Priya Sharma',
    role: 'Product Designer, Designdot',
    featured: false,
  },
];

export default function ReviewsSection() {
  return (
    <section className="relative w-full px-10 py-24 bg-white overflow-hidden">
      {/* Decorative blobs */}
      <div className="w-48 h-48 absolute right-52 bottom-0 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />
      <div className="w-48 h-48 absolute left-0 top-0 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-12">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h2 className="text-neutral-800 text-4xl font-bold font-['Segoe_UI'] leading-[48px]">
            Over 1000<br />Positive Reviews
          </h2>
          <div className="flex items-center gap-6">
            <button className="px-3 py-3.5 rotate-180 bg-neutral-100 rounded-full shadow border border-gray-200 flex items-center justify-center hover:bg-neutral-200 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="#404040" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button className="px-3 py-3.5 bg-white rounded-full shadow border border-amber-500 flex items-center justify-center hover:bg-amber-50 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Review cards */}
        <div className="grid grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div
              key={r.name}
              className={`p-6 rounded-xl flex flex-col gap-8 ${
                r.featured
                  ? 'bg-gradient-to-br from-orange-50 to-white border-2 border-orange-100'
                  : 'bg-white border border-zinc-100'
              }`}
            >
              <p className="text-neutral-700 text-lg font-normal font-['Segoe_UI'] leading-7">
                {r.quote}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-1 self-stretch bg-amber-500 rounded-full" />
                <div className="flex flex-col gap-2">
                  <span className="text-neutral-800 text-xl font-bold font-['Segoe_UI'] leading-6">{r.name}</span>
                  <span className="text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{r.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
