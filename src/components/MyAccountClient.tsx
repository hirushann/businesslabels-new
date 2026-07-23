'use client';

import React, { useEffect, useState, Suspense, useSyncExternalStore, Fragment, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useTranslations, useLocale } from 'next-intl';
import { useCart } from '@/components/CartProvider';
import { toDisplayImageUrl } from '@/lib/utils/imageProxy';
import { localePath } from '@/lib/i18n/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
    productId?: string | number;
    sku?: string;
    slug?: string;
    type?: string;
    mainImage?: string | null;
    packingGroup?: number | null;
    allowSingulars?: boolean | null;
    isLabelProduct?: boolean | null;
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
  vatNumber?: string;
  address1: string;
  address2: string;
  state?: string;
  province_id?: number | string;
  state_id?: number | string;
  postcode?: string;
  city?: string;
  phone?: string;
  email?: string;
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

          const imagesArray = Array.isArray(itemRecord.images) ? itemRecord.images : Array.isArray(product.images) ? product.images : [];
          const firstImageObj = imagesArray.length > 0 && isPlainObject(imagesArray[0]) ? imagesArray[0] : null;

          return {
            id: readNumberValue(itemRecord, ['id']) || itemIndex,
            name: (() => {
              const explicitName = readStringValue(itemRecord, ['title_nl', 'title_en', 'name']) || readStringValue(product, ['title_nl', 'title_en', 'name']);
              if (explicitName) return explicitName;
              if (Array.isArray(product.translations)) {
                const tr = product.translations.find((t: any) => t && (t.name || t.title));
                if (tr) return tr.name || tr.title;
              }
              return 'Product';
            })(),
            quantity,
            price: price,
            total: total,
            productId: readNumberValue(itemRecord, ['product_id', 'variation_id']) || readNumberValue(product, ['id']) || undefined,
            sku: readStringValue(itemRecord, ['sku']) || readStringValue(product, ['sku']) || undefined,
            slug: (() => {
              const explicitSlug = readStringValue(product, ['slug', 'slug_nl', 'slug_en', 'post_name']) || readStringValue(itemRecord, ['slug', 'slug_nl', 'slug_en']);
              if (explicitSlug) return explicitSlug;
              if (Array.isArray(product.translations)) {
                const tr = product.translations.find((t: any) => t && t.slug);
                if (tr) return tr.slug;
              }
              if (isPlainObject(product.slug)) {
                return readStringValue(product.slug, ['nl', 'en']) || '';
              }
              if (isPlainObject(itemRecord.slug)) {
                return readStringValue(itemRecord.slug, ['nl', 'en']) || '';
              }
              return undefined;
            })(),
            type: readStringValue(product, ['type']) || readStringValue(itemRecord, ['type', 'product_type']) || 'simple',
            mainImage: toDisplayImageUrl(
              (firstImageObj ? readStringValue(firstImageObj, ['url', 'file_name', 'src']) : '') ||
              readStringValue(product, ['main_image', 'image', 'image_url', 'thumbnail', 'thumbnail_url', 'url']) ||
              readStringValue(itemRecord, ['image', 'main_image', 'image_url', 'thumbnail', 'thumbnail_url', 'url']) ||
              (isPlainObject(product.main_image) ? readStringValue(product.main_image, ['url', 'src']) : '') ||
              (isPlainObject(product.image) ? readStringValue(product.image, ['url', 'src']) : '') ||
              (isPlainObject(itemRecord.image) ? readStringValue(itemRecord.image, ['url', 'src']) : '') ||
              (isPlainObject(itemRecord.main_image) ? readStringValue(itemRecord.main_image, ['url', 'src']) : '')
            ) || null,
            packingGroup: readNumberValue(product, ['packingGroup', 'packing_group']) || null,
            allowSingulars: product.allow_singulars !== undefined ? Boolean(product.allow_singulars) : null,
            isLabelProduct: Boolean(product.is_label_product ?? product.is_label ?? false),
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

function splitAddressName(address?: AccountAddress) {
  if (!address) {
    return { firstName: '', lastName: '' };
  }

  const [firstNameFromName = '', ...lastNameParts] = address.name.split(' ').filter(Boolean);

  return {
    firstName: address.firstname || firstNameFromName,
    lastName: address.lastname || lastNameParts.join(' '),
  };
}

function normalizeAddress(address: Record<string, unknown>, index: number): AccountAddress {
  const street = readStringValue(address, ['street', 'address', 'address_1', 'line1', 'street_address']);
  const street2 = readStringValue(address, ['street2', 'address2', 'address_2', 'line2', 'apartment', 'suite']);
  const state = readStringValue(address, ['state', 'state_name', 'province', 'province_name', 'region', 'region_name']);
  const postcode = readStringValue(address, ['postcode', 'postalcode', 'postal_code', 'zip', 'zip_code']);
  const city = readStringValue(address, ['city', 'town']);
  const country = readStringValue(address, ['country', 'country_name', 'country_id']);
  const email = readStringValue(address, ['email', 'billing_email', 'shipping_email']);

  return {
    id: formatAddressId(address, index),
    type: readAddressType(address) || 'shipping',
    name: formatAddressName(address),
    firstname: readStringValue(address, ['firstname', 'first_name', 'billing_first_name', 'shipping_first_name']),
    lastname: readStringValue(address, ['lastname', 'last_name', 'billing_last_name', 'shipping_last_name']),
    company: readStringValue(address, ['company', 'company_name', 'business_name']),
    vatNumber: readStringValue(address, ['vat_number', 'tax_nr', 'vatNumber', 'btw_number', 'btwNumber', 'tax_number', 'taxNumber']),
    address1: street,
    address2: street2,
    state: state || street2,
    postcode,
    city,
    phone: readStringValue(address, ['phone', 'telephone', 'mobile']),
    email,
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
    cache: 'no-store',
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarClick = () => {
    if (isUploadingAvatar) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Avatar must be an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar image must be smaller than 2MB.');
      return;
    }

    setIsUploadingAvatar(true);
    const loadingToast = toast.loading('Uploading avatar...');

    try {
      const formData = new FormData();
      formData.append('name', userDisplayName(user));
      formData.append('email', userString(user, ['email']));
      formData.append('avatar', file);

      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload avatar.');
      }

      localStorage.setItem('auth_user', JSON.stringify(data.data || data));
      window.dispatchEvent(new Event('auth-user-updated'));
      toast.success('Avatar uploaded successfully.', { id: loadingToast });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload avatar.', { id: loadingToast });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    async function syncProfile() {
      try {
        const response = await fetch('/api/account/profile');
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('auth_user', JSON.stringify(data.data || data));
          window.dispatchEvent(new Event('auth-user-updated'));
        }
      } catch (err) {
        console.error('Failed to sync profile:', err);
      }
    }
    void syncProfile();
  }, []);

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
  const avatarUrl = toDisplayImageUrl(userString(user, ['avatar', 'avatar_url', 'profile_photo_url', 'image']));

  const sidebarItems = [
    { id: 'details', label: t('account.accountDetails') },
    { id: 'billing_address', label: t('account.billingAddress') },
    { id: 'shipping_address', label: t('account.shippingAddress') },
    { id: 'orders', label: t('account.orders') },
    { id: 'change_password', label: t('account.changePassword') },
  ];

  return (
    <div className="bg-slate-50 py-6 sm:py-12 px-4 sm:px-6 relative overflow-hidden z-0">
      {/* Invisible file input for avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleAvatarChange}
      />
      {/* Background orange blob on starting end */}
      <div className="absolute top-[10%] -left-[250px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-orange-400/15 to-amber-300/5 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-10 relative z-10">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col items-start gap-[30px] w-full">
          <div className="h-4 inline-flex justify-start items-center gap-2">
            <div>
              <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 9.9615H3.23083V6.6025C3.23083 6.43183 3.28856 6.28872 3.404 6.17317C3.51956 6.05772 3.66267 6 3.83333 6H6.16667C6.33733 6 6.48044 6.05772 6.596 6.17317C6.71144 6.28872 6.76917 6.43183 6.76917 6.6025V9.9615H9V4.064C9 4.02989 8.9925 3.99895 8.9775 3.97117C8.96261 3.94339 8.94233 3.91878 8.91667 3.89733L5.12183 1.04483C5.08761 1.01494 5.047 1 5 1C4.953 1 4.91239 1.01494 4.87817 1.04483L1.08333 3.89733C1.05767 3.91878 1.03739 3.94339 1.0225 3.97117C1.0075 3.99895 1 4.02989 1 4.064V9.9615ZM0 9.9615V4.064C0 3.87322 0.0426665 3.6925 0.128 3.52183C0.213444 3.35106 0.331444 3.21044 0.482 3.1L4.277 0.241C4.48756 0.0803337 4.72822 0 4.999 0C5.26978 0 5.51111 0.0803337 5.723 0.241L9.518 3.1C9.66856 3.21044 9.78656 3.35106 9.872 3.52183C9.95733 3.6925 10 3.87322 10 4.064V9.9615C10 10.2342 9.9015 10.469 9.7045 10.666C9.5075 10.863 9.27267 10.9615 9 10.9615H6.37183C6.20106 10.9615 6.05794 10.9037 5.9425 10.7882C5.82694 10.6727 5.76917 10.5296 5.76917 10.3588V7H4.23083V10.3588C4.23083 10.5296 4.17306 10.6727 4.0575 10.7882C3.94206 10.9037 3.79894 10.9615 3.62817 10.9615H1C0.727333 10.9615 0.4925 10.863 0.2955 10.666C0.0984999 10.469 0 10.2342 0 9.9615Z" fill="var(--subtle)"/></svg>
            </div>
            <div className="justify-start text-zinc-500 text-sm font-normal leading-5">/</div>
            <div className="justify-start text-neutral-700 text-sm font-bold leading-5">{t('account.myAccount')}</div>
          </div>
          <div className="text-center w-full text-neutral-800 text-4xl font-bold leading-[48px]">{t('account.myAccount')}</div>
        </div>

        {/* Main Card Wrapper */}
        <div className="w-full bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col justify-start items-start overflow-hidden">
          <div className="self-stretch flex flex-col lg:flex-row justify-start items-stretch">
            
            {/* Sidebar */}
            <div className="w-full lg:w-72 p-6 bg-gray-50 flex flex-col justify-start items-start gap-6 shrink-0">
              <div className="self-stretch flex flex-col justify-start items-center gap-1.5">
                <div className="size-20 relative">
                  <div className="size-20 left-0 top-0 absolute rounded-[58px] overflow-hidden bg-slate-200">
                    {avatarUrl ? (
                      <img className="w-full h-full object-cover" src={avatarUrl} alt={displayName} />
                    ) : (
                      <img className="w-full h-full object-cover" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`} alt={displayName} />
                    )}
                  </div>
                  <div className="absolute right-0 bottom-0 cursor-pointer" onClick={handleAvatarClick}>
                    {isUploadingAvatar ? (
                      <div className="w-[30px] h-[30px] rounded-full bg-black/70 border border-white flex items-center justify-center">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.75" y="0.75" width="28.5" height="28.5" rx="14.25" fill="#141718"/>
                        <rect x="0.75" y="0.75" width="28.5" height="28.5" rx="14.25" stroke="white" strokeWidth="1.5"/>
                        <path d="M11.2506 10.7226C11.0974 10.9524 11.1595 11.2628 11.3892 11.416C11.619 11.5692 11.9294 11.5071 12.0826 11.2774L11.6666 11L11.2506 10.7226ZM12.6041 9.59373L13.0201 9.87108V9.87108L12.6041 9.59373ZM17.3957 9.59373L17.8118 9.31638V9.31638L17.3957 9.59373ZM17.9172 11.2774C18.0704 11.5071 18.3808 11.5692 18.6106 11.416C18.8404 11.2628 18.9025 10.9524 18.7493 10.7226L18.3333 11L17.9172 11.2774ZM16.9999 16H16.4999C16.4999 16.8284 15.8283 17.5 14.9999 17.5V18V18.5C16.3806 18.5 17.4999 17.3807 17.4999 16H16.9999ZM14.9999 18V17.5C14.1715 17.5 13.4999 16.8284 13.4999 16H12.9999H12.4999C12.4999 17.3807 13.6192 18.5 14.9999 18.5V18ZM12.9999 16H13.4999C13.4999 15.1716 14.1715 14.5 14.9999 14.5V14V13.5C13.6192 13.5 12.4999 14.6193 12.4999 16H12.9999ZM14.9999 14V14.5C15.8283 14.5 16.4999 15.1716 16.4999 16H16.9999H17.4999C17.4999 14.6193 16.3806 13.5 14.9999 13.5V14ZM11.6666 11L12.0826 11.2774L13.0201 9.87108L12.6041 9.59373L12.1881 9.31638L11.2506 10.7226L11.6666 11ZM13.7135 9V9.5H16.2863V9V8.5H13.7135V9ZM17.3957 9.59373L16.9797 9.87108L17.9172 11.2774L18.3333 11L18.7493 10.7226L17.8118 9.31638L17.3957 9.59373ZM16.2863 9V9.5C16.565 9.5 16.8252 9.63925 16.9797 9.87108L17.3957 9.59373L17.8118 9.31638C17.4717 8.80635 16.8993 8.5 16.2863 8.5V9ZM12.6041 9.59373L13.0201 9.87108C13.1747 9.63925 13.4349 9.5 13.7135 9.5V9V8.5C13.1005 8.5 12.5281 8.80635 12.1881 9.31638L12.6041 9.59373ZM10.9999 11V11.5H18.9999V11V10.5H10.9999V11ZM21.6666 13.6667H21.1666V18.3333H21.6666H22.1666V13.6667H21.6666ZM18.9999 21V20.5H10.9999V21V21.5H18.9999V21ZM8.33325 18.3333H8.83325V13.6667H8.33325H7.83325V18.3333H8.33325ZM10.9999 21V20.5C9.8033 20.5 8.83325 19.53 8.83325 18.3333H8.33325H7.83325C7.83325 20.0822 9.25102 21.5 10.9999 21.5V21ZM21.6666 18.3333H21.1666C21.1666 19.53 20.1965 20.5 18.9999 20.5V21V21.5C20.7488 21.5 22.1666 20.0822 22.1666 18.3333H21.6666ZM18.9999 11V11.5C20.1965 11.5 21.1666 12.47 21.1666 13.6667H21.6666H22.1666C22.1666 11.9178 20.7488 10.5 18.9999 10.5V11ZM10.9999 11V10.5C9.25102 10.5 7.83325 11.9178 7.83325 13.6667H8.33325H8.83325C8.83325 12.47 9.8033 11.5 10.9999 11.5V11Z" fill="#FEFEFE"/>
                      </svg>
                    )}
                  </div>
                </div>
                <div className="justify-start text-ink text-[28px] font-bold leading-8 text-center">{displayName}</div>
              </div>
              
              <div className="self-stretch border-t border-line"></div>
              
              <div className="self-stretch flex flex-col justify-center items-start gap-1">
                {sidebarItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    className={`self-stretch py-3 inline-flex justify-start items-center gap-1.5 ${activeTab === item.id ? 'border-b border-brand' : ''}`}
                  >
                    <div className={`text-center justify-start text-[18px] font-bold leading-6 ${activeTab === item.id ? 'text-brand' : 'text-copy'}`}>
                      {item.label}
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  disabled={isLoggingOut}
                  className="self-stretch py-3 inline-flex justify-start items-center gap-1.5"
                >
                  <div className="text-center justify-start text-red-600 text-lg font-bold leading-6">
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
              
              {activeTab === 'billing_address' && <BillingAddressesView user={user} />}
              {activeTab === 'shipping_address' && <ShippingAddressesView user={user} />}
              {activeTab === 'change_password' && <ChangePasswordView />}
            </div>
            
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-sky-950/40 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
          />
          <div className="relative animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-w-full">
             <div className="w-[540px] max-w-full p-10 bg-white rounded-xl shadow-lg outline outline-1 outline-offset-[-1px] outline-black/10 inline-flex flex-col justify-start items-start gap-7 overflow-hidden">
                <div className="self-stretch flex flex-col justify-start items-start gap-8">
                  <div className="self-stretch flex flex-col justify-start items-center gap-6">
                    <div className="self-stretch flex flex-col justify-start items-start gap-2">
                      <div className="self-stretch text-center justify-start text-neutral-800 text-3xl font-bold leading-10">
                        {t('account.confirmLogout') || 'Confirm Logout'}
                      </div>
                      <div className="self-stretch text-center justify-start text-neutral-700 text-lg font-normal leading-7">
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
                      <div className="text-center justify-start text-neutral-800 text-lg font-medium leading-6">{t('account.cancel') || 'Cancel'}</div>
                    </button>
                    <button 
                      onClick={handleLogout} 
                      disabled={isLoggingOut}
                      className="flex-1 h-12 px-7 py-4 bg-red-600 rounded-[50px] flex justify-center items-center gap-2.5 hover:bg-red-700 transition-colors"
                    >
                      <div className="text-center justify-start text-white text-lg font-medium leading-6">
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
  const avatarUrl = toDisplayImageUrl(userString(user, ['avatar', 'avatar_url', 'profile_photo_url', 'image']));
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
            <h2 className="text-xl sm:text-3xl font-black text-neutral-800 tracking-tight font-bold">{t('account.welcomeName', { name: displayName })}</h2>
            <p className="text-neutral-500 font-medium">{email || formatCustomerSince(user, t, locale)}</p>
          </div>
        </div>
        <p className="text-neutral-600 text-lg leading-relaxed max-w-2xl">
          {t.rich('account.dashboardDesc', {
            ordersLink: (chunks) => (
              <button onClick={() => setActiveTab('orders')} className="text-brand font-bold hover:underline">
                {chunks}
              </button>
            ),
            printersLink: (chunks) => (
              <button onClick={() => setActiveTab('printers')} className="text-brand font-bold hover:underline">
                {chunks}
              </button>
            ),
            favouritesLink: (chunks) => (
              <button onClick={() => setActiveTab('favourites')} className="text-brand font-bold hover:underline">
                {chunks}
              </button>
            ),
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col gap-3 group hover:border-brand/30 transition-all cursor-default">
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
            className="text-brand font-black text-xs uppercase tracking-widest hover:underline"
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
              <div key={order.id} className="group p-5 rounded-[24px] bg-white border border-slate-100 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-neutral-400 group-hover:bg-brand-soft group-hover:text-brand transition-colors">
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
                    className="p-2.5 rounded-full bg-slate-50 text-neutral-400 hover:bg-brand hover:text-white transition-all"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand rounded-full text-[10px] font-black uppercase tracking-widest w-fit">
            {t('account.expertSupportBadge')}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">{t('account.expertSupportTitle')}</h3>
            <p className="text-sky-100/70 text-lg leading-relaxed">
              {t('account.expertSupportDesc')}
            </p>
          </div>
          <Link href="/support" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-black text-sky-950 hover:bg-brand hover:text-white transition-all w-fit shadow-xl shadow-black/10">
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
  const locale = useLocale();
  const cart = useCart();
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AccountOrder | null>(null);
  const [isOrderItemsOpen, setIsOrderItemsOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleReorder = (itemsList: any[]) => {
    if (!itemsList || itemsList.length === 0) return;
    itemsList.forEach((item) => {
      cart.addItem(
        {
          id: item.productId || item.id,
          slug: item.slug || '',
          type: item.type || 'simple',
          name: item.name,
          sku: item.sku || '',
          price: item.price ?? null,
          mainImage: item.mainImage ?? null,
          packingGroup: item.packingGroup ?? null,
          allowSingulars: item.allowSingulars ?? null,
          isLabelProduct: item.isLabelProduct ?? null,
        },
        item.quantity
      );
    });
    toast.success(t.has('account.reorderSuccess') ? t('account.reorderSuccess') : 'Items added to cart!');
    window.location.href = localePath('/afrekenen', locale);
  };

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
      <div className="justify-start text-neutral-800 text-3xl font-bold leading-8">{t('account.orderHistory') || 'Order History'}</div>

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
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-sky-950 px-10 text-sm font-black text-white transition-all hover:bg-brand hover:shadow-xl hover:shadow-brand/20"
          >
            {t('account.continueShopping')}
          </Link>
        </div>
      ) : (
        <div className="self-stretch py-6 relative bg-white rounded-xl flex flex-col justify-start items-start gap-6 overflow-hidden outline outline-1 outline-slate-200 shadow-sm w-full">
          <div className="w-full h-16 left-0 top-0 absolute bg-white border-b border-slate-100"></div>
          
          <div className="w-full overflow-x-auto">
            <div className="min-w-[800px] w-full flex flex-col gap-6">
              <div className="self-stretch inline-flex justify-start items-center gap-6 px-8 relative z-10 h-4 w-full">
                <div className="w-4 shrink-0"></div>
                <div className="flex-1 justify-start text-copy text-base font-bold leading-5">{t('account.tableOrder') || 'Order ID'}</div>
                <div className="flex-1 justify-start text-copy text-base font-bold leading-5">{t('account.tableDate') || 'Dates'}</div>
                <div className="flex-1 justify-start text-copy text-base font-bold leading-5">{t('account.tableStatus') || 'Status'}</div>
                <div className="w-[120px] justify-start text-copy text-base font-bold leading-5 shrink-0">{t('account.tableTotal') || 'Price'}</div>
                <div className="w-[160px] justify-start text-copy text-base font-bold leading-5 shrink-0">{t('account.action') || 'Action'}</div>
              </div>
              
              <div className="self-stretch flex flex-col justify-start items-start gap-2.5 px-8 relative z-10 w-full">
                {orders.map((order, index) => {
                  const isExpanded = !!expandedOrders[order.id];
                  return (
                    <Fragment key={`${order.id}-${order.date}-${index}`}>
                      <div className="self-stretch flex flex-col justify-start items-start w-full">
                        <div 
                          className="self-stretch py-4 inline-flex justify-start items-center gap-6 group hover:bg-slate-50/50 transition-colors w-full cursor-pointer"
                          onClick={() => toggleExpand(order.id)}
                        >
                          <div className="w-4 h-4 flex items-center justify-center shrink-0">
                            {isExpanded ? (
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 10L8 6L12 10" stroke="#717182" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6L8 10L12 6" stroke="#717182" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="flex-1 text-left text-copy text-lg font-normal leading-6 hover:text-brand hover:underline"
                          >
                            {order.id}
                          </button>

                          <div className="flex-1 text-copy text-lg font-normal leading-6">{order.date}</div>

                          <div className="flex-1 justify-start text-lg font-medium leading-6">
                            <span className={order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'delivered' ? 'text-success' : 'text-brand'}>
                              {t(`account.${order.status.toLowerCase()}`) || order.status}
                            </span>
                          </div>

                          <div className="w-[120px] text-ink text-lg font-bold leading-6 shrink-0">{order.total}</div>

                          <div className="w-[160px] inline-flex justify-start items-center gap-1 shrink-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReorder(order.items_list || []);
                              }} 
                              className="inline-flex justify-start items-center gap-1 text-brand text-lg font-medium underline leading-6 hover:text-brand whitespace-nowrap"
                            >
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                <mask id="mask0_2407_16091" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                                  <rect width="20" height="20" fill="#D9D9D9"/>
                                </mask>
                                <g mask="url(#mask0_2407_16091)">
                                  <path d="M9.98474 17.0846C8.3096 17.0846 6.83175 16.5721 5.55119 15.5469C4.27078 14.5218 3.45057 13.2149 3.09057 11.6263C3.04571 11.4607 3.07536 11.3085 3.17953 11.1696C3.28369 11.0307 3.42446 10.9501 3.60182 10.9276C3.77057 10.9052 3.92251 10.9389 4.05765 11.0286C4.19279 11.1183 4.2871 11.2503 4.34057 11.4244C4.65779 12.7118 5.34126 13.7687 6.39099 14.5951C7.44071 15.4214 8.63863 15.8346 9.98474 15.8346C11.6097 15.8346 12.9882 15.2687 14.1202 14.1367C15.2521 13.0048 15.8181 11.6263 15.8181 10.0013C15.8181 8.3763 15.2521 6.99783 14.1202 5.86589C12.9882 4.73394 11.6097 4.16797 9.98474 4.16797C9.07446 4.16797 8.2214 4.37019 7.42557 4.77464C6.6296 5.17894 5.94418 5.73526 5.36932 6.44359H6.9239C7.10126 6.44359 7.24974 6.50345 7.36932 6.62318C7.48904 6.74276 7.5489 6.89123 7.5489 7.06859C7.5489 7.24595 7.48904 7.39443 7.36932 7.51401C7.24974 7.63373 7.10126 7.69359 6.9239 7.69359H4.0714C3.85668 7.69359 3.67744 7.62172 3.53369 7.47797C3.38994 7.33436 3.31807 7.15512 3.31807 6.94026V4.08776C3.31807 3.9104 3.37793 3.76193 3.49765 3.64234C3.61724 3.52262 3.76571 3.46276 3.94307 3.46276C4.12043 3.46276 4.26897 3.52262 4.38869 3.64234C4.50828 3.76193 4.56807 3.9104 4.56807 4.08776V5.43714C5.24432 4.63908 6.05418 4.0197 6.99765 3.57901C7.94099 3.13832 8.93668 2.91797 9.98474 2.91797C10.9677 2.91797 11.8886 3.10387 12.7477 3.47568C13.6065 3.84748 14.3554 4.35283 14.9943 4.99172C15.6332 5.63061 16.1386 6.37957 16.5104 7.23859C16.8822 8.09748 17.0681 9.01839 17.0681 10.0013C17.0681 10.9842 16.8822 11.9051 16.5104 12.764C16.1386 13.623 15.6332 14.372 14.9943 15.0109C14.3554 15.6498 13.6065 16.1551 12.7477 16.5269C11.8886 16.8987 10.9677 17.0846 9.98474 17.0846ZM9.98474 11.2513C9.6439 11.2513 9.35036 11.1282 9.10411 10.8819C8.85786 10.6357 8.73474 10.0013C8.73474 9.66047 8.85786 9.36693 9.10411 9.12068C9.35036 8.87443 9.6439 8.7513 9.98474 8.7513C10.3256 8.7513 10.6191 8.87443 10.8654 9.12068C11.1116 9.36693 11.2347 9.66047 11.2347 10.0013C11.2347 10.3421 11.1116 10.6357 10.8654 10.8819C10.6191 11.1282 10.3256 11.2513 9.98474 11.2513Z" fill="var(--brand)"/>
                                </g>
                              </svg>
                              {t.has('account.reorderAll') ? t('account.reorderAll') : 'Re-order All'}
                            </button>
                          </div>
                        </div>

                        {isExpanded && order.items_list && order.items_list.length > 0 && (
                          <div 
                            className="self-stretch p-4 bg-surface rounded-[10px] flex flex-col justify-start items-start gap-2 w-full mt-1 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {order.items_list.map((item, itemIdx) => {
                              const productHref = item.slug ? localePath(`/product/${item.slug}`, locale) : null;

                              return (
                              <Fragment key={`${item.id}-${itemIdx}`}>
                                <div className="group self-stretch justify-start items-center gap-2 inline-flex w-full">
                                  <div className="w-10 h-10 p-1 bg-line overflow-hidden rounded-[5px] justify-center items-center flex shrink-0 relative">
                                    {productHref ? (
                                      <Link 
                                        href={productHref} 
                                        className="w-full h-full block relative z-10 cursor-pointer pointer-events-auto"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {item.mainImage ? (
                                          <img className="w-full h-full object-contain" src={item.mainImage} alt={item.name} />
                                        ) : (
                                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#717182" strokeWidth="1.5" className="opacity-40 w-full h-full">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                          </svg>
                                        )}
                                      </Link>
                                    ) : (
                                      item.mainImage ? (
                                        <img className="w-full h-full object-contain" src={item.mainImage} alt={item.name} />
                                      ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#717182" strokeWidth="1.5" className="opacity-40">
                                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                          <circle cx="8.5" cy="8.5" r="1.5" />
                                          <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                      )
                                    )}
                                  </div>
                                  <div className="flex-1 justify-start items-center gap-2 flex">
                                    <div className="flex-1 flex flex-col justify-start items-start gap-1">
                                      <div className="self-stretch text-copy text-base font-normal leading-[19px]">
                                        {productHref ? (
                                          <Link 
                                            href={productHref} 
                                            className="hover:text-brand hover:underline relative z-10 cursor-pointer pointer-events-auto"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {item.name}
                                          </Link>
                                        ) : (
                                          item.name
                                        )}
                                      </div>
                                      <div className="text-subtle text-sm font-normal leading-5">
                                        {t('account.quantityCount', { count: item.quantity }) || `${item.quantity} Items`}
                                      </div>
                                    </div>
                                    <div className="w-[120px] text-copy text-base font-normal leading-[21px] shrink-0">
                                      {formatEuro(item.total)}
                                    </div>
                                    <div className="w-[160px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReorder([item]);
                                        }}
                                        className="text-brand text-lg font-medium underline leading-6 hover:text-brand whitespace-nowrap"
                                      >
                                        {t.has('account.reorder') ? t('account.reorder') : 'Re-order'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                {itemIdx < (order.items_list?.length || 0) - 1 && (
                                  <div className="self-stretch h-[1px] bg-[#E5E7EB] my-1"></div>
                                )}
                              </Fragment>
                            );
                            })}
                          </div>
                        )}
                      </div>
                      {index < orders.length - 1 && (
                        <div className="self-stretch border-t border-line my-1 w-full"></div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        {selectedOrder && (
          <DialogContent className="w-full sm:max-w-2xl max-w-2xl bg-white rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col border-none shadow-2xl">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex flex-col gap-1">
                <DialogTitle className="text-2xl font-black text-neutral-800 tracking-tight">{t('account.orderNumber', { number: selectedOrder.id })}</DialogTitle>
                <DialogDescription className="text-sm font-medium text-neutral-500">{t('account.placedOn', { date: selectedOrder.date })}</DialogDescription>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar">
              {/* Status Banner */}
              <div className={`p-4 rounded-2xl flex items-center justify-between ${orderStatusClass(selectedOrder.status)}`}>
                <span className="font-bold text-sm uppercase tracking-widest">{t('account.currentStatus')}</span>
                <span className="font-black text-sm uppercase tracking-widest">{t(`account.${selectedOrder.status.toLowerCase()}`)}</span>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
                <button 
                  onClick={() => setIsOrderItemsOpen((prev) => !prev)}
                  className="flex items-center justify-between w-full text-left px-1 py-1 group"
                >
                  <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600 transition-colors">{t('account.orderItems')}</h4>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`text-neutral-400 transition-transform duration-200 ${isOrderItemsOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>

                {isOrderItemsOpen && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    {selectedOrder.items_list?.map((item) => {
                      const productHref = item.slug ? localePath(`/product/${item.slug}`, locale) : null;

                      return (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-12 h-12 p-1 bg-white border border-slate-200 overflow-hidden rounded-xl justify-center items-center flex shrink-0 relative shadow-sm">
                            {productHref ? (
                              <Link href={productHref} className="w-full h-full block">
                                {item.mainImage ? (
                                  <img className="w-full h-full object-contain" src={item.mainImage} alt={item.name} />
                                ) : (
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#717182" strokeWidth="1.5" className="opacity-40 w-full h-full">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                  </svg>
                                )}
                              </Link>
                            ) : (
                              item.mainImage ? (
                                <img className="w-full h-full object-contain" src={item.mainImage} alt={item.name} />
                              ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#717182" strokeWidth="1.5" className="opacity-40">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <polyline points="21 15 16 10 5 21" />
                                </svg>
                              )
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <span className="font-bold text-neutral-800 truncate">
                              {productHref ? (
                                <Link href={productHref} className="hover:text-brand hover:underline">
                                  {item.name}
                                </Link>
                              ) : (
                                item.name
                              )}
                            </span>
                            <span className="text-xs font-medium text-neutral-400">{t('account.quantityCount', { count: item.quantity })}</span>
                          </div>
                        </div>
                        <span className="font-black text-neutral-800 shrink-0">{formatEuro(item.total)}</span>
                      </div>
                    );
                    })}
                  </div>
                )}
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
              <div className="flex flex-col gap-3 p-6 rounded-3xl bg-neutral-900 text-white my-2">
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
          </DialogContent>
        )}
      </Dialog>
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

  return 'bg-brand-soft text-brand';
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
        <Link href="/en/printers" className="h-11 px-8 bg-sky-950 text-white rounded-full font-bold text-sm hover:bg-brand transition-all flex items-center gap-2 whitespace-nowrap">
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
          <div key={printer.id} className="group p-8 rounded-[32px] border border-slate-200 bg-white hover:border-brand hover:shadow-xl hover:shadow-brand/5 transition-all flex flex-col gap-6">
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
                <Link href={printer.slug ? `/material/${printer.slug}` : "#"} className="text-brand font-black text-xs uppercase tracking-wider hover:underline">{t('account.viewPrinter')}</Link>
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
               <Link href={printer.slug ? `/material/${printer.slug}` : "#"} className="flex flex-col gap-1 text-left group/btn">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest group-hover/btn:text-brand transition-colors">{t('account.supplies', { fallback: 'Supplies' })}</span>
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
           <Link href="/product" className="mt-6 h-11 px-8 bg-brand text-white rounded-full font-black text-sm hover:shadow-lg shadow-brand/20 transition-all flex items-center">
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

function BillingAddressesView({ user }: { user: StoredUser }) {
  const t = useTranslations();
  const [editingAddress, setEditingAddress] = useState<AccountAddress | 'new' | null>(null);
  const [addresses, setAddresses] = useState<AccountAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    user.default_billing_address_id ? String(user.default_billing_address_id) : null
  );

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

  useEffect(() => {
    if (user.default_billing_address_id) {
      setSelectedAddressId(String(user.default_billing_address_id));
    }
  }, [user.default_billing_address_id]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const userDefaultId = user.default_billing_address_id ? String(user.default_billing_address_id) : undefined;
      const defaultSel = addresses.find(a => String(a.id) === userDefaultId) || addresses.find(a => a.type?.toLowerCase() === 'billing') || addresses[0];
      setSelectedAddressId(defaultSel.id);
    }
  }, [addresses, selectedAddressId, user.default_billing_address_id]);

  const handleSelectAddress = async (addrId: string) => {
    setSelectedAddressId(addrId);
    try {
      const uName = userDisplayName(user);
      const uEmail = userString(user, ['email']);
      const uPhone = userString(user, ['phone', 'mobile']);

      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: uName,
          email: uEmail,
          phone: uPhone,
          default_billing_address_id: addrId
        }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('auth_user', JSON.stringify(data.data || data));
        window.dispatchEvent(new Event('auth-user-updated'));
        toast.success(t('account.defaultBillingAddressUpdated') || 'Default billing address updated.');
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update default billing address');
      }
    } catch (error) {
      console.error('Error updating default billing address:', error);
      toast.error(error instanceof Error ? error.message : 'Error updating default billing address.');
    }
  };

  const billingAddresses = addresses.filter((address) => {
    const addressType = address.type?.toLowerCase() || '';
    return addressType === 'billing' || addressType.includes('billing');
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

  const handleRemove = async (addressId: string) => {
    if (!confirm(t('account.confirmRemoveAddress') || 'Are you sure you want to remove this address?')) {
      return;
    }
    try {
      const response = await fetch('/api/account/addresses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ id: addressId }),
      });
      if (!response.ok) {
        throw new Error();
      }
      toast.success(t('account.addressRemovedSuccess') || 'Address removed successfully.');
      void fetchAddresses();
    } catch (error) {
      toast.error(t('account.addressRemoveError') || 'Error removing address.');
    }
  };

  return (
    <div className="self-stretch flex flex-col justify-start items-start gap-6 w-full">
      <div className="justify-start text-neutral-800 text-3xl font-bold leading-8">
        {getLabel('account.billingAddress', 'Billing Address')}
      </div>
      <div className="self-stretch border-t border-line"></div>

      {editingAddress ? (
        <BillingAddressEditInline
          onClose={() => setEditingAddress(null)}
          onSave={(savedId) => {
            setEditingAddress(null);
            if (savedId) {
              setSelectedAddressId(String(savedId));
            }
            void fetchAddresses();
          }}
          address={editingAddress === 'new' ? undefined : editingAddress}
        />
      ) : (
        <>
          <div className="self-stretch flex flex-col justify-start items-start gap-4">
            {billingAddresses.length === 0 && (
              <div className="text-zinc-500 text-base">{getLabel('account.noBillingAddresses', 'No billing addresses found.')}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full self-stretch">
              {billingAddresses.map((addr, index) => {
                const isSelected = selectedAddressId ? String(addr.id) === String(selectedAddressId) : index === 0;
                const name = addr.name || `${addr.firstname || ''} ${addr.lastname || ''}`.trim();
                const addressStr = [addr.address1, addr.address2, addr.city, addr.postcode, addr.country].filter(Boolean).join(', ');
                const isOffice = addr.company?.toLowerCase().includes('office') || addr.company?.toLowerCase().includes('company');
                const contactDetails = [addr.email, addr.phone].filter(Boolean);

                return (
                  <div
                    key={addr.id || index}
                    className={`flex-1 p-4 relative rounded-xl outline transition-all duration-200 ${isSelected ? 'bg-[rgba(241,136,0,0.02)] outline-[1.5px] outline-brand' : 'bg-white outline-[1px] outline-[#E4EAF1]'} inline-flex flex-col justify-start items-start gap-3 w-full`}
                  >
                    <div className="self-stretch inline-flex justify-start items-start gap-3">
                      <div className="w-5 h-6 relative mt-1 cursor-pointer flex items-start" onClick={() => handleSelectAddress(addr.id)}>
                        {isSelected ? (
                          <div className="w-5 h-5 bg-brand rounded-full relative flex items-center justify-center">
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1.5 4L4 6.5L8.5 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-[#CAD3DF]"></div>
                        )}
                      </div>

                      <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                        <div className="inline-flex justify-start items-center gap-1">
                          <div className="justify-start text-neutral-800 text-xl font-bold leading-6">{name || '-'}</div>
                          {isOffice ? (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[16px] h-[16px] text-copy fill-current">
                              <mask id={`mask0_billing_office_${addr.id}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                                <rect width="20" height="20" fill="#D9D9D9"/>
                              </mask>
                              <g mask={`url(#mask0_billing_office_${addr.id})`}>
                                <path d="M3.45455 18C3.05455 18 2.71212 17.8508 2.42727 17.5524C2.14242 17.254 2 16.8952 2 16.4762V8.85714C2 8.64127 2.0697 8.46032 2.20909 8.31429C2.34848 8.16825 2.52121 8.09524 2.72727 8.09524C2.93333 8.09524 3.10606 8.16825 3.24545 8.31429C3.38485 8.46032 3.45455 8.64127 3.45455 8.85714V16.4762H15.0909C15.297 16.4762 15.4697 16.5492 15.6091 16.6952C15.7485 16.8413 15.8182 17.0222 15.8182 17.2381C15.8182 17.454 15.7485 17.6349 15.6091 17.781C15.4697 17.927 15.297 18 15.0909 18H3.45455ZM6.36364 14.9524C5.96364 14.9524 5.62121 14.8032 5.33636 14.5048C5.05152 14.2063 4.90909 13.8476 4.90909 13.4286V5.80952C4.90909 5.59365 4.97879 5.4127 5.11818 5.26667C5.25758 5.12063 5.4303 5.04762 5.63636 5.04762H8.54545V3.52381C8.54545 3.10476 8.68788 2.74603 8.97273 2.44762C9.25758 2.14921 9.6 2 10 2H12.9091C13.3091 2 13.6515 2.14921 13.9364 2.44762C14.2212 2.74603 14.3636 3.10476 14.3636 3.52381V5.04762H17.2727C17.4788 5.04762 17.6515 5.12063 17.7909 5.26667C17.9303 5.4127 18 5.59365 18 5.80952V13.4286C18 13.8476 17.8576 14.2063 17.5727 14.5048C17.2879 14.8032 16.9455 14.9524 16.5455 14.9524H6.36364ZM6.36364 13.4286H16.5455V6.57143H6.36364V13.4286ZM10 5.04762H12.9091V3.52381H10V5.04762Z" fill="var(--copy)"/>
                              </g>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--copy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
                              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                              <polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                          )}
                        </div>
                        {addr.company ? (
                          <div className="justify-center text-neutral-700 text-base font-normal leading-6">{addr.company}</div>
                        ) : null}
                        {contactDetails.length > 0 ? (
                          <div className="flex justify-start items-center gap-2 flex-wrap text-copy text-[16px] font-normal leading-6">
                            {contactDetails.map((detail, detailIndex) => (
                              <Fragment key={`${detail}-${detailIndex}`}>
                                {detailIndex > 0 ? <div className="text-[#C8D2DD]">|</div> : null}
                                <div>{detail}</div>
                              </Fragment>
                            ))}
                          </div>
                        ) : null}
                        {addressStr ? (
                          <div className="justify-center text-neutral-700 text-base font-normal leading-6">{addressStr}</div>
                        ) : null}
                        <div className="self-stretch border-t border-line mt-1"></div>
                        <div className="self-stretch inline-flex justify-start items-center gap-4 mt-1">
                          <button onClick={() => setEditingAddress(addr)} className="inline-flex justify-start items-center gap-1 hover:opacity-80 transition-opacity">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <mask id={`mask0_billing_edit_${addr.id}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                                <rect width="20" height="20" fill="#D9D9D9"/>
                              </mask>
                              <g mask={`url(#mask0_billing_edit_${addr.id})`}>
                                <path d="M3.33268 20.0052C2.87435 20.0052 2.48199 19.842 2.1556 19.5156C1.82921 19.1892 1.66602 18.7969 1.66602 18.3385C1.66602 17.8802 1.82921 17.4878 2.1556 17.1615C2.48199 16.8351 2.87435 16.6719 3.33268 16.6719H16.666C17.1243 16.6719 17.5167 16.8351 17.8431 17.1615C18.1695 17.4878 18.3327 17.8802 18.3327 18.3385C18.3327 18.7969 18.1695 19.1892 17.8431 19.5156C17.5167 19.842 17.1243 20.0052 16.666 20.0052H3.33268ZM4.99935 13.3385H6.16602L12.666 6.85938L11.4785 5.67188L4.99935 12.1719V13.3385ZM3.33268 14.1719V11.8177C3.33268 11.7066 3.35352 11.599 3.39518 11.4948C3.43685 11.3906 3.49935 11.2969 3.58268 11.2135L12.666 2.15104C12.8188 1.99826 12.9959 1.88021 13.1973 1.79688C13.3987 1.71354 13.6105 1.67188 13.8327 1.67188C14.0549 1.67188 14.2702 1.71354 14.4785 1.79688C14.6868 1.88021 14.8743 2.00521 15.041 2.17188L16.1868 3.33854C16.3535 3.49132 16.475 3.67188 16.5514 3.88021C16.6278 4.08854 16.666 4.30382 16.666 4.52604C16.666 4.73438 16.6278 4.93924 16.5514 5.14063C16.475 5.34201 16.3535 5.52604 16.1868 5.69271L7.12435 14.7552C7.04101 14.8385 6.94726 14.901 6.8431 14.9427C6.73893 14.9844 6.63129 15.0052 6.52018 15.0052H4.16602C3.9299 15.0052 3.73199 14.9253 3.57227 14.7656C3.41254 14.6059 3.33268 14.408 3.33268 14.1719Z" fill="var(--brand)"/>
                              </g>
                            </svg>
                            <div className="text-brand text-base font-normal leading-5">{getLabel('account.edit', 'Edit')}</div>
                          </button>
                          <>
                            <div className="w-[1.16px] h-4 bg-[#C8D2DD] rounded-full mx-1"></div>
                            <button onClick={() => handleRemove(addr.id)} className="inline-flex justify-start items-center gap-1 hover:opacity-80 transition-opacity">
                              <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <mask id={`mask0_billing_delete_${addr.id}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="21" height="21">
                                  <rect width="21" height="21" fill="#D9D9D9"/>
                                </mask>
                                <g mask={`url(#mask0_billing_delete_${addr.id})`}>
                                  <path d="M6.125 18.375C5.64375 18.375 5.23177 18.2036 4.88906 17.8609C4.54635 17.5182 4.375 17.1062 4.375 16.625V5.25C4.12708 5.25 3.91927 5.16615 3.75156 4.99844C3.58385 4.83073 3.5 4.62292 3.5 4.375C3.5 4.12708 3.58385 3.91927 3.75156 3.75156C3.91927 3.58385 4.12708 3.5 4.375 3.5H7.875C7.875 3.25208 7.95885 3.04427 8.12656 2.87656C8.29427 2.70885 8.50208 2.625 8.75 2.625H12.25C12.4979 2.625 12.7057 2.70885 12.8734 2.87656C13.0411 3.04427 13.125 3.25208 13.125 3.5H16.625C16.8729 3.5 17.0807 3.58385 17.2484 3.75156C17.4161 3.91927 17.5 4.12708 17.5 4.375C17.5 4.62292 17.4161 4.83073 17.2484 4.99844C17.0807 5.16615 16.8729 5.25 16.625 5.25V16.625C16.625 17.1062 16.4536 17.5182 16.1109 17.8609C15.7682 18.2036 15.3562 18.375 14.875 18.375H6.125ZM14.875 5.25H6.125V16.625H14.875V5.25ZM9.37344 14.6234C9.54115 14.4557 9.625 14.2479 9.625 14V7.875C9.625 7.62708 9.54115 7.41927 9.37344 7.25156C9.20573 7.08385 8.99792 7 8.75 7C8.50208 7 8.29427 7.08385 8.12656 7.25156C7.95885 7.41927 7.875 7.62708 7.875 7.875V14C7.875 14.2479 7.95885 14.4557 8.12656 14.6234C8.29427 14.7911 8.50208 14.875 8.75 14.875C8.99792 14.875 9.20573 14.7911 9.37344 14.6234ZM12.8734 14.6234C13.0411 14.4557 13.125 14.2479 13.125 14V7.875C13.125 7.62708 13.0411 7.41927 12.8734 7.25156C12.7057 7.08385 12.4979 7 12.25 7C12.0021 7 11.7943 7.08385 11.6266 7.25156C11.4589 7.41927 11.375 7.62708 11.375 7.875V14C11.375 14.2479 11.4589 14.4557 11.6266 14.6234C11.7943 14.7911 12.0021 14.875 12.25 14.875C12.4979 14.875 12.7057 14.7911 12.8734 14.6234Z" fill="var(--subtle)"/>
                                </g>
                              </svg>
                              <div className="text-subtle text-base font-normal leading-5">{getLabel('account.remove', 'Remove')}</div>
                            </button>
                          </>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="self-stretch justify-start items-center gap-2 inline-flex">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.99935 1.66536C14.5827 1.66536 18.3327 5.41536 18.3327 9.9987C18.3327 14.582 14.5827 18.332 9.99935 18.332C5.41602 18.332 1.66602 14.582 1.66602 9.9987C1.66602 5.41536 5.41602 1.66536 9.99935 1.66536Z" stroke="var(--subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 13.332V9.16536" stroke="var(--subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.99609 6.66797H10.0036" stroke="var(--subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="text-subtle text-[16px] font-normal leading-[20.80px]">
              {getLabel('account.selectFavoriteAddress', 'Select an address to make it your favorite.')}
            </div>
          </div>

          <button
            onClick={() => setEditingAddress('new')}
            className="h-[52px] px-8 rounded-full border-[1.5px] border-brand flex w-full sm:inline-flex sm:w-auto justify-center items-center gap-2 hover:bg-brand/5 transition-colors mt-2"
          >
            <span className="text-brand text-[22px] font-normal leading-6">+</span>
            <span className="text-brand text-lg font-normal leading-6">{getLabel('account.addNewAddress', 'Add New Address')}</span>
          </button>
        </>
      )}
    </div>
  );
}

function ShippingAddressesView({ user }: { user: StoredUser }) {
  const t = useTranslations();
  const [editingAddress, setEditingAddress] = useState<AccountAddress | 'new' | null>(null);
  const [addresses, setAddresses] = useState<AccountAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    user.default_shipping_address_id ? String(user.default_shipping_address_id) : null
  );

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

  useEffect(() => {
    if (user.default_shipping_address_id) {
      setSelectedAddressId(String(user.default_shipping_address_id));
    }
  }, [user.default_shipping_address_id]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const userDefaultId = user.default_shipping_address_id ? String(user.default_shipping_address_id) : undefined;
      const defaultSel = addresses.find(a => String(a.id) === userDefaultId) || addresses.find(a => a.type?.toLowerCase() === 'shipping') || addresses[0];
      setSelectedAddressId(defaultSel.id);
    }
  }, [addresses, selectedAddressId, user.default_shipping_address_id]);

  const handleSelectAddress = async (addrId: string) => {
    setSelectedAddressId(addrId);
    try {
      const uName = userDisplayName(user);
      const uEmail = userString(user, ['email']);
      const uPhone = userString(user, ['phone', 'mobile']);

      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: uName,
          email: uEmail,
          phone: uPhone,
          default_shipping_address_id: addrId
        }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('auth_user', JSON.stringify(data.data || data));
        window.dispatchEvent(new Event('auth-user-updated'));
        toast.success(t('account.defaultShippingAddressUpdated') || 'Default shipping address updated.');
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update default shipping address');
      }
    } catch (error) {
      console.error('Error updating default shipping address:', error);
      toast.error(error instanceof Error ? error.message : 'Error updating default shipping address.');
    }
  };

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

  const handleRemove = async (addressId: string) => {
    if (!confirm(t('account.confirmRemoveAddress') || 'Are you sure you want to remove this address?')) {
      return;
    }
    try {
      const response = await fetch('/api/account/addresses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ id: addressId }),
      });
      if (!response.ok) {
        throw new Error();
      }
      toast.success(t('account.addressRemovedSuccess') || 'Address removed successfully.');
      void fetchAddresses();
    } catch (error) {
      toast.error(t('account.addressRemoveError') || 'Error removing address.');
    }
  };

  return (
    <div className="self-stretch flex flex-col justify-start items-start gap-6 w-full">
      <div className="justify-start text-neutral-800 text-3xl font-bold leading-8">
        {getLabel('account.shippingAddress', 'Shipping Address')}
      </div>
      <div className="self-stretch border-t border-line"></div>
      
      {editingAddress ? (
        <ShippingAddressEditInline
          onClose={() => setEditingAddress(null)} 
          onSave={(savedId) => {
            setEditingAddress(null);
            if (savedId) {
              setSelectedAddressId(String(savedId));
            }
            void fetchAddresses();
          }}
          address={editingAddress === 'new' ? undefined : editingAddress}
        />
      ) : (
        <>
          <div className="self-stretch flex flex-col justify-start items-start gap-4">
            {shippingAddresses.length === 0 && (
              <div className="text-zinc-500 text-base">{getLabel('account.noShippingAddresses', 'No shipping addresses found.')}</div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full self-stretch">
              {shippingAddresses.map((addr, index) => {
                const isSelected = selectedAddressId ? String(addr.id) === String(selectedAddressId) : index === 0;
                const name = addr.name || `${addr.firstname || ''} ${addr.lastname || ''}`.trim();
                const addressStr = [addr.address1, addr.address2, addr.city, addr.postcode, addr.country].filter(Boolean).join(', ');
                const isOffice = addr.company?.toLowerCase().includes('office') || addr.company?.toLowerCase().includes('company') || addr.lastname?.toLowerCase().includes('havertz') || addr.firstname?.toLowerCase().includes('jenny'); // Fallback matches for mockup icons
                const contactDetails = [addr.email, addr.phone].filter(Boolean);
                
                return (
                  <div 
                    key={addr.id || index} 
                    className={`flex-1 p-4 relative rounded-xl outline transition-all duration-200 ${isSelected ? 'bg-[rgba(241,136,0,0.02)] outline-[1.5px] outline-brand' : 'bg-white outline-[1px] outline-[#E4EAF1]'} inline-flex flex-col justify-start items-start gap-3 w-full`}
                  >
                    {addr.type === 'billing' && (
                      <div className="absolute right-0 top-0 bg-line px-2 py-0.5 rounded-bl-lg text-copy text-[12px] font-normal leading-[18px]">
                        Billing Address
                      </div>
                    )}
                    
                    <div className="self-stretch inline-flex justify-start items-start gap-3">
                      <div className="w-5 h-6 relative mt-1 cursor-pointer flex items-start" onClick={() => handleSelectAddress(addr.id)}>
                        {isSelected ? (
                          <div className="w-5 h-5 bg-brand rounded-full relative flex items-center justify-center">
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1.5 4L4 6.5L8.5 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-[#CAD3DF]"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                        <div className="inline-flex justify-start items-center gap-1">
                          <div className="justify-start text-neutral-800 text-xl font-bold leading-6">{name || '-'}</div>
                          {isOffice ? (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[16px] h-[16px] text-copy fill-current">
                              <mask id={`mask0_2487_8686_${addr.id}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                                <rect width="20" height="20" fill="#D9D9D9"/>
                              </mask>
                              <g mask={`url(#mask0_2487_8686_${addr.id})`}>
                                <path d="M3.45455 18C3.05455 18 2.71212 17.8508 2.42727 17.5524C2.14242 17.254 2 16.8952 2 16.4762V8.85714C2 8.64127 2.0697 8.46032 2.20909 8.31429C2.34848 8.16825 2.52121 8.09524 2.72727 8.09524C2.93333 8.09524 3.10606 8.16825 3.24545 8.31429C3.38485 8.46032 3.45455 8.64127 3.45455 8.85714V16.4762H15.0909C15.297 16.4762 15.4697 16.5492 15.6091 16.6952C15.7485 16.8413 15.8182 17.0222 15.8182 17.2381C15.8182 17.454 15.7485 17.6349 15.6091 17.781C15.4697 17.927 15.297 18 15.0909 18H3.45455ZM6.36364 14.9524C5.96364 14.9524 5.62121 14.8032 5.33636 14.5048C5.05152 14.2063 4.90909 13.8476 4.90909 13.4286V5.80952C4.90909 5.59365 4.97879 5.4127 5.11818 5.26667C5.25758 5.12063 5.4303 5.04762 5.63636 5.04762H8.54545V3.52381C8.54545 3.10476 8.68788 2.74603 8.97273 2.44762C9.25758 2.14921 9.6 2 10 2H12.9091C13.3091 2 13.6515 2.14921 13.9364 2.44762C14.2212 2.74603 14.3636 3.10476 14.3636 3.52381V5.04762H17.2727C17.4788 5.04762 17.6515 5.12063 17.7909 5.26667C17.9303 5.4127 18 5.59365 18 5.80952V13.4286C18 13.8476 17.8576 14.2063 17.5727 14.5048C17.2879 14.8032 16.9455 14.9524 16.5455 14.9524H6.36364ZM6.36364 13.4286H16.5455V6.57143H6.36364V13.4286ZM10 5.04762H12.9091V3.52381H10V5.04762Z" fill="var(--copy)"/>
                              </g>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--copy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
                              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                              <polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                          )}
                        </div>
                        {addr.company ? (
                          <div className="justify-center text-neutral-700 text-base font-normal leading-6">{addr.company}</div>
                        ) : null}
                        {contactDetails.length > 0 ? (
                          <div className="flex justify-start items-center gap-2 flex-wrap text-copy text-[16px] font-normal leading-6">
                            {contactDetails.map((detail, detailIndex) => (
                              <Fragment key={`${detail}-${detailIndex}`}>
                                {detailIndex > 0 ? <div className="text-[#C8D2DD]">|</div> : null}
                                <div>{detail}</div>
                              </Fragment>
                            ))}
                          </div>
                        ) : null}
                        {addressStr ? (
                          <div className="justify-center text-neutral-700 text-base font-normal leading-6">{addressStr}</div>
                        ) : null}
                        <div className="self-stretch border-t border-line mt-1"></div>
                        <div className="self-stretch inline-flex justify-start items-center gap-4 mt-1">
                          <button onClick={() => setEditingAddress(addr)} className="inline-flex justify-start items-center gap-1 hover:opacity-80 transition-opacity">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <mask id={`mask0_2485_5893_${addr.id}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                                <rect width="20" height="20" fill="#D9D9D9"/>
                              </mask>
                              <g mask={`url(#mask0_2485_5893_${addr.id})`}>
                                <path d="M3.33268 20.0052C2.87435 20.0052 2.48199 19.842 2.1556 19.5156C1.82921 19.1892 1.66602 18.7969 1.66602 18.3385C1.66602 17.8802 1.82921 17.4878 2.1556 17.1615C2.48199 16.8351 2.87435 16.6719 3.33268 16.6719H16.666C17.1243 16.6719 17.5167 16.8351 17.8431 17.1615C18.1695 17.4878 18.3327 17.8802 18.3327 18.3385C18.3327 18.7969 18.1695 19.1892 17.8431 19.5156C17.5167 19.842 17.1243 20.0052 16.666 20.0052H3.33268ZM4.99935 13.3385H6.16602L12.666 6.85938L11.4785 5.67188L4.99935 12.1719V13.3385ZM3.33268 14.1719V11.8177C3.33268 11.7066 3.35352 11.599 3.39518 11.4948C3.43685 11.3906 3.49935 11.2969 3.58268 11.2135L12.666 2.15104C12.8188 1.99826 12.9959 1.88021 13.1973 1.79688C13.3987 1.71354 13.6105 1.67188 13.8327 1.67188C14.0549 1.67188 14.2702 1.71354 14.4785 1.79688C14.6868 1.88021 14.8743 2.00521 15.041 2.17188L16.1868 3.33854C16.3535 3.49132 16.475 3.67188 16.5514 3.88021C16.6278 4.08854 16.666 4.30382 16.666 4.52604C16.666 4.73438 16.6278 4.93924 16.5514 5.14063C16.475 5.34201 16.3535 5.52604 16.1868 5.69271L7.12435 14.7552C7.04101 14.8385 6.94726 14.901 6.8431 14.9427C6.73893 14.9844 6.63129 15.0052 6.52018 15.0052H4.16602C3.9299 15.0052 3.73199 14.9253 3.57227 14.7656C3.41254 14.6059 3.33268 14.408 3.33268 14.1719Z" fill="var(--brand)"/>
                              </g>
                            </svg>
                            <div className="text-brand text-base font-normal leading-5">{getLabel('account.edit', 'Edit')}</div>
                          </button>
                          {addr.type !== 'billing' && (
                            <>
                              <div className="w-[1.16px] h-4 bg-[#C8D2DD] rounded-full mx-1"></div>
                              <button onClick={() => handleRemove(addr.id)} className="inline-flex justify-start items-center gap-1 hover:opacity-80 transition-opacity">
                                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <mask id={`mask0_2485_5881_${addr.id}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="21" height="21">
                                    <rect width="21" height="21" fill="#D9D9D9"/>
                                  </mask>
                                  <g mask={`url(#mask0_2485_5881_${addr.id})`}>
                                    <path d="M6.125 18.375C5.64375 18.375 5.23177 18.2036 4.88906 17.8609C4.54635 17.5182 4.375 17.1062 4.375 16.625V5.25C4.12708 5.25 3.91927 5.16615 3.75156 4.99844C3.58385 4.83073 3.5 4.62292 3.5 4.375C3.5 4.12708 3.58385 3.91927 3.75156 3.75156C3.91927 3.58385 4.12708 3.5 4.375 3.5H7.875C7.875 3.25208 7.95885 3.04427 8.12656 2.87656C8.29427 2.70885 8.50208 2.625 8.75 2.625H12.25C12.4979 2.625 12.7057 2.70885 12.8734 2.87656C13.0411 3.04427 13.125 3.25208 13.125 3.5H16.625C16.8729 3.5 17.0807 3.58385 17.2484 3.75156C17.4161 3.91927 17.5 4.12708 17.5 4.375C17.5 4.62292 17.4161 4.83073 17.2484 4.99844C17.0807 5.16615 16.8729 5.25 16.625 5.25V16.625C16.625 17.1062 16.4536 17.5182 16.1109 17.8609C15.7682 18.2036 15.3562 18.375 14.875 18.375H6.125ZM14.875 5.25H6.125V16.625H14.875V5.25ZM9.37344 14.6234C9.54115 14.4557 9.625 14.2479 9.625 14V7.875C9.625 7.62708 9.54115 7.41927 9.37344 7.25156C9.20573 7.08385 8.99792 7 8.75 7C8.50208 7 8.29427 7.08385 8.12656 7.25156C7.95885 7.41927 7.875 7.62708 7.875 7.875V14C7.875 14.2479 7.95885 14.4557 8.12656 14.6234C8.29427 14.7911 8.50208 14.875 8.75 14.875C8.99792 14.875 9.20573 14.7911 9.37344 14.6234ZM12.8734 14.6234C13.0411 14.4557 13.125 14.2479 13.125 14V7.875C13.125 7.62708 13.0411 7.41927 12.8734 7.25156C12.7057 7.08385 12.4979 7 12.25 7C12.0021 7 11.7943 7.08385 11.6266 7.25156C11.4589 7.41927 11.375 7.62708 11.375 7.875V14C11.375 14.2479 11.4589 14.4557 11.6266 14.6234C11.7943 14.7911 12.0021 14.875 12.25 14.875C12.4979 14.875 12.7057 14.7911 12.8734 14.6234Z" fill="var(--subtle)"/>
                                  </g>
                                </svg>
                                <div className="text-subtle text-base font-normal leading-5">{getLabel('account.remove', 'Remove')}</div>
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
          </div>

          <div className="self-stretch justify-start items-center gap-2 inline-flex">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.99935 1.66536C14.5827 1.66536 18.3327 5.41536 18.3327 9.9987C18.3327 14.582 14.5827 18.332 9.99935 18.332C5.41602 18.332 1.66602 14.582 1.66602 9.9987C1.66602 5.41536 5.41602 1.66536 9.99935 1.66536Z" stroke="var(--subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 13.332V9.16536" stroke="var(--subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.99609 6.66797H10.0036" stroke="var(--subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="text-subtle text-[16px] font-normal leading-[20.80px]">
              {getLabel('account.selectFavoriteAddress', 'Select an address to make it your favorite.')}
            </div>
          </div>

          <button 
            onClick={() => setEditingAddress('new')}
            className="h-[52px] px-8 rounded-full border-[1.5px] border-brand flex w-full sm:inline-flex sm:w-auto justify-center items-center gap-2 hover:bg-brand/5 transition-colors mt-2"
          >
            <span className="text-brand text-[22px] font-normal leading-6">+</span>
            <span className="text-brand text-lg font-normal leading-6">{getLabel('account.addNewAddress', 'Add New Address')}</span>
          </button>
        </>
      )}
    </div>
  );
}

function ShippingAddressEditInline({ 
  onClose, 
  onSave, 
  address 
}: { 
  onClose: () => void; 
  onSave: (savedId?: string | number) => void;
  address?: AccountAddress;
}) {
  const t = useTranslations();
  const getLabel = (key: string, fallback: string) => {
    const val = t(key);
    return val === key ? fallback : val;
  };
  const [firstName, setFirstName] = useState(address?.firstname || '');
  const [lastName, setLastName] = useState(address?.lastname || '');
  const [email, setEmail] = useState(address?.email || ''); 
  const [phone, setPhone] = useState(address?.phone || '');
  const [countryId, setCountryId] = useState('');
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [provinceId, setProvinceId] = useState<number | string>('');
  const [street, setStreet] = useState(address?.address1 || '');
  const [postcode, setPostcode] = useState(address?.postcode || '');
  const [city, setCity] = useState(address?.city || '');
  const [stateRegion, setStateRegion] = useState(address?.state || address?.address2 || '');
  const [label, setLabel] = useState<'office' | 'home'>('home');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch('/api/countries');
        if (res.ok) {
          const data = await res.json();
          const list = data.countries || [];
          setCountriesList(list);

          const initialVal = address?.country || (address as any)?.country_id || 'NL';
          const match = list.find((c: any) => 
            c.id.toLowerCase() === initialVal.toLowerCase() ||
            c.name.toLowerCase() === initialVal.toLowerCase()
          );

          if (match) {
            setCountryId(match.id);
          } else {
            const nl = list.find((c: any) => c.id === 'NL' || c.name.toLowerCase() === 'netherlands');
            if (nl) {
              setCountryId(nl.id);
            } else if (list.length > 0) {
              setCountryId(list[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching countries:', err);
      }
    }
    loadCountries();
  }, [address]);

  const selectedCountry = countriesList.find((c: any) => c.id === countryId);
  const provinces = selectedCountry?.provinces || [];

  useEffect(() => {
    if (provinces.length > 0) {
      const initialProvVal = address?.state || address?.address2 || (address as any)?.state || '';
      const match = provinces.find((p: any) => 
        String(p.id) === String(initialProvVal) ||
        p.name.toLowerCase() === String(initialProvVal).toLowerCase()
      );
      if (match) {
        setProvinceId(match.id);
        setStateRegion(match.name);
      } else {
        // If no match but we have provinces, set to first or empty
        setProvinceId('');
        setStateRegion('');
      }
    } else {
      setProvinceId('');
    }
  }, [countryId, provinces, address]);

  const handleProvinceChange = (provIdStr: string) => {
    setProvinceId(provIdStr);
    const match = provinces.find((p: any) => String(p.id) === provIdStr);
    if (match) {
      setStateRegion(match.name);
    } else {
      setStateRegion('');
    }
  };

  const inputClasses = "w-full h-12 px-4 rounded-full border border-slate-200 focus:border-brand outline-none transition-all text-neutral-800 text-base bg-white font-normal";
  const labelClasses = "text-base font-bold text-neutral-800 mb-2 block";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const cleanId = address?.id && !address.id.startsWith('address-') 
        ? (isNaN(Number(address.id)) ? address.id : Number(address.id)) 
        : undefined;

      const payload = {
        id: cleanId,
        type: 'shipping',
        name: `${firstName} ${lastName}`,
        firstname: firstName,
        lastname: lastName,
        company_name: label === 'office' ? 'Office' : '',
        address: street,
        address2: stateRegion,
        state: stateRegion,
        state_name: stateRegion,
        province: stateRegion,
        province_name: stateRegion,
        postalcode: postcode,
        city: city,
        phone: phone,
        email: email,
        country_id: countryId || 'NL',
        country: selectedCountry?.name || countryId || 'Netherlands',
        country_name: selectedCountry?.name || countryId || 'Netherlands',
        province_id: provinceId ? Number(provinceId) : undefined,
        state_id: provinceId ? Number(provinceId) : undefined,
      };

      const response = await fetch('/api/account/addresses', {
        method: cleanId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Save failed');
      }
      const responseData = await response.json().catch(() => ({}));
      const savedAddressId = responseData?.id || responseData?.data?.id || cleanId;

      toast.success(t('account.addressSavedSuccess', { type: 'Shipping' }));
      onSave(savedAddressId);
    } catch (error) {
      console.error("Shipping save error:", error);
      toast.error(t('account.addressesLoadError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-300 mt-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>{getLabel('account.firstName', 'First name')}</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClasses} required placeholder="Sofia" />
          </div>
          <div>
            <label className={labelClasses}>{getLabel('account.lastName', 'Last name')}</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClasses} required placeholder="Havertz" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>{getLabel('account.email', 'Email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="sofia@gmail.com" />
          </div>
          <div>
            <label className={labelClasses}>{getLabel('account.phoneNumber', 'Phone number')}</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} placeholder="+555-113324" />
          </div>
        </div>

        <div>
          <label className={labelClasses}>{getLabel('account.country', 'Country / Region')}</label>
          <div className="relative">
            <select value={countryId} onChange={(e) => setCountryId(e.target.value)} className={`${inputClasses} appearance-none pr-10 bg-transparent`}>
              {countriesList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>{getLabel('account.streetAndHouseNumber', 'Street and house number')}</label>
            <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className={inputClasses} required placeholder="345 Long Island" />
          </div>
          <div>
            <label className={labelClasses}>{getLabel('account.postCode', 'Postcode')}</label>
            <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value)} className={inputClasses} required placeholder="1200" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>{getLabel('account.city', 'Place')}</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClasses} required placeholder="NewYork" />
          </div>
          <div>
            <label className={labelClasses}>{getLabel('account.stateOptional', 'State (optional)')}</label>
            {provinces.length > 0 ? (
              <div className="relative">
                <select value={provinceId} onChange={(e) => handleProvinceChange(e.target.value)} className={`${inputClasses} appearance-none pr-10 bg-transparent`}>
                  <option value="">-- Select Province --</option>
                  {provinces.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            ) : (
              <input type="text" value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} className={inputClasses} placeholder="NewYork" />
            )}
          </div>
        </div>

        <div>
          <label className={labelClasses}>{getLabel('account.selectLabelForDelivery', 'Select a label for effective delivery:')}</label>
          <div className="flex flex-col sm:flex-row gap-4 justify-start items-stretch sm:items-center">
            <button 
              type="button" 
              onClick={() => setLabel('office')}
              className={`flex items-center justify-start gap-3 h-12 px-6 rounded-full border transition-all duration-200 font-bold w-full sm:w-auto sm:min-w-[180px] ${label === 'office' ? 'border-brand bg-[rgba(241,136,0,0.02)] ring-[0.5px] ring-brand' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
            >
              <div className="w-5 h-5 relative flex items-center justify-center flex-shrink-0">
                {label === 'office' ? (
                  <div className="w-5 h-5 bg-brand rounded-full relative flex items-center justify-center">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.5 4L4 6.5L8.5 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#CAD3DF]"></div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-copy fill-current">
                  <mask id="mask0_2487_8680_form" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                    <rect width="20" height="20" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_2487_8680_form)">
                    <path d="M2.49967 18.332C2.04134 18.332 1.64898 18.1688 1.32259 17.8424C0.996202 17.5161 0.833008 17.1237 0.833008 16.6654V8.33203C0.833008 8.09592 0.912869 7.898 1.07259 7.73828C1.23231 7.57856 1.43023 7.4987 1.66634 7.4987C1.90245 7.4987 2.10037 7.57856 2.26009 7.73828C2.41981 7.898 2.49967 8.09592 2.49967 8.33203V16.6654H15.833C16.0691 16.6654 16.267 16.7452 16.4268 16.9049C16.5865 17.0647 16.6663 17.2626 16.6663 17.4987C16.6663 17.7348 16.5865 17.9327 16.4268 18.0924C16.267 18.2522 16.0691 18.332 15.833 18.332H2.49967ZM5.83301 14.9987C5.37467 14.9987 4.98231 14.8355 4.65592 14.5091C4.32954 14.1827 4.16634 13.7904 4.16634 13.332V4.9987C4.16634 4.76259 4.2462 4.56467 4.40592 4.40495C4.56565 4.24523 4.76356 4.16536 4.99967 4.16536H8.33301V2.4987C8.33301 2.04036 8.4962 1.648 8.82259 1.32161C9.14898 0.995226 9.54134 0.832031 9.99967 0.832031H13.333C13.7913 0.832031 14.1837 0.995226 14.5101 1.32161C14.8365 1.648 14.9997 2.04036 14.9997 2.4987V4.16536H18.333C18.5691 4.16536 18.767 4.24523 18.9268 4.40495C19.0865 4.56467 19.1663 4.76259 19.1663 4.9987V13.332C19.1663 13.7904 19.0031 14.1827 18.6768 14.5091C18.3504 14.8355 17.958 14.9987 17.4997 14.9987H5.83301ZM5.83301 13.332H17.4997V5.83203H5.83301V13.332ZM9.99967 4.16536H13.333V2.4987H9.99967V4.16536Z" fill="var(--copy)" />
                  </g>
                </svg>
                <span className="text-copy text-[20px] font-bold leading-6">{getLabel('account.office', 'Office')}</span>
              </div>
            </button>
            
            <button 
              type="button" 
              onClick={() => setLabel('home')}
              className={`flex items-center justify-start gap-3 h-12 px-6 rounded-full border transition-all duration-200 font-bold w-full sm:w-auto sm:min-w-[180px] ${label === 'home' ? 'border-brand bg-[rgba(241,136,0,0.02)] ring-[0.5px] ring-brand' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
            >
              <div className="w-5 h-5 relative flex items-center justify-center flex-shrink-0">
                {label === 'home' ? (
                  <div className="w-5 h-5 bg-brand rounded-full relative flex items-center justify-center">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.5 4L4 6.5L8.5 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#CAD3DF]"></div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-copy fill-current">
                  <mask id="mask0_2487_8674_form" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                    <rect width="20" height="20" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_2487_8674_form)">
                    <path d="M4.99967 15.8346H7.49967V11.668C7.49967 11.4319 7.57954 11.2339 7.73926 11.0742C7.89898 10.9145 8.0969 10.8346 8.33301 10.8346H11.6663C11.9025 10.8346 12.1004 10.9145 12.2601 11.0742C12.4198 11.2339 12.4997 11.4319 12.4997 11.668V15.8346H14.9997V8.33464L9.99967 4.58464L4.99967 8.33464V15.8346ZM3.33301 15.8346V8.33464C3.33301 8.07075 3.39204 7.82075 3.51009 7.58464C3.62815 7.34852 3.79134 7.15408 3.99967 7.0013L8.99967 3.2513C9.29134 3.02908 9.62467 2.91797 9.99967 2.91797C10.3747 2.91797 10.708 3.02908 10.9997 3.2513L15.9997 7.0013C16.208 7.15408 16.3712 7.34852 16.4893 7.58464C16.6073 7.82075 16.6663 8.33464 16.6663 8.33464V15.8346C16.6663 16.293 16.5031 16.6853 16.1768 17.0117C15.8504 17.3381 15.458 17.5013 14.9997 17.5013H11.6663C11.4302 17.5013 11.2323 17.4214 11.0726 17.2617C10.9129 17.102 10.833 16.9041 10.833 16.668V12.5013H9.16634V16.668C9.16634 16.9041 9.08648 17.102 8.92676 17.2617C8.76704 17.4214 8.56912 17.5013 8.33301 17.5013H4.99967C4.54134 17.5013 4.14898 17.3381 3.82259 17.0117C3.4962 16.6853 3.33301 16.293 3.33301 15.8346Z" />
                  </g>
                </svg>
                <span className="text-copy text-[20px] font-bold leading-6">{getLabel('account.home', 'Home')}</span>
              </div>
            </button>
          </div>
        </div>

        <div className="self-stretch border-t border-line mt-4"></div>

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button 
            type="submit" 
            disabled={isSaving}
            className="h-12 px-8 rounded-full bg-[#f08c00] hover:bg-brand-hover text-white text-base font-normal transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            {isSaving ? getLabel('account.saving', 'Saving...') : getLabel('account.saveChanges', 'Save Changes')}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="h-12 px-8 rounded-full bg-white border border-slate-200 text-neutral-600 text-base font-normal hover:bg-slate-50 transition-colors w-full sm:w-auto"
          >
            {getLabel('account.cancel', 'Cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}

function AddressValueField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
      <div className="justify-center text-zinc-500 text-base font-normal leading-6">{label}</div>
      <div className="justify-start text-neutral-800 text-lg font-bold leading-5">{value}</div>
    </div>
  );
}

function SingleAddressView({ type }: { type: 'billing_address' | 'shipping_address' }) {
  const t = useTranslations();
  const isBilling = type === 'billing_address';
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

  const getLabel = (key: string, fallback: string) => {
    const val = t(key);
    return val === key ? fallback : val;
  };
  const { firstName, lastName } = splitAddressName(targetAddress);
  const displayFields = [
    { label: getLabel('account.company', 'Company name'), value: targetAddress?.company },
    { label: getLabel('account.vatNumber', 'VAT number'), value: targetAddress?.vatNumber },
    { label: getLabel('account.firstName', 'First name'), value: firstName },
    { label: getLabel('account.lastName', 'Last name'), value: lastName },
    { label: getLabel('account.emailAddress', 'Email address'), value: targetAddress?.email },
    { label: getLabel('account.phoneNumber', 'Phone number'), value: targetAddress?.phone },
    { label: getLabel('account.country', 'Country/Region'), value: targetAddress?.country },
    { label: getLabel('account.streetAndHouseNumber', 'Street and house number'), value: targetAddress?.address1 },
    { label: getLabel('account.postCode', 'Post code'), value: targetAddress?.postcode },
    { label: getLabel('account.city', 'Place'), value: targetAddress?.city },
    { label: getLabel('account.stateOptional', 'State (optional)'), value: targetAddress?.state || targetAddress?.address2 },
  ].filter((field): field is { label: string; value: string } => Boolean(field.value?.trim()));

  return (
    <div className="self-stretch flex flex-col justify-start items-start gap-4 w-full">
      <div className="justify-start text-neutral-800 text-3xl font-bold leading-8">
        {isBilling ? getLabel('account.billingAddress', 'Billing Address') : getLabel('account.shippingAddress', 'Shipping Address')}
      </div>
      <div className="self-stretch border-t border-line mb-2"></div>
      
      {editingAddress ? (
        <BillingAddressEditInline 
          onClose={() => setEditingAddress(null)} 
          onSave={() => {
            setEditingAddress(null);
            void fetchAddresses();
          }}
          address={targetAddress}
        />
      ) : (
        <>
          <div className="self-stretch grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            {displayFields.length > 0 ? (
              displayFields.map((field) => (
                <AddressValueField key={field.label} label={field.label} value={field.value} />
              ))
            ) : (
              <div className="text-zinc-500 text-base font-normal leading-6">
                {isBilling ? getLabel('account.billingAddressEmpty', 'No billing address found.') : getLabel('account.shippingAddressEmpty', 'No shipping address found.')}
              </div>
            )}
          </div>

          <button 
            onClick={() => setEditingAddress(isBilling ? 'billing' : 'shipping')}
            className="h-12 px-8 py-2.5 mt-4 rounded-[100px] outline outline-[1.50px] outline-offset-[-1.50px] outline-amber-500 flex w-full sm:inline-flex sm:w-auto justify-center items-center gap-2 hover:bg-brand-soft transition-colors"
          >
            <div className="text-center justify-start text-brand text-lg font-normal leading-6">{t('account.editAddress') || 'Edit Address'}</div>
          </button>
        </>
      )}
    </div>
  );
}

function BillingAddressEditInline({ 
  onClose, 
  onSave, 
  address 
}: { 
  onClose: () => void; 
  onSave: (savedId?: string | number) => void;
  address?: AccountAddress;
}) {
  const t = useTranslations();
  const getLabel = (key: string, fallback: string) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const [firstName, setFirstName] = useState(address?.firstname || '');
  const [lastName, setLastName] = useState(address?.lastname || '');
  const [company, setCompany] = useState(address?.company || '');
  const [vatNumber, setVatNumber] = useState(address?.vatNumber || '');
  const [email, setEmail] = useState(address?.email || ''); 
  const [phone, setPhone] = useState(address?.phone || '');
  const [countryId, setCountryId] = useState('');
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [provinceId, setProvinceId] = useState<number | string>('');
  const [street, setStreet] = useState(address?.address1 || '');
  const [postcode, setPostcode] = useState(address?.postcode || '');
  const [city, setCity] = useState(address?.city || '');
  const [stateRegion, setStateRegion] = useState(address?.state || address?.address2 || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch('/api/countries');
        if (res.ok) {
          const data = await res.json();
          const list = data.countries || [];
          setCountriesList(list);

          const initialVal = address?.country || (address as any)?.country_id || 'NL';
          const match = list.find((c: any) => 
            c.id.toLowerCase() === initialVal.toLowerCase() ||
            c.name.toLowerCase() === initialVal.toLowerCase()
          );

          if (match) {
            setCountryId(match.id);
          } else {
            const nl = list.find((c: any) => c.id === 'NL' || c.name.toLowerCase() === 'netherlands');
            if (nl) {
              setCountryId(nl.id);
            } else if (list.length > 0) {
              setCountryId(list[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching countries:', err);
      }
    }
    loadCountries();
  }, [address]);

  const selectedCountry = countriesList.find((c: any) => c.id === countryId);
  const provinces = selectedCountry?.provinces || [];

  useEffect(() => {
    if (provinces.length > 0) {
      const initialProvVal = address?.state || address?.address2 || (address as any)?.state || '';
      const match = provinces.find((p: any) => 
        String(p.id) === String(initialProvVal) ||
        p.name.toLowerCase() === String(initialProvVal).toLowerCase()
      );
      if (match) {
        setProvinceId(match.id);
        setStateRegion(match.name);
      } else {
        // If no match but we have provinces, set to first or empty
        setProvinceId('');
        setStateRegion('');
      }
    } else {
      setProvinceId('');
    }
  }, [countryId, provinces, address]);

  const handleProvinceChange = (provIdStr: string) => {
    setProvinceId(provIdStr);
    const match = provinces.find((p: any) => String(p.id) === provIdStr);
    if (match) {
      setStateRegion(match.name);
    } else {
      setStateRegion('');
    }
  };

  const inputClasses = "w-full h-12 px-4 rounded-full border border-slate-200 focus:border-brand outline-none transition-all text-neutral-800 text-base bg-white font-normal";
  const labelClasses = "text-base font-bold text-neutral-800 mb-2 block";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const cleanId = address?.id && !address.id.startsWith('address-') 
        ? (isNaN(Number(address.id)) ? address.id : Number(address.id)) 
        : undefined;

      const payload = {
        id: cleanId,
        type: 'billing',
        name: `${firstName} ${lastName}`,
        firstname: firstName,
        lastname: lastName,
        company_name: company,
        vat_number: vatNumber || undefined,
        btw_number: vatNumber || undefined,
        address: street,
        address2: stateRegion,
        state: stateRegion,
        state_name: stateRegion,
        province: stateRegion,
        province_name: stateRegion,
        postalcode: postcode,
        city: city,
        phone: phone,
        email: email,
        country_id: countryId || 'NL',
        country: selectedCountry?.name || countryId || 'Netherlands',
        country_name: selectedCountry?.name || countryId || 'Netherlands',
        province_id: provinceId ? Number(provinceId) : undefined,
        state_id: provinceId ? Number(provinceId) : undefined,
      };

      const response = await fetch('/api/account/addresses', {
        method: cleanId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));
      console.log('[BillingForm] response status:', response.status, 'data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || JSON.stringify(responseData) || 'Save failed');
      }

      const savedAddressId = responseData?.id || responseData?.data?.id || cleanId;
      toast.success(t('account.addressSavedSuccess', { type: 'Billing' }));
      onSave(savedAddressId);
    } catch (error) {
      console.error("Billing save error:", error);
      toast.error(error instanceof Error ? error.message : t('account.addressesLoadError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-300 mt-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>{getLabel('account.companyOptional', 'Company name (optional)')}</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className={inputClasses} placeholder="Company Ltd." />
          </div>
          <div>
            <label className={labelClasses}>{getLabel('account.vatNumberOptional', 'VAT number (optional)')}</label>
            <input type="text" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} className={inputClasses} placeholder="NL123456789B01" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>{getLabel('account.firstName', 'First name')}</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClasses} required placeholder="Sofia" />
          </div>
          <div>
            <label className={labelClasses}>{getLabel('account.lastName', 'Last name')}</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClasses} required placeholder="Havertz" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>{getLabel('account.emailAddress', 'Email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="sofia@gmail.com" />
          </div>
          <div>
            <label className={labelClasses}>{getLabel('account.phoneNumber', 'Phone number')}</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} placeholder="+555-113324" />
          </div>
        </div>

        <div>
          <label className={labelClasses}>{getLabel('account.country', 'Country / Region')}</label>
          <div className="relative">
            <select value={countryId} onChange={(e) => setCountryId(e.target.value)} className={`${inputClasses} appearance-none pr-10 bg-transparent`}>
              {countriesList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>{getLabel('account.streetAndHouseNumber', 'Street and house number')}</label>
            <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className={inputClasses} required placeholder="345 Long Island" />
          </div>
          <div>
            <label className={labelClasses}>{getLabel('account.postCode', 'Postcode')}</label>
            <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value)} className={inputClasses} required placeholder="1200" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>{getLabel('account.city', 'Place')}</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClasses} required placeholder="NewYork" />
          </div>
          <div>
            <label className={labelClasses}>{getLabel('account.stateOptional', 'State (optional)')}</label>
            {provinces.length > 0 ? (
              <div className="relative">
                <select value={provinceId} onChange={(e) => handleProvinceChange(e.target.value)} className={`${inputClasses} appearance-none pr-10 bg-transparent`}>
                  <option value="">-- Select Province --</option>
                  {provinces.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            ) : (
              <input type="text" value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} className={inputClasses} placeholder="NewYork" />
            )}
          </div>
        </div>

        <div className="self-stretch border-t border-line mt-4"></div>

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button 
            type="submit" 
            disabled={isSaving}
            className="h-12 px-8 rounded-full bg-[#f08c00] hover:bg-brand-hover text-white text-base font-normal transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            {isSaving ? getLabel('account.saving', 'Saving...') : getLabel('account.saveChanges', 'Save Changes')}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="h-12 px-8 rounded-full bg-white border border-slate-200 text-neutral-600 text-base font-normal hover:bg-slate-50 transition-colors w-full sm:w-auto"
          >
            {getLabel('account.cancel', 'Cancel')}
          </button>
        </div>
      </form>
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
  const inputClasses = "w-full h-14 px-6 rounded-2xl border border-slate-200 focus:border-brand outline-none transition-all text-neutral-800 text-base bg-white focus:ring-[6px] focus:ring-brand/5 font-medium";
  const labelClasses = "text-xs font-black text-neutral-500 uppercase tracking-widest mb-2.5 block ml-1";

  const [firstName, setFirstName] = useState(address?.firstname || '');
  const [lastName, setLastName] = useState(address?.lastname || '');
  const [company, setCompany] = useState(address?.company || '');
  const [email, setEmail] = useState(address?.email || '');
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
      const cleanId = address?.id && !address.id.startsWith('address-') 
        ? (isNaN(Number(address.id)) ? address.id : Number(address.id)) 
        : undefined;

      const payload = {
        id: cleanId,
        type,
        name: `${firstName} ${lastName}`,
        firstname: firstName,
        lastname: lastName,
        company_name: company,
        address: street,
        address2: street2,
        state: street2,
        state_name: street2,
        province: street2,
        province_name: street2,
        postalcode: postcode,
        city: city,
        phone: phone,
        email: email,
        country_id: 'NL',
      };


      const response = await fetch('/api/account/addresses', {
        method: cleanId ? 'PUT' : 'POST',
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
      console.error("Address modal save error:", error);
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
            className="flex-1 h-14 rounded-full bg-brand px-8 text-base font-black text-white hover:bg-brand-hover transition-all shadow-xl shadow-brand/30 uppercase tracking-widest disabled:opacity-50"
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
            ? 'h-9 px-5 bg-brand text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-brand-hover transition-all shadow-lg shadow-brand/20'
            : 'text-brand font-black text-sm uppercase tracking-wider hover:underline'}
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
            {address.email ? <p className="font-medium">{address.email}</p> : null}
            {address.phone ? <p className="font-medium">{address.phone}</p> : null}
            {address.address1 ? <p className="font-medium">{address.address1}</p> : null}
            {address.address2 ? <p className="font-medium">{address.address2}</p> : null}
            {address.postcode || address.city ? <p className="font-medium">{[address.postcode, address.city].filter(Boolean).join(' ')}</p> : null}
            {address.country ? <p className="font-bold text-brand">{address.country}</p> : null}
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
  const inputClasses = "w-full h-12 px-4 rounded-full border border-slate-200 focus:border-brand outline-none transition-all text-neutral-800 text-base bg-white font-normal";
  const labelClasses = "text-ink text-[18px] font-bold leading-[20px] mb-2.5 block ml-1 break-words";
  
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
        <div className="justify-start text-neutral-800 text-3xl font-bold leading-8">{t('account.accountDetails')}</div>
        <div className="self-stretch border-t border-line"></div>
        <div className="self-stretch flex flex-col justify-start items-start gap-6 mt-2">
          <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-6 sm:gap-4">
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
              <div className="justify-center text-zinc-500 text-base font-normal leading-6">{getLabel('account.firstName', 'First name')}</div>
              <div className="justify-start text-neutral-800 text-lg font-bold leading-5">{firstName}</div>
            </div>
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
              <div className="justify-center text-zinc-500 text-base font-normal leading-6">{getLabel('account.lastName', 'Last name')}</div>
              <div className="justify-start text-neutral-800 text-lg font-bold leading-5">{name.includes(' ') ? lastName : '-'}</div>
            </div>
          </div>
          <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-6 sm:gap-4">
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
              <div className="justify-center text-zinc-500 text-base font-normal leading-6">{getLabel('account.emailAddress', 'Email address')}</div>
              <div className="justify-start text-neutral-800 text-lg font-bold leading-5">{email || '-'}</div>
            </div>
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-3 w-full">
              <div className="justify-center text-zinc-500 text-base font-normal leading-6">{getLabel('account.phoneNumber', 'Phone number')}</div>
              <div className="justify-start text-neutral-800 text-lg font-bold leading-5">{phone || '-'}</div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="h-12 px-8 py-2.5 mt-4 rounded-[100px] outline outline-[1.50px] outline-offset-[-1.50px] outline-amber-500 flex w-full sm:inline-flex sm:w-auto justify-center items-center gap-2 hover:bg-brand-soft transition-colors"
        >
          <div className="text-center justify-start text-brand text-lg font-normal leading-6">{getLabel('account.editProfile', 'Edit Profile')}</div>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">{t('account.editProfile') || 'Edit Profile'}</h2>
        <p className="text-neutral-500 font-medium">{t('account.detailsSub')}</p>
        <div className="self-stretch border-t border-line mt-4"></div>
      </div>
      
      <form className="flex flex-col gap-8" onSubmit={handleSaveProfile}>
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
             <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
          </h3>
          
          <p className="text-neutral-500 text-sm mb-6">{t('account.securitySettingsDesc')}</p>
        </div>

        <div className="self-stretch border-t border-line pt-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button 
              type="submit" 
              disabled={isSaving}
              className="h-12 px-8 py-2.5 bg-brand rounded-[100px] flex justify-center items-center gap-2 hover:bg-brand-hover transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-brand/20 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <div className="text-center justify-start text-white text-lg font-normal leading-6">
                {isSaving ? t('account.saving') : t('account.saveProfile') || 'Save Profile'}
              </div>
            </button>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="h-12 px-8 py-2.5 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-4 focus:ring-slate-100 w-full sm:w-auto"
            >
              <div className="text-center justify-start text-neutral-700 text-lg font-normal leading-6">
                {t('account.cancel') || 'Cancel'}
              </div>
            </button>
          </div>
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
      <div className="justify-start text-neutral-800 text-3xl font-bold leading-8">
        {t('account.changePassword') || 'Change Password'}
      </div>
      <div className="self-stretch border-t border-line"></div>
      
      <div className="self-stretch flex flex-col justify-start items-start gap-6 mt-2">
        {/* Current Password */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="justify-start text-neutral-800 text-lg font-bold leading-5">
            {t('account.currentPassword') || 'Current Password'}
          </div>
          <div className="self-stretch h-12 px-5 py-2 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 inline-flex justify-start items-center gap-3 bg-white focus-within:outline-[1.5px] focus-within:outline-amber-500 transition-all">
            <input 
              type={showCurrent ? 'text' : 'password'} 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="flex-1 bg-transparent outline-none text-neutral-800 text-lg leading-7 placeholder-zinc-400 tracking-widest font-mono" 
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
          <div className="justify-start text-neutral-800 text-lg font-bold leading-5">
            {t('account.newPassword') || 'New Password'}
          </div>
          <div className="self-stretch h-12 px-5 py-2 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 inline-flex justify-start items-center gap-3 bg-white focus-within:outline-[1.5px] focus-within:outline-amber-500 transition-all">
            <input 
              type={showNew ? 'text' : 'password'} 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 bg-transparent outline-none text-neutral-800 text-lg leading-7 placeholder-zinc-400 tracking-widest font-mono" 
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
          <div className="justify-start text-neutral-800 text-lg font-bold leading-5">
            {t('account.confirmNewPassword') || 'Confirm New Password'}
          </div>
          <div className="self-stretch h-12 px-5 py-2 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 inline-flex justify-start items-center gap-3 bg-white focus-within:outline-[1.5px] focus-within:outline-amber-500 transition-all">
            <input 
              type={showConfirm ? 'text' : 'password'} 
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="flex-1 bg-transparent outline-none text-neutral-800 text-lg leading-7 placeholder-zinc-400 tracking-widest font-mono" 
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
        <div className="self-stretch border-t border-line"></div>
        <div className="self-stretch flex flex-col sm:flex-row gap-4 w-full">
          <button type="submit" disabled={isSaving} className="h-12 px-8 py-2.5 bg-brand rounded-[100px] flex justify-center items-center gap-2 hover:bg-brand-hover transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-brand/20 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto">
            <div className="text-center justify-start text-white text-lg font-normal leading-6">
              {isSaving ? t('account.saving') : t('account.saveChanges') || 'Save Changes'}
            </div>
          </button>
          <button type="button" onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); setShowCurrent(false); setShowNew(false); setShowConfirm(false); }} className="h-12 px-8 py-2.5 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-4 focus:ring-slate-100 w-full sm:w-auto">
            <div className="text-center justify-start text-neutral-700 text-lg font-normal leading-6">
              {t('account.cancel') || 'Cancel'}
            </div>
          </button>
        </div>
      </div>
    </form>
  );
}
