'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Tab = 'dashboard' | 'orders' | 'downloads' | 'addresses' | 'details';

export default function MyAccountClient() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

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
    <div className="bg-slate-50 min-h-screen py-12 px-6">
      <div className="max-w-[1440px] mx-auto w-full">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-neutral-800 text-4xl font-bold leading-tight mb-2">My Account</h1>
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/" className="hover:text-amber-500 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-neutral-800 font-medium">My Account</span>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* Sidebar */}
          <aside className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[2px_8px_40px_0px_rgba(109,109,120,0.05)] sticky top-24">
            <div className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-left ${
                    activeTab === item.id 
                    ? 'bg-amber-50 text-amber-600 font-semibold shadow-sm border border-amber-100' 
                    : 'text-neutral-600 hover:bg-slate-50 hover:text-neutral-800 border border-transparent'
                  }`}
                >
                  <span className={activeTab === item.id ? 'text-amber-500' : 'text-neutral-400'}>
                    {item.icon}
                  </span>
                  <span className="text-base">{item.label}</span>
                </button>
              ))}
              <div className="h-px bg-slate-100 my-4" />
              <button className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all text-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
                </svg>
                <span className="text-base font-medium">Logout</span>
              </button>
            </div>
          </aside>

          {/* Content Area */}
          <main className="bg-white rounded-3xl border border-slate-200 p-8 lg:p-10 shadow-[2px_8px_40px_0px_rgba(109,109,120,0.05)] min-h-[600px]">
            {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
            {activeTab === 'orders' && <OrdersView />}
            {activeTab === 'downloads' && <DownloadsView />}
            {activeTab === 'addresses' && <AddressesView />}
            {activeTab === 'details' && <AccountDetailsView />}
          </main>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ setActiveTab }: { setActiveTab: (tab: Tab) => void }) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-neutral-800">Hello, John Doe</h2>
        <p className="text-neutral-600 leading-relaxed max-w-2xl">
          From your account dashboard you can view your <button onClick={() => setActiveTab('orders')} className="text-amber-500 font-semibold hover:underline">recent orders</button>, 
          manage your <button onClick={() => setActiveTab('addresses')} className="text-amber-500 font-semibold hover:underline">shipping and billing addresses</button>, 
          and <button onClick={() => setActiveTab('details')} className="text-amber-500 font-semibold hover:underline">edit your password and account details</button>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
          <span className="text-neutral-500 text-sm font-medium">Recent Orders</span>
          <span className="text-2xl font-bold text-neutral-800">12 Orders</span>
        </div>
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
          <span className="text-neutral-500 text-sm font-medium">Active Subscriptions</span>
          <span className="text-2xl font-bold text-neutral-800">0 Active</span>
        </div>
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
          <span className="text-neutral-500 text-sm font-medium">Rewards Points</span>
          <span className="text-2xl font-bold text-neutral-800 underline decoration-amber-500 underline-offset-4 decoration-2">450 pts</span>
        </div>
      </div>

      <div className="mt-4 p-8 rounded-3xl bg-sky-950 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-4 max-w-md">
          <h3 className="text-2xl font-bold">Premium Support</h3>
          <p className="text-sky-100/80 leading-relaxed">
            As a ColorWorks Gold Partner, we provide free technical support for all your printers and label questions.
          </p>
          <Link href="/support" className="inline-flex h-11 items-center justify-center rounded-full bg-amber-500 px-6 text-sm font-bold text-white hover:bg-amber-600 transition-colors w-fit">
            Get Help Now
          </Link>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-neutral-800">Recent Orders</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="py-4 font-bold text-neutral-800 text-sm uppercase tracking-wider">Order</th>
              <th className="py-4 font-bold text-neutral-800 text-sm uppercase tracking-wider">Date</th>
              <th className="py-4 font-bold text-neutral-800 text-sm uppercase tracking-wider">Status</th>
              <th className="py-4 font-bold text-neutral-800 text-sm uppercase tracking-wider">Total</th>
              <th className="py-4 font-bold text-neutral-800 text-sm uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockOrders.map((order) => (
              <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-5 font-semibold text-neutral-800">{order.id}</td>
                <td className="py-5 text-neutral-600">{order.date}</td>
                <td className="py-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-5 text-neutral-800 font-medium">{order.total} for {order.items} items</td>
                <td className="py-5 text-right font-bold">
                  <button className="text-amber-500 hover:text-amber-600 transition-colors px-4 py-2 rounded-full border border-amber-100 bg-amber-50/50 text-sm">
                    View
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

function DownloadsView() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
       <h2 className="text-2xl font-bold text-neutral-800">Downloads</h2>
       <div className="flex flex-col items-center justify-center py-12 px-6 rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/30">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
          </div>
          <p className="text-neutral-500 text-base mb-6 text-center">No downloads available yet.</p>
          <Link href="/products" className="h-11 inline-flex items-center justify-center rounded-full bg-amber-500 px-8 text-sm font-bold text-white hover:bg-amber-600 transition-colors shadow-sm">
            Browse Products
          </Link>
       </div>
    </div>
  );
}

function AddressesView() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-neutral-800">Addresses</h2>
        <p className="text-neutral-500 text-sm">The following addresses will be used on the checkout page by default.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-800">Billing Address</h3>
            <button className="text-amber-500 font-bold text-sm hover:underline">Edit</button>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-neutral-600 min-h-[160px] leading-relaxed">
            <p className="font-bold text-neutral-800 mb-1">John Doe</p>
            <p>123 Business Parkway</p>
            <p>Suite 101</p>
            <p>6741 GK Ede</p>
            <p>Netherlands</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-800">Shipping Address</h3>
            <button className="text-amber-500 font-bold text-sm hover:underline">Add</button>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-neutral-500 min-h-[160px] flex items-center justify-center italic">
            You have not set up this type of address yet.
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountDetailsView() {
  const inputClasses = "w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-amber-400 outline-none transition-all text-neutral-800 text-base bg-white focus:ring-4 focus:ring-amber-500/5";
  const labelClasses = "text-sm font-bold text-neutral-700 mb-1.5 block";

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-neutral-800">Account Details</h2>
      
      <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>First name *</label>
            <input type="text" defaultValue="John" className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>Last name *</label>
            <input type="text" defaultValue="Doe" className={inputClasses} />
          </div>
        </div>

        <div>
          <label className={labelClasses}>Display name *</label>
          <input type="text" defaultValue="John Doe" className={inputClasses} />
          <p className="text-xs text-neutral-400 mt-1.5">This will be how your name will be displayed in the account section and in reviews</p>
        </div>

        <div>
          <label className={labelClasses}>Email address *</label>
          <input type="email" defaultValue="john.doe@example.com" className={inputClasses} />
        </div>

        <fieldset className="mt-4 p-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-6">
          <legend className="px-3 text-sm font-bold text-neutral-500 uppercase tracking-widest bg-slate-50 ml-2">Password Change</legend>
          
          <div>
            <label className={labelClasses}>Current password (leave blank to leave unchanged)</label>
            <input type="password" className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>New password (leave blank to leave unchanged)</label>
            <input type="password" className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>Confirm new password</label>
            <input type="password" className={inputClasses} />
          </div>
        </fieldset>

        <button type="submit" className="h-12 rounded-full bg-amber-500 px-10 text-base font-bold text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 w-fit">
          Save Changes
        </button>
      </form>
    </div>
  );
}
