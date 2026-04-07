import type { Metadata } from "next";
import ProductPurchase from "@/components/ProductPurchase";

export const metadata: Metadata = {
  title: "Epson CW-C6000Ae MK — BusinessLabels",
  description:
    "Premium color label printer for product labeling, shipping labels and general purpose use. Compatible with Epson ColorWorks inkjet label printers.",
};

export default function SingleProductPage() {
  return (
    <div className="bg-white">
      

      {/* Main Product Section */}
      <div className="px-10 py-10">
        {/* Breadcrumb */}
        <div className="pb-8">
          <div className="max-w-[1440px] mx-auto flex items-center gap-2 text-sm text-zinc-500">
            <span>Home</span>
            <span>/</span>
            <span>Printers</span>
            <span>/</span>
            <span>Color Desktop Labelprinters</span>
            <span>/</span>
            <span className="text-neutral-700 font-semibold">Epson CW-C6000Ae MK</span>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto flex gap-12 items-start">

          {/* LEFT: Images + Description + Specs */}
          <div className="flex-1 flex flex-col gap-12">
            {/* Title & Description */}
            <div className="flex flex-col gap-4">
              <h1 className="text-neutral-800 text-3xl font-bold leading-10">
                Epson CW-C6000Ae MK
              </h1>
              <p className="text-neutral-700 text-lg font-normal leading-7">
                Premium matte paper labels perfect for product labeling, shipping labels, and general
                purpose use. Compatible with Epson ColorWorks inkjet label printers.
              </p>
            </div>

            {/* Image Gallery */}
            <div className="flex flex-col gap-10">
              <div className="flex justify-center items-center">
                <img
                  src="https://placehold.co/460x509"
                  alt="Epson CW-C6000Ae MK main image"
                  className="w-[460px] h-[509px] object-contain"
                />
              </div>
              {/* Thumbnails */}
              <div className="flex items-center gap-5">
                <button className="w-24 h-24 relative bg-slate-100 rounded-lg outline outline-1 outline-offset-[-1px] outline-amber-500 overflow-hidden">
                  <img
                    src="https://placehold.co/80x80"
                    alt="Thumbnail 1"
                    className="w-20 h-20 absolute top-2 left-2 object-contain"
                  />
                </button>
                <button className="w-24 h-24 relative bg-slate-100 rounded-lg overflow-hidden hover:outline hover:outline-1 hover:outline-amber-500 transition-all">
                  <img
                    src="https://placehold.co/80x80"
                    alt="Thumbnail 2"
                    className="w-20 h-20 absolute top-2 left-2 object-contain"
                  />
                </button>
                <button className="w-24 h-24 relative bg-slate-100 rounded-lg overflow-hidden hover:outline hover:outline-1 hover:outline-amber-500 transition-all">
                  <img
                    src="https://placehold.co/80x80"
                    alt="Thumbnail 3"
                    className="w-20 h-20 absolute top-2 left-2 object-contain"
                  />
                </button>
                <button className="w-24 h-24 relative bg-slate-100 rounded-lg overflow-hidden hover:outline hover:outline-1 hover:outline-amber-500 transition-all">
                  <img
                    src="https://placehold.co/80x80"
                    alt="Thumbnail 4"
                    className="w-20 h-20 absolute top-2 left-2 object-contain"
                  />
                  {/* Video overlay indicator */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-neutral-700" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Product Description Accordion */}
            <div className="flex flex-col gap-6">
              <div className="p-6 bg-gray-50 rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-neutral-700 text-2xl font-bold leading-7">Product Description</h2>
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                </div>
                <p className="text-neutral-700 text-base font-normal leading-6">
                  Introduced in 2024, the Epson ColorWorks CW-C8000e is a true production machine for full-color
                  labels. The Epson CW-C8000e combines a very high production speed of 300 mm per second with high
                  print quality (600 x 1200 DPI) and very user-friendly operation. Furthermore, color management
                  becomes a breeze with the Epson CW-C8000e; using so-called ICM profiles, the user is able to
                  optimize the desired print colors better than ever before. A good input profile is required for
                  this optimization, and{" "}
                  <span className="underline">Smart2B</span>{" "}
                  (owner of Businesslabels) happens to be the expert in that area, so ask us about the possibilities.
                </p>
              </div>

              {/* Product Specifications Accordion */}
              <div className="pt-6 bg-gray-50 rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10">
                <div className="px-6 flex justify-between items-center mb-4">
                  <h2 className="text-neutral-700 text-2xl font-bold leading-7">Product specifications</h2>
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                </div>
                <div className="rounded-lg overflow-hidden">
                  {[
                    { label: "SKU", value: "EP-C3500" },
                    { label: "Category", value: "Color Labelprinter" },
                    { label: "Print Speed", value: "119 mm per second" },
                    { label: "Print Resolution", value: "1200 × 1200 DPI" },
                    { label: "Maximum Print Width", value: "108 mm" },
                    { label: "Print Technology", value: "Inkjet (Full-color)" },
                    { label: "Cutter", value: "Auto Cutter Included" },
                    { label: "Printer Type", value: "Industrial Label Printer" },
                    { label: "Usage", value: "Product labeling, Shipping labels, Barcode printing" },
                    { label: "Connectivity", value: "USB / Ethernet (Typical for this model)" },
                    { label: "Build Type", value: "Heavy-duty Industrial Design" },
                  ].map((spec, i) => (
                    <div
                      key={spec.label}
                      className={`px-6 py-3 flex justify-between items-center ${i % 2 === 0 ? "bg-white/50" : ""}`}
                    >
                      <span className="text-neutral-700 text-base font-normal leading-6">{spec.label}</span>
                      <span className="text-neutral-700 text-base font-semibold leading-6">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compatibility CTA */}
              <div className="p-6 bg-gradient-to-br from-orange-50 to-white rounded-xl outline outline-2 outline-offset-[-2px] outline-orange-100">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 p-2 bg-white rounded-lg shadow-sm flex-shrink-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                    </svg>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-neutral-700 text-2xl font-bold leading-7">Does this fit my printer?</h3>
                      <p className="text-neutral-700 text-base font-normal leading-6">
                        Use our product finder to check compatibility with your specific printer model.
                      </p>
                    </div>
                    <button className="text-amber-500 text-base font-semibold underline text-left">
                      Check Compatibility
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Purchase Card */}
          <div className="flex flex-col gap-6 w-96 sticky top-24">
            <ProductPurchase />

            {/* Consumable Items */}
            <div className="flex flex-col gap-3">
              <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Consumable Items:
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {["Hardwares", "Ink & Maintenance", "Badges / Media"].map((item) => (
                  <button
                    key={item}
                    className="px-4 py-2.5 bg-blue-400/10 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-blue-400/50 text-blue-400 text-base font-bold text-left hover:bg-blue-400/20 transition-colors"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ink & Maintenance Section */}
      <div className="px-40 py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-12">
          <div className="flex justify-between items-center">
            <h2 className="text-neutral-800 text-4xl font-bold leading-[48px]">Ink &amp; Maintenance</h2>
            <div className="flex items-center gap-6">
              <button className="w-12 h-12 p-3 bg-gray-50 rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-gray-200 flex justify-center items-center hover:bg-white transition-colors">
                <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-12 h-12 p-3 bg-white rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-amber-500 flex justify-center items-center hover:bg-amber-50 transition-colors">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { name: "CW-C4000 ink cartridge Black (BK)", spec1: "Ink content: 50 ml", spec2: "Color system: CMYK", price: "€9,34" },
              { name: "Banderol glanzend papier 30 mm", spec1: "Core: 38", spec2: "Max outer diameter: 101", price: "€9,34" },
              { name: "Transfer ribbon, 110 mm x 300 meter", spec1: "Core: 25", spec2: "Ink type: Premium Wax Resin", price: "€15,66" },
            ].map((product) => (
              <div key={product.name} className="bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col">
                <div className="h-60 relative bg-slate-100 overflow-hidden rounded-t-xl">
                  <img
                    src="https://placehold.co/222x180"
                    alt={product.name}
                    className="absolute left-1/2 top-[34px] -translate-x-1/2 h-44 object-contain"
                  />
                  <div className="absolute left-4 top-4 flex justify-between items-center w-[calc(100%-32px)]">
                    <div className="h-6 px-2.5 py-1 bg-white rounded-3xl flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 12 12">
                        <rect x="1" y="4" width="10" height="7" rx="1" />
                        <path d="M4 4V3a2 2 0 014 0v1" />
                      </svg>
                      <span className="text-neutral-700 text-xs font-normal leading-4">Inkjet</span>
                    </div>
                    <div className="px-2.5 py-1 bg-green-600 rounded-full flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 12 12">
                        <circle cx="6" cy="6" r="5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l1.5 1.5L8 4" />
                      </svg>
                      <span className="text-white text-xs font-normal leading-4">In Stock</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] flex flex-col gap-4 flex-1">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-blue-400 text-sm font-normal leading-5">SKU: EP-C3500</span>
                      <span className="text-neutral-800 text-xl font-semibold leading-6 line-clamp-1">{product.name}</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      {[product.spec1, product.spec2].map((spec) => (
                        <div key={spec} className="flex items-center gap-2">
                          <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 12 12">
                            <circle cx="6" cy="6" r="5" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l1.5 1.5L8 4" />
                          </svg>
                          <span className="text-neutral-700 text-base font-normal leading-5">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 mt-auto">
                    <div className="h-px bg-slate-100" />
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-2">
                        <span className="text-neutral-800 text-2xl font-bold leading-7">{product.price}</span>
                        <span className="text-zinc-500 text-xs font-normal leading-4">ex. VAT</span>
                      </div>
                      <button className="h-9 px-4 py-2.5 bg-amber-500 rounded-[100px] flex items-center gap-2 hover:bg-amber-600 transition-colors">
                        <span className="text-white text-base font-semibold leading-6">Add</span>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 20 16">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h3l2 9h10l2-7H5" />
                          <circle cx="8" cy="13" r="1" />
                          <circle cx="16" cy="13" r="1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges / Media Section */}
      <div className="px-40 py-24 bg-white">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-12">
          <div className="flex justify-between items-center">
            <h2 className="text-neutral-800 text-4xl font-bold leading-[48px]">Badges / Media</h2>
            <div className="flex items-center gap-6">
              <button className="w-12 h-12 p-3 bg-white rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-gray-200 flex justify-center items-center hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-12 h-12 p-3 bg-white rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-amber-500 flex justify-center items-center hover:bg-amber-50 transition-colors">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { name: "1000T, 100 x 150 mm", spec1: "Core: Fan-fold", spec2: "Max outer diameter: Fan-fold", price: "€9,34" },
              { name: "A6 shipping labels", spec1: "Core: 76", spec2: "Max outer diameter: 203", price: "€9,34" },
              { name: "1000T, 100 x 50 mm", spec1: "Core: 25", spec2: "Max outer diameter: 203", price: "€15,66" },
            ].map((product) => (
              <div key={product.name} className="bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col">
                <div className="h-60 relative bg-slate-100 overflow-hidden rounded-t-xl">
                  <img
                    src="https://placehold.co/180x180"
                    alt={product.name}
                    className="absolute left-1/2 top-[34px] -translate-x-1/2 h-44 object-contain"
                  />
                  <div className="absolute left-4 top-4 flex justify-between items-center w-[calc(100%-32px)]">
                    <div className="h-6 px-2.5 py-1 bg-white rounded-3xl flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 12 12">
                        <rect x="1" y="4" width="10" height="7" rx="1" />
                        <path d="M4 4V3a2 2 0 014 0v1" />
                      </svg>
                      <span className="text-neutral-700 text-xs font-normal leading-4">Inkjet</span>
                    </div>
                    <div className="px-2.5 py-1 bg-green-600 rounded-full flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 12 12">
                        <circle cx="6" cy="6" r="5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l1.5 1.5L8 4" />
                      </svg>
                      <span className="text-white text-xs font-normal leading-4">In Stock</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] flex flex-col gap-4 flex-1">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-blue-400 text-sm font-normal leading-5">SKU: EP-C3500</span>
                      <span className="text-neutral-800 text-xl font-semibold leading-6 line-clamp-1">{product.name}</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      {[product.spec1, product.spec2].map((spec) => (
                        <div key={spec} className="flex items-center gap-2">
                          <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 12 12">
                            <circle cx="6" cy="6" r="5" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l1.5 1.5L8 4" />
                          </svg>
                          <span className="text-neutral-700 text-base font-normal leading-5">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 mt-auto">
                    <div className="h-px bg-slate-100" />
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-2">
                        <span className="text-neutral-800 text-2xl font-bold leading-7">{product.price}</span>
                        <span className="text-zinc-500 text-xs font-normal leading-4">ex. VAT</span>
                      </div>
                      <button className="h-9 px-4 py-2.5 bg-amber-500 rounded-[100px] flex items-center gap-2 hover:bg-amber-600 transition-colors">
                        <span className="text-white text-base font-semibold leading-6">Add</span>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 20 16">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h3l2 9h10l2-7H5" />
                          <circle cx="8" cy="13" r="1" />
                          <circle cx="16" cy="13" r="1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hardwares Section */}
      <div className="px-40 py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-12">
          <div className="flex justify-between items-center">
            <h2 className="text-neutral-800 text-4xl font-bold leading-[48px]">Hardwares</h2>
            <div className="flex items-center gap-6">
              <button className="w-12 h-12 p-3 bg-gray-50 rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-gray-200 flex justify-center items-center hover:bg-white transition-colors">
                <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-12 h-12 p-3 bg-white rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-amber-500 flex justify-center items-center hover:bg-amber-50 transition-colors">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { name: "Epson CW-C4000 WiFi Dongle", spec1: "Ink content: 50 ml", spec2: "Color system: CMYK", price: "€9,34" },
              { name: "Power supply cord 220-230V", spec1: "Cable length: 1,8 meter", spec2: "Connector: Schuko male – Female CEE", price: "€9,34" },
              { name: "SLP power supply extension cord", spec1: "Extension cable length: 1.5 meters", spec2: "Connection: Male – Female connector", price: "€15,66" },
            ].map((product) => (
              <div key={product.name} className="bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col">
                <div className="h-60 relative bg-slate-100 overflow-hidden rounded-t-xl">
                  <img
                    src="https://placehold.co/227x180"
                    alt={product.name}
                    className="absolute left-1/2 top-[34px] -translate-x-1/2 h-44 object-contain"
                  />
                  <div className="absolute left-4 top-4 flex justify-between items-center w-[calc(100%-32px)]">
                    <div className="h-6 px-2.5 py-1 bg-white rounded-3xl flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 12 12">
                        <rect x="1" y="4" width="10" height="7" rx="1" />
                        <path d="M4 4V3a2 2 0 014 0v1" />
                      </svg>
                      <span className="text-neutral-700 text-xs font-normal leading-4">Inkjet</span>
                    </div>
                    <div className="px-2.5 py-1 bg-green-600 rounded-full flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 12 12">
                        <circle cx="6" cy="6" r="5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l1.5 1.5L8 4" />
                      </svg>
                      <span className="text-white text-xs font-normal leading-4">In Stock</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] flex flex-col gap-4 flex-1">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-blue-400 text-sm font-normal leading-5">SKU: EP-C3500</span>
                      <span className="text-neutral-800 text-xl font-semibold leading-6 line-clamp-1">{product.name}</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      {[product.spec1, product.spec2].map((spec) => (
                        <div key={spec} className="flex items-center gap-2">
                          <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 12 12">
                            <circle cx="6" cy="6" r="5" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l1.5 1.5L8 4" />
                          </svg>
                          <span className="text-neutral-700 text-base font-normal leading-5">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 mt-auto">
                    <div className="h-px bg-slate-100" />
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-2">
                        <span className="text-neutral-800 text-2xl font-bold leading-7">{product.price}</span>
                        <span className="text-zinc-500 text-xs font-normal leading-4">ex. VAT</span>
                      </div>
                      <button className="h-9 px-4 py-2.5 bg-amber-500 rounded-[100px] flex items-center gap-2 hover:bg-amber-600 transition-colors">
                        <span className="text-white text-base font-semibold leading-6">Add</span>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 20 16">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h3l2 9h10l2-7H5" />
                          <circle cx="8" cy="13" r="1" />
                          <circle cx="16" cy="13" r="1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
