"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useEffect } from "react";
import { type CartItem, useCart } from "@/components/CartProvider";
import { toast } from "sonner";
import LoginPopup from "@/components/LoginPopup";
import RegisterPopup from "@/components/RegisterPopup";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useTranslations, useLocale } from 'next-intl';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { localePath } from "@/lib/i18n/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useShippingRules } from "@/hooks/useShippingRules";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

type CheckoutFormState = {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  companyName: string;
  vatNumber: string;
  streetAddress: string;
  country: string;
  city: string;
  state: string;
  postcode: string;
  paymentMethod: "ideal" | "creditcard" | "bancontact" | "banktransfer" | "";
  // Shipping fields
  shippingFirstName: string;
  shippingLastName: string;
  shippingStreetAddress: string;
  shippingCountry: string;
  shippingCity: string;
  shippingState: string;
  shippingPostcode: string;
  sameAsBilling: boolean;
  purchaseReference: string;
};

type CheckoutMode = "live" | "demo";

type CheckoutPageClientProps = {
  mode?: CheckoutMode;
  demoItems?: CartItem[];
};

type CheckoutSavedAddress = {
  id: string;
  type: string;
  isDefault: boolean;
  name: string;
  firstname: string;
  lastname: string;
  company: string;
  address1: string;
  address2: string;
  postcode: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  country: string;
};

const DELIVERY_FEE = 9.95;

const initialFormState: CheckoutFormState = {
  firstName: "",
  lastName: "",
  email: "",
  mobileNumber: "",
  companyName: "",
  vatNumber: "",
  streetAddress: "",
  country: "Netherlands",
  city: "",
  state: "",
  postcode: "",
  paymentMethod: "",
  shippingFirstName: "",
  shippingLastName: "",
  shippingStreetAddress: "",
  shippingCountry: "Netherlands",
  shippingCity: "",
  shippingState: "",
  shippingPostcode: "",
  sameAsBilling: true,
  purchaseReference: "",
};

const demoFormState: CheckoutFormState = {
  firstName: "Emma",
  lastName: "van Dijk",
  email: "emma.vandijk@example.com",
  mobileNumber: "+31 6 1234 5678",
  companyName: "Van Dijk Labels BV",
  vatNumber: "NL123456789B01",
  streetAddress: "Keizersgracht 214",
  country: "Netherlands",
  city: "Amsterdam",
  state: "North Holland",
  postcode: "1016 DW",
  paymentMethod: "ideal",
  shippingFirstName: "Emma",
  shippingLastName: "van Dijk",
  shippingStreetAddress: "Keizersgracht 214",
  shippingCountry: "Netherlands",
  shippingCity: "Amsterdam",
  shippingState: "North Holland",
  shippingPostcode: "1016 DW",
  sameAsBilling: true,
  purchaseReference: "",
};

function formatEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function inputClasses(hasError = false): string {
  return `w-full h-[52px] px-5 py-4 rounded-full border bg-white text-neutral-800 text-[16px] outline-none transition-all placeholder:text-subtle ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400"
      : "border-[#DDE1EA] focus:border-brand focus:ring-1 focus:ring-brand"
  }`;
}

function linePrice(item: CartItem): number {
  const price = typeof item.price === "number" && Number.isFinite(item.price) ? item.price : 0;
  return price * item.quantity;
}

function getProductId(item: CartItem): number | null {
  if (typeof item.id === "number" && Number.isFinite(item.id)) {
    return item.id;
  }

  if (typeof item.id === "string") {
    const parsedId = Number(item.id);
    if (Number.isInteger(parsedId) && parsedId > 0) {
      return parsedId;
    }
  }

  return null;
}

type CheckoutOrderItem = {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  is_group_product: boolean;
  warranty_option_id?: number;
  extended_warranty_id?: number;
  extended_warranty_name?: string;
  extended_warranty_sku?: string;
  extended_warranty_price?: number;
  extended_warranty_quantity?: number;
  extended_warranty_duration_months?: number | null;
  extended_warranty?: {
    option_id: number;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    duration_months: number | null;
    parent_sku: string | null;
    parent_name: string | null;
  };
};

function getLinkedWarrantyItem(items: CartItem[], parentItem: CartItem): CartItem | null {
  return items.find((item) => item.itemKind === "warranty" && item.linkedToKey === parentItem.key) ?? null;
}

function buildCheckoutOrderItems(items: CartItem[]): CheckoutOrderItem[] {
  return items.flatMap((item) => {
    if (item.itemKind === "warranty") {
      return [];
    }

    const productId = getProductId(item);

    if (productId === null) {
      return [];
    }

    const orderItem: CheckoutOrderItem = {
      product_id: productId,
      name: item.name?.trim() || item.sku || "Product",
      price: typeof item.price === "number" && Number.isFinite(item.price) ? item.price : 0,
      quantity: item.quantity,
      is_group_product: item.type === "group_product" || (item.componentCount ?? 0) > 0,
    };

    const warrantyItem = getLinkedWarrantyItem(items, item);
    const warrantyOptionId = warrantyItem?.warranty?.optionId;

    if (!warrantyItem || typeof warrantyOptionId !== "number" || !Number.isFinite(warrantyOptionId)) {
      return [orderItem];
    }

    const warrantyPrice =
      typeof warrantyItem.price === "number" && Number.isFinite(warrantyItem.price) ? warrantyItem.price : 0;
    const warrantyDurationMonths =
      typeof warrantyItem.warranty?.durationMonths === "number" && Number.isFinite(warrantyItem.warranty.durationMonths)
        ? warrantyItem.warranty.durationMonths
        : null;

    return [
      {
        ...orderItem,
        warranty_option_id: warrantyOptionId,
        extended_warranty_id: warrantyOptionId,
        extended_warranty_name: warrantyItem.name,
        extended_warranty_sku: warrantyItem.sku,
        extended_warranty_price: warrantyPrice,
        extended_warranty_quantity: warrantyItem.quantity,
        extended_warranty_duration_months: warrantyDurationMonths,
        extended_warranty: {
          option_id: warrantyOptionId,
          name: warrantyItem.name,
          sku: warrantyItem.sku,
          price: warrantyPrice,
          quantity: warrantyItem.quantity,
          duration_months: warrantyDurationMonths,
          parent_sku: warrantyItem.warranty?.parentSku ?? item.sku ?? null,
          parent_name: warrantyItem.warranty?.parentName ?? item.name ?? null,
        },
      },
    ];
  });
}

function CheckoutShell({
  items,
  totalAmount,
  removeItem,
  incrementItemQuantity,
  decrementItemQuantity,
  handleSubmit,
  form,
  errors,
  handleChange,
  isPending,
  isLoggedIn,
  onLoginSuccess,
  onAddressSelect,
  savedShippingAddresses,
  selectedSavedShippingAddressId,
  onSavedShippingAddressSelect,
  isLoadingSavedShippingAddresses,
  savedShippingAddressesError,
  savedBillingAddresses = [],
  selectedSavedBillingAddressId = null,
  onSavedBillingAddressSelect = () => {},
  step,
  setStep,
  isEditingBilling,
  startEditingBilling,
  cancelEditingBilling,
  saveEditingBilling,
  countriesList,
  onAddressAdded,
}: {
  items: CartItem[];
  totalAmount: number;
  removeItem: (key: string) => void;
  incrementItemQuantity: (key: string) => void;
  decrementItemQuantity: (key: string) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  form: CheckoutFormState;
  errors: Partial<Record<keyof CheckoutFormState, string>>;
  handleChange: (field: keyof CheckoutFormState, value: string | boolean) => void;
  isPending: boolean;
  isLoggedIn: boolean;
  onLoginSuccess: () => void;
  onAddressSelect: (address: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  }, isShipping?: boolean) => void;
  savedShippingAddresses: CheckoutSavedAddress[];
  selectedSavedShippingAddressId: string | null;
  onSavedShippingAddressSelect: (address: CheckoutSavedAddress) => void;
  isLoadingSavedShippingAddresses: boolean;
  savedShippingAddressesError: string;
  savedBillingAddresses?: CheckoutSavedAddress[];
  selectedSavedBillingAddressId?: string | null;
  onSavedBillingAddressSelect?: (address: CheckoutSavedAddress) => void;
  step: 1 | 2 | 3;
  setStep: (step: 1 | 2 | 3) => void;
  isEditingBilling: boolean;
  startEditingBilling: () => void;
  cancelEditingBilling: () => void;
  saveEditingBilling: () => void;
  countriesList: any[];
  onAddressAdded: (savedAddressId?: string | number, type?: 'billing' | 'shipping') => Promise<void>;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { shippingRules, defaultRule } = useShippingRules();
  const selectedCountry = form.sameAsBilling ? form.country : form.shippingCountry;
  const selectedRule = shippingRules.find(r => r.country_name === selectedCountry) ?? defaultRule;

  const selectedBillingCountryObj = countriesList.find(
    (c: any) =>
      c.name.toLowerCase() === form.country.toLowerCase() ||
      c.id.toLowerCase() === form.country.toLowerCase()
  );
  const billingProvinces = selectedBillingCountryObj?.provinces || [];

  const selectedBillingProvinceValue = useMemo(() => {
    if (!form.state) return '';
    const match = billingProvinces.find(
      (p: any) =>
        String(p.id) === String(form.state) ||
        p.name.toLowerCase() === form.state.toLowerCase()
    );
    return match ? match.name : form.state;
  }, [form.state, billingProvinces]);

  const shippingAmount = useMemo(() => {
    if (items.length === 0) return 0;
    if (!selectedRule) return DELIVERY_FEE;
    return totalAmount >= selectedRule.free_shipping_threshold ? 0 : selectedRule.shipping_cost;
  }, [items.length, totalAmount, selectedRule]);
  const paymentFee = useMemo(() => (form.paymentMethod === "creditcard" ? totalAmount * 0.025 : 0), [totalAmount, form.paymentMethod]);
  const taxAmount = useMemo(() => (totalAmount + shippingAmount + paymentFee) * 0.21, [totalAmount, shippingAmount, paymentFee]);
  const finalTotal = useMemo(() => totalAmount + shippingAmount + paymentFee + taxAmount, [totalAmount, shippingAmount, paymentFee, taxAmount]);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [isRegisterPopupOpen, setIsRegisterPopupOpen] = useState(false);
  const [isAddAddressPopupOpen, setIsAddAddressPopupOpen] = useState(false);
  const [addressPopupType, setAddressPopupType] = useState<'billing' | 'shipping'>('shipping');
  const [editingAddress, setEditingAddress] = useState<CheckoutSavedAddress | null>(null);
  const showBillingEditForm = !isLoggedIn || isEditingBilling || savedBillingAddresses.length === 0;

  const breadcrumbs = [
    { label: t('checkout.title') }
  ];

  return (
    <div className="px-4 md:px-8 lg:px-10 py-12 min-h-screen" style={{
      background: "radial-gradient(circle at 15% 15%, rgba(241, 136, 0, 0.08) 0%, rgba(250, 251, 253, 0) 55%), var(--surface)"
    }}>
      <div className="max-w-360 mx-auto w-full">
        
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} className="mb-8" />
        
        {/* Page Title */}
        {items.length > 0 && (
          <h1 className="text-[32px] font-semibold text-ink mb-10 text-center">
            {t('checkout.title')}
          </h1>
        )}

        {items.length === 0 ? (
          <div className="w-full flex flex-col justify-start items-center gap-10 py-12">
            <div className="w-full flex flex-col justify-start items-center gap-4">
              <h2 className="w-full text-center text-ink text-2xl md:text-[32px] lg:text-[40px] font-bold leading-tight md:leading-[48px]">
                {t('checkout.emptyCart')}
              </h2>
              <p className="w-full max-w-[800px] text-center text-copy text-lg font-normal leading-[26px]">
                {t('checkout.emptyCartDescription')}
              </p>
              <Link
                href={localePath("/product", locale)}
                className="h-[52px] px-[30px] py-4 bg-brand hover:bg-[#e07d00] transition-colors rounded-[50px] flex justify-center items-center gap-2.5 text-center text-white text-lg font-semibold leading-6 mt-2"
              >
                {t('common.browseProducts')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          
          {/* Main Checkout Panel */}
          <div className="w-full flex-1 bg-white shadow-[2px_4px_20px_rgba(109,109,120,0.10)] rounded-xl border border-line flex flex-col overflow-hidden">
            
            {/* Step Progress Bar */}
            <div className="w-full px-4 py-4 bg-white border-b border-line flex justify-center">
              <div className="w-full max-w-lg relative flex justify-between items-start">
                {/* Progress Track */}
                <div className="absolute h-[2px] bg-line rounded-[5px] left-[16.66%] right-[16.66%] top-4 -translate-y-1/2 -z-0">
                  <div
                    className="h-full bg-brand rounded-[5px] transition-all duration-300"
                    style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                  />
                </div>
                
                {/* Step 1: Billing Address */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="relative z-10 flex-1 flex flex-col items-center gap-2 focus:outline-none"
                >
                  <div className={`w-8 h-8 rounded-full justify-center items-center inline-flex transition-all shrink-0 ${
                    step > 1 ? "bg-brand" : "bg-white border-2 border-brand"
                  }`}>
                    {step > 1 ? (
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <span className="text-brand text-[18px] font-normal">1</span>
                    )}
                  </div>
                  <div className={`text-[12px] sm:text-[14px] font-bold text-center px-1 leading-tight ${
                    step === 1 ? "text-brand" : "text-subtle"
                  }`}>
                    {t('checkout.billingAddress')}
                  </div>
                </button>

                {/* Step 2: Shipping Address */}
                <button
                  type="button"
                  onClick={() => step > 1 && setStep(2)}
                  disabled={step < 2}
                  className="relative z-10 flex-1 flex flex-col items-center gap-2 focus:outline-none disabled:cursor-not-allowed"
                >
                  <div className={`w-8 h-8 rounded-full justify-center items-center inline-flex transition-all shrink-0 ${
                    step > 2
                      ? "bg-brand"
                      : step === 2
                        ? "bg-white border-2 border-brand"
                        : "bg-[#F3F4F6]"
                  }`}>
                    {step > 2 ? (
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <span className={`text-[18px] font-normal ${
                        step === 2 ? "text-brand" : "text-subtle"
                      }`}>2</span>
                    )}
                  </div>
                  <div className={`text-[12px] sm:text-[14px] font-bold text-center px-1 leading-tight ${
                    step === 2 ? "text-brand" : "text-subtle"
                  }`}>
                    {t('checkout.shippingAddress')}
                  </div>
                </button>

                {/* Step 3: Payment Method */}
                <div className="relative z-10 flex-1 flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full justify-center items-center inline-flex transition-all shrink-0 ${
                    step === 3 ? "bg-white border-2 border-brand" : "bg-[#F3F4F6]"
                  }`}>
                    <span className={`text-[18px] font-normal ${
                      step === 3 ? "text-brand" : "text-subtle"
                    }`}>3</span>
                  </div>
                  <div className={`text-[12px] sm:text-[14px] font-bold text-center px-1 leading-tight ${
                    step === 3 ? "text-brand" : "text-subtle"
                  }`}>
                    {t('checkout.paymentMethod')}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <form id="checkout-form" onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
                
                {/* LOGIN SECTION FOR GUESTS */}
                {step === 1 && !isLoggedIn && (
                  <div className="rounded-2xl border border-amber-100 bg-brand-soft/70 p-5 mb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1 max-w-xl">
                        <h2 className="text-lg font-bold text-neutral-800">{t('checkout.loginTitle')}</h2>
                        <p className="text-sm leading-5 text-neutral-600">{t('checkout.loginDescription')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsLoginPopupOpen(true)}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white transition-colors hover:bg-brand-hover shrink-0 self-start md:self-auto"
                      >
                        {t('checkout.loginButton')}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 1: BILLING ADDRESS */}
                {step === 1 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-ink text-[28px] font-bold leading-[33.6px]">{t('checkout.billingAddress')}</h2>
                      <p className="text-copy text-[16px] font-normal leading-[20.8px]">
                        {t('checkout.billingDescription')}
                      </p>
                    </div>
                    <div className="h-px bg-line w-full" />

                    {/* Saved Billing Addresses section for logged in user */}
                    {isLoggedIn && (
                      <div className="flex flex-col gap-4">
                        {isLoadingSavedShippingAddresses ? (
                          <div className="w-full p-4 rounded-xl border border-[#DDE1EA] bg-slate-50 text-copy text-[14px] font-semibold">
                            {t('account.loadingAddresses')}
                          </div>
                        ) : savedBillingAddresses.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3">
                            {savedBillingAddresses.map((address) => {
                              const isSelected = String(address.id) === String(selectedSavedBillingAddressId);
                              const addressLine = [address.address1, address.address2, address.city, address.postcode, address.country]
                                .filter(Boolean)
                                .join(', ');

                              return (
                                <label
                                  key={address.id}
                                  className={`w-full p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                                    isSelected
                                      ? "border-brand bg-[rgba(241,136,0,0.02)] shadow-[0_0_0_1px_rgba(241,136,0,0.20)]"
                                      : "border-[#E0E7EE] bg-white hover:border-brand/30"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isSelected}
                                    onChange={() => onSavedBillingAddressSelect(address)}
                                  />
                                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                    isSelected ? "bg-brand border border-brand" : "border border-[#CAD3DF] bg-white"
                                  }`}>
                                    {isSelected && (
                                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1.5 4L4 6.5L8.5 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="text-ink text-[17px] font-bold leading-5 break-words">
                                        {address.name || `${address.firstname} ${address.lastname}`.trim() || t('checkout.billingAddress')}
                                      </span>
                                      {isSelected && (
                                        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[12px] font-bold text-brand">
                                          {t('common.selected')}
                                        </span>
                                      )}
                                    </div>
                                    {(address.email || address.phone) && (
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-copy text-[14px] font-normal leading-5">
                                        {address.email && <span className="break-all">{address.email}</span>}
                                        {address.email && address.phone && <span className="text-[#C8D2DD]">|</span>}
                                        {address.phone && <span>{address.phone}</span>}
                                      </div>
                                    )}
                                    <div className="flex items-end justify-between gap-2">
                                      <p className="text-copy text-[15px] font-normal leading-5 flex-1">
                                        {addressLine || '-'}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setEditingAddress(address);
                                          setAddressPopupType('billing');
                                          setIsAddAddressPopupOpen(true);
                                        }}
                                        className="inline-flex justify-start items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer shrink-0 ml-auto"
                                      >
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <mask id={`mask0_edit_billing_${address.id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20" style={{ maskType: 'alpha' }}>
                                            <rect width="20" height="20" fill="#D9D9D9"></rect>
                                          </mask>
                                          <g mask={`url(#mask0_edit_billing_${address.id})`}>
                                            <path d="M3.33268 20.0052C2.87435 20.0052 2.48199 19.842 2.1556 19.5156C1.82921 19.1892 1.66602 18.7969 1.66602 18.3385C1.66602 17.8802 1.82921 17.4878 2.1556 17.1615C2.48199 16.8351 2.87435 16.6719 3.33268 16.6719H16.666C17.1243 16.6719 17.5167 16.8351 17.8431 17.1615C18.1695 17.4878 18.3327 17.8802 18.3327 18.3385C18.3327 18.7969 18.1695 19.1892 17.8431 19.5156C17.5167 19.842 17.1243 20.0052 16.666 20.0052H3.33268ZM4.99935 13.3385H6.16602L12.666 6.85938L11.4785 5.67188L4.99935 12.1719V13.3385ZM3.33268 14.1719V11.8177C3.33268 11.7066 3.35352 11.599 3.39518 11.4948C3.43685 11.3906 3.49935 11.2969 3.58268 11.2135L12.666 2.15104C12.8188 1.99826 12.9959 1.88021 13.1973 1.79688C13.3987 1.71354 13.6105 1.67188 13.8327 1.67188C14.0549 1.67188 14.2702 1.71354 14.4785 1.79688C14.6868 1.88021 14.8743 2.00521 15.041 2.17188L16.1868 3.33854C16.3535 3.49132 16.475 3.67188 16.5514 3.88021C16.6278 4.08854 16.666 4.30382 16.666 4.52604C16.666 4.73438 16.6278 4.93924 16.5514 5.14063C16.475 5.34201 16.5514 5.52604 16.1868 5.69271L7.12435 14.7552C7.04101 14.8385 6.94726 14.901 6.8431 14.9427C6.73893 14.9844 6.63129 15.0052 6.52018 15.0052H4.16602C3.9299 15.0052 3.73199 14.9253 3.57227 14.7656C3.41254 14.6059 3.33268 14.408 3.33268 14.1719Z" fill="var(--brand)"></path>
                                          </g>
                                        </svg>
                                        <div className="text-brand text-base font-normal leading-5">Edit</div>
                                      </button>
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddress(null);
                            setAddressPopupType('billing');
                            setIsAddAddressPopupOpen(true);
                          }}
                          className="w-fit min-w-[170px] h-[52px] px-8 rounded-full border-[1.5px] border-[#F18800] inline-flex justify-center items-center gap-2 hover:bg-orange-50/50 transition-all focus:outline-none"
                        >
                          <span className="text-center font-['Segoe_UI'] font-medium leading-6">
                            <span className="text-[#F18800] text-[22px] align-middle mr-1">+</span>
                            <span className="text-[#F18800] text-[18px] align-middle">
                              {t('account.addNewAddress')}
                            </span>
                          </span>
                        </button>
                      </div>
                    )}

                    {showBillingEditForm && (
                      <div className="w-full p-4 bg-[rgba(241,136,0,0.02)] rounded-xl border-[1.5px] border-[#F18800] flex flex-col gap-6">
                        {/* Address Autocomplete Search (Billing) */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[18px] font-bold text-ink">{t('checkout.quickAddressSearch')}</span>
                          <AddressAutocomplete
                            value={form.streetAddress}
                            onChange={(val) => handleChange("streetAddress", val)}
                            onAddressSelect={(addr) => onAddressSelect(addr, false)}
                            className={inputClasses(Boolean(errors.streetAddress))}
                            placeholder={t('checkout.quickAddressSearch')}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <span className="text-[18px] font-bold text-ink">{t('checkout.companyName')}</span>
                            <input
                              type="text"
                              value={form.companyName}
                              disabled={isLoggedIn && !isEditingBilling}
                              onChange={(e) => handleChange("companyName", e.target.value)}
                              placeholder={t('checkout.companyNamePlaceholder')}
                              className={inputClasses(Boolean(errors.companyName))}
                            />
                            {errors.companyName && <span className="text-xs text-red-500">{errors.companyName}</span>}
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className="text-[18px] font-bold text-ink">{t('checkout.vatNumber')}</span>
                            <input
                              type="text"
                              value={form.vatNumber}
                              disabled={isLoggedIn && !isEditingBilling}
                              onChange={(e) => handleChange("vatNumber", e.target.value)}
                              placeholder={t('checkout.vatNumberPlaceholder')}
                              className={inputClasses(Boolean(errors.vatNumber))}
                            />
                            {errors.vatNumber && <span className="text-xs text-red-500">{errors.vatNumber}</span>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <span className="text-[18px] font-bold text-ink">{t('checkout.firstName')} *</span>
                            <input
                              type="text"
                              value={form.firstName}
                              disabled={isLoggedIn && !isEditingBilling}
                              onChange={(e) => handleChange("firstName", e.target.value)}
                              placeholder={t('checkout.firstNamePlaceholder')}
                              className={inputClasses(Boolean(errors.firstName))}
                            />
                            {errors.firstName && <span className="text-xs text-red-500">{errors.firstName}</span>}
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className="text-[18px] font-bold text-ink">{t('checkout.lastName')} *</span>
                            <input
                              type="text"
                              value={form.lastName}
                              disabled={isLoggedIn && !isEditingBilling}
                              onChange={(e) => handleChange("lastName", e.target.value)}
                              placeholder={t('checkout.lastNamePlaceholder')}
                              className={inputClasses(Boolean(errors.lastName))}
                            />
                            {errors.lastName && <span className="text-xs text-red-500">{errors.lastName}</span>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <span className="text-[18px] font-bold text-ink">{t('checkout.email')} *</span>
                            <input
                              type="email"
                              value={form.email}
                              disabled={isLoggedIn && !isEditingBilling}
                              onChange={(e) => handleChange("email", e.target.value)}
                              placeholder={t('checkout.emailPlaceholder')}
                              className={inputClasses(Boolean(errors.email))}
                            />
                            {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className="text-[18px] font-bold text-ink">{t('checkout.mobileNumber')} *</span>
                            <input
                              type="tel"
                              value={form.mobileNumber}
                              disabled={isLoggedIn && !isEditingBilling}
                              onChange={(e) => handleChange("mobileNumber", e.target.value)}
                              placeholder={t('checkout.mobileNumberPlaceholder')}
                              className={inputClasses(Boolean(errors.mobileNumber))}
                            />
                            {errors.mobileNumber && <span className="text-xs text-red-500">{errors.mobileNumber}</span>}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-[18px] font-bold text-ink">{t('checkout.country')}</span>
                          <div className="relative">
                            <select
                              value={form.country}
                              disabled={isLoggedIn && !isEditingBilling}
                              onChange={(e) => handleChange("country", e.target.value)}
                              className={`${inputClasses()} appearance-none pr-10`}
                            >
                              {countriesList.length > 0 ? (
                                countriesList.map((c: any) => (
                                  <option key={c.id} value={c.name}>
                                    {c.name}
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="Netherlands">{t('countries.netherlands')}</option>
                                  <option value="Belgium">{t('countries.belgium')}</option>
                                  <option value="Germany">{t('countries.germany')}</option>
                                </>
                              )}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6L8 10L12 6" stroke="var(--subtle)" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-[18px] font-bold text-ink">{t('checkout.streetAddress')} *</span>
                          <input
                            type="text"
                            value={form.streetAddress}
                            disabled={isLoggedIn && !isEditingBilling}
                            onChange={(e) => handleChange("streetAddress", e.target.value)}
                            placeholder={t('checkout.streetAddressPlaceholder')}
                            className={inputClasses(Boolean(errors.streetAddress))}
                          />
                          {errors.streetAddress && <span className="text-xs text-red-500">{errors.streetAddress}</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-[18px] font-bold text-ink">{t('checkout.postcode')} *</span>
                          <input
                            type="text"
                            value={form.postcode}
                            disabled={isLoggedIn && !isEditingBilling}
                            onChange={(e) => handleChange("postcode", e.target.value)}
                            placeholder={t('checkout.postcodePlaceholder')}
                            className={inputClasses(Boolean(errors.postcode))}
                          />
                          {errors.postcode && <span className="text-xs text-red-500">{errors.postcode}</span>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-[18px] font-bold text-ink">{t('checkout.city')} *</span>
                          <input
                            type="text"
                            value={form.city}
                            disabled={isLoggedIn && !isEditingBilling}
                            onChange={(e) => handleChange("city", e.target.value)}
                            placeholder={t('checkout.cityPlaceholder')}
                            className={inputClasses(Boolean(errors.city))}
                          />
                          {errors.city && <span className="text-xs text-red-500">{errors.city}</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-[18px] font-bold text-ink">{t('checkout.state')}</span>
                          {billingProvinces.length > 0 ? (
                            <div className="relative">
                              <select
                                value={selectedBillingProvinceValue}
                                disabled={isLoggedIn && !isEditingBilling}
                                onChange={(e) => handleChange("state", e.target.value)}
                                className={`${inputClasses(Boolean(errors.state))} appearance-none pr-10`}
                              >
                                <option value="">-- Select Province --</option>
                                {billingProvinces.map((p: any) => (
                                  <option key={p.id} value={p.name}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M4 6L8 10L12 6" stroke="var(--subtle)" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={form.state}
                              disabled={isLoggedIn && !isEditingBilling}
                              onChange={(e) => handleChange("state", e.target.value)}
                              placeholder={t('checkout.statePlaceholder')}
                              className={inputClasses(Boolean(errors.state))}
                            />
                          )}
                          {errors.state && <span className="text-xs text-red-500">{errors.state}</span>}
                        </div>
                      </div>

                      {isLoggedIn && (
                        isEditingBilling ? (
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={saveEditingBilling}
                              className="w-[120px] h-[52px] bg-[#F18800] text-white rounded-full font-medium text-[18px] hover:opacity-90 transition-all flex items-center justify-center shrink-0"
                            >
                              {t('checkout.save')}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditingBilling}
                              className="w-[120px] h-[52px] rounded-full border border-[rgba(0,0,0,0.10)] text-[#444444] font-medium text-[18px] hover:bg-slate-50 transition-all flex items-center justify-center shrink-0"
                            >
                              {t('checkout.cancel')}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={startEditingBilling}
                            className="w-[120px] h-[52px] rounded-full border-[1.5px] border-[#F18800] inline-flex items-center justify-center gap-2 hover:bg-orange-50/50 transition-all focus:outline-none shrink-0"
                          >
                            <span className="text-center text-[#F18800] text-[18px] font-bold leading-6 font-['Segoe_UI'] break-words">
                              {t('checkout.edit')}
                            </span>
                          </button>
                        )
                      )}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: SHIPPING ADDRESS */}
                {step === 2 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-ink text-[28px] font-bold leading-[33.60px]">
                        {t('checkout.shippingAddress')}
                      </h2>
                      <p className="text-copy text-[16px] font-normal leading-[20.80px]">
                        {t('checkout.deliveryInfoDesc')}
                      </p>
                    </div>
                    <div className="h-px bg-line w-full" />

                     {/* Toggle Same as Billing (Custom styled checkbox container) - only shown when user has no saved shipping addresses */}
                    {savedShippingAddresses.length === 0 && (
                      <label className="w-full p-4 rounded-xl border border-[#DDE1EA] justify-start items-start gap-3 inline-flex cursor-pointer hover:bg-slate-50 transition-all select-none">
                        <input
                          type="checkbox"
                          checked={form.sameAsBilling}
                          onChange={(e) => handleChange("sameAsBilling", e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-[22px] h-[22px] rounded-[2px] flex items-center justify-center shrink-0 transition-all ${
                          form.sameAsBilling ? "bg-brand border-[1.5px] border-brand" : "border-[1.5px] border-[#BBC0CC]"
                        }`}>
                          {form.sameAsBilling && (
                            <svg width="12" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-col justify-center items-start gap-[12px] inline-flex">
                          <div className="text-ink text-[18px] font-bold leading-[20px]">
                            {t('checkout.sameAsBilling')}
                          </div>
                          <div className="text-copy text-[14px] font-normal leading-[18.20px]">
                            {t('checkout.sameAsBillingSub')}
                          </div>
                        </div>
                      </label>
                    )}

                    {/* Info Warning Banner */}
                    {!isLoggedIn && (
                      <div className="w-full p-4 bg-gradient-to-br from-[var(--brand-soft)] to-white rounded-xl border border-[#E9CA9E] justify-start items-center gap-2 inline-flex">
                        <div className="flex-1 flex-col justify-center items-start gap-2 inline-flex">
                          <div className="justify-start items-start gap-2 inline-flex">
                            <div className="w-5 h-5 relative flex items-center justify-center">
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="2" width="16" height="16" rx="8" stroke="var(--ink)" strokeWidth="1.5"/>
                                <path d="M10 6V11" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round"/>
                                <circle cx="10" cy="14" r="1" fill="var(--ink)"/>
                              </svg>
                            </div>
                            <div className="text-ink text-[18px] font-bold leading-[20px]">
                              {t('checkout.multipleShippingTitle')}
                            </div>
                          </div>
                          <div className="self-stretch text-copy text-[14px] font-normal leading-[18.20px]">
                            {t.rich('checkout.multipleShippingDesc', {
                              registerLink: (chunks) => (
                                <button
                                  type="button"
                                  onClick={() => setIsRegisterPopupOpen(true)}
                                  className="text-brand underline hover:text-brand-hover cursor-pointer bg-transparent border-none p-0 inline align-baseline font-semibold"
                                >
                                  {chunks}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {(!form.sameAsBilling || savedShippingAddresses.length > 0) && (
                      <div className="flex flex-col gap-4 mt-2">
                        {isLoggedIn && (
                          <div className="flex flex-col gap-3">


                            {isLoadingSavedShippingAddresses ? (
                              <div className="w-full p-4 rounded-xl border border-[#DDE1EA] bg-slate-50 text-copy text-[14px] font-semibold">
                                {t('account.loadingAddresses')}
                              </div>
                            ) : savedShippingAddressesError ? (
                              <div className="w-full p-4 rounded-xl border border-red-100 bg-red-50 text-red-600 text-[14px] font-semibold">
                                {savedShippingAddressesError}
                              </div>
                            ) : savedShippingAddresses.length > 0 ? (
                              <div className="grid grid-cols-1 gap-3">
                                {savedShippingAddresses.map((address) => {
                                  const isSelected = String(address.id) === String(selectedSavedShippingAddressId);
                                  const addressLine = [address.address1, address.address2, address.city, address.postcode, address.country]
                                    .filter(Boolean)
                                    .join(', ');

                                  return (
                                    <label
                                      key={address.id}
                                      className={`w-full p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                                        isSelected
                                          ? "border-brand bg-[rgba(241,136,0,0.02)] shadow-[0_0_0_1px_rgba(241,136,0,0.20)]"
                                          : "border-[#E0E7EE] bg-white hover:border-brand/30"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={isSelected}
                                        onChange={() => onSavedShippingAddressSelect(address)}
                                      />
                                      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                        isSelected ? "bg-brand border border-brand" : "border border-[#CAD3DF] bg-white"
                                      }`}>
                                        {isSelected && (
                                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1.5 4L4 6.5L8.5 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                      </div>
                                       <div className="flex min-w-0 flex-1 flex-col gap-2">
                                         <div className="flex items-start justify-between gap-2">
                                           <span className="text-ink text-[17px] font-bold leading-5 break-words">
                                             {address.name || `${address.firstname} ${address.lastname}`.trim() || t('checkout.shippingAddress')}
                                           </span>
                                           {isSelected && (
                                             <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[12px] font-bold text-brand">
                                               {t('common.selected')}
                                             </span>
                                           )}
                                         </div>
                                         {(address.email || address.phone) && (
                                           <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-copy text-[14px] font-normal leading-5">
                                             {address.email && <span className="break-all">{address.email}</span>}
                                             {address.email && address.phone && <span className="text-[#C8D2DD]">|</span>}
                                             {address.phone && <span>{address.phone}</span>}
                                           </div>
                                         )}
                                         <div className="flex items-end justify-between gap-2">
                                           <p className="text-copy text-[15px] font-normal leading-5 flex-1">
                                             {addressLine || '-'}
                                           </p>
                                           <button
                                             type="button"
                                             onClick={(e) => {
                                               e.preventDefault();
                                               e.stopPropagation();
                                               setEditingAddress(address);
                                               setIsAddAddressPopupOpen(true);
                                             }}
                                             className="inline-flex justify-start items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer shrink-0 ml-auto"
                                           >
                                             <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                               <mask id={`mask0_edit_${address.id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20" style={{ maskType: 'alpha' }}>
                                                 <rect width="20" height="20" fill="#D9D9D9"></rect>
                                               </mask>
                                               <g mask={`url(#mask0_edit_${address.id})`}>
                                                 <path d="M3.33268 20.0052C2.87435 20.0052 2.48199 19.842 2.1556 19.5156C1.82921 19.1892 1.66602 18.7969 1.66602 18.3385C1.66602 17.8802 1.82921 17.4878 2.1556 17.1615C2.48199 16.8351 2.87435 16.6719 3.33268 16.6719H16.666C17.1243 16.6719 17.5167 16.8351 17.8431 17.1615C18.1695 17.4878 18.3327 17.8802 18.3327 18.3385C18.3327 18.7969 18.1695 19.1892 17.8431 19.5156C17.5167 19.842 17.1243 20.0052 16.666 20.0052H3.33268ZM4.99935 13.3385H6.16602L12.666 6.85938L11.4785 5.67188L4.99935 12.1719V13.3385ZM3.33268 14.1719V11.8177C3.33268 11.7066 3.35352 11.599 3.39518 11.4948C3.43685 11.3906 3.49935 11.2969 3.58268 11.2135L12.666 2.15104C12.8188 1.99826 12.9959 1.88021 13.1973 1.79688C13.3987 1.71354 13.6105 1.67188 13.8327 1.67188C14.0549 1.67188 14.2702 1.71354 14.4785 1.79688C14.6868 1.88021 14.8743 2.00521 15.041 2.17188L16.1868 3.33854C16.3535 3.49132 16.475 3.67188 16.5514 3.88021C16.6278 4.08854 16.666 4.30382 16.666 4.52604C16.666 4.73438 16.6278 4.93924 16.5514 5.14063C16.475 5.34201 16.3535 5.52604 16.1868 5.69271L7.12435 14.7552C7.04101 14.8385 6.94726 14.901 6.8431 14.9427C6.73893 14.9844 6.63129 15.0052 6.52018 15.0052H4.16602C3.9299 15.0052 3.73199 14.9253 3.57227 14.7656C3.41254 14.6059 3.33268 14.408 3.33268 14.1719Z" fill="var(--brand)"></path>
                                               </g>
                                             </svg>
                                             <div className="text-brand text-base font-normal leading-5">Edit</div>
                                           </button>
                                         </div>
                                       </div>
                                     </label>
                                   );
                                })}
                              </div>
                            ) : (
                              <div className="w-full p-4 rounded-xl border border-[#DDE1EA] bg-slate-50 text-copy text-[14px] font-semibold">
                                {t('account.noShippingAddresses')}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setEditingAddress(null);
                                setIsAddAddressPopupOpen(true);
                              }}
                              className="w-fit min-w-[170px] h-[52px] px-8 rounded-full border-[1.5px] border-[#F18800] inline-flex justify-center items-center gap-2 hover:bg-orange-50/50 transition-all focus:outline-none mt-2"
                            >
                              <span className="text-center font-['Segoe_UI'] font-medium leading-6">
                                <span className="text-[#F18800] text-[22px] align-middle mr-1">+</span>
                                <span className="text-[#F18800] text-[18px] align-middle">{t('account.addNewAddress')}</span>
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: PAYMENT METHOD */}
                {step === 3 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-ink text-[28px] font-bold leading-[33.6px]">{t('checkout.paymentMethod')}</h2>
                      <p className="text-copy text-[16px] font-normal leading-[20.8px]">
                        {t('checkout.paymentMethodDesc')}
                      </p>
                    </div>
                    <div className="h-px bg-line w-full" />

                    <div className="flex flex-col gap-4">
                      {/* iDEAL */}
                      <label
                        className={`flex cursor-pointer items-center justify-between p-4 rounded-xl border transition-all ${
                          form.paymentMethod === "ideal"
                            ? "border-brand bg-[rgba(241,136,0,0.02)]"
                            : "border-[#E0E7EE] bg-white hover:border-brand/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          className="sr-only"
                          checked={form.paymentMethod === "ideal"}
                          onChange={() => handleChange("paymentMethod", "ideal")}
                        />
                        <div className="flex items-center gap-[15px]">
                          {form.paymentMethod === "ideal" ? (
                            <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0">
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-[#CAD3DF] shrink-0" />
                          )}
                          <div className="flex items-center gap-[10px]">
                            <img className="w-[32px] h-[28px] object-contain" src="/ideal-logo.png" alt="iDEAL" />
                            <span className="text-ink text-lg sm:text-[22px] font-bold leading-6 sm:leading-[28px]">{t('checkout.ideal')}</span>
                          </div>
                        </div>
                      </label>

                      {/* Credit Card */}
                      <label
                        className={`flex cursor-pointer items-center justify-between p-4 rounded-xl border transition-all ${
                          form.paymentMethod === "creditcard"
                            ? "border-brand bg-[rgba(241,136,0,0.02)]"
                            : "border-[#E0E7EE] bg-white hover:border-brand/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          className="sr-only"
                          checked={form.paymentMethod === "creditcard"}
                          onChange={() => handleChange("paymentMethod", "creditcard")}
                        />
                        <div className="flex items-center gap-[15px]">
                          {form.paymentMethod === "creditcard" ? (
                            <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0">
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-[#CAD3DF] shrink-0" />
                          )}
                          <div className="flex items-center gap-[10px]">
                            <img className="w-[33px] h-[28px] object-contain" src="/creditcard-logo.svg" alt="Credit Card" />
                            <div className="flex items-baseline gap-2">
                              <span className="text-ink text-lg sm:text-[22px] font-bold leading-6 sm:leading-[28px]">{t('checkout.creditCard')}</span>
                              <span className="text-xs text-brand font-medium">{t('checkout.creditCardFee')}</span>
                            </div>
                          </div>
                        </div>
                      </label>

                      {/* Bancontact */}
                      <label
                        className={`flex cursor-pointer items-center justify-between p-4 rounded-xl border transition-all ${
                          form.paymentMethod === "bancontact"
                            ? "border-brand bg-[rgba(241,136,0,0.02)]"
                            : "border-[#E0E7EE] bg-white hover:border-brand/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          className="sr-only"
                          checked={form.paymentMethod === "bancontact"}
                          onChange={() => handleChange("paymentMethod", "bancontact")}
                        />
                        <div className="flex items-center gap-[15px]">
                          {form.paymentMethod === "bancontact" ? (
                            <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0">
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-[#CAD3DF] shrink-0" />
                          )}
                          <div className="flex items-center gap-[10px]">
                            <img className="w-[33px] h-[28px] object-contain rounded" src="/bancontact-logo.webp" alt="Bancontact" />
                            <span className="text-ink text-lg sm:text-[22px] font-bold leading-6 sm:leading-[28px]">{t('checkout.bancontact')}</span>
                          </div>
                        </div>
                      </label>

                      {/* Bank Transfer (Invoice) */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                              isLoggedIn
                                ? form.paymentMethod === "banktransfer"
                                  ? "cursor-pointer border-brand bg-[rgba(241,136,0,0.02)]"
                                  : "cursor-pointer border-[#E0E7EE] bg-white hover:border-brand/30"
                                : "cursor-not-allowed border-[#E0E7EE] bg-slate-50 opacity-60"
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              className="sr-only"
                              checked={form.paymentMethod === "banktransfer"}
                              disabled={!isLoggedIn}
                              onChange={() => {
                                if (isLoggedIn) {
                                  handleChange("paymentMethod", "banktransfer");
                                }
                              }}
                            />
                            <div className="flex items-center gap-[15px]">
                              {form.paymentMethod === "banktransfer" ? (
                                <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0">
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-[#CAD3DF] shrink-0" />
                              )}
                              <div className="flex items-center gap-[10px]">
                                <div className="w-[33px] h-[28px] flex items-center justify-center text-neutral-600 shrink-0">
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                  </svg>
                                </div>
                                <div className="flex flex-col">
                                  <span className={`text-lg sm:text-[22px] font-bold leading-6 sm:leading-[28px] ${isLoggedIn ? "text-ink" : "text-neutral-500"}`}>
                                    {t('checkout.invoice')}
                                  </span>
                                  {!isLoggedIn && (
                                    <span className="text-xs font-semibold leading-4 text-neutral-500">
                                      {t('checkout.invoiceAccountOnly')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </label>
                        </TooltipTrigger>
                        <TooltipContent className="p-4 bg-white border border-slate-200 shadow-xl text-neutral-800 rounded-2xl max-w-[300px]">
                          <p className="font-medium text-sm">
                            {isLoggedIn ? t('checkout.bankTransferTooltip') : t('checkout.invoiceAccountOnly')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {errors.paymentMethod && <p className="text-sm text-red-500 font-medium">{errors.paymentMethod}</p>}
                  </div>
                )}

                  {!isEditingBilling && (
                    <div className="flex items-center gap-4 pt-4 border-t border-line">
                      {step > 1 && (
                        <button
                          type="button"
                          onClick={() => setStep((step - 1) as 1 | 2)}
                          className="w-[120px] sm:w-[160px] h-[52px] rounded-full border border-[rgba(0,0,0,0.10)] text-copy font-medium text-base sm:text-[18px] hover:bg-slate-50 transition-colors flex items-center justify-center shrink-0"
                        >
                          {t('common.previous')}
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 h-[52px] bg-brand text-white rounded-full font-medium text-base sm:text-[18px] flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-3 min-w-0"
                      >
                        {isPending ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('checkout.calculating')}
                          </>
                        ) : step < 3 ? (
                          t('common.next')
                        ) : (
                          t('checkout.makePayment', { amount: formatEuro(finalTotal) })
                        )}
                      </button>
                    </div>
                  )}
              </form>
            </div>

          {/* Right Sidebar: Order Summary & Purchase Reference */}
          <div className="w-full lg:w-[360px] flex flex-col gap-6 shrink-0">
            
            {/* Your Order Card */}
            <div className="w-full bg-white shadow-[2px_4px_20px_rgba(109,109,120,0.06)] rounded-xl border border-line flex flex-col overflow-hidden">
              <div className="w-full p-4 bg-surface border-[#E5E7EB] border flex items-center justify-center">
                <h3 className="text-ink text-xl font-bold uppercase tracking-wider">{t('checkout.yourOrder')}</h3>
              </div>

              <div className="p-4 flex flex-col gap-4">
                {/* Product List */}
                <div className="flex flex-col gap-4">
                  {items.map((item) => {
                    const imageSrc = item.mainImage?.trim() || "https://placehold.co/62x62";
                    const productSlug = item.slug?.trim();
                    const productHref = productSlug ? localePath(`/product/${productSlug}`, locale) : null;

                    return (
                      <div key={item.key} className="w-full flex items-center gap-3">
                        <div className="w-[62px] h-[62px] p-1 bg-line rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                          {productHref ? (
                            <Link href={productHref} className="w-full h-full block">
                              <img src={imageSrc} alt={item.name} className="w-full h-full object-contain" />
                            </Link>
                          ) : (
                            <img src={imageSrc} alt={item.name} className="w-full h-full object-contain" />
                          )}
                        </div>
                        <div className="flex-1 flex items-start justify-between gap-2 min-w-0">
                          <div className="flex flex-col min-w-0">
                            <h4 className="text-copy text-[16px] font-bold break-words whitespace-normal leading-[19.2px]">
                              {productHref ? (
                                <Link href={productHref} className="hover:text-brand hover:underline transition-colors">
                                  {item.name}
                                </Link>
                              ) : (
                                item.name
                              )}
                            </h4>
                            <span className="text-subtle text-sm mt-1">{item.quantity} {item.quantity === 1 ? t('checkout.item') : t('checkout.items')}</span>
                          </div>
                          <span className="text-ink text-[18px] font-bold shrink-0">{formatEuro(linePrice(item))}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="h-px bg-line w-full" />

                {/* Subtotals */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[18px]">
                    <span className="text-ink font-bold">{t('checkout.subtotal')}</span>
                    <span className="text-ink font-bold">{formatEuro(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[18px]">
                    <span className="text-ink font-bold">{t('checkout.shipping')}</span>
                    <span className="text-ink font-bold">{formatEuro(shippingAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[18px]">
                    <span className="text-ink font-bold">{t('checkout.vat')} (21%)</span>
                    <span className="text-ink font-bold">{formatEuro(taxAmount)}</span>
                  </div>
                  {paymentFee > 0 && (
                    <div className="flex justify-between items-center text-[18px]">
                      <span className="text-ink font-bold">{t('checkout.paymentFeeLabel')}</span>
                      <span className="text-ink font-bold">{formatEuro(paymentFee)}</span>
                    </div>
                  )}
                  {paymentFee < 0 && (
                    <div className="flex justify-between items-center text-[18px]">
                      <span className="text-ink font-bold">{t('checkout.discount')}</span>
                      <span className="text-danger font-bold">-{formatEuro(Math.abs(paymentFee))}</span>
                    </div>
                  )}

                  <div className="h-px bg-[#D9E3ED] w-full mt-1" />

                  <div className="flex justify-between items-center mt-1">
                    <span className="text-ink text-[20px] font-bold">{t('checkout.totalInclVat')}</span>
                    <span className="text-ink text-[20px] font-semibold">{formatEuro(finalTotal)}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Purchase Reference Card */}
            <div className="w-full p-4 bg-gradient-to-br from-[var(--brand-soft)] to-white rounded-xl border-2 border-[#FFEDD4] flex flex-col gap-3">
              <h3 className="text-ink text-[20px] font-bold leading-6">{t('checkout.purchaseReference')}</h3>
              
              <div className="relative w-full h-[52px]">
                <input
                  type="text"
                  value={form.purchaseReference}
                  onChange={(e) => handleChange("purchaseReference", e.target.value)}
                  placeholder={t('checkout.purchaseReferencePlaceholder')}
                  className="w-full h-full pl-5 pr-14 rounded-full border border-[#DDE1EA] bg-white font-medium text-neutral-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                />
                <div
                  className="absolute right-2 top-2 w-9 h-9 bg-line rounded-full flex items-center justify-center pointer-events-none"
                  aria-hidden="true"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <mask id="mask0_2740_6734" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                      <rect width="20" height="20" fill="#D9D9D9"/>
                    </mask>
                    <g mask="url(#mask0_2740_6734)">
                      <path d="M2.91699 20.0019C2.57616 20.0019 2.28262 19.8801 2.03637 19.6365C1.79012 19.3928 1.66699 19.098 1.66699 18.7519C1.66699 18.411 1.79012 18.1175 2.03637 17.8713C2.28262 17.625 2.57616 17.5019 2.91699 17.5019H17.0837C17.4245 17.5019 17.718 17.6237 17.9643 17.8673C18.2105 18.1109 18.3337 18.4058 18.3337 18.7519C18.3337 19.0927 18.2105 19.3863 17.9643 19.6325C17.718 19.8788 17.4245 20.0019 17.0837 20.0019H2.91699ZM5.00033 13.6798H6.03074L12.9474 6.77583L12.4235 6.24396L11.9043 5.73271L5.00033 12.6494V13.6798ZM3.75033 14.1765V12.4315C3.75033 12.331 3.76713 12.2354 3.80074 12.1446C3.83449 12.0538 3.89033 11.9693 3.96824 11.8913L13.0918 2.78875C13.2125 2.66806 13.3495 2.57674 13.5028 2.51479C13.656 2.45285 13.8144 2.42188 13.9778 2.42188C14.1467 2.42188 14.3073 2.45285 14.4595 2.51479C14.6117 2.57674 14.7525 2.67236 14.8818 2.80167L15.8832 3.81604C16.0125 3.93674 16.106 4.07451 16.1637 4.22938C16.2214 4.38438 16.2503 4.54625 16.2503 4.715C16.2503 4.87 16.2214 5.0241 16.1637 5.17729C16.106 5.33063 16.0125 5.47195 15.8832 5.60125L6.78074 14.7038C6.70269 14.7818 6.61831 14.839 6.52762 14.8752C6.43678 14.9116 6.34116 14.9298 6.24074 14.9298H4.50366C4.2888 14.9298 4.10956 14.8579 3.96595 14.7142C3.8222 14.5706 3.75033 14.3913 3.75033 14.1765ZM12.9474 6.77583L12.4235 6.24396L11.9043 5.73271L12.9474 6.77583Z" fill="var(--subtle)"/>
                    </g>
                  </svg>
                </div>
              </div>
            </div>

          </div>

        </div>
        )}
      </div>

      <LoginPopup
        open={isLoginPopupOpen}
        onOpenChange={setIsLoginPopupOpen}
        onSwitchToRegister={() => {
          setIsLoginPopupOpen(false);
          setIsRegisterPopupOpen(true);
        }}
        onLoginSuccess={onLoginSuccess}
      />
      <RegisterPopup
        open={isRegisterPopupOpen}
        onOpenChange={setIsRegisterPopupOpen}
        onSwitchToLogin={() => {
          setIsRegisterPopupOpen(false);
          setIsLoginPopupOpen(true);
        }}
      />
      <AddAddressPopup
        open={isAddAddressPopupOpen}
        editingAddress={editingAddress}
        addressType={addressPopupType}
        onOpenChange={(open) => {
          setIsAddAddressPopupOpen(open);
          if (!open) {
            setEditingAddress(null);
          }
        }}
        onSuccess={async (savedAddressId) => {
          setIsAddAddressPopupOpen(false);
          setEditingAddress(null);
          await onAddressAdded(savedAddressId, addressPopupType);
        }}
      />
    </div>
  );
}

type LoginErrors = {
  email?: string[];
  password?: string[];
};

type LoginResponse = {
  message?: string;
  user?: unknown;
  data?: unknown;
  customer?: unknown;
  auth?: unknown;
  errors?: LoginErrors;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(source: unknown, keys: string[]): string {
  if (!isPlainObject(source)) {
    return "";
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

function extractUser(data: LoginResponse, email: string) {
  if (isPlainObject(data.user)) {
    return data.user;
  }

  if (isPlainObject(data.data)) {
    if (isPlainObject(data.data.user)) {
      return data.data.user;
    }

    if (typeof data.data.email === "string" || typeof data.data.name === "string") {
      return data.data;
    }
  }

  if (isPlainObject(data.customer)) {
    return data.customer;
  }

  if (isPlainObject(data.auth) && isPlainObject(data.auth.user)) {
    return data.auth.user;
  }

  return { email };
}

function extractPayloadObject(payload: unknown): Record<string, unknown> {
  if (!isPlainObject(payload)) {
    return {};
  }

  if (isPlainObject(payload.data)) {
    return payload.data;
  }

  if (isPlainObject(payload.user)) {
    return payload.user;
  }

  if (isPlainObject(payload.customer)) {
    return payload.customer;
  }

  return payload;
}

function extractAddressList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(isPlainObject);
  }

  if (!isPlainObject(payload)) {
    return [];
  }

  if (Array.isArray(payload.data)) {
    return payload.data.filter(isPlainObject);
  }

  if (Array.isArray(payload.addresses)) {
    return payload.addresses.filter(isPlainObject);
  }

  if (isPlainObject(payload.data) && Array.isArray(payload.data.addresses)) {
    return payload.data.addresses.filter(isPlainObject);
  }

  return [];
}

function readAddressType(address: Record<string, unknown>) {
  return readString(address, ["type", "address_type", "kind"]);
}

function formatAddressId(address: Record<string, unknown>, index: number) {
  return readString(address, ["id", "address_id", "uuid"]) || `address-${index}`;
}

function countryFromAddress(address: Record<string, unknown>, fallback: string, countriesList?: any[]) {
  const rawVal = readString(address, ["country_id", "countryCode", "country_code", "country_name", "country"]);
  const countryId = rawVal.toUpperCase();

  if (countriesList && countriesList.length > 0 && rawVal) {
    const found = countriesList.find((c: any) =>
      c.id.toLowerCase() === rawVal.toLowerCase() ||
      c.name.toLowerCase() === rawVal.toLowerCase()
    );
    if (found) {
      return found.name;
    }
  }

  if (countryId === "NL" || countryId === "NEDERLAND") return "Netherlands";
  if (countryId === "BE" || countryId === "BELGIË" || countryId === "BELGIQUE") return "Belgium";
  if (countryId === "DE" || countryId === "DEUTSCHLAND") return "Germany";
  if (countryId === "NG" || countryId === "NIGERIA") return "Nigeria";
  if (countryId === "FR" || countryId === "FRANCE") return "France";
  if (countryId === "ES" || countryId === "ESPAÑA" || countryId === "SPAIN") return "Spain";
  if (countryId === "IT" || countryId === "ITALIA" || countryId === "ITALY") return "Italy";
  if (countryId === "AT" || countryId === "AUSTRIA" || countryId === "ÖSTERREICH") return "Austria";
  if (countryId === "GB" || countryId === "UK" || countryId === "UNITED KINGDOM") return "United Kingdom";
  if (countryId === "US" || countryId === "USA" || countryId === "UNITED STATES") return "United States";

  const explicitCountry = readString(address, ["country_name", "country"]);
  return explicitCountry || fallback;
}

function normalizeCheckoutAddress(address: Record<string, unknown>, index: number, countriesList?: any[]): CheckoutSavedAddress {
  const firstName = readString(address, ["firstname", "first_name", "billing_first_name", "shipping_first_name"]);
  const lastName = readString(address, ["lastname", "last_name", "billing_last_name", "shipping_last_name"]);
  const explicitName = readString(address, ["name", "full_name", "display_name"]);
  const isDefaultValue =
    address.default_shipping === true ||
    address.is_default_shipping === true ||
    address.default === true ||
    address.is_default === true ||
    readString(address, ["default_shipping", "is_default_shipping", "default", "is_default"]) === "1";

  return {
    id: formatAddressId(address, index),
    type: readAddressType(address) || "shipping",
    isDefault: isDefaultValue,
    name: explicitName || [firstName, lastName].filter(Boolean).join(" ") || "Saved address",
    firstname: firstName,
    lastname: lastName,
    company: readString(address, ["company", "company_name", "business_name"]),
    address1: readString(address, ["street", "address", "address_1", "line1", "street_address"]),
    address2: readString(address, ["street2", "address2", "address_2", "line2", "apartment", "suite"]),
    postcode: readString(address, ["postcode", "postalcode", "postal_code", "zip", "zip_code"]),
    city: readString(address, ["city", "town", "locality"]),
    state: readAddressState(address),
    phone: readString(address, ["phone", "telephone", "mobile", "mobile_number", "mobileNumber"]),
    email: readString(address, ["email", "billing_email", "shipping_email"]),
    country: countryFromAddress(address, "Netherlands", countriesList),
  };
}

function normalizeCheckoutShippingAddresses(payload: unknown, countriesList?: any[]) {
  return extractAddressList(payload)
    .map((addr, idx) => normalizeCheckoutAddress(addr, idx, countriesList))
    .filter((address) => {
      const addressType = address.type.toLowerCase();
      return addressType === "shipping" || addressType.includes("shipping");
    });
}

function normalizeCheckoutBillingAddresses(payload: unknown, countriesList?: any[]) {
  return extractAddressList(payload)
    .map((addr, idx) => normalizeCheckoutAddress(addr, idx, countriesList))
    .filter((address) => {
      const addressType = address.type.toLowerCase();
      return addressType === "billing" || addressType.includes("billing");
    });
}

function readDefaultShippingAddressId(...sources: unknown[]) {
  for (const source of sources) {
    const value = readString(source, [
      "default_shipping_address_id",
      "defaultShippingAddressId",
      "default_shipping_id",
      "shipping_address_id",
    ]);

    if (value) {
      return value;
    }
  }

  return "";
}

function readDefaultBillingAddressId(...sources: unknown[]) {
  for (const source of sources) {
    const value = readString(source, [
      "default_billing_address_id",
      "defaultBillingAddressId",
      "default_billing_id",
      "billing_address_id",
    ]);

    if (value) {
      return value;
    }
  }

  return "";
}

function splitName(source: unknown) {
  let firstName = readString(source, ["firstName", "firstname", "first_name", "billing_first_name"]);
  let lastName = readString(source, ["lastName", "lastname", "last_name", "billing_last_name"]);

  if (!firstName) {
    const name = readString(source, ["name", "full_name", "display_name"]);
    if (name) {
      const parts = name.trim().split(/\s+/);
      firstName = parts[0] || "";
      lastName = lastName || parts.slice(1).join(" ");
    }
  }

  return { firstName, lastName };
}

function readNestedString(source: unknown, objectKeys: string[], valueKeys: string[]) {
  if (!isPlainObject(source)) {
    return "";
  }

  for (const objectKey of objectKeys) {
    const nested = source[objectKey];
    const value = readString(nested, valueKeys);

    if (value) {
      return value;
    }
  }

  return "";
}

function readAddressState(address: unknown) {
  return (
    readString(address, [
      "state",
      "state_name",
      "province",
      "province_name",
      "region",
      "region_name",
      "county",
      "administrative_area",
      "administrative_area_level_1",
      "address2",
      "address_2",
      "street2",
    ]) ||
    readNestedString(address, ["state", "province", "region"], ["name", "title", "label", "code"])
  );
}

function valueWhenBlank(current: string, next: string) {
  return current.trim() ? current : next || current;
}

function applySavedShippingAddressToForm(
  current: CheckoutFormState,
  address: CheckoutSavedAddress,
  countriesList?: any[],
): CheckoutFormState {
  return {
    ...current,
    shippingFirstName: address.firstname || current.shippingFirstName,
    shippingLastName: address.lastname || current.shippingLastName,
    email: address.email || current.email,
    mobileNumber: address.phone || current.mobileNumber,
    shippingStreetAddress: address.address1,
    shippingCity: address.city,
    shippingState: address.state,
    shippingPostcode: address.postcode,
    shippingCountry: countryFromAddress(address, current.shippingCountry, countriesList),
  };
}

function applySavedBillingAddressToForm(
  current: CheckoutFormState,
  address: CheckoutSavedAddress,
  countriesList?: any[],
): CheckoutFormState {
  return {
    ...current,
    firstName: address.firstname || current.firstName,
    lastName: address.lastname || current.lastName,
    companyName: address.company || current.companyName,
    email: address.email || current.email,
    mobileNumber: address.phone || current.mobileNumber,
    streetAddress: address.address1,
    city: address.city,
    state: address.state,
    shippingState: current.sameAsBilling ? address.state : current.shippingState,
    postcode: address.postcode,
    country: countryFromAddress(address, current.country, countriesList),
  };
}

export default function CheckoutPageClient({
  mode = "live",
  demoItems = [],
}: CheckoutPageClientProps) {
  const t = useTranslations();
  const cart = useCart();
  const locale = useLocale();
  const isDemoMode = mode === "demo";
  const [form, setForm] = useState<CheckoutFormState>(
    isDemoMode ? demoFormState : initialFormState,
  );
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormState, string>>>({});
  const [isPending, setIsPending] = useState(false);
  const [localDemoItems, setLocalDemoItems] = useState<CartItem[]>(demoItems);
  const [isAutofilled, setIsAutofilled] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedShippingAddresses, setSavedShippingAddresses] = useState<CheckoutSavedAddress[]>([]);
  const [selectedSavedShippingAddressId, setSelectedSavedShippingAddressId] = useState<string | null>(null);
  const [defaultShippingAddressId, setDefaultShippingAddressId] = useState<string>("");
  const [savedBillingAddresses, setSavedBillingAddresses] = useState<CheckoutSavedAddress[]>([]);
  const [selectedSavedBillingAddressId, setSelectedSavedBillingAddressId] = useState<string | null>(null);
  const [defaultBillingAddressId, setDefaultBillingAddressId] = useState<string>("");
  const [isLoadingSavedShippingAddresses, setIsLoadingSavedShippingAddresses] = useState(false);
  const [savedShippingAddressesError, setSavedShippingAddressesError] = useState("");
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [billingSnapshot, setBillingSnapshot] = useState<Partial<CheckoutFormState> | null>(null);
  const [countriesList, setCountriesList] = useState<any[]>([]);

  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch("/api/countries");
        if (res.ok) {
          const data = await res.json();
          const list = data.countries || [];
          setCountriesList(list);
        }
      } catch (err) {
        console.error("Error fetching countries:", err);
      }
    }
    loadCountries();
  }, []);

  const [loadedBillingAddressId, setLoadedBillingAddressId] = useState<string | number | null>(null);

  const startEditingBilling = () => {
    setBillingSnapshot({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      mobileNumber: form.mobileNumber,
      companyName: form.companyName,
      vatNumber: form.vatNumber,
      streetAddress: form.streetAddress,
      country: form.country,
      city: form.city,
      state: form.state,
      postcode: form.postcode,
    });
    setIsEditingBilling(true);
  };

  const cancelEditingBilling = () => {
    if (billingSnapshot) {
      setForm((current) => ({
        ...current,
        ...billingSnapshot,
      }));
    }
    setIsEditingBilling(false);
  };

  const saveEditingBilling = async () => {
    if (isLoggedIn) {
      try {
        let finalAddressId = loadedBillingAddressId;
        if (!finalAddressId) {
          const resAddr = await fetch("/api/account/addresses", { cache: "no-store" }).catch(() => null);
          if (resAddr?.ok) {
            const addrPayload = await resAddr.json().catch(() => ({}));
            const addressesList = extractAddressList(addrPayload);
            const existingBilling = addressesList.find((address) => readString(address, ["type"]) === "billing");
            if (existingBilling) {
              finalAddressId = (existingBilling.id || existingBilling.address_id) as string | number;
              setLoadedBillingAddressId(finalAddressId);
            }
          }
        }

        const countryObj = countriesList.find(
          (c: any) =>
            c.name.toLowerCase() === form.country.toLowerCase() ||
            c.id.toLowerCase() === form.country.toLowerCase()
        );
        const countryIdVal = countryObj?.id || "NL";
        const provinceObj = countryObj?.provinces?.find(
          (p: any) => p.name.toLowerCase() === form.state.toLowerCase() || String(p.id) === String(form.state)
        );
        const provinceIdVal = provinceObj?.id ? Number(provinceObj.id) : undefined;

        const payload = {
          id: finalAddressId || undefined,
          type: "billing",
          name: `${form.firstName} ${form.lastName}`,
          firstname: form.firstName,
          lastname: form.lastName,
          company_name: form.companyName,
          address: form.streetAddress,
          postalcode: form.postcode,
          city: form.city,
          phone: form.mobileNumber,
          email: form.email,
          country_id: countryIdVal,
          province_id: provinceIdVal,
        };

        const res = await fetch("/api/account/addresses", {
          method: finalAddressId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to update address");
        }

        const data = await res.json().catch(() => ({}));
        const newId = data?.id || data?.data?.id || finalAddressId;
        if (newId) {
          setLoadedBillingAddressId(newId);
        }

        toast.success(t("account.addressSavedSuccess", { type: "Billing" }));
      } catch (err: any) {
        console.error("Failed to save billing address:", err);
        toast.error(err.message || "Failed to save billing address");
        return;
      }
    }

    setBillingSnapshot(null);
    setIsEditingBilling(false);
  };
  
  const { shippingRules, defaultRule } = useShippingRules();

  const autofillCustomerDetails = useCallback(async () => {
    if (isDemoMode) return;

    setIsLoadingSavedShippingAddresses(true);
    setSavedShippingAddressesError("");

    const storedUser = localStorage.getItem("auth_user");
    let storedUserData: unknown = {};
    if (storedUser) {
      try {
        storedUserData = JSON.parse(storedUser);
      } catch (error) {
        console.error("Failed to parse auth_user for autofill:", error);
      }
    }

    // Try fetching from backend first
    const profileResponse = await fetch("/api/account/profile", { cache: "no-store" }).catch(() => null);
    const profilePayload = profileResponse?.ok ? await profileResponse.json().catch(() => ({})) : null;

    const addressResponse = await fetch("/api/account/addresses", { cache: "no-store" }).catch(() => null);
    const addressPayload = addressResponse?.ok ? await addressResponse.json().catch(() => ({})) : null;

    // If we have a profile response from backend, use it
    const profile = profilePayload ? extractPayloadObject(profilePayload) : {};
    const addresses = addressPayload ? extractAddressList(addressPayload) : [];

    const hasBackendProfile = profile && Object.keys(profile).length > 0;
    let finalProfile = profile;

    if (hasBackendProfile) {
      // Sync with localStorage so the user is logged in client-side
      localStorage.setItem("auth_user", JSON.stringify(profile));
      setIsLoggedIn(true);
      window.dispatchEvent(new Event("auth-user-updated"));
    } else if (storedUser && Object.keys(storedUserData as object).length > 0) {
      // Fallback: If backend check failed/unauthorized, but we have stored user, use stored user
      finalProfile = storedUserData as Record<string, unknown>;
      setIsLoggedIn(true);
    } else {
      // Not logged in either backend or frontend
      setIsLoggedIn(false);
      setSavedShippingAddresses([]);
      setSelectedSavedShippingAddressId(null);
      setDefaultShippingAddressId("");
      setSavedBillingAddresses([]);
      setSelectedSavedBillingAddressId(null);
      setDefaultBillingAddressId("");
      setIsLoadingSavedShippingAddresses(false);
      setIsAutofilled(true);
      return;
    }

    const preferredAddress =
      addresses.find((address) => readString(address, ["type"]) === "billing") ??
      addresses.find((address) => readString(address, ["type"]) === "shipping") ??
      addresses[0] ??
      null;

    if (preferredAddress && readString(preferredAddress, ["type"]) === "billing") {
      const pId = preferredAddress.id || preferredAddress.address_id;
      setLoadedBillingAddressId((pId as string | number | null) || null);
    }

    // Saved Billing Addresses
    const rawBillingAddresses = normalizeCheckoutBillingAddresses(addressPayload, countriesList);
    const nextDefaultBillingAddressId = readDefaultBillingAddressId(finalProfile, storedUserData);
    const defaultBillingAddress =
      rawBillingAddresses.find((address) => String(address.id) === String(nextDefaultBillingAddressId)) ??
      rawBillingAddresses.find((address) => address.isDefault) ??
      rawBillingAddresses[0] ??
      null;
    const billingAddresses = defaultBillingAddress
      ? [defaultBillingAddress, ...rawBillingAddresses.filter((address) => String(address.id) !== String(defaultBillingAddress.id))]
      : rawBillingAddresses;
    const billingAddressToLoad =
      billingAddresses.find((address) => String(address.id) === String(selectedSavedBillingAddressId)) ??
      defaultBillingAddress;

    setSavedBillingAddresses(billingAddresses);
    setDefaultBillingAddressId(nextDefaultBillingAddressId);
    setSelectedSavedBillingAddressId((current) => {
      if (current && billingAddresses.some((address) => String(address.id) === String(current))) {
        return current;
      }
      return defaultBillingAddress ? defaultBillingAddress.id : null;
    });

    // Saved Shipping Addresses
    const rawShippingAddresses = normalizeCheckoutShippingAddresses(addressPayload, countriesList);
    const nextDefaultShippingAddressId = readDefaultShippingAddressId(finalProfile, storedUserData);

    const defaultAddress =
      rawShippingAddresses.find((address) => String(address.id) === String(nextDefaultShippingAddressId)) ??
      rawShippingAddresses.find((address) => address.isDefault) ??
      rawShippingAddresses[0] ??
      null;

    const shippingAddresses = defaultAddress
      ? [defaultAddress, ...rawShippingAddresses.filter((address) => String(address.id) !== String(defaultAddress.id))]
      : rawShippingAddresses;

    const addressToLoad =
      shippingAddresses.find((address) => String(address.id) === String(selectedSavedShippingAddressId)) ??
      defaultAddress;

    setSavedShippingAddresses(shippingAddresses);
    setDefaultShippingAddressId(nextDefaultShippingAddressId);
    setSelectedSavedShippingAddressId((current) => {
      if (current && shippingAddresses.some((address) => String(address.id) === String(current))) {
        return current;
      }

      return defaultAddress ? defaultAddress.id : null;
    });
    setForm((current) => {
      let updated = current;
      if (billingAddresses.length > 0 && billingAddressToLoad) {
        updated = applySavedBillingAddressToForm(updated, billingAddressToLoad, countriesList);
      }
      if (shippingAddresses.length > 0 && addressToLoad) {
        return applySavedShippingAddressToForm({ ...updated, sameAsBilling: false }, addressToLoad, countriesList);
      }
      return updated.sameAsBilling || !addressToLoad ? updated : applySavedShippingAddressToForm(updated, addressToLoad, countriesList);
    });
    setIsLoadingSavedShippingAddresses(false);
    setIsAutofilled(true);
  }, [isDemoMode, selectedSavedShippingAddressId, selectedSavedBillingAddressId, countriesList]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    const refreshAuthState = () => {
      const hasUser = !!localStorage.getItem("auth_user");
      setIsLoggedIn(hasUser);

      if (!hasUser) {
        setSavedShippingAddresses([]);
        setSelectedSavedShippingAddressId(null);
        setDefaultShippingAddressId("");
        setIsLoadingSavedShippingAddresses(false);
        setSavedShippingAddressesError("");
        setForm((current) =>
          current.paymentMethod === "banktransfer" ? { ...current, paymentMethod: "" } : current,
        );
      }

      if (!isAutofilled) {
        void autofillCustomerDetails();
      }
    };

    refreshAuthState();
    window.addEventListener("auth-user-updated", refreshAuthState);
    window.addEventListener("storage", refreshAuthState);

    return () => {
      window.removeEventListener("auth-user-updated", refreshAuthState);
      window.removeEventListener("storage", refreshAuthState);
    };
  }, [autofillCustomerDetails, isAutofilled]);

  const handleChange = (field: keyof CheckoutFormState, value: string | boolean) => {
    if (field === "country") {
      setForm((current) => ({ ...current, country: value as string, state: "" }));
      setErrors((current) => ({ ...current, country: undefined, state: undefined }));
      return;
    }

    if (field === "paymentMethod" && value === "banktransfer" && !isLoggedIn) {
      setForm((current) => ({ ...current, paymentMethod: "" }));
      setErrors((current) => ({ ...current, paymentMethod: t("checkout.invoiceAccountOnly") }));
      return;
    }

    if (field === "sameAsBilling" && value === false) {
      const selectedAddress =
        savedShippingAddresses.find((address) => String(address.id) === String(selectedSavedShippingAddressId)) ??
        savedShippingAddresses.find((address) => String(address.id) === String(defaultShippingAddressId)) ??
        savedShippingAddresses.find((address) => address.isDefault) ??
        savedShippingAddresses[0] ??
        null;

      if (selectedAddress) {
        setSelectedSavedShippingAddressId(selectedAddress.id);
      }

      setForm((current) => {
        const next = { ...current, sameAsBilling: false };
        return selectedAddress ? applySavedShippingAddressToForm(next, selectedAddress, countriesList) : next;
      });
      setErrors((current) => ({ ...current, sameAsBilling: undefined }));
      return;
    }

    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSavedShippingAddressSelect = useCallback((address: CheckoutSavedAddress) => {
    setSelectedSavedShippingAddressId(address.id);
    setForm((current) => applySavedShippingAddressToForm(current, address, countriesList));
    setErrors((current) => ({
      ...current,
      shippingFirstName: undefined,
      shippingLastName: undefined,
      shippingStreetAddress: undefined,
      shippingCity: undefined,
      shippingState: undefined,
      shippingPostcode: undefined,
      email: address.email ? undefined : current.email,
      mobileNumber: address.phone ? undefined : current.mobileNumber,
    }));
  }, []);

  const handleSavedBillingAddressSelect = useCallback((address: CheckoutSavedAddress) => {
    setSelectedSavedBillingAddressId(address.id);
    setForm((current) => applySavedBillingAddressToForm(current, address));
    setErrors((current) => ({
      ...current,
      firstName: undefined,
      lastName: undefined,
      streetAddress: undefined,
      city: undefined,
      state: undefined,
      postcode: undefined,
      companyName: undefined,
      email: address.email ? undefined : current.email,
      mobileNumber: address.phone ? undefined : current.mobileNumber,
    }));
  }, []);

  const validateStep = (currentStep: number): boolean => {
    const nextErrors: Partial<Record<keyof CheckoutFormState, string>> = {};
    const fieldLabels: Record<string, string> = {
      firstName: t('checkout.firstName'),
      lastName: t('checkout.lastName'),
      email: t('checkout.email'),
      mobileNumber: t('checkout.mobileNumber'),
      companyName: t('checkout.companyName'),
      vatNumber: t('checkout.vatNumber'),
      streetAddress: t('checkout.streetAddress'),
      city: t('checkout.city'),
      state: t('checkout.state'),
      postcode: t('checkout.postcode'),
      shippingFirstName: t('checkout.firstName'),
      shippingLastName: t('checkout.lastName'),
      shippingStreetAddress: t('checkout.streetAddress'),
      shippingCity: t('checkout.city'),
      shippingState: t('checkout.state'),
      shippingPostcode: t('checkout.postcode'),
      paymentMethod: t('checkout.paymentMethod'),
    };

    if (currentStep === 1) {
      const requiredFields: Array<keyof CheckoutFormState> = [
        "firstName",
        "lastName",
        "email",
        "mobileNumber",
        "streetAddress",
        "city",
        "postcode",
      ];
      for (const field of requiredFields) {
        const val = form[field];
        if (typeof val === "string" && !val.trim()) {
          nextErrors[field] = t('validation.required', { field: fieldLabels[field] || field });
        }
      }
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        nextErrors.email = t('validation.invalidEmail');
      }
    } else if (currentStep === 2) {
      if (!form.sameAsBilling) {
        const requiredFields: Array<keyof CheckoutFormState> = [
          "shippingFirstName",
          "shippingLastName",
          "shippingStreetAddress",
          "shippingCity",
          "shippingPostcode",
        ];
        for (const field of requiredFields) {
          const val = form[field];
          if (typeof val === "string" && !val.trim()) {
            nextErrors[field] = t('validation.required', { field: fieldLabels[field] || field });
          }
        }
      }
    } else if (currentStep === 3) {
      if (!form.paymentMethod) {
        nextErrors.paymentMethod = t('validation.required', { field: fieldLabels.paymentMethod });
      }
      if (!isLoggedIn && form.paymentMethod === "banktransfer") {
        nextErrors.paymentMethod = t("checkout.invoiceAccountOnly");
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const items = isDemoMode ? localDemoItems : cart.items;
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + linePrice(item), 0),
    [items],
  );

  const removeItem = (key: string) => {
    if (isDemoMode) {
      setLocalDemoItems((current) => current.filter((item) => item.key !== key));
      return;
    }
    cart.removeItem(key);
  };

  const incrementItemQuantity = (key: string) => {
    if (isDemoMode) {
      setLocalDemoItems((current) =>
        current.map((item) => (item.key === key ? { ...item, quantity: item.quantity + 1 } : item)),
      );
      return;
    }
    cart.incrementItemQuantity(key);
  };

  const decrementItemQuantity = (key: string) => {
    if (isDemoMode) {
      setLocalDemoItems((current) =>
        current.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 1 }
            : item,
        ),
      );
      return;
    }
    cart.decrementItemQuantity(key);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (items.length === 0) {
      return;
    }

    if (step < 3) {
      if (validateStep(step)) {
        setStep((step + 1) as 1 | 2 | 3);
      }
      return;
    }

    if (!validateStep(3)) {
      return;
    }

    // Ensure there's at least one real product (not just warranty addons)
    const productItems = items.filter((item) => item.itemKind !== "warranty" && getProductId(item) !== null);
    if (productItems.length === 0) {
      toast.error(t('checkout.noProducts'));
      return;
    }

    setIsPending(true);

    const selectedCountry = form.sameAsBilling ? form.country : form.shippingCountry;
    const selectedRule = shippingRules.find(r => r.country_name === selectedCountry) ?? defaultRule;
    
    let shippingAmount = 0;
    if (items.length > 0) {
      if (selectedRule) {
        shippingAmount = totalAmount >= selectedRule.free_shipping_threshold ? 0 : selectedRule.shipping_cost;
      } else {
        shippingAmount = DELIVERY_FEE;
      }
    }
    const paymentFee = form.paymentMethod === "creditcard" ? totalAmount * 0.025 : 0;
    const taxAmount = (totalAmount + shippingAmount + paymentFee) * 0.21;
    const finalTotal = totalAmount + shippingAmount + paymentFee + taxAmount;

    const shippingFirst = form.sameAsBilling ? form.firstName : form.shippingFirstName;
    const shippingLast = form.sameAsBilling ? form.lastName : form.shippingLastName;
    const shippingStreet = form.sameAsBilling ? form.streetAddress : form.shippingStreetAddress;
    const shippingCityVal = form.sameAsBilling ? form.city : form.shippingCity;
    const shippingStateVal = form.sameAsBilling ? form.state : form.shippingState;
    const shippingPostcodeVal = form.sameAsBilling ? form.postcode : form.shippingPostcode;
    const shippingCountryVal = form.sameAsBilling ? form.country : form.shippingCountry;

    const orderData = {
      status: "pending",
      customer_notes: form.purchaseReference,
      billing_firstname: form.firstName,
      billing_lastname: form.lastName,
      billing_email: form.email,
      billing_phone: form.mobileNumber,
      billing_company_name: form.companyName,
      company_name: form.companyName,
      billing_vat_number: form.vatNumber,
      vat_number: form.vatNumber,
      btw_number: form.vatNumber,
      billing_address: form.streetAddress,
      billing_city: form.city,
      billing_state: form.state,
      billing_province: form.state,
      billing_postalcode: form.postcode,
      billing_country_id: (countriesList.find((c: any) => c.name.toLowerCase() === form.country.toLowerCase() || c.id.toLowerCase() === form.country.toLowerCase())?.id || (form.country === "Netherlands" ? "NL" : form.country === "Belgium" ? "BE" : form.country === "Germany" ? "DE" : "NL")).toUpperCase(),
      
      shipping_firstname: shippingFirst,
      shipping_lastname: shippingLast,
      shipping_address: shippingStreet,
      shipping_city: shippingCityVal,
      shipping_state: shippingStateVal,
      shipping_province: shippingStateVal,
      shipping_postalcode: shippingPostcodeVal,
      shipping_country_id: (countriesList.find((c: any) => c.name.toLowerCase() === shippingCountryVal.toLowerCase() || c.id.toLowerCase() === shippingCountryVal.toLowerCase())?.id || (shippingCountryVal === "Netherlands" ? "NL" : shippingCountryVal === "Belgium" ? "BE" : shippingCountryVal === "Germany" ? "DE" : "NL")).toUpperCase(),

      shipping_amount: shippingAmount,
      tax_amount: taxAmount,
      payment_fee: paymentFee,
      payment_method: form.paymentMethod,
      total: finalTotal,
      lang: locale.split('-')[0] === 'nl' ? 'nl' : 'en',
      order_items: buildCheckoutOrderItems(items),
    };

    console.log("[Checkout] Submitting order data:", JSON.stringify(orderData, null, 2));

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const json = await response.json();

      if (!response.ok) {
        if (response.status === 401 || json.message === "Unauthenticated.") {
          toast.error(t('checkout.sessionExpired'));
          localStorage.removeItem('auth_user');
          window.location.href = `${localePath("/login", locale)}?redirect=${encodeURIComponent(localePath("/afrekenen", locale))}`;
          return;
        }
        
        toast.error(json.message || json.error || t('checkout.createOrderError'));
        return;
      }

      if (!isDemoMode) {
        cart.clearCart();
      }
      
      if (!isDemoMode && json.payment_url) {
        window.location.href = json.payment_url;
        return;
      }
      
      setOrderNumber(json.data?.number || null);
      setIsSubmitted(true);
      toast.success(t('checkout.orderSuccess'));
    } catch (error) {
      console.log("Checkout error:", String(error));
      toast.error(t('checkout.orderError'));
    } finally {
      setIsPending(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-surface px-5 py-24 min-h-[70vh] flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 p-12 shadow-[2px_8px_40px_0px_rgba(109,109,120,0.10)] flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-neutral-800">{t('checkout.successTitle')}</h1>
            <p className="text-neutral-600 text-lg">
              {t('checkout.successSubtitle', { email: form.email })}
            </p>
          </div>
          
          {orderNumber && (
            <div className="bg-slate-50 rounded-xl px-6 py-4 border border-slate-100">
              <p className="text-sm text-neutral-500 font-medium uppercase tracking-wider">{t('checkout.orderNumberLabel')}</p>
              <p className="text-2xl font-bold text-brand">{orderNumber}</p>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full pt-4">
            <Link 
              href={localePath("/my-account", locale)}
              className="h-12 w-full rounded-full bg-brand px-6 text-base font-bold text-white transition-colors hover:bg-brand-hover flex items-center justify-center"
            >
              {t('checkout.viewMyOrders')}
            </Link>
            <Link 
              href={localePath("/product", locale)}
              className="h-12 w-full rounded-full border border-slate-200 px-6 text-base font-bold text-neutral-700 transition-colors hover:bg-slate-50 flex items-center justify-center"
            >
              {t('common.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleAddressAdded = async (savedAddressId?: string | number, type?: 'billing' | 'shipping') => {
    await autofillCustomerDetails();
    if (savedAddressId) {
      if (type === 'billing') {
        setSelectedSavedBillingAddressId(String(savedAddressId));
      } else {
        setSelectedSavedShippingAddressId(String(savedAddressId));
      }
    }
  };

  return (
    <CheckoutShell
      items={items}
      totalAmount={totalAmount}
      onAddressAdded={handleAddressAdded}
      removeItem={removeItem}
      incrementItemQuantity={incrementItemQuantity}
      decrementItemQuantity={decrementItemQuantity}
      handleSubmit={handleSubmit}
      form={form}
      errors={errors}
      handleChange={handleChange}
      isPending={isPending}
      onLoginSuccess={() => setIsAutofilled(false)}
      savedShippingAddresses={savedShippingAddresses}
      selectedSavedShippingAddressId={selectedSavedShippingAddressId}
      onSavedShippingAddressSelect={handleSavedShippingAddressSelect}
      isLoadingSavedShippingAddresses={isLoadingSavedShippingAddresses}
      savedShippingAddressesError={savedShippingAddressesError}
      savedBillingAddresses={savedBillingAddresses}
      selectedSavedBillingAddressId={selectedSavedBillingAddressId}
      onSavedBillingAddressSelect={handleSavedBillingAddressSelect}
      step={step}
      setStep={setStep}
      onAddressSelect={(address, isShipping = false) => {
        setForm((prev) => {
          let normalizedCountry = address.country;
          if (address.country === "Nederland") normalizedCountry = "Netherlands";
          if (address.country === "België" || address.country === "Belgique") normalizedCountry = "Belgium";
          if (address.country === "Deutschland") normalizedCountry = "Germany";
          
          const supportedCountries = ["Netherlands", "Belgium", "Germany"];
          
          if (isShipping) {
            const finalCountry = supportedCountries.includes(normalizedCountry) ? normalizedCountry : prev.shippingCountry;
            return {
              ...prev,
              shippingStreetAddress: address.street,
              shippingCity: address.city || prev.shippingCity,
              shippingState: address.state || prev.shippingState,
              shippingPostcode: address.postcode || prev.shippingPostcode,
              shippingCountry: finalCountry,
            };
          } else {
            const finalCountry = supportedCountries.includes(normalizedCountry) ? normalizedCountry : prev.country;
            return {
              ...prev,
              streetAddress: address.street,
              city: address.city || prev.city,
              state: address.state || prev.state,
              postcode: address.postcode || prev.postcode,
              country: finalCountry,
            };
          }
        });
        
        setErrors((prev) => {
          const next = { ...prev };
          if (isShipping) {
            if (address.street) delete next.shippingStreetAddress;
            if (address.city) delete next.shippingCity;
            if (address.state) delete next.shippingState;
            if (address.postcode) delete next.shippingPostcode;
          } else {
            if (address.street) delete next.streetAddress;
            if (address.city) delete next.city;
            if (address.state) delete next.state;
            if (address.postcode) delete next.postcode;
          }
          return next;
        });
      }}
      isLoggedIn={isLoggedIn}
      isEditingBilling={isEditingBilling}
      startEditingBilling={startEditingBilling}
      cancelEditingBilling={cancelEditingBilling}
      saveEditingBilling={saveEditingBilling}
      countriesList={countriesList}
    />
  );
}
interface AddAddressPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (savedId?: string | number) => void;
  editingAddress?: CheckoutSavedAddress | null;
  addressType?: 'billing' | 'shipping';
}

function AddAddressPopup({ open, onOpenChange, onSuccess, editingAddress, addressType = 'shipping' }: AddAddressPopupProps) {
  const t = useTranslations();
  const getLabel = (key: string, fallback: string) => {
    try {
      if (t.has && typeof t.has === 'function' && t.has(key as any)) {
        return t(key);
      }
    } catch (_) {}
    return fallback;
  };

  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryId, setCountryId] = useState('NL');
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [provinceId, setProvinceId] = useState<number | string>('');
  const [street, setStreet] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [label, setLabel] = useState<'office' | 'home'>('home');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingAddress) {
        setCompanyName(editingAddress.company || '');
        setVatNumber('');
        setFirstName(editingAddress.firstname || '');
        setLastName(editingAddress.lastname || '');
        setEmail(editingAddress.email || '');
        setPhone(editingAddress.phone || '');
        const rawC = editingAddress.country || 'NL';
        const matchC = countriesList.find((c: any) => c.id.toLowerCase() === rawC.toLowerCase() || c.name.toLowerCase() === rawC.toLowerCase());
        setCountryId(matchC ? matchC.id : rawC);
        setStreet(editingAddress.address1 || '');
        setStateRegion(editingAddress.state || editingAddress.address2 || '');
        setPostcode(editingAddress.postcode || '');
        setCity(editingAddress.city || '');
        setLabel(editingAddress.company === 'Office' ? 'office' : 'home');
      } else {
        setCompanyName('');
        setVatNumber('');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setCountryId('NL');
        setStreet('');
        setStateRegion('');
        setProvinceId('');
        setPostcode('');
        setCity('');
        setLabel('home');
      }
    }
  }, [open, editingAddress, countriesList]);

  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch('/api/countries');
        if (res.ok) {
          const data = await res.json();
          const list = data.countries || [];
          setCountriesList(list);
          if (editingAddress?.country) {
            const match = list.find((c: any) =>
              c.id.toLowerCase() === editingAddress.country.toLowerCase() ||
              c.name.toLowerCase() === editingAddress.country.toLowerCase()
            );
            if (match) {
              setCountryId(match.id);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching countries:', err);
      }
    }
    if (open) {
      loadCountries();
    }
  }, [open, editingAddress]);

  const selectedCountry = countriesList.find((c: any) => c.id === countryId || c.name.toLowerCase() === countryId.toLowerCase());
  const provinces = selectedCountry?.provinces || [];

  useEffect(() => {
    const provincesList = selectedCountry?.provinces || [];
    if (provincesList.length > 0) {
      const initialProvVal = editingAddress?.state || editingAddress?.address2 || stateRegion || '';
      const match = provincesList.find((p: any) =>
        String(p.id) === String(initialProvVal) ||
        p.name.toLowerCase() === String(initialProvVal).toLowerCase()
      );
      if (match) {
        setProvinceId(match.id);
        setStateRegion(match.name);
      } else {
        setProvinceId('');
        if (initialProvVal) {
          setStateRegion(initialProvVal);
        }
      }
    } else {
      setProvinceId('');
    }
  }, [countryId, selectedCountry, editingAddress]);

  const handleProvinceChange = (provIdStr: string) => {
    setProvinceId(provIdStr);
    const match = provinces.find((p: any) => String(p.id) === provIdStr);
    if (match) {
      setStateRegion(match.name);
    } else {
      setStateRegion('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        type: addressType,
        name: `${firstName} ${lastName}`,
        firstname: firstName,
        lastname: lastName,
        company_name: companyName || (label === 'office' ? 'Office' : ''),
        vat_number: vatNumber,
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

      if (editingAddress?.id) {
        payload.id = editingAddress.id;
      }

      const response = await fetch('/api/account/addresses', {
        method: editingAddress ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Save failed');
      }
      const responseData = await response.json().catch(() => ({}));
      const savedAddressId = responseData?.id || responseData?.data?.id || editingAddress?.id;

      const typeLabel = addressType === 'billing' ? 'Billing' : 'Shipping';
      toast.success(t('account.addressSavedSuccess', { type: typeLabel }));
      onSuccess(savedAddressId);
    } catch (error) {
      console.error(`${addressType} save error:`, error);
      toast.error(t('account.addressesLoadError'));
    } finally {
      setIsSaving(false);
    }
  };

  const labelClasses = "text-[18px] font-bold text-ink mb-2 block";
  const inputClasses = "w-full h-[52px] px-5 py-4 rounded-full border bg-white text-neutral-800 text-[16px] outline-none transition-all placeholder:text-subtle border-[#DDE1EA] focus:border-brand focus:ring-1 focus:ring-brand";

  const isBilling = addressType === 'billing';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[28px] border-none bg-white shadow-2xl sm:max-w-2xl w-full">
        {/* Header */}
        <div className="px-8 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <DialogTitle className="text-[#222222] text-[24px] sm:text-[28px] font-semibold font-['Segoe_UI'] leading-tight">
            {editingAddress
              ? (isBilling ? getLabel('account.editBillingAddress', 'Edit Billing Address') : getLabel('account.editAddress', 'Edit Shipping Address'))
              : (isBilling ? getLabel('account.addNewBillingAddress', 'Add New Billing Address') : getLabel('account.addNewAddress', 'Add New Shipping Address'))}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isBilling ? 'Form to add a new billing address' : 'Form to add a new shipping address'}
          </DialogDescription>
          <button 
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:border-neutral-300 transition-all shadow-sm shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
            {isBilling && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className={labelClasses}>{getLabel('checkout.companyName', 'Company name')}</span>
                  <input 
                    type="text" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    className={inputClasses} 
                    placeholder={getLabel('checkout.companyNamePlaceholder', 'Van Dijk Labels BV')} 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className={labelClasses}>{getLabel('checkout.vatNumber', 'VAT number')}</span>
                  <input 
                    type="text" 
                    value={vatNumber} 
                    onChange={(e) => setVatNumber(e.target.value)} 
                    className={inputClasses} 
                    placeholder={getLabel('checkout.vatNumberPlaceholder', 'NL123456789B01')} 
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className={labelClasses}>{getLabel('checkout.firstName', 'First Name')} *</span>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  className={inputClasses} 
                  required 
                  placeholder={getLabel('checkout.firstNamePlaceholder', 'Emma')} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className={labelClasses}>{getLabel('checkout.lastName', 'Last Name')} *</span>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  className={inputClasses} 
                  required 
                  placeholder={getLabel('checkout.lastNamePlaceholder', 'van Dijk')} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className={labelClasses}>{getLabel('checkout.email', 'Email')} *</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className={inputClasses} 
                  required 
                  placeholder="you@example.com" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className={labelClasses}>{getLabel('checkout.mobileNumber', 'Phone number')} *</span>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className={inputClasses} 
                  required 
                  placeholder="+31 6 1234 5678" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <span className={labelClasses}>{getLabel('checkout.country', 'Country')}</span>
              <div className="relative w-full">
                <select 
                  value={countryId} 
                  onChange={(e) => setCountryId(e.target.value)} 
                  className={`${inputClasses} appearance-none pr-10 bg-white`}
                >
                  {countriesList.length > 0 ? (
                    countriesList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="NL">{t('countries.netherlands', { defaultValue: 'Netherlands' })}</option>
                      <option value="BE">{t('countries.belgium', { defaultValue: 'Belgium' })}</option>
                      <option value="DE">{t('countries.germany', { defaultValue: 'Germany' })}</option>
                    </>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6L8 10L12 6" stroke="var(--subtle)" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className={labelClasses}>{getLabel('checkout.streetAddress', 'Street Address')} *</span>
                <input 
                  type="text" 
                  value={street} 
                  onChange={(e) => setStreet(e.target.value)} 
                  className={inputClasses} 
                  required 
                  placeholder={getLabel('checkout.streetAddressPlaceholder', 'Keizersgracht 214')} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className={labelClasses}>{getLabel('checkout.postcode', 'Postcode')} *</span>
                <input 
                  type="text" 
                  value={postcode} 
                  onChange={(e) => setPostcode(e.target.value)} 
                  className={inputClasses} 
                  required 
                  placeholder={getLabel('checkout.postcodePlaceholder', '1016 DW')} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className={labelClasses}>{getLabel('checkout.city', 'Town/City')} *</span>
                <input 
                  type="text" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  className={inputClasses} 
                  required 
                  placeholder={getLabel('checkout.cityPlaceholder', 'Amsterdam')} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className={labelClasses}>{getLabel('checkout.state', 'State')}</span>
                {provinces.length > 0 ? (
                  <div className="relative w-full">
                    <select 
                      value={provinceId} 
                      onChange={(e) => handleProvinceChange(e.target.value)} 
                      className={`${inputClasses} appearance-none pr-10 bg-white`}
                    >
                      <option value="">-- {getLabel('account.stateOptional', 'Select Province')} --</option>
                      {provinces.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 10L12 6" stroke="var(--subtle)" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                ) : (
                  <input 
                    type="text" 
                    value={stateRegion} 
                    onChange={(e) => setStateRegion(e.target.value)} 
                    className={inputClasses} 
                    placeholder={getLabel('checkout.statePlaceholder', 'State')} 
                  />
                )}
              </div>
            </div>

            {!isBilling && (
              <div className="flex flex-col gap-2 w-full">
                <label className={labelClasses}>{getLabel('account.selectLabelForDelivery', 'Select a label for effective delivery:')}</label>
                <div className="flex gap-2 w-full">
                  <button 
                    type="button" 
                    onClick={() => setLabel('office')}
                    className={`flex-1 p-4 bg-white border rounded-[52px] justify-start items-center gap-3 inline-flex cursor-pointer select-none transition-all ${
                      label === 'office' ? 'border-[#F18800] bg-[rgba(241,136,0,0.02)] border-[1.5px]' : 'border-[#E4EAF1]'
                    }`}
                  >
                    <div className="w-5 h-5 relative flex items-center justify-center flex-shrink-0">
                      {label === 'office' ? (
                        <div className="w-5 h-5 bg-[#F18800] rounded-full relative flex items-center justify-center">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.5 4L4 6.5L8.5 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-[#CAD3DF]"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#444444] fill-current">
                        <mask id="mask_office" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                          <rect width="20" height="20" fill="#D9D9D9"/>
                        </mask>
                        <g mask="url(#mask_office)">
                          <path d="M2.49967 18.332C2.04134 18.332 1.64898 18.1688 1.32259 17.8424C0.996202 17.5161 0.833008 17.1237 0.833008 16.6654V8.33203C0.833008 8.09592 0.912869 7.898 1.07259 7.73828C1.23231 7.57856 1.43023 7.4987 1.66634 7.4987C1.90245 7.4987 2.10037 7.57856 2.26009 7.73828C2.41981 7.898 2.49967 8.09592 2.49967 8.33203V16.6654H15.833C16.0691 16.6654 16.267 16.7452 16.4268 16.9049C16.5865 17.0647 16.6663 17.2626 16.6663 17.4987C16.6663 17.7348 16.5865 17.9327 16.4268 18.0924C16.267 18.2522 16.0691 18.332 15.833 18.332H2.49967ZM5.83301 14.9987C5.37467 14.9987 4.98231 14.8355 4.65592 14.5091C4.32954 14.1827 4.16634 13.7904 4.16634 13.332V4.9987C4.16634 4.76259 4.2462 4.56467 4.40592 4.40495C4.56565 4.24523 4.76356 4.16536 4.99967 4.16536H8.33301V2.4987C8.33301 2.04036 8.4962 1.648 8.82259 1.32161C9.14898 0.995226 9.54134 0.832031 9.99967 0.832031H13.333C13.7913 0.832031 14.1837 0.995226 14.5101 1.32161C14.8365 1.648 14.9997 2.04036 14.9997 2.4987V4.16536H18.333C18.5691 4.16536 18.767 4.24523 18.9268 4.40495C19.0865 4.56467 19.1663 4.76259 19.1663 4.9987V13.332C19.1663 13.7904 19.0031 14.1827 18.6768 14.5091C18.3504 14.8355 17.958 14.9987 17.4997 14.9987H5.83301ZM5.83301 13.332H17.4997V5.83203H5.83301V13.332ZM9.99967 4.16536H13.333V2.4987H9.99967V4.16536Z" fill="#444444" />
                        </g>
                      </svg>
                      <span className="text-[#444444] text-[20px] font-bold leading-6 font-['Segoe_UI']">{getLabel('account.office', 'Office')}</span>
                    </div>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setLabel('home')}
                    className={`flex-1 p-4 bg-white border rounded-[52px] justify-start items-center gap-3 inline-flex cursor-pointer select-none transition-all ${
                      label === 'home' ? 'border-[#F18800] bg-[rgba(241,136,0,0.02)] border-[1.5px]' : 'border-[#E4EAF1]'
                    }`}
                  >
                    <div className="w-5 h-5 relative flex items-center justify-center flex-shrink-0">
                      {label === 'home' ? (
                        <div className="w-5 h-5 bg-[#F18800] rounded-full relative flex items-center justify-center">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.5 4L4 6.5L8.5 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-[#CAD3DF]"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#444444] fill-current">
                        <mask id="mask_home" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                          <rect width="20" height="20" fill="#D9D9D9"/>
                        </mask>
                        <g mask="url(#mask_home)">
                          <path d="M4.99967 15.8346H7.49967V11.668C7.49967 11.4319 7.57954 11.2339 7.73926 11.0742C7.89898 10.9145 8.0969 10.8346 8.33301 10.8346H11.6663C11.9025 10.8346 12.1004 10.9145 12.2601 11.0742C12.4198 11.2339 12.4997 11.4319 12.4997 11.668V15.8346H14.9997V8.33464L9.99967 4.58464L4.99967 8.33464V15.8346ZM3.33301 15.8346V8.33464C3.33301 8.07075 3.39204 7.82075 3.51009 7.58464C3.62815 7.34852 3.79134 7.15408 3.99967 7.0013L8.99967 3.2513C9.29134 3.02908 9.62467 2.91797 9.99967 2.91797C10.3747 2.91797 10.708 3.02908 10.9997 3.2513L15.9997 7.0013C16.208 7.15408 16.3712 7.34852 16.4893 7.58464C16.6073 7.82075 16.6663 8.33464 16.6663 8.33464V15.8346C16.6663 16.293 16.5031 16.6853 16.1768 17.0117C15.8504 17.3381 15.458 17.5013 14.9997 17.5013H11.6663C11.4302 17.5013 11.2323 17.4214 11.0726 17.2617C10.9129 17.102 10.833 16.9041 10.833 16.668V12.5013H9.16634V16.668C9.16634 16.9041 9.08648 17.102 8.92676 17.2617C8.76704 17.4214 8.56912 17.5013 8.33301 17.5013H4.99967C4.54134 17.5013 4.14898 17.3381 3.82259 17.0117C3.4962 16.6853 3.33301 16.293 3.33301 15.8346Z" fill="#444444" />
                        </g>
                      </svg>
                      <span className="text-[#444444] text-[20px] font-bold leading-6 font-['Segoe_UI']">{getLabel('account.home', 'Home')}</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div className="w-full h-px bg-[#EDF2F7] my-2" />

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button 
                type="button" 
                onClick={() => onOpenChange(false)}
                className="h-[52px] px-8 rounded-full border border-black/10 text-[#444444] text-[18px] font-medium leading-6 font-['Segoe_UI'] inline-flex justify-center items-center hover:bg-slate-50 transition-all cursor-pointer w-full sm:w-[160px] shrink-0"
              >
                {getLabel('checkout.cancel', 'Cancel')}
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full sm:flex-1 h-[52px] px-4 rounded-full bg-[#F18800] hover:bg-brand-hover text-white text-[18px] font-medium leading-6 font-['Segoe_UI'] inline-flex justify-center items-center hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? getLabel('account.saving', 'Saving...') : getLabel('account.saveChanges', 'Save')}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
