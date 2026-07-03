'use client';

import React, { useEffect, useState, Suspense, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useTranslations, useLocale } from 'next-intl';

type Tab = 'dashboard' | 'orders' | 'addresses' | 'details' | 'printers' | 'favourites' | 'billing_address' | 'shipping_address' | 'change_password';

type StoredUser = Record<string, unknown>;
type TranslationFn = (key: string, values?: Record<string, string | number | Date>) => string;
type OrderStatus = 'completed' | 'processing' | 'pending' | 'cancelled' | 'failed' | string;
type AccountOrder = {
  id: string;
  date: string;
  status: OrderStatus;
  total: string;
  items: number | null;
  subtotal?: string;
  shipping_amount?: string;
  tax_amount?: string;
  items_list?: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  billing_address?: AccountAddress;
  shipping_address?: AccountAddress;
};
type AddressType = 'billing' | 'shipping' | string;
type AccountAddress = {
  id: string;
  type: AddressType;
  name: string;
  firstname?: string;
  lastname?: string;
  company: string;
  address1: string;
  address2: string;
  postcode?: string;
  city?: string;
  phone?: string;
  country: string;
};

const emptyUser: StoredUser = {};
const validTabs: Tab[] = ['dashboard', 'orders', 'addresses', 'details', 'printers', 'favourites', 'billing_address', 'shipping_address', 'change_password'];

function getValidTab(value: string | null): Tab | null {
  return validTabs.includes(value as Tab) ? (value as Tab) : null;
}

function readStoredUser() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem('auth_user') ?? '';
}

function subscribeToStoredUser(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('auth-user-updated', callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('auth-user-updated', callback);
  };
}

function parseStoredUser(value: string): StoredUser {
  if (!value) {
    return emptyUser;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : emptyUser;
  } catch {
    return emptyUser;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function useStoredUser() {
  const userSnapshot = useSyncExternalStore(subscribeToStoredUser, readStoredUser, () => '');

  return parseStoredUser(userSnapshot);
}

function userString(user: StoredUser, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = user[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }

  return fallback;
}

function userDisplayName(user: StoredUser) {
  const explicitName = userString(user, ['name', 'full_name', 'display_name']);
  if (explicitName) {
    return explicitName;
  }

  const firstName = userString(user, ['first_name', 'firstname']);
  const lastName = userString(user, ['last_name', 'lastname']);
  const combinedName = [firstName, lastName].filter(Boolean).join(' ');

  return combinedName || userString(user, ['email'], 'Customer');
}

function formatEuro(value: number) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function readStringValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number') {
      return String(value);
    }
  }

  return '';
}

function readNumberValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const normalized = Number(value.replace(/[^\d.-]/g, ''));

      if (Number.isFinite(normalized)) {
        return normalized;
      }
    }
  }

  return null;
}

function formatOrderId(order: Record<string, unknown>) {
  const id = readStringValue(order, ['number', 'order_number', 'order_no', 'reference', 'id']);

  if (!id) {
    return 'Order';
  }

  return id.startsWith('#') ? id : `#${id}`;
}

function formatOrderDate(order: Record<string, unknown>) {
  const dateValue = readStringValue(order, ['date', 'ordered_at', 'created_at', 'createdAt']);

  if (!dateValue) {
    return '-';
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
}

function formatOrderTotal(order: Record<string, unknown>) {
  const total = readNumberValue(order, ['total', 'grand_total', 'order_total', 'total_price', 'amount']);
  
  if (total !== null) {
    return formatEuro(total);
  }

  const formattedTotal = readStringValue(order, ['formatted_total', 'total_formatted', 'display_total']);
  return formattedTotal || '-';
}

function readOrderItemCount(order: Record<string, unknown>) {
  const count = readNumberValue(order, ['items_count', 'item_count', 'line_items_count', 'products_count']);
  if (count !== null) {
    return count;
  }

  const items = order.items ?? order.line_items ?? order.order_items;
  return Array.isArray(items) ? items.length : null;
}

function extractOrderList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isPlainObject(payload)) {
    return [];
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.orders)) {
    return payload.orders;
  }

  if (isPlainObject(payload.data) && Array.isArray(payload.data.orders)) {
    return payload.data.orders;
  }

  return [];
}

function normalizeOrders(payload: unknown): AccountOrder[] {
  return extractOrderList(payload)
    .filter(isPlainObject)
    .map((order, index) => {
      const itemsValue = order.items ?? order.line_items ?? order.order_items;
      const itemsRaw = Array.isArray(itemsValue) ? itemsValue : [];
      const billpayer = isPlainObject(order.billpayer) ? order.billpayer : {};
      const billingRaw = isPlainObject(order.billing_address)
        ? order.billing_address
        : isPlainObject(billpayer.address)
          ? billpayer.address
          : null;
      const shippingRaw = isPlainObject(order.shipping_address) ? order.shipping_address : null;

      return {
        id: formatOrderId(order),
        date: formatOrderDate(order),
        status: readStringValue(order, ['status', 'order_status', 'fulfillment_status']) || 'Pending',
        total: formatOrderTotal(order),
        items: readOrderItemCount(order),
        subtotal: formatEuro(readNumberValue(order, ['subtotal']) || 0),
        shipping_amount: formatEuro(readNumberValue(order, ['shipping_amount']) || 0),
        tax_amount: formatEuro(readNumberValue(order, ['tax_amount']) || 0),
        items_list: itemsRaw.map((item, itemIndex) => {
          const itemRecord = isPlainObject(item) ? item : {};
          const product = isPlainObject(itemRecord.product) ? itemRecord.product : {};
          const quantity = readNumberValue(itemRecord, ['quantity', 'qty']) || 1;
          const price = readNumberValue(itemRecord, ['price', 'unit_price']) || 0;
          const total = readNumberValue(itemRecord, ['total', 'line_total']) || (price * quantity);

          return {
            id: readNumberValue(itemRecord, ['id']) || itemIndex,
            name: readStringValue(itemRecord, ['name']) || readStringValue(product, ['name']) || 'Product',
            quantity,
            price: price,
            total: total,
          };
        }),
        billing_address: billingRaw ? normalizeAddress(billingRaw, index) : undefined,
        shipping_address: shippingRaw ? normalizeAddress(shippingRaw, index) : undefined,
      };
    });
}

function OrderSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 w-full bg-slate-100 rounded-[24px] border border-slate-200" />
      ))}
    </div>
  );
}

async function requestAccountOrders() {
  const response = await fetch('/api/account/orders', {
    headers: {
      Accept: 'application/json',
    },
  });
  const data = await response.json().catch(() => ({}));
  console.log('Orders API Response:', data);

  if (!response.ok) {
    if (response.status === 401 || data.message === 'Unauthenticated.') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user');
        window.location.href = '/login?redirect=/my-account';
      }
      return [];
    }
    
    throw new Error(
      isPlainObject(data) && typeof data.message === 'string'
        ? data.message
        : 'Unable to load your orders.'
    );
  }

  return normalizeOrders(data);
}

function formatAddressId(address: Record<string, unknown>, index: number) {
  const id = readStringValue(address, ['id', 'address_id', 'uuid']);
  return id || `address-${index}`;
}

function readAddressType(address: Record<string, unknown>) {
  return readStringValue(address, ['type', 'address_type', 'kind']);
}

function formatAddressName(address: Record<string, unknown>) {
  const explicitName = readStringValue(address, ['name', 'full_name', 'display_name']);
  if (explicitName) {
    return explicitName;
  }

  const firstName = readStringValue(address, ['first_name', 'firstname', 'billing_first_name', 'shipping_first_name']);
  const lastName = readStringValue(address, ['last_name', 'lastname', 'billing_last_name', 'shipping_last_name']);
  const combinedName = [firstName, lastName].filter(Boolean).join(' ');

  return combinedName || 'Saved address';
}

function normalizeAddress(address: Record<string, unknown>, index: number): AccountAddress {
  const street = readStringValue(address, ['street', 'address', 'address_1', 'line1', 'street_address']);
  const street2 = readStringValue(address, ['street2', 'address2', 'address_2', 'line2', 'apartment', 'suite']);
  const postcode = readStringValue(address, ['postcode', 'postalcode', 'postal_code', 'zip', 'zip_code']);
  const city = readStringValue(address, ['city', 'town']);
  const country = readStringValue(address, ['country', 'country_name', 'country_id']) || 'Netherlands';

  return {
    id: formatAddressId(address, index),
    type: readAddressType(address) || 'shipping',
    name: formatAddressName(address),
    firstname: readStringValue(address, ['firstname', 'first_name', 'billing_first_name', 'shipping_first_name']),
    lastname: readStringValue(address, ['lastname', 'last_name', 'billing_last_name', 'shipping_last_name']),
    company: readStringValue(address, ['company', 'company_name', 'business_name']),
    address1: street,
    address2: street2,
    postcode,
    city,
    phone: readStringValue(address, ['phone', 'telephone', 'mobile']),
    country,
  };
}

function extractAddressList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isPlainObject(payload)) {
    return [];
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.addresses)) {
    return payload.addresses;
  }

  if (isPlainObject(payload.data) && Array.isArray(payload.data.addresses)) {
    return payload.data.addresses;
  }

  const typedAddresses = [
    isPlainObject(payload.billing) ? { ...payload.billing, type: readAddressType(payload.billing) || 'billing' } : null,
    isPlainObject(payload.shipping) ? { ...payload.shipping, type: readAddressType(payload.shipping) || 'shipping' } : null,
    isPlainObject(payload.billing_address) ? { ...payload.billing_address, type: readAddressType(payload.billing_address) || 'billing' } : null,
    isPlainObject(payload.shipping_address) ? { ...payload.shipping_address, type: readAddressType(payload.shipping_address) || 'shipping' } : null,
  ].filter(isPlainObject);

  return typedAddresses.length > 0 ? typedAddresses : [];
}

function normalizeAddresses(payload: unknown): AccountAddress[] {
  return extractAddressList(payload)
    .filter(isPlainObject)
    .map(normalizeAddress);
}

async function requestAccountAddresses() {
  const response = await fetch('/api/account/addresses', {
    headers: {
      Accept: 'application/json',
    },
  });
  const data = await response.json().catch(() => ({}));
  console.log('Addresses API Response:', data);

  if (!response.ok) {
    if (response.status === 401 || data.message === 'Unauthenticated.') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user');
        window.location.href = '/login?redirect=/my-account';
      }
      return [];
    }

    throw new Error(
      isPlainObject(data) && typeof data.message === 'string'
        ? data.message
        : 'Unable to load your addresses.'
    );
  }

  return normalizeAddresses(data);
}

async function requestAccountFavorites() {
  const response = await fetch('/api/account/favorites', {
    headers: {
      Accept: 'application/json',
    },
  });
  const data = await response.json().catch(() => ({}));
  console.log('Favorites API Response:', data);

  if (!response.ok) {
    if (response.status === 401 || data.message === 'Unauthenticated.') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user');
        window.location.href = '/login?redirect=/my-account';
      }
      return [];
    }

    throw new Error(
      isPlainObject(data) && typeof data.message === 'string'
        ? data.message
        : 'Unable to load your favorite products.'
    );
  }

  return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
}

function formatCustomerSince(user: StoredUser, t: TranslationFn, locale: string) {
  const dateValue = userString(user, ['created_at', 'createdAt']);

  if (!dateValue) {
    return t('account.detailsLoaded');
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return t('account.detailsLoaded');
  }

  return t('account.customerSince', {
    date: date.toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-US', {
      month: 'long',
      year: 'numeric',
    })
  });
}

export default function MyAccountClient() {
  const t = useTranslations();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>}>
      <MyAccountContent />
    </Suspense>
  );
}

function MyAccountContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => getValidTab(searchParams.get('tab')) ?? 'details');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const user = useStoredUser();
  const t = useTranslations();

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.message === 'string' ? data.message : t('account.logoutError'));
      }

      toast.success(t('account.logoutSuccess'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('account.logoutError'));
    } finally {
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new Event('auth-user-updated'));
      setIsLoggingOut(false);
      window.location.replace('/login');
    }
  };

  const displayName = userDisplayName(user);

  const sidebarItems = [
    { id: 'details', label: t('account.accountDetails') },
    { id: 'billing_address', label: t('account.billingAddress') },
    { id: 'shipping_address', label: t('account.shippingAddress') },
    { id: 'orders', label: t('account.orders') },
    { id: 'change_password', label: t('account.changePassword') },
  ];

  return (
    <div className="bg-slate-50 py-6 sm:py-12 px-4 sm:px-6 font-['Segoe_UI']">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-6">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col gap-4">
          <div className="h-4 inline-flex justify-start items-center gap-2">
            <div>
              <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 9.9615H3.23083V6.6025C3.23083 6.43183 3.28856 6.28872 3.404 6.17317C3.51956 6.05772 3.66267 6 3.83333 6H6.16667C6.33733 6 6.48044 6.05772 6.596 6.17317C6.71144 6.28872 6.76917 6.43183 6.76917 6.6025V9.9615H9V4.064C9 4.02989 8.9925 3.99895 8.9775 3.97117C8.96261 3.94339 8.94233 3.91878 8.91667 3.89733L5.12183 1.04483C5.08761 1.01494 5.047 1 5 1C4.953 1 4.91239 1.01494 4.87817 1.04483L1.08333 3.89733C1.05767 3.91878 1.03739 3.94339 1.0225 3.97117C1.0075 3.99895 1 4.02989 1 4.064V9.9615ZM0 9.9615V4.064C0 3.87322 0.0426665 3.6925 0.128 3.52183C0.213444 3.35106 0.331444 3.21044 0.482 3.1L4.277 0.241C4.48756 0.0803337 4.72822 0 4.999 0C5.26978 0 5.51111 0.0803337 5.723 0.241L9.518 3.1C9.66856 3.21044 9.78656 3.35106 9.872 3.52183C9.95733 3.6925 10 3.87322 10 4.064V9.9615C10 10.2342 9.9015 10.469 9.7045 10.666C9.5075 10.863 9.27267 10.9615 9 10.9615H6.37183C6.20106 10.9615 6.05794 10.9037 5.9425 10.7882C5.82694 10.6727 5.76917 10.5296 5.76917 10.3588V7H4.23083V10.3588C4.23083 10.5296 4.17306 10.6727 4.0575 10.7882C3.94206 10.9037 3.79894 10.9615 3.62817 10.9615H1C0.727333 10.9615 0.4925 10.863 0.2955 10.666C0.0984999 10.469 0 10.2342 0 9.9615Z" fill="#888888"/></svg>
            </div>
            <div className="justify-start text-zinc-500 text-sm font-normal font-['Segoe_UI'] leading-5">/</div>
            <div className="justify-start text-neutral-700 text-sm font-semibold font-['Segoe_UI'] leading-5">{t('account.myAccount')}</div>
          </div>
          <div className="justify-start text-neutral-800 text-4xl font-bold font-['Segoe_UI'] leading-[48px]">{t('account.myAccount')}</div>
        </div>

        {/* Main Card Wrapper */}
        <div className="w-full bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col justify-start items-start overflow-hidden">
          <div className="self-stretch flex flex-col lg:flex-row justify-start items-stretch">
            
            {/* Sidebar */}
            <div className="w-full lg:w-72 p-6 bg-gray-50 flex flex-col justify-start items-start gap-6 shrink-0">
              <div className="self-stretch flex flex-col justify-start items-center gap-1.5">
                <div className="size-20 relative">
                  <div className="size-20 left-0 top-0 absolute rounded-[58px] overflow-hidden bg-slate-200">
                    <img className="w-full h-full object-cover" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`} alt={displayName} />
                  </div>
                  <div className="p-1.5 absolute right-0 bottom-0 bg-neutral-900 rounded-full outline outline-[1.50px] outline-offset-[-1.50px] outline-white inline-flex justify-start items-start gap-2.5">
                    <div className="size-4 relative overflow-hidden text-white flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                    </div>
                  </div>
                </div>
                <div className="justify-start text-neutral-800 text-3xl font-bold font-['Segoe_UI'] leading-8 text-center">{displayName}</div>
              </div>
              
              <div className="self-stretch h-px outline outline-1 outline-offset-[-0.50px] outline-slate-100"></div>
              
              <div className="self-stretch flex flex-col justify-center items-start gap-1">
                {sidebarItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    className={`self-stretch py-3 inline-flex justify-start items-center gap-1.5 ${activeTab === item.id ? 'border-b border-amber-500' : ''}`}
                  >
                    <div className={`text-center justify-start text-lg font-semibold font-['Segoe_UI'] leading-6 ${activeTab === item.id ? 'text-amber-500' : 'text-neutral-700'}`}>
                      {item.label}
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  disabled={isLoggingOut}
                  className="self-stretch py-3 inline-flex justify-start items-center gap-1.5"
                >
                  <div className="text-center justify-start text-red-600 text-lg font-semibold font-['Segoe_UI'] leading-6">
                    {isLoggingOut ? t('account.loggingOut') : 'Logout'}
                  </div>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 flex flex-col justify-start items-start gap-6 min-h-[526px] bg-white">
              {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} user={user} />}
              {activeTab === 'orders' && <OrdersView />}
              {activeTab === 'printers' && <PrintersView />}
              {activeTab === 'favourites' && <FavouriteProductsView />}
              {activeTab === 'addresses' && <AddressesView />}
              {activeTab === 'details' && <AccountDetailsView user={user} />}
              
              {activeTab === 'billing_address' && <SingleAddressView type="billing_address" />}
              {activeTab === 'shipping_address' && <ShippingAddressesView />}
              {activeTab === 'change_password' && <ChangePasswordView />}
            </div>
            
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-sky-950/40 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
          />
          <div className="relative animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-w-full">
             <div className="w-[540px] max-w-full p-10 bg-white rounded-xl shadow-lg outline outline-1 outline-offset-[-1px] outline-black/10 inline-flex flex-col justify-start items-start gap-7 overflow-hidden">
                <div className="self-stretch flex flex-col justify-start items-start gap-8">
                  <div className="self-stretch flex flex-col justify-start items-center gap-6">
                    <div className="self-stretch flex flex-col justify-start items-start gap-2">
                      <div className="self-stretch text-center justify-start text-neutral-800 text-3xl font-semibold font-['Segoe_UI'] leading-10">
                        {t('account.confirmLogout') || 'Confirm Logout'}
                      </div>
                      <div className="self-stretch text-center justify-start text-neutral-700 text-lg font-normal font-['Segoe_UI'] leading-7">
                        {t('account.confirmLogoutDesc') || 'Are you sure to log out?'}
                      </div>
                    </div>
                  </div>
                  <div className="self-stretch inline-flex justify-start items-start gap-2">
                    <button 
                      onClick={() => setShowLogoutConfirm(false)} 
                      disabled={isLoggingOut}
                      className="flex-1 h-12 px-4 py-2.5 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-center justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-6">{t('account.cancel') || 'Cancel'}</div>
                    </button>
                    <button 
                      onClick={handleLogout} 
                      disabled={isLoggingOut}
                      className="flex-1 h-12 px-7 py-4 bg-red-600 rounded-[50px] flex justify-center items-center gap-2.5 hover:bg-red-700 transition-colors"
                    >
                      <div className="text-center justify-start text-white text-lg font-semibold font-['Segoe_UI'] leading-6">
                        {isLoggingOut ? (t('account.loggingOut') || 'Logging Out...') : (t('account.yesLogout') || 'Yes, log Out')}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardView({ setActiveTab, user }: { setActiveTab: (tab: Tab) => void; user: StoredUser }) {
  const t = useTranslations();
  const locale = useLocale();
  const displayName = userDisplayName(user);
  const email = userString(user, ['email']);
  const avatarUrl = userString(user, ['avatar', 'avatar_url', 'profile_photo_url', 'image']);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const nextOrders = await requestAccountOrders();
        setOrders(nextOrders);
      } catch (error) {
        console.error('Failed to load dashboard orders:', error);
      } finally {
        setIsLoading(false);
      }
    }
    void loadDashboardData();
  }, []);

  const stats = [
    { label: t('account.recentOrders'), value: isLoading ? '...' : String(orders.length), sub: t('account.lifetimeTotal') },
    { label: t('account.activePrinters'), value: '3', sub: t('account.statusOnline') },
    // { label: 'Rewards Balance', value: '€ 45.00', sub: '450 pts' },
  ];

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 border-4 border-white shadow-sm overflow-hidden relative">
            <Image src={avatarUrl || "https://placehold.co/128x128"} alt="Profile" fill className="object-cover" />
          </div>
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-neutral-800 tracking-tight">{t('account.welcomeName', { name: displayName })}</h2>
            <p className="text-neutral-500 font-medium">{email || formatCustomerSince(user, t, locale)}</p>
          </div>
        </div>
        <p className="text-neutral-600 text-lg leading-relaxed max-w-2xl">
          {t.rich('account.dashboardDesc', {
            ordersLink: (chunks) => (
              <button onClick={() => setActiveTab('orders')} className="text-amber-500 font-bold hover:underline">
                {chunks}
              </button>
            ),
            printersLink: (chunks) => (
              <button onClick={() => setActiveTab('printers')} className="text-amber-500 font-bold hover:underline">
                {chunks}
              </button>
            ),
            favouritesLink: (chunks) => (
              <button onClick={() => setActiveTab('favourites')} className="text-amber-500 font-bold hover:underline">
                {chunks}
              </button>
            ),
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col gap-3 group hover:border-amber-200 transition-all cursor-default">
            <span className="text-neutral-500 text-sm font-bold uppercase tracking-widest">{stat.label}</span>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-neutral-800">{stat.value}</span>
              <span className="text-neutral-400 text-xs font-semibold">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders List Widget */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-black text-neutral-800 tracking-tight">{t('account.recentOrders')}</h3>
          <button 
            onClick={() => setActiveTab('orders')}
            className="text-amber-500 font-black text-xs uppercase tracking-widest hover:underline"
          >
            {t('account.viewAllOrders')}
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => <div key={i} className="h-20 w-full bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 rounded-[32px] bg-slate-50 border border-dashed border-slate-200 text-center">
            <p className="text-neutral-400 font-bold">{t('account.noOrdersFoundWidget')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.slice(0, 3).map((order) => (
              <div key={order.id} className="group p-5 rounded-[24px] bg-white border border-slate-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-neutral-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-neutral-800">{order.id}</span>
                    <span className="text-xs font-medium text-neutral-400">{order.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-black text-neutral-800">{order.total}</span>
                    <span className={`text-[10px] font-black uppercase tracking-tight ${orderStatusClass(order.status)} px-2 py-0.5 rounded-full`}>
                      {t(`account.${order.status.toLowerCase()}`)}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      // We need to set active tab to orders AND set selected order
                      // But for simplicity, we just link to orders tab
                      setActiveTab('orders');
                    }}
                    className="p-2.5 rounded-full bg-slate-50 text-neutral-400 hover:bg-amber-500 hover:text-white transition-all"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-6 sm:p-10 rounded-2xl sm:rounded-[40px] bg-sky-950 text-white relative overflow-hidden group">
        <div className="relative z-10 flex flex-col gap-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest w-fit">
            {t('account.expertSupportBadge')}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">{t('account.expertSupportTitle')}</h3>
            <p className="text-sky-100/70 text-lg leading-relaxed">
              {t('account.expertSupportDesc')}
            </p>
          </div>
          <Link href="/support" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-black text-sky-950 hover:bg-amber-500 hover:text-white transition-all w-fit shadow-xl shadow-black/10">
            {t('account.talkToExpert')}
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
  const t = useTranslations();
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AccountOrder | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      setOrders(await requestAccountOrders());
    } catch (error) {
      setOrders([]);
      setErrorMessage(error instanceof Error ? error.message : t('account.ordersLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        const nextOrders = await requestAccountOrders();

        if (isMounted) {
          setOrders(nextOrders);
        }
      } catch (error) {
        if (isMounted) {
          setOrders([]);
          setErrorMessage(error instanceof Error ? error.message : t('account.ordersLoadError'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, [t]);

  return (
    <div className="flex-1 inline-flex flex-col justify-start items-start gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="justify-start text-neutral-800 text-3xl font-semibold font-['Segoe_UI'] leading-8">{t('account.orderHistory') || 'Order History'}</div>

      {isLoading ? (
        <OrderSkeleton />
      ) : errorMessage ? (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-8">
          <h3 className="text-lg font-black text-red-700">{t('account.ordersLoadError')}</h3>
          <p className="mt-2 font-medium text-red-600">{errorMessage}</p>
          <button
            type="button"
            onClick={() => void fetchOrders()}
            className="mt-5 rounded-full bg-red-600 px-6 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-700"
          >
            {t('account.tryAgain')}
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-[40px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 text-slate-300">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="m16 10-4 4-4-4"/>
            </svg>
          </div>
          <h3 className="text-2xl font-black text-neutral-800">{t('account.noOrdersFound')}</h3>
          <p className="mt-2 font-medium text-neutral-400 max-w-sm mx-auto">{t('account.noOrdersFoundDesc')}</p>
          <Link
            href="/product"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-sky-950 px-10 text-sm font-black text-white transition-all hover:bg-amber-500 hover:shadow-xl hover:shadow-amber-500/20"
          >
            {t('account.continueShopping')}
          </Link>
        </div>
      ) : (
        <div className="self-stretch py-6 relative bg-white rounded-xl flex flex-col justify-start items-start gap-6 overflow-hidden outline outline-1 outline-slate-200 shadow-sm">
          <div className="w-full h-16 left-0 top-0 absolute bg-white border-b border-slate-100"></div>
          
          <div className="self-stretch inline-flex justify-start items-center gap-6 px-8 relative z-10 h-4">
            <div className="w-24 justify-start text-neutral-700 text-base font-semibold font-['Segoe_UI'] leading-5">{t('account.tableOrder') || 'Order ID'}</div>
            <div className="flex-1 justify-start text-neutral-700 text-base font-semibold font-['Segoe_UI'] leading-5">{t('account.tableDate') || 'Date'}</div>
            <div className="w-28 justify-start text-neutral-700 text-base font-semibold font-['Segoe_UI'] leading-5">{t('account.tableStatus') || 'Status'}</div>
            <div className="w-28 justify-start text-neutral-700 text-base font-semibold font-['Segoe_UI'] leading-5">{t('account.tableTotal') || 'Price'}</div>
            <div className="w-36 justify-start text-neutral-700 text-base font-semibold font-['Segoe_UI'] leading-5">{t('account.tableActions') || 'Action'}</div>
          </div>
          
          <div className="self-stretch flex flex-col justify-start items-start gap-2.5 px-8 relative z-10 w-full">
            {orders.map((order, index) => (
              <Fragment key={`${order.id}-${order.date}-${index}`}>
                <div className="self-stretch py-4 inline-flex justify-start items-center gap-6 group hover:bg-slate-50/50 transition-colors -mx-8 px-8 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <div className="w-24 justify-start text-neutral-700 text-lg font-normal font-['Segoe_UI'] leading-6">{order.id}</div>
                  <div className="flex-1 justify-start text-neutral-700 text-lg font-normal font-['Segoe_UI'] leading-6">{order.date}</div>
                  <div className="w-28 justify-start text-lg font-semibold font-['Segoe_UI'] leading-6">
                    <span className={order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'delivered' ? 'text-green-600' : 'text-amber-500'}>
                      {t(`account.${order.status.toLowerCase()}`) || order.status}
                    </span>
                  </div>
                  <div className="w-28 justify-start text-neutral-700 text-lg font-normal font-['Segoe_UI'] leading-6">{order.total}</div>
                  <div className="w-36 flex justify-start items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }} 
                      className="justify-start text-amber-500 text-lg font-semibold font-['Segoe_UI'] underline leading-6 hover:text-amber-600"
                    >
                      {t('account.details') || 'View Details'}
                    </button>
                  </div>
                </div>
                {index < orders.length - 1 && (
                  <div className="self-stretch h-px outline outline-1 outline-offset-[-0.50px] outline-gray-200"></div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-sky-950/40 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-black text-neutral-800 tracking-tight">{t('account.orderNumber', { number: selectedOrder.id })}</h3>
                <p className="text-sm font-medium text-neutral-500">{t('account.placedOn', { date: selectedOrder.date })}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="size-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:border-neutral-300 transition-all shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar">
              {/* Status Banner */}
              <div className={`p-4 rounded-2xl flex items-center justify-between ${orderStatusClass(selectedOrder.status)}`}>
                <span className="font-bold text-sm uppercase tracking-widest">{t('account.currentStatus')}</span>
                <span className="font-black text-sm uppercase tracking-widest">{t(`account.${selectedOrder.status.toLowerCase()}`)}</span>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest px-1">{t('account.orderItems')}</h4>
                <div className="flex flex-col gap-3">
                  {selectedOrder.items_list?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-neutral-800">{item.name}</span>
                        <span className="text-xs font-medium text-neutral-400">{t('account.quantityCount', { count: item.quantity })}</span>
                      </div>
                      <span className="font-black text-neutral-800">{formatEuro(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest px-1">{t('account.billingAddress')}</h4>
                  <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col gap-1 text-sm font-medium text-neutral-600">
                    <span className="font-bold text-neutral-800 mb-1 text-base">{selectedOrder.billing_address?.name}</span>
                    {selectedOrder.billing_address?.company && <span>{selectedOrder.billing_address.company}</span>}
                    {selectedOrder.billing_address?.address1 && <span>{selectedOrder.billing_address.address1}</span>}
                    {selectedOrder.billing_address?.address2 && <span>{selectedOrder.billing_address.address2}</span>}
                    <span>{selectedOrder.billing_address?.postcode} {selectedOrder.billing_address?.city}</span>
                    <span>{selectedOrder.billing_address?.country}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest px-1">{t('account.shippingAddress')}</h4>
                  <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col gap-1 text-sm font-medium text-neutral-600">
                    <span className="font-bold text-neutral-800 mb-1 text-base">{selectedOrder.shipping_address?.name}</span>
                    {selectedOrder.shipping_address?.company && <span>{selectedOrder.shipping_address.company}</span>}
                    {selectedOrder.shipping_address?.address1 && <span>{selectedOrder.shipping_address.address1}</span>}
                    {selectedOrder.shipping_address?.address2 && <span>{selectedOrder.shipping_address.address2}</span>}
                    <span>{selectedOrder.shipping_address?.postcode} {selectedOrder.shipping_address?.city}</span>
                    <span>{selectedOrder.shipping_address?.country}</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="flex flex-col gap-3 p-6 rounded-3xl bg-neutral-900 text-white mt-4">
                <div className="flex justify-between text-sm text-neutral-400 font-bold">
                  <span>{t('account.subtotal')}</span>
                  <span>{selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-neutral-400 font-bold">
                  <span>{t('account.shipping')}</span>
                  <span>{selectedOrder.shipping_amount}</span>
                </div>
                <div className="flex justify-between text-sm text-neutral-400 font-bold">
                  <span>{t('account.tax')}</span>
                  <span>{selectedOrder.tax_amount}</span>
                </div>
                <div className="h-px bg-white/10 my-1" />
                <div className="flex justify-between text-xl font-black">
                  <span>{t('account.total')}</span>
                  <span className="text-amber-400">{selectedOrder.total}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-full h-12 bg-white border border-slate-200 text-neutral-800 font-black text-sm rounded-full hover:bg-slate-50 transition-all shadow-sm"
              >
                {t('account.closeOrderDetails')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function orderStatusClass(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (['completed', 'complete', 'paid', 'delivered'].includes(normalizedStatus)) {
    return 'bg-emerald-50 text-emerald-600';
  }

  if (['cancelled', 'canceled', 'failed', 'refunded'].includes(normalizedStatus)) {
    return 'bg-red-50 text-red-600';
  }

  return 'bg-amber-50 text-amber-600';
}

function PrintersView() {
  const t = useTranslations();
  const [printers, setPrinters] = useState<PrinterCardData[]>([]);

  useEffect(() => {
    const loadFavorites = () => {
      setPrinters(JSON.parse(localStorage.getItem('favorite_printers') || '[]'));
    };
    loadFavorites();
    window.addEventListener('favorites-updated', loadFavorites);
    return () => window.removeEventListener('favorites-updated', loadFavorites);
  }, []);

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-neutral-800 tracking-tight">{t('account.myPrinters')}</h2>
          <p className="text-neutral-500 font-medium">{t('account.hardwareMonitoring')}</p>
        </div>
        <Link href="/en/printers" className="h-11 px-8 bg-sky-950 text-white rounded-full font-bold text-sm hover:bg-amber-500 transition-all flex items-center gap-2 whitespace-nowrap">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
             <path d="M5 12h14"/><path d="M12 5v14"/>
           </svg>
           {t('account.findMorePrinters')}
        </Link>
      </div>

      {printers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
             <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
           </svg>
           <p className="mt-4 text-neutral-400 font-bold">{t('account.noSavedPrinters')}</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {printers.map((printer) => (
          <div key={printer.id} className="group p-8 rounded-[32px] border border-slate-200 bg-white hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/5 transition-all flex flex-col gap-6">
            <div className="relative h-48 bg-slate-100 rounded-2xl overflow-hidden p-6 group-hover:scale-[1.02] transition-transform">
               <Image src={printer.mainImage || "https://placehold.co/400x300"} alt={printer.name} fill className="object-contain" unoptimized />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-black text-neutral-800 leading-tight">{printer.name}</h3>
              <div className="flex items-center justify-between">
                {printer.sku ? (
                  <span className="text-neutral-400 font-bold text-sm tracking-tight">{t('account.skuNumber', { sku: printer.sku })}</span>
                ) : (
                  <span />
                )}
                <Link href={printer.slug ? `/materials/${printer.slug}` : "#"} className="text-amber-500 font-black text-xs uppercase tracking-wider hover:underline">{t('account.viewPrinter')}</Link>
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="grid grid-cols-2 gap-4">
               <button 
                onClick={() => {
                   const favorites = JSON.parse(localStorage.getItem('favorite_printers') || '[]');
                   const updated = favorites.filter((p: PrinterCardData) => p.id !== printer.id);
                   localStorage.setItem('favorite_printers', JSON.stringify(updated));
                   setPrinters(updated);
                   window.dispatchEvent(new Event('favorites-updated'));
                }}
                className="flex flex-col gap-1 text-left group/btn">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest group-hover/btn:text-red-500 transition-colors">{t('account.action', { fallback: 'Action' })}</span>
                  <span className="text-sm font-bold text-neutral-800 group-hover/btn:text-red-500 transition-colors">{t('account.removeFromFavorites')}</span>
               </button>
               <Link href={printer.slug ? `/materials/${printer.slug}` : "#"} className="flex flex-col gap-1 text-left group/btn">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest group-hover/btn:text-amber-500 transition-colors">{t('account.supplies', { fallback: 'Supplies' })}</span>
                  <span className="text-sm font-bold text-neutral-800">{t('account.buyLabels')}</span>
               </Link>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { useWishlist } from "@/components/WishlistProvider";
import { PrinterCardData } from './PrintersListing';

function FavouriteProductsView() {
  const t = useTranslations();
  const wishlist = useWishlist();
  const [favourites, setFavourites] = useState<ProductCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadFavourites() {
      try {
        const nextFavourites = await requestAccountFavorites();
        if (isMounted) {
          setFavourites(nextFavourites);
        }
      } catch (error) {
        if (isMounted) {
          setFavourites([]);
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load your favorite products.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFavourites();

    window.addEventListener('favorites-updated', loadFavourites);

    return () => {
      isMounted = false;
      window.removeEventListener('favorites-updated', loadFavourites);
    };
  }, [t]);

  const handleRemoveFavorite = async (product: ProductCardData) => {
    const key = product.slug ? (product.type ? `${product.slug}::${product.type}` : product.slug) : String(product.id);
    
    // Optimistic update for current view
    setFavourites(prev => prev.filter(p => p.id !== product.id));

    // Remove from local wishlist state & trigger DELETE API sync
    wishlist.removeItem(key, { id: product.id, type: product.type });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-neutral-800 tracking-tight">{t('account.favouriteProducts')}</h2>
          <p className="text-neutral-500 font-medium">{t('account.favouriteSuppliesDesc')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="h-96 bg-slate-50 rounded-[40px] animate-pulse border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-neutral-800 tracking-tight">{t('account.favouriteProducts')}</h2>
          <p className="text-neutral-500 font-medium">{t('account.favouriteSuppliesDesc')}</p>
        </div>
        <div className="p-8 bg-red-50 border border-red-200 text-red-600 rounded-[40px] font-bold text-center">
          {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">{t('account.favouriteProducts')}</h2>
        <p className="text-neutral-500 font-medium">{t('account.favouriteSuppliesDesc')}</p>
      </div>

      {favourites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
             <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
           </svg>
           <p className="mt-4 text-neutral-400 font-bold">{t('account.noFavourites')}</p>
           <Link href="/product" className="mt-6 h-11 px-8 bg-amber-500 text-white rounded-full font-black text-sm hover:shadow-lg shadow-amber-500/20 transition-all flex items-center">
             {t('account.browseSupplies')}
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {favourites.map((product) => (
            <div key={product.sku} className="relative group">
              <ProductCard 
                product={product} 
                href={product.slug ? `/product/${product.slug}` : undefined}
              />
              <button
                onClick={() => handleRemoveFavorite(product)}
                className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-red-500 hover:text-white text-neutral-500 p-2 rounded-full shadow-md transition-all duration-200 flex items-center justify-center border border-neutral-200/50 hover:border-red-500"
                title={t('account.removeFromFavorites') || "Remove from favorites"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function AddressesView() {
  const t = useTranslations();
  const [editingAddress, setEditingAddress] = useState<'billing' | 'shipping' | null>(null);
  const [addresses, setAddresses] = useState<AccountAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchAddresses = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      setAddresses(await requestAccountAddresses());
    } catch (error) {
      setAddresses([]);
      setErrorMessage(error instanceof Error ? error.message : t('account.addressesLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadAddresses() {
      try {
        const nextAddresses = await requestAccountAddresses();

        if (isMounted) {
          setAddresses(nextAddresses);
        }
      } catch (error) {
        if (isMounted) {
          setAddresses([]);
          setErrorMessage(error instanceof Error ? error.message : t('account.addressesLoadError'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAddresses();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const billingAddress = addresses.find((address) => address.type?.toLowerCase() === 'billing' || address.type?.toLowerCase().includes('billing'));
  const shippingAddress = addresses.find((address) => address.type?.toLowerCase() === 'shipping' || address.type?.toLowerCase().includes('shipping'));


  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">{t('account.addresses')}</h2>
        <p className="text-neutral-500 font-medium">{t('account.addressesSub')}</p>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-100 bg-slate-50">
          <div className="flex flex-col items-center gap-3 text-neutral-500">
            <div className="size-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
            <p className="font-bold">{t('account.loadingAddresses')}</p>
          </div>
        </div>
      ) : errorMessage ? (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-8">
          <h3 className="text-lg font-black text-red-700">{t('account.addressesLoadError')}</h3>
          <p className="mt-2 font-medium text-red-600">{errorMessage}</p>
          <button
            type="button"
            onClick={() => void fetchAddresses()}
            className="mt-5 rounded-full bg-red-600 px-6 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-700"
          >
            {t('account.tryAgain')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <AddressProfile
            title={t('account.billingAddress')}
            address={billingAddress}
            emptyLabel={t('account.billingAddressEmpty')}
            actionLabel={billingAddress ? t('account.change') : t('account.addNew')}
            variant="billing"
            onEdit={() => setEditingAddress('billing')}
          />

          <AddressProfile
            title={t('account.shippingAddress')}
            address={shippingAddress}
            emptyLabel={t('account.shippingAddressEmpty')}
            actionLabel={shippingAddress ? t('account.change') : t('account.addNew')}
            variant="shipping"
            onEdit={() => setEditingAddress('shipping')}
          />
        </div>
      )}

      {editingAddress && (
        <AddressEditModal 
          type={editingAddress} 
          onClose={() => setEditingAddress(null)} 
          onSave={() => {
            setEditingAddress(null);
            void fetchAddresses();
          }}
          address={editingAddress === 'billing' ? billingAddress : shippingAddress}
        />
      )}
    </div>
  );
}

function ShippingAddressesView() {
  const t = useTranslations();
  const [editingAddress, setEditingAddress] = useState<AccountAddress | 'new' | null>(null);
  const [addresses, setAddresses] = useState<AccountAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchAddresses = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setAddresses(await requestAccountAddresses());
    } catch (error) {
      setAddresses([]);
      setErrorMessage(error instanceof Error ? error.message : t('account.addressesLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadAddresses() {
      try {
        const nextAddresses = await requestAccountAddresses();
        if (isMounted) setAddresses(nextAddresses);
      } catch (error) {
        if (isMounted) {
          setAddresses([]);
          setErrorMessage(error instanceof Error ? error.message : t('account.addressesLoadError'));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadAddresses();
    return () => { isMounted = false; };
  }, [t]);

  const shippingAddresses = addresses.filter((address) => {
    const addressType = address.type?.toLowerCase() || '';
    return addressType === 'shipping' || addressType.includes('shipping');
  });

  const getLabel = (key: string, fallback: string) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-64 w-full items-center justify-center rounded-3xl border border-slate-100 bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-neutral-500">
          <div className="size-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
          <p className="font-bold">{t('account.loadingAddresses')}</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-8 w-full">
        <h3 className="text-lg font-black text-red-700">{t('account.addressesLoadError')}</h3>
        <p className="mt-2 font-medium text-red-600">{errorMessage}</p>
        <button type="button" onClick={() => void fetchAddresses()} className="mt-5 rounded-full bg-red-600 px-6 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-700">{t('account.tryAgain')}</button>
      </div>
    );
  }

  return (
    <div className="self-stretch flex flex-col justify-start items-start gap-4 w-full">
      <div className="justify-start text-neutral-800 text-3xl font-semibold font-['Segoe_UI'] leading-8">
        {getLabel('account.shippingAddress', 'Shipping Address')}
      </div>
      <div className="self-stretch h-px outline outline-1 outline-offset-[-0.50px] outline-slate-100"></div>
      
      <div className="self-stretch flex flex-col justify-start items-start gap-4 mt-2">
        {shippingAddresses.length === 0 && (
          <div className="text-zinc-500 text-base">{getLabel('account.noShippingAddresses', 'No shipping addresses found.')}</div>
        )}
        {shippingAddresses.map((addr, index) => {
          const isSelected = index === 0;
          const name = addr.name || `${addr.firstname || ''} ${addr.lastname || ''}`.trim();
          const addressStr = [addr.address1, addr.address2, addr.city, addr.postcode, addr.country].filter(Boolean).join(', ');
          
          return (
            <div key={addr.id || index} className={`flex-1 p-4 relative rounded-xl outline ${isSelected ? 'bg-amber-500/0 outline-[1.50px] outline-amber-500' : 'bg-white outline-1 outline-slate-200'} inline-flex flex-col justify-start items-start gap-2.5 w-full`}>
              <div className="self-stretch inline-flex justify-start items-start gap-3">
                <div className="w-5 h-6 relative mt-1">
                  {isSelected ? (
                    <div className="size-5 left-0 top-[2px] absolute">
                        <div className="size-5 left-0 top-0 absolute bg-amber-500 rounded-full"></div>
                        <div className="size-3 left-[4.17px] top-[4.17px] absolute overflow-hidden">
                            <div className="w-2 h-[4.86px] left-[2.43px] top-[3.40px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-white"></div>
                        </div>
                    </div>
                  ) : (
                    <div className="size-5 left-0 top-[2px] absolute">
                        <div className="size-5 left-0 top-0 absolute rounded-full border border-slate-300"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                  <div className="inline-flex justify-start items-center gap-1">
                    <div className="justify-start text-neutral-800 text-xl font-semibold font-['Segoe_UI'] leading-6">{name || '-'}</div>
                  </div>
                  <div className="inline-flex justify-start items-start gap-2 flex-wrap">
                    {addr.company && <div className="justify-center text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-6">{addr.company}</div>}
                    {addr.company && addr.phone && <div className="justify-center text-slate-300 text-base font-normal font-['Segoe_UI'] leading-6">|</div>}
                    {addr.phone && <div className="justify-center text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-6">{addr.phone}</div>}
                  </div>
                  <div className="justify-center text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-6">{addressStr}</div>
                  <div className="self-stretch h-px outline outline-1 outline-offset-[-0.50px] outline-slate-100 mt-1"></div>
                  <div className="self-stretch inline-flex justify-start items-center gap-4 mt-1">
                    <button onClick={() => setEditingAddress(addr)} className="flex justify-start items-center gap-2 hover:opacity-80 text-amber-500 group">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      <div className="text-right justify-start text-base font-semibold font-['Segoe_UI'] leading-5">{getLabel('account.edit', 'Edit')}</div>
                    </button>
                    {shippingAddresses.length > 1 && (
                      <>
                        <div className="w-px h-4 bg-slate-300 rounded-[10px]"></div>
                        <button className="flex justify-start items-center gap-2 hover:opacity-80 text-zinc-500 group">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          <div className="text-right justify-start text-base font-semibold font-['Segoe_UI'] leading-5">{getLabel('account.remove', 'Remove')}</div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={() => setEditingAddress('new')}
        className="h-12 px-8 py-2.5 mt-4 rounded-[100px] outline outline-[1.50px] outline-offset-[-1.50px] outline-amber-500 inline-flex justify-center items-center gap-2 hover:bg-amber-50 transition-colors"
      >
        <div className="text-center justify-start text-amber-500 text-xl font-semibold font-['Segoe_UI'] leading-6 mr-1">+</div>
        <div className="text-center justify-start text-amber-500 text-lg font-semibold font-['Segoe_UI'] leading-6">{getLabel('account.addNewAddress', 'Add New Address')}</div>
      </button>

      {editingAddress && (
        <AddressEditModal 
          type="shipping"
          onClose={() => setEditingAddress(null)} 
          onSave={() => {
            setEditingAddress(null);
            void fetchAddresses();
          }}
          address={editingAddress === 'new' ? undefined : editingAddress}
        />
      )}
    </div>
  );
}

function SingleAddressView({ type }: { type: 'billing_address' | 'shipping_address' }) {
  const t = useTranslations();
  const isBilling = type === 'billing_address';
  const typeWord = isBilling ? 'Billing' : 'Shipping';
  const [editingAddress, setEditingAddress] = useState<'billing' | 'shipping' | null>(null);
  const [addresses, setAddresses] = useState<AccountAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchAddresses = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setAddresses(await requestAccountAddresses());
    } catch (error) {
      setAddresses([]);
      setErrorMessage(error instanceof Error ? error.message : t('account.addressesLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadAddresses() {
      try {
        const nextAddresses = await requestAccountAddresses();
        if (isMounted) setAddresses(nextAddresses);
      } catch (error) {
        if (isMounted) {
          setAddresses([]);
          setErrorMessage(error instanceof Error ? error.message : t('account.addressesLoadError'));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadAddresses();
    return () => { isMounted = false; };
  }, [t]);

  const targetAddress = addresses.find((address) => {
    const addressType = address.type?.toLowerCase() || '';
    return isBilling ? (addressType === 'billing' || addressType.includes('billing')) : (addressType === 'shipping' || addressType.includes('shipping'));
  });

  if (isLoading) {
    return (
      <div className="flex min-h-64 w-full items-center justify-center rounded-3xl border border-slate-100 bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-neutral-500">
          <div className="size-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
          <p className="font-bold">{t('account.loadingAddresses')}</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-8 w-full">
        <h3 className="text-lg font-black text-red-700">{t('account.addressesLoadError')}</h3>
        <p className="mt-2 font-medium text-red-600">{errorMessage}</p>
        <button type="button" onClick={() => void fetchAddresses()} className="mt-5 rounded-full bg-red-600 px-6 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-700">{t('account.tryAgain')}</button>
      </div>
    );
  }

  const firstName = targetAddress?.firstname || targetAddress?.name?.split(' ')[0] || '-';
  const lastName = targetAddress?.lastname || (targetAddress?.name?.includes(' ') ? targetAddress?.name?.substring(targetAddress.name.indexOf(' ') + 1) : '-');

  const getLabel = (key: string, fallback: string) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  return (
    <div className="self-stretch flex flex-col justify-start items-start gap-4 w-full">
      <div className="justify-start text-neutral-800 text-3xl font-semibold font-['Segoe_UI'] leading-8">
        {isBilling ? getLabel('account.billingAddress', 'Billing Address') : getLabel('account.shippingAddress', 'Shipping Address')}
      </div>
      <div className="self-stretch h-px outline outline-1 outline-offset-[-0.50px] outline-slate-100"></div>
      
      <div className="self-stretch flex flex-col justify-start items-start gap-6 mt-2">
        <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-6 sm:gap-4">
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
            <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.company', 'Company name')}</div>
            <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{targetAddress?.company || '-'}</div>
          </div>
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
            <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.vatNumber', 'VAT number')}</div>
            <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{'-'}</div>
          </div>
        </div>

        <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-6 sm:gap-4">
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
            <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.firstName', 'First name')}</div>
            <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{firstName}</div>
          </div>
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
            <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.lastName', 'Last name')}</div>
            <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{lastName}</div>
          </div>
        </div>

        <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-6 sm:gap-4">
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
            <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.emailAddress', 'Email address')}</div>
            <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{'-'}</div>
          </div>
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
            <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.phoneNumber', 'Phone number')}</div>
            <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{targetAddress?.phone || '-'}</div>
          </div>
        </div>

        <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-6 sm:gap-4">
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
            <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.country', 'Country/Region')}</div>
            {/* Displaying country placeholder for now or if we have country_id */}
            <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{'-'}</div>
          </div>
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
            <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.streetAndHouseNumber', 'Street and house number')}</div>
            <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{[targetAddress?.address1, targetAddress?.address2].filter(Boolean).join(', ') || '-'}</div>
          </div>
        </div>

        <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-6 sm:gap-4">
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
            <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.postCode', 'Post code')}</div>
            <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{targetAddress?.postcode || '-'}</div>
          </div>
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
            <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.city', 'Place')}</div>
            <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{targetAddress?.city || '-'}</div>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setEditingAddress(isBilling ? 'billing' : 'shipping')}
        className="h-12 px-8 py-2.5 mt-4 rounded-[100px] outline outline-[1.50px] outline-offset-[-1.50px] outline-amber-500 inline-flex justify-center items-center gap-2 hover:bg-amber-50 transition-colors"
      >
        <div className="text-center justify-start text-amber-500 text-lg font-semibold font-['Segoe_UI'] leading-6">{t('account.editAddress') || 'Edit Address'}</div>
      </button>

      {editingAddress && (
        <AddressEditModal 
          type={editingAddress} 
          onClose={() => setEditingAddress(null)} 
          onSave={() => {
            setEditingAddress(null);
            void fetchAddresses();
          }}
          address={targetAddress}
        />
      )}
    </div>
  );
}

function AddressEditModal({ 
  type, 
  onClose, 
  onSave, 
  address 
}: { 
  type: 'billing' | 'shipping'; 
  onClose: () => void; 
  onSave: () => void;
  address?: AccountAddress;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const isBilling = type === 'billing';
  const inputClasses = "w-full h-14 px-6 rounded-2xl border border-slate-200 focus:border-amber-400 outline-none transition-all text-neutral-800 text-base bg-white focus:ring-[6px] focus:ring-amber-500/5 font-medium";
  const labelClasses = "text-xs font-black text-neutral-500 uppercase tracking-widest mb-2.5 block ml-1";

  const [firstName, setFirstName] = useState(address?.firstname || '');
  const [lastName, setLastName] = useState(address?.lastname || '');
  const [company, setCompany] = useState(address?.company || '');
  const [street, setStreet] = useState(address?.address1 || '');
  const [street2, setStreet2] = useState(address?.address2 || '');
  const [postcode, setPostcode] = useState(address?.postcode || '');
  const [city, setCity] = useState(address?.city || '');
  const [phone, setPhone] = useState(address?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const typeWord = isBilling 
    ? (locale === 'nl' ? 'Factuur' : 'Billing') 
    : (locale === 'nl' ? 'Aflever' : 'Shipping');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        id: address?.id,
        type,
        name: `${firstName} ${lastName}`,
        firstname: firstName,
        lastname: lastName,
        company_name: company,
        address: street,
        address2: street2,
        postalcode: postcode,
        city: city,
        phone: phone,
        country_id: 'NL',
      };


      const response = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.message || t('account.addressesLoadError'));
      }

      toast.success(t('account.addressSavedSuccess', { type: typeWord }));
      onSave();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('account.addressesLoadError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-sky-950/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-black text-neutral-800 tracking-tight">
              {t('account.editAddressTitle', { type: typeWord })}
            </h3>
            <p className="text-sm font-medium text-neutral-500">
              {t('account.editAddressDesc', { typeDesc: isBilling ? t('account.invoiceWord') : t('account.deliveryWord') })}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="size-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:border-neutral-300 transition-all shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form id="address-form-modal" className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>{t('account.firstName')}</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClasses} required />
              </div>
              <div>
                <label className={labelClasses}>{t('account.lastName')}</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClasses} required />
              </div>
            </div>

            <div>
              <label className={labelClasses}>{t('account.companyOptional')}</label>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className={inputClasses} />
            </div>

              <div>
                <label className={labelClasses}>{t('account.streetAddress')}</label>
                <div className="flex flex-col gap-3">
                  <AddressAutocomplete
                    value={street}
                    onChange={setStreet}
                    onAddressSelect={(addr) => {
                      if (addr.street) setStreet(addr.street);
                      if (addr.city) setCity(addr.city);
                      if (addr.postcode) setPostcode(addr.postcode);
                    }}
                    className={inputClasses}
                  />
                  <input type="text" placeholder={t('account.apartmentOptional')} value={street2} onChange={(e) => setStreet2(e.target.value)} className={inputClasses} />
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className={labelClasses}>{t('account.postcode')}</label>
                <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value)} className={inputClasses} required />
              </div>
              <div className="md:col-span-2">
                <label className={labelClasses}>{t('account.townCity')}</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClasses} required />
              </div>
            </div>

            <div>
              <label className={labelClasses}>{t('account.phone')}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <button 
            form="address-form-modal"
            type="submit" 
            disabled={isSaving} 
            className="flex-1 h-14 rounded-full bg-amber-500 px-8 text-base font-black text-white hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/30 uppercase tracking-widest disabled:opacity-50"
          >
            {isSaving ? t('account.saving') : t('account.saveAddress')}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="h-14 rounded-full bg-white border border-slate-200 px-8 text-base font-black text-neutral-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
          >
            {t('account.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressProfile({
  title,
  address,
  emptyLabel,
  actionLabel,
  variant,
  onEdit,
}: {
  title: string;
  address?: AccountAddress;
  emptyLabel: string;
  actionLabel: string;
  variant: 'billing' | 'shipping';
  onEdit: () => void;
}) {
  const isShipping = variant === 'shipping';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-black text-neutral-800">{title}</h3>
        <button
          onClick={onEdit}
          className={isShipping
            ? 'h-9 px-5 bg-amber-500 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20'
            : 'text-amber-500 font-black text-sm uppercase tracking-wider hover:underline'}
        >
          {actionLabel}
        </button>
      </div>

      {address ? (
        <div className="p-8 rounded-[32px] bg-white border border-slate-200 text-neutral-600 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <p className="text-xl font-black text-neutral-800 mb-1">{address.name}</p>
            {address.company ? <p className="font-medium">{address.company}</p> : null}
            <p className="font-medium">{address.address1}</p>
            {address.address2 ? <p className="font-medium">{address.address2}</p> : null}
            <p className="font-medium">{address.postcode} {address.city}</p>
            <p className="font-bold text-amber-600">{address.country}</p>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 text-neutral-300 min-h-[220px] flex flex-col items-center justify-center gap-4 text-center">
           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
           <span className="font-bold italic">{emptyLabel}</span>
        </div>
      )}
    </div>
  );
}


function AccountDetailsView({ user }: { user: StoredUser }) {
  const t = useTranslations();
  const inputClasses = "w-full h-14 px-6 rounded-2xl border border-slate-200 focus:border-amber-400 outline-none transition-all text-neutral-800 text-base bg-white focus:ring-[6px] focus:ring-amber-500/5 font-medium";
  const labelClasses = "text-xs font-black text-neutral-500 uppercase tracking-widest mb-2.5 block ml-1";
  
  const displayName = userDisplayName(user);
  const [name, setName] = useState(displayName);
  const [email, setEmail] = useState(userString(user, ['email']));
  const [phone, setPhone] = useState(userString(user, ['phone', 'mobile']));
  const [isSaving, setIsSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setName(userDisplayName(user));
    setEmail(userString(user, ['email']));
    setPhone(userString(user, ['phone', 'mobile']));
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name, email, phone }),
      });

      const data = await response.json();
      console.log('Profile API Response:', data);

      if (!response.ok) {
        throw new Error(data.message || t('account.profileUpdatedSuccess'));
      }

      localStorage.setItem('auth_user', JSON.stringify(data.data || data));
      window.dispatchEvent(new Event('auth-user-updated'));
      toast.success(t('account.profileUpdatedSuccess'));
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('account.profileUpdatedSuccess'));
    } finally {
      setIsSaving(false);
    }
  };

  const firstName = name.split(' ')[0] || '-';
  const lastName = name.substring(name.indexOf(' ') + 1) || '-';

  const getLabel = (key: string, fallback: string) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  if (!isEditing) {
    return (
      <div className="self-stretch flex flex-col justify-start items-start gap-4">
        <div className="justify-start text-neutral-800 text-3xl font-semibold font-['Segoe_UI'] leading-8">{t('account.accountDetails')}</div>
        <div className="self-stretch h-px outline outline-1 outline-offset-[-0.50px] outline-slate-100"></div>
        <div className="self-stretch flex flex-col justify-start items-start gap-6 mt-2">
          <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-6 sm:gap-4">
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
              <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.firstName', 'First name')}</div>
              <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{firstName}</div>
            </div>
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
              <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.lastName', 'Last name')}</div>
              <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{name.includes(' ') ? lastName : '-'}</div>
            </div>
          </div>
          <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-6 sm:gap-4">
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
              <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.emailAddress', 'Email address')}</div>
              <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{email || '-'}</div>
            </div>
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
              <div className="justify-center text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">{getLabel('account.phoneNumber', 'Phone number')}</div>
              <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{phone || '-'}</div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="h-12 px-8 py-2.5 mt-4 rounded-[100px] outline outline-[1.50px] outline-offset-[-1.50px] outline-amber-500 inline-flex justify-center items-center gap-2 hover:bg-amber-50 transition-colors"
        >
          <div className="text-center justify-start text-amber-500 text-lg font-semibold font-['Segoe_UI'] leading-6">{getLabel('account.editProfile', 'Edit Profile')}</div>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">{t('account.editProfile') || 'Edit Profile'}</h2>
        <p className="text-neutral-500 font-medium">{t('account.detailsSub')}</p>
      </div>
      
      <form className="flex flex-col gap-8 max-w-2xl" onSubmit={handleSaveProfile}>
        <div>
          <label className={labelClasses}>{t('account.fullName')}</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className={inputClasses} 
            required
          />
          <p className="text-xs font-bold text-neutral-400 mt-3 ml-1 italic opacity-60">{t('account.reviewDisclaimer')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>{t('account.emailAddress')}</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses} 
              required
            />
          </div>
          <div>
            <label className={labelClasses}>{t('account.phoneNumber')}</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+31 6 12345678"
              className={inputClasses} 
            />
          </div>
        </div>

        <div className="relative pt-6">
          <div className="absolute top-0 left-0 right-0 h-px bg-slate-100" />
          <h3 className="text-xl font-black text-neutral-800 mb-8 mt-2 tracking-tight flex items-center gap-3">
             {t('account.securitySettings')}
             <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          </h3>
          
          <p className="text-neutral-500 text-sm mb-6">{t('account.securitySettingsDesc')}</p>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <button 
            type="submit" 
            disabled={isSaving}
            className="h-14 rounded-full bg-amber-500 px-12 text-base font-black text-white hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/30 w-fit uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t('account.saving') : t('account.saveProfile')}
          </button>
          <button 
            type="button" 
            onClick={() => setIsEditing(false)}
            className="h-14 rounded-full border border-slate-200 px-8 text-base font-black text-neutral-600 hover:bg-slate-50 transition-all w-fit uppercase tracking-widest"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ChangePasswordView() {
  const t = useTranslations();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error(t('account.passwordsDoNotMatch') || 'Passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/account/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmNewPassword
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.errors) {
          const firstError = Object.values(data.errors)[0] as string | string[];
          throw new Error(Array.isArray(firstError) ? firstError[0] : (typeof firstError === 'string' ? firstError : data.message));
        }
        throw new Error(data.message || t('account.passwordUpdateError') || 'Unable to update password.');
      }

      toast.success(data.message || t('account.passwordUpdateSuccess') || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error updating password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSavePassword} className="flex-1 inline-flex flex-col justify-start items-start gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="justify-start text-neutral-800 text-3xl font-semibold font-['Segoe_UI'] leading-8">
        {t('account.changePassword') || 'Change Password'}
      </div>
      <div className="self-stretch h-px outline outline-1 outline-offset-[-0.50px] outline-slate-100"></div>
      
      <div className="self-stretch flex flex-col justify-start items-start gap-6 max-w-lg mt-2">
        {/* Current Password */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">
            {t('account.currentPassword') || 'Current Password'}
          </div>
          <div className="self-stretch h-12 px-5 py-2 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 inline-flex justify-start items-center gap-3 bg-white focus-within:outline-[1.5px] focus-within:outline-amber-500 transition-all">
            <input 
              type={showCurrent ? 'text' : 'password'} 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="flex-1 bg-transparent outline-none text-neutral-800 text-lg font-['Segoe_UI'] leading-7 placeholder-zinc-400 tracking-widest font-mono" 
              placeholder="••••••••" 
              required
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-zinc-500 hover:text-neutral-800 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        
        {/* New Password */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">
            {t('account.newPassword') || 'New Password'}
          </div>
          <div className="self-stretch h-12 px-5 py-2 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 inline-flex justify-start items-center gap-3 bg-white focus-within:outline-[1.5px] focus-within:outline-amber-500 transition-all">
            <input 
              type={showNew ? 'text' : 'password'} 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 bg-transparent outline-none text-neutral-800 text-lg font-['Segoe_UI'] leading-7 placeholder-zinc-400 tracking-widest font-mono" 
              placeholder="••••••••" 
              required
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="text-zinc-500 hover:text-neutral-800 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="justify-start text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">
            {t('account.confirmNewPassword') || 'Confirm New Password'}
          </div>
          <div className="self-stretch h-12 px-5 py-2 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 inline-flex justify-start items-center gap-3 bg-white focus-within:outline-[1.5px] focus-within:outline-amber-500 transition-all">
            <input 
              type={showConfirm ? 'text' : 'password'} 
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="flex-1 bg-transparent outline-none text-neutral-800 text-lg font-['Segoe_UI'] leading-7 placeholder-zinc-400 tracking-widest font-mono" 
              placeholder="••••••••" 
              required
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-zinc-500 hover:text-neutral-800 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className="self-stretch flex flex-col justify-start items-start gap-6 mt-6 max-w-lg">
        <div className="self-stretch h-px outline outline-1 outline-offset-[-0.50px] outline-slate-100"></div>
        <div className="self-stretch inline-flex justify-start items-start gap-4">
          <button type="submit" disabled={isSaving} className="h-12 px-8 py-2.5 bg-amber-500 rounded-[100px] flex justify-center items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
            <div className="text-center justify-start text-white text-lg font-semibold font-['Segoe_UI'] leading-6">
              {isSaving ? t('account.saving') : t('account.saveChanges') || 'Save Changes'}
            </div>
          </button>
          <button type="button" onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); setShowCurrent(false); setShowNew(false); setShowConfirm(false); }} className="h-12 px-8 py-2.5 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-4 focus:ring-slate-100">
            <div className="text-center justify-start text-neutral-700 text-lg font-semibold font-['Segoe_UI'] leading-6">
              {t('account.cancel') || 'Cancel'}
            </div>
          </button>
        </div>
      </div>
    </form>
  );
}
