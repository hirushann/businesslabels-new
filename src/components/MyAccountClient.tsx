'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useHelp } from './HelpProvider';

type Tab = 'dashboard' | 'orders' | 'downloads' | 'addresses' | 'details' | 'printers' | 'favourites';

export default function MyAccountClient() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MyAccountContent />
    </Suspense>
  );
}

function MyAccountContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const searchParams = useSearchParams();
  const { openHelp } = useHelp();

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab;
    if (tab && ['dashboard', 'orders', 'downloads', 'addresses', 'details', 'printers', 'favourites'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    )},
    { id: 'orders', label: 'Orders', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    )},
    { id: 'printers', label: 'My Printers', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
      </svg>
    )},
    { id: 'favourites', label: 'Favourite Products', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    )},
    { id: 'downloads', label: 'Downloads', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
      </svg>
    )},
    { id: 'addresses', label: 'Addresses', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    )},
    { id: 'details', label: 'Account details', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )},
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-6 font-['Segoe_UI']">
      <div className="max-w-360 mx-auto w-full">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-neutral-800 text-4xl font-bold leading-tight mb-2 uppercase tracking-tight">My Account</h1>
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/" className="hover:text-amber-500 transition-colors uppercase font-semibold text-xs tracking-wider">Home</Link>
            <span className="opacity-30">/</span>
            <span className="text-neutral-800 font-bold uppercase text-xs tracking-wider">My Account</span>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10 items-start">
          {/* Sidebar */}
          <aside className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-[2px_12px_44px_0px_rgba(109,109,120,0.06)] sticky top-24">
            <div className="flex flex-col gap-1.5">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all text-left group ${
                    activeTab === item.id 
                    ? 'bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20' 
                    : 'text-neutral-600 hover:bg-slate-50 hover:text-neutral-900 border border-transparent'
                  }`}
                >
                  <span className={`${activeTab === item.id ? 'text-white' : 'text-neutral-400 group-hover:text-amber-500'} transition-colors`}>
                    {item.icon}
                  </span>
                  <span className="text-base tracking-tight">{item.label}</span>
                  {activeTab === item.id && (
                    <span className="ml-auto">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </span>
                  )}
                </button>
              ))}
              <div className="h-px bg-slate-100 my-5 mx-2" />
              <button className="flex items-center gap-3.5 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all text-left font-semibold">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
                </svg>
                <span className="text-base">Logout</span>
              </button>
            </div>
          </aside>

          {/* Content Area */}
          <main className="bg-white rounded-[40px] border border-slate-200 p-10 lg:p-14 shadow-[2px_12px_44px_0px_rgba(109,109,120,0.06)] min-h-[700px]">
             <div className="max-w-4xl mx-auto">
                {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
                {activeTab === 'orders' && <OrdersView />}
                {activeTab === 'printers' && <PrintersView />}
                {activeTab === 'favourites' && <FavouriteProductsView />}
                {activeTab === 'downloads' && <DownloadsView />}
                {activeTab === 'addresses' && <AddressesView />}
                {activeTab === 'details' && <AccountDetailsView />}
             </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ setActiveTab }: { setActiveTab: (tab: Tab) => void }) {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 border-4 border-white shadow-sm overflow-hidden relative">
            <Image src="https://placehold.co/128x128" alt="Profile" fill className="object-cover" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Welcome, John Doe</h2>
            <p className="text-neutral-500 font-medium">Customer since April 2024</p>
          </div>
        </div>
        <p className="text-neutral-600 text-lg leading-relaxed max-w-2xl">
          Your personal label management hub. Track <button onClick={() => setActiveTab('orders')} className="text-amber-500 font-bold hover:underline">orders</button>, 
          manage <button onClick={() => setActiveTab('printers')} className="text-amber-500 font-bold hover:underline">printers</button>, 
          and find your <button onClick={() => setActiveTab('favourites')} className="text-amber-500 font-bold hover:underline">favourite supplies</button> in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Recent Orders', value: '12', sub: 'Last 30 days' },
          { label: 'Active Printers', value: '3', sub: 'Status: Online' },
          { label: 'Rewards Balance', value: '€ 45.00', sub: '450 pts' },
        ].map((stat) => (
          <div key={stat.label} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col gap-3 group hover:border-amber-200 transition-all cursor-default">
            <span className="text-neutral-500 text-sm font-bold uppercase tracking-widest">{stat.label}</span>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-neutral-800">{stat.value}</span>
              <span className="text-neutral-400 text-xs font-semibold">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-10 rounded-[40px] bg-sky-950 text-white relative overflow-hidden group">
        <div className="relative z-10 flex flex-col gap-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest w-fit">
            Gold Partner Service
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-3xl font-black tracking-tight leading-tight">Expert Label Support Always Free</h3>
            <p className="text-sky-100/70 text-lg leading-relaxed">
              Having trouble with your Epson ColorWorks? Our technicians are ready to assist you with drivers, settings, and media selection.
            </p>
          </div>
          <Link href="/support" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-black text-sky-950 hover:bg-amber-500 hover:text-white transition-all w-fit shadow-xl shadow-black/10">
            Talk to an Expert
          </Link>
        </div>
        <div className="absolute right-[-40px] bottom-[-40px] opacity-10 rotate-12 transition-transform duration-700 group-hover:rotate-0">
          <svg width="320" height="320" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

function OrdersView() {
  const mockOrders = [
    { id: '#4582', date: 'June 12, 2023', status: 'Completed', total: '€ 450.00', items: 3 },
    { id: '#4120', date: 'May 28, 2023', status: 'Processing', total: '€ 1,205.50', items: 1 },
    { id: '#3994', date: 'April 05, 2023', status: 'Completed', total: '€ 89.90', items: 2 },
  ];

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Order History</h2>
        <p className="text-neutral-500 font-medium">Manage and track all your printer and supply orders.</p>
      </div>
      
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b-2 border-slate-100 text-neutral-400">
              <th className="py-5 font-black text-[11px] uppercase tracking-widest pl-2">Order</th>
              <th className="py-5 font-black text-[11px] uppercase tracking-widest">Date</th>
              <th className="py-5 font-black text-[11px] uppercase tracking-widest">Status</th>
              <th className="py-5 font-black text-[11px] uppercase tracking-widest">Total</th>
              <th className="py-5 font-black text-[11px] uppercase tracking-widest text-right pr-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockOrders.map((order) => (
              <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-all group">
                <td className="py-6 font-bold text-neutral-800 text-lg pl-2">{order.id}</td>
                <td className="py-6 text-neutral-500 font-medium">{order.date}</td>
                <td className="py-6">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tight ${
                    order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-6 flex flex-col">
                   <span className="text-neutral-800 font-bold">{order.total}</span>
                   <span className="text-neutral-400 text-xs font-medium">{order.items} items</span>
                </td>
                <td className="py-6 text-right pr-2">
                  <button className="text-neutral-400 font-bold text-sm bg-white border border-slate-200 px-5 py-2.5 rounded-full group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all shadow-sm">
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PrintersView() {
  const printers = [
    { name: 'Epson ColorWorks CW-C6000Ae', serial: 'S2BK-980122', status: 'Online', image: 'https://placehold.co/400x300' },
    { name: 'Epson ColorWorks CW-C3500', serial: 'S2BK-442100', status: 'Online', image: 'https://placehold.co/400x300' },
  ];

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-neutral-800 tracking-tight">My Printers</h2>
          <p className="text-neutral-500 font-medium">Monitoring and management for your registered hardware.</p>
        </div>
        <button className="h-11 px-8 bg-sky-950 text-white rounded-full font-bold text-sm hover:bg-amber-500 transition-all flex items-center gap-2 whitespace-nowrap">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
             <path d="M5 12h14"/><path d="M12 5v14"/>
           </svg>
           Register New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {printers.map((printer) => (
          <div key={printer.serial} className="group p-8 rounded-[32px] border border-slate-200 bg-white hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/5 transition-all flex flex-col gap-6">
            <div className="relative h-48 bg-slate-100 rounded-2xl overflow-hidden p-6 group-hover:scale-[1.02] transition-transform">
               <Image src={printer.image} alt={printer.name} fill className="object-contain" />
               <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                 {printer.status}
               </div>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-black text-neutral-800 leading-tight">{printer.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 font-bold text-sm tracking-tight">SN: {printer.serial}</span>
                <button className="text-amber-500 font-black text-xs uppercase tracking-wider hover:underline">View Manual</button>
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="grid grid-cols-2 gap-4">
               <button className="flex flex-col gap-1 text-left group/btn">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest group-hover/btn:text-amber-500 transition-colors">Supplies</span>
                  <span className="text-sm font-bold text-neutral-800">Buy Ink & Paper</span>
               </button>
               <button className="flex flex-col gap-1 text-left group/btn">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest group-hover/btn:text-amber-500 transition-colors">Support</span>
                  <span className="text-sm font-bold text-neutral-800">Troubleshoot</span>
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import ProductCard, { type ProductCardData } from "@/components/ProductCard";

function FavouriteProductsView() {
  const favourites: ProductCardData[] = [
    {
      id: 1,
      sku: 'BL-7500-MATTE',
      name: 'Matte Paper Labels 102mm x 152mm',
      subtitle: 'Premium Quality',
      excerpt: 'Ideal for shipping labels and industrial identification.',
      materialTitle: 'Matte Paper',
      price: 45.99,
      originalPrice: 52.00,
      inStock: true,
      mainImage: 'https://placehold.co/600x400',
      slug: 'matte-paper-labels',
      type: 'simple',
      categories: [{ name: 'Labels' }]
    },
    {
      id: 2,
      sku: 'BL-C6000-INK-BLK',
      name: 'Epson SJIC36P Ink Cartridge - Black',
      subtitle: 'Original Epson Ink',
      excerpt: 'Genuine UltraChrome DL pigment ink for ColorWorks C6000.',
      materialTitle: 'Pigment Ink',
      price: 129.00,
      originalPrice: null,
      inStock: true,
      mainImage: 'https://placehold.co/600x400',
      slug: 'epson-c6000-ink-black',
      type: 'simple',
      categories: [{ name: 'Ink Supplies' }]
    }
  ];

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Favourite Products</h2>
        <p className="text-neutral-500 font-medium">Your curated list of essential label supplies.</p>
      </div>

      {favourites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
             <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
           </svg>
           <p className="mt-4 text-neutral-400 font-bold">No favourites saved yet</p>
           <Link href="/products" className="mt-6 h-11 px-8 bg-amber-500 text-white rounded-full font-black text-sm hover:shadow-lg shadow-amber-500/20 transition-all flex items-center">
             Browse Supplies
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {favourites.map((product) => (
            <ProductCard 
              key={product.sku} 
              product={product} 
              href={product.slug ? `/products/${product.slug}` : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DownloadsView() {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex flex-col gap-2">
         <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Downloads</h2>
         <p className="text-neutral-500 font-medium">Access your digital manuals, drivers, and technical guides.</p>
       </div>
       <div className="flex flex-col items-center justify-center py-20 px-6 rounded-[40px] border-2 border-dashed border-slate-200 bg-slate-50/50">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 shadow-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
          </div>
          <p className="text-neutral-400 font-bold text-center">Your digital library is currently empty</p>
          <p className="text-neutral-400 text-sm mt-1 mb-8 text-center max-w-xs">Buy digital manuals or drivers to see them here.</p>
          <Link href="/products" className="h-12 inline-flex items-center justify-center rounded-full bg-sky-950 px-10 text-sm font-black text-white hover:bg-amber-500 transition-all shadow-xl shadow-sky-950/20">
            Browse Technical Assets
          </Link>
       </div>
    </div>
  );
}

function AddressesView() {
  const [editingAddress, setEditingAddress] = useState<'billing' | 'shipping' | null>(null);

  if (editingAddress) {
    const isBilling = editingAddress === 'billing';
    const inputClasses = "w-full h-14 px-6 rounded-2xl border border-slate-200 focus:border-amber-400 outline-none transition-all text-neutral-800 text-base bg-white focus:ring-[6px] focus:ring-amber-500/5 font-medium";
    const labelClasses = "text-xs font-black text-neutral-500 uppercase tracking-widest mb-2.5 block ml-1";

    return (
      <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setEditingAddress(null)}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 text-neutral-400 hover:text-amber-500 hover:border-amber-500 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black text-neutral-800 tracking-tight">
              Edit {isBilling ? 'Billing' : 'Shipping'} Address
            </h2>
            <p className="text-neutral-500 font-medium">Please provide your {isBilling ? 'invoice' : 'delivery'} details below.</p>
          </div>
        </div>

        <form className="flex flex-col gap-8 max-w-2xl" onSubmit={(e) => { e.preventDefault(); setEditingAddress(null); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>First name</label>
              <input type="text" defaultValue="John" className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Last name</label>
              <input type="text" defaultValue="Doe" className={inputClasses} />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Company Name (Optional)</label>
            <input type="text" defaultValue="BusinessLabels Inc." className={inputClasses} />
          </div>

          <div>
            <label className={labelClasses}>Street address</label>
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="House number and street name" defaultValue="123 Business Parkway" className={inputClasses} />
              <input type="text" placeholder="Apartment, suite, unit, etc. (optional)" defaultValue="Suite 101" className={inputClasses} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className={labelClasses}>Postcode</label>
              <input type="text" defaultValue="6741 GK" className={inputClasses} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>Town / City</label>
              <input type="text" defaultValue="Ede" className={inputClasses} />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Phone</label>
            <input type="tel" defaultValue="+31 123 456 789" className={inputClasses} />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button type="submit" className="h-14 rounded-full bg-amber-500 px-12 text-base font-black text-white hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/30 uppercase tracking-widest">
              Save Address
            </button>
            <button 
              type="button" 
              onClick={() => setEditingAddress(null)}
              className="h-14 rounded-full bg-slate-100 px-12 text-base font-black text-neutral-600 hover:bg-slate-200 transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Addresses</h2>
        <p className="text-neutral-500 font-medium">Standard shipping and billing profiles for fast checkout.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-neutral-800">Billing Address</h3>
            <button 
              onClick={() => setEditingAddress('billing')}
              className="text-amber-500 font-black text-sm uppercase tracking-wider hover:underline"
            >
              Change
            </button>
          </div>
          <div className="p-8 rounded-[32px] bg-white border border-slate-200 text-neutral-600 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
            </div>
            <div className="relative z-10 flex flex-col gap-2">
              <p className="text-xl font-black text-neutral-800 mb-1">John Doe</p>
              <p className="font-medium">BusinessLabels Inc.</p>
              <p className="font-medium">123 Business Parkway</p>
              <p className="font-medium">Suite 101</p>
              <p className="font-medium">6741 GK Ede</p>
              <p className="font-bold text-amber-600">Netherlands</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-neutral-800">Shipping Address</h3>
            <button 
              onClick={() => setEditingAddress('shipping')}
              className="h-9 px-5 bg-amber-500 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
            >
              Add New
            </button>
          </div>
          <div className="p-8 rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 text-neutral-300 min-h-[220px] flex flex-col items-center justify-center gap-4 text-center">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             <span className="font-bold italic">No shipping profiles saved</span>
          </div>
        </div>
      </div>
    </div>
  );
}


function AccountDetailsView() {
  const inputClasses = "w-full h-14 px-6 rounded-2xl border border-slate-200 focus:border-amber-400 outline-none transition-all text-neutral-800 text-base bg-white focus:ring-[6px] focus:ring-amber-500/5 font-medium";
  const labelClasses = "text-xs font-black text-neutral-500 uppercase tracking-widest mb-2.5 block ml-1";

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Account Details</h2>
        <p className="text-neutral-500 font-medium">Update your identity and password settings.</p>
      </div>
      
      <form className="flex flex-col gap-8 max-w-2xl" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>First name</label>
            <input type="text" defaultValue="John" className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>Last name</label>
            <input type="text" defaultValue="Doe" className={inputClasses} />
          </div>
        </div>

        <div>
          <label className={labelClasses}>Display name</label>
          <input type="text" defaultValue="John Doe" className={inputClasses} />
          <p className="text-xs font-bold text-neutral-400 mt-3 ml-1 italic opacity-60">* This is how your name will appear in reviews and forum posts.</p>
        </div>

        <div>
          <label className={labelClasses}>Email address</label>
          <input type="email" defaultValue="john.doe@example.com" className={inputClasses} />
        </div>

        <div className="relative pt-6">
          <div className="absolute top-0 left-0 right-0 h-px bg-slate-100" />
          <h3 className="text-xl font-black text-neutral-800 mb-8 mt-2 tracking-tight flex items-center gap-3">
             Security Settings
             <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          </h3>
          
          <div className="flex flex-col gap-6">
            <div>
              <label className={labelClasses}>Current password</label>
              <input type="password" placeholder="••••••••••••" className={inputClasses} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className={labelClasses}>New password</label>
                  <input type="password" className={inputClasses} />
               </div>
               <div>
                  <label className={labelClasses}>Confirm password</label>
                  <input type="password" className={inputClasses} />
               </div>
            </div>
          </div>
        </div>

        <button type="submit" className="h-14 rounded-full bg-amber-500 px-12 text-base font-black text-white hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/30 w-fit uppercase tracking-widest mt-4">
          Save Profile
        </button>
      </form>
    </div>
  );
}

