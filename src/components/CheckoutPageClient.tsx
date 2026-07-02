"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState, useEffect } from "react";
import EmptyState from "@/components/EmptyState";
import { type CartItem, useCart } from "@/components/CartProvider";
import { toast } from "sonner";
import LoginPopup from "@/components/LoginPopup";
import RegisterPopup from "@/components/RegisterPopup";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useTranslations, useLocale } from 'next-intl';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { localePath } from "@/lib/i18n/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

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
  purchaseReference: "213321",
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
  purchaseReference: "213321",
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
  return `w-full h-[52px] px-5 py-4 rounded-full border bg-white text-neutral-800 text-[16px] outline-none transition-all placeholder-[#888888] ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400"
      : "border-[#DDE1EA] focus:border-[#F18800] focus:ring-1 focus:ring-[#F18800]"
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
  loginEmail,
  loginPassword,
  loginRemember,
  loginErrors,
  loginMessage,
  isLoginPending,
  onLoginEmailChange,
  onLoginPasswordChange,
  onLoginRememberChange,
  onLoginSubmit,
  onAddressSelect,
  step,
  setStep,
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
  loginEmail: string;
  loginPassword: string;
  loginRemember: boolean;
  loginErrors: { email?: string; password?: string };
  loginMessage: string;
  isLoginPending: boolean;
  onLoginEmailChange: (value: string) => void;
  onLoginPasswordChange: (value: string) => void;
  onLoginRememberChange: (value: boolean) => void;
  onLoginSubmit: () => void;
  onAddressSelect: (address: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  }, isShipping?: boolean) => void;
  step: 1 | 2 | 3;
  setStep: (step: 1 | 2 | 3) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const shippingAmount = useMemo(() => (items.length > 0 ? DELIVERY_FEE : 0), [items.length]);
  const paymentFee = useMemo(() => (form.paymentMethod === "creditcard" ? totalAmount * 0.025 : 0), [totalAmount, form.paymentMethod]);
  const taxAmount = useMemo(() => (totalAmount + shippingAmount + paymentFee) * 0.21, [totalAmount, shippingAmount, paymentFee]);
  const finalTotal = useMemo(() => totalAmount + shippingAmount + paymentFee + taxAmount, [totalAmount, shippingAmount, paymentFee, taxAmount]);
  const [isEditingRef, setIsEditingRef] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [isRegisterPopupOpen, setIsRegisterPopupOpen] = useState(false);

  const handleLoginKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onLoginSubmit();
    }
  };

  const breadcrumbs = [
    { label: t('checkout.title') || 'Checkout' }
  ];

  return (
    <div className="px-4 md:px-8 lg:px-10 py-12 min-h-screen" style={{
      background: "radial-gradient(circle at 15% 15%, rgba(241, 136, 0, 0.08) 0%, rgba(250, 251, 253, 0) 55%), #FAFBFD"
    }}>
      <div className="max-w-360 mx-auto w-full">
        
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} className="mb-8" />
        
        {/* Page Title */}
        <h1 className="text-[32px] font-semibold text-[#222222] font-['Segoe_UI'] mb-10 text-center">
          {t('checkout.title')}
        </h1>

        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          
          {/* Main Checkout Panel */}
          <div className="w-full flex-1 bg-white shadow-[2px_4px_20px_rgba(109,109,120,0.10)] rounded-xl border border-[#EDF2F7] flex flex-col overflow-hidden">
            
            {/* Step Progress Bar */}
            <div className="align-self-stretch px-6 py-4 bg-white border-b border-[#EDF2F7] flex flex-col justify-start items-center gap-4">
              <div className="relative overflow-hidden justify-start items-center gap-8 inline-flex" style={{ paddingRight: '0.06px' }}>
                <div className="absolute h-[2px] bg-[#EDF2F7] rounded-[5px]" style={{ width: '346px', left: '74.03px', top: '15px' }} />
                <div className="absolute h-[2px] bg-[#F18800] rounded-[5px] transition-all duration-300" style={{
                  width: step === 1 ? '0px' : step === 2 ? '173px' : '346px',
                  left: '74.03px',
                  top: '15px'
                }} />
                
                {/* Step 1: Billing Address */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="relative z-10 w-[140px] flex-col justify-start items-center gap-2 inline-flex focus:outline-none"
                >
                  <div className={`w-8 h-8 rounded-full justify-center items-center inline-flex transition-all ${
                    step > 1 ? "bg-[#F18800]" : "bg-white border-2 border-[#F18800]"
                  }`}>
                    {step > 1 ? (
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <span className="text-[#F18800] text-[18px] font-normal">1</span>
                    )}
                  </div>
                  <div className={`text-[14px] font-bold font-['Segoe_UI'] ${
                    step === 1 ? "text-[#F18800]" : "text-[#888888]"
                  }`}>
                    {t('checkout.billingAddress')}
                  </div>
                </button>

                {/* Step 2: Shipping Address */}
                <button
                  type="button"
                  onClick={() => step > 1 && setStep(2)}
                  disabled={step < 2}
                  className="relative z-10 w-[140px] flex-col justify-start items-center gap-2 inline-flex focus:outline-none disabled:cursor-not-allowed"
                >
                  <div className={`w-8 h-8 rounded-full justify-center items-center inline-flex transition-all ${
                    step > 2
                      ? "bg-[#F18800]"
                      : step === 2
                        ? "bg-white border-2 border-[#F18800]"
                        : "bg-[#F3F4F6]"
                  }`}>
                    {step > 2 ? (
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <span className={`text-[18px] font-normal ${
                        step === 2 ? "text-[#F18800]" : "text-[#888888]"
                      }`}>2</span>
                    )}
                  </div>
                  <div className={`text-[14px] font-bold font-['Segoe_UI'] ${
                    step === 2 ? "text-[#F18800]" : "text-[#888888]"
                  }`}>
                    {t('checkout.shippingAddress')}
                  </div>
                </button>

                {/* Step 3: Payment Method */}
                <div className="relative z-10 w-[140px] flex-col justify-start items-center gap-2 inline-flex">
                  <div className={`w-8 h-8 rounded-full justify-center items-center inline-flex transition-all ${
                    step === 3 ? "bg-white border-2 border-[#F18800]" : "bg-[#F3F4F6]"
                  }`}>
                    <span className={`text-[18px] font-normal ${
                      step === 3 ? "text-[#F18800]" : "text-[#888888]"
                    }`}>3</span>
                  </div>
                  <div className={`text-[14px] font-bold font-['Segoe_UI'] ${
                    step === 3 ? "text-[#F18800]" : "text-[#888888]"
                  }`}>
                    {t('checkout.paymentMethod')}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            {items.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <EmptyState
                  title={t('checkout.emptyCart')}
                  description={t('checkout.emptyCartDescription')}
                />
                <div className="mt-8 flex justify-center">
                  <Link
                    href={localePath("/product", locale)}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-[#F18800] px-6 text-base font-semibold text-white transition-colors hover:bg-amber-600"
                  >
                    {t('common.browseProducts')}
                  </Link>
                </div>
              </div>
            ) : (
              <form id="checkout-form" onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
                
                {/* LOGIN SECTION FOR GUESTS */}
                {step === 1 && !isLoggedIn && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 mb-4 hidden">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-bold text-neutral-800">{t('checkout.loginTitle')}</h2>
                        <p className="text-sm leading-5 text-neutral-600">{t('checkout.loginDescription')}</p>
                      </div>
                      {loginMessage && (
                        <div className="rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-semibold text-red-700">
                          {loginMessage}
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                          <span className="text-sm font-semibold text-neutral-700">{t('login.emailLabel')}</span>
                          <input
                            type="email"
                            autoComplete="email"
                            className={inputClasses(Boolean(loginErrors.email))}
                            value={loginEmail}
                            onChange={(event) => onLoginEmailChange(event.target.value)}
                            onKeyDown={handleLoginKeyDown}
                            disabled={isLoginPending}
                          />
                          {loginErrors.email && <span className="text-xs font-medium text-red-500">{loginErrors.email}</span>}
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-sm font-semibold text-neutral-700">{t('login.passwordLabel')}</span>
                          <input
                            type="password"
                            autoComplete="current-password"
                            className={inputClasses(Boolean(loginErrors.password))}
                            value={loginPassword}
                            onChange={(event) => onLoginPasswordChange(event.target.value)}
                            onKeyDown={handleLoginKeyDown}
                            disabled={isLoginPending}
                          />
                          {loginErrors.password && <span className="text-xs font-medium text-red-500">{loginErrors.password}</span>}
                        </label>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <label className="flex items-center gap-3 text-sm font-semibold text-neutral-600">
                          <input
                            type="checkbox"
                            checked={loginRemember}
                            onChange={(event) => onLoginRememberChange(event.target.checked)}
                            disabled={isLoginPending}
                            className="size-4 rounded border-slate-300 accent-[#F18800]"
                          />
                          {t('login.rememberMe')}
                        </label>
                        <button
                          type="button"
                          onClick={onLoginSubmit}
                          disabled={isLoginPending}
                          className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-800 px-5 text-sm font-bold text-white transition-colors hover:bg-[#F18800] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isLoginPending ? t('checkout.loginLoading') : t('checkout.loginButton')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 1: BILLING ADDRESS */}
                {step === 1 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-[#222222] text-[28px] font-bold leading-[33.6px]">{t('checkout.billingAddress')}</h2>
                      <p className="text-[#444444] text-[16px] font-normal leading-[20.8px]">
                        {t('checkout.billingDescription')}
                      </p>
                    </div>
                    <div className="h-px bg-[#EDF2F7] w-full" />

                    {/* Address Autocomplete Search (Billing) */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[18px] font-bold text-[#222222]">{t('checkout.quickAddressSearch')}</span>
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
                        <span className="text-[18px] font-bold text-[#222222]">{t('checkout.companyName')}</span>
                        <input
                          type="text"
                          value={form.companyName}
                          onChange={(e) => handleChange("companyName", e.target.value)}
                          placeholder="Van Dijk Labels BV"
                          className={inputClasses(Boolean(errors.companyName))}
                        />
                        {errors.companyName && <span className="text-xs text-red-500">{errors.companyName}</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[18px] font-bold text-[#222222]">{t('checkout.vatNumber')}</span>
                        <input
                          type="text"
                          value={form.vatNumber}
                          onChange={(e) => handleChange("vatNumber", e.target.value)}
                          placeholder="NL123456789B01"
                          className={inputClasses(Boolean(errors.vatNumber))}
                        />
                        {errors.vatNumber && <span className="text-xs text-red-500">{errors.vatNumber}</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[18px] font-bold text-[#222222]">{t('checkout.firstName')} *</span>
                        <input
                          type="text"
                          value={form.firstName}
                          onChange={(e) => handleChange("firstName", e.target.value)}
                          placeholder="Emma"
                          className={inputClasses(Boolean(errors.firstName))}
                        />
                        {errors.firstName && <span className="text-xs text-red-500">{errors.firstName}</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[18px] font-bold text-[#222222]">{t('checkout.lastName')} *</span>
                        <input
                          type="text"
                          value={form.lastName}
                          onChange={(e) => handleChange("lastName", e.target.value)}
                          placeholder="van Dijk"
                          className={inputClasses(Boolean(errors.lastName))}
                        />
                        {errors.lastName && <span className="text-xs text-red-500">{errors.lastName}</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[18px] font-bold text-[#222222]">{t('checkout.email')} *</span>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          placeholder="you@example.com"
                          className={inputClasses(Boolean(errors.email))}
                        />
                        {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[18px] font-bold text-[#222222]">{t('checkout.mobileNumber')} *</span>
                        <input
                          type="tel"
                          value={form.mobileNumber}
                          onChange={(e) => handleChange("mobileNumber", e.target.value)}
                          placeholder="+31 6 1234 5678"
                          className={inputClasses(Boolean(errors.mobileNumber))}
                        />
                        {errors.mobileNumber && <span className="text-xs text-red-500">{errors.mobileNumber}</span>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[18px] font-bold text-[#222222]">{t('checkout.country')}</span>
                      <div className="relative">
                        <select
                          value={form.country}
                          onChange={(e) => handleChange("country", e.target.value)}
                          className={`${inputClasses()} appearance-none pr-10`}
                        >
                          <option value="Netherlands">{t('countries.netherlands')}</option>
                          <option value="Belgium">{t('countries.belgium')}</option>
                          <option value="Germany">{t('countries.germany')}</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L8 10L12 6" stroke="#888888" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[18px] font-bold text-[#222222]">{t('checkout.streetAddress')} *</span>
                        <input
                          type="text"
                          value={form.streetAddress}
                          onChange={(e) => handleChange("streetAddress", e.target.value)}
                          placeholder="Keizersgracht 214"
                          className={inputClasses(Boolean(errors.streetAddress))}
                        />
                        {errors.streetAddress && <span className="text-xs text-red-500">{errors.streetAddress}</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[18px] font-bold text-[#222222]">{t('checkout.postcode')} *</span>
                        <input
                          type="text"
                          value={form.postcode}
                          onChange={(e) => handleChange("postcode", e.target.value)}
                          placeholder="1016 DW"
                          className={inputClasses(Boolean(errors.postcode))}
                        />
                        {errors.postcode && <span className="text-xs text-red-500">{errors.postcode}</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[18px] font-bold text-[#222222]">{t('checkout.city')} *</span>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => handleChange("city", e.target.value)}
                          placeholder="Amsterdam"
                          className={inputClasses(Boolean(errors.city))}
                        />
                        {errors.city && <span className="text-xs text-red-500">{errors.city}</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[18px] font-bold text-[#222222]">{t('checkout.state')}</span>
                        <input
                          type="text"
                          value={form.state}
                          onChange={(e) => handleChange("state", e.target.value)}
                          placeholder="North Holland"
                          className={inputClasses(Boolean(errors.state))}
                        />
                        {errors.state && <span className="text-xs text-red-500">{errors.state}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: SHIPPING ADDRESS */}
                {step === 2 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-[#222222] text-[28px] font-bold font-['Segoe_UI'] leading-[33.60px]">
                        {t('checkout.shippingAddress')}
                      </h2>
                      <p className="text-[#444444] text-[16px] font-normal font-['Segoe_UI'] leading-[20.80px]">
                        {t('checkout.deliveryInfoDesc') || "Enter the address where you'd like your order to be delivered."}
                      </p>
                    </div>
                    <div className="h-px bg-[#EDF2F7] w-full" />

                     {/* Toggle Same as Billing (Custom styled checkbox container) */}
                    <label className="w-full p-4 rounded-xl border border-[#DDE1EA] justify-start items-start gap-3 inline-flex cursor-pointer hover:bg-slate-50 transition-all select-none">
                      <input
                        type="checkbox"
                        checked={form.sameAsBilling}
                        onChange={(e) => handleChange("sameAsBilling", e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-[22px] h-[22px] rounded-[2px] flex items-center justify-center shrink-0 transition-all ${
                        form.sameAsBilling ? "bg-[#F18800] border-[1.5px] border-[#F18800]" : "border-[1.5px] border-[#BBC0CC]"
                      }`}>
                        {form.sameAsBilling && (
                          <svg width="12" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-col justify-center items-start gap-[12px] inline-flex">
                        <div className="text-[#222222] text-[18px] font-bold font-['Segoe_UI'] leading-[20px]">
                          {t('checkout.sameAsBilling') || "Use my billing address for shipping"}
                        </div>
                        <div className="text-[#444444] text-[14px] font-normal font-['Segoe_UI'] leading-[18.20px]">
                          {t('checkout.sameAsBillingSub') || "Fill in the fields below automatically with your billing address"}
                        </div>
                      </div>
                    </label>

                    {/* Info Warning Banner */}
                    {!isLoggedIn && (
                      <div className="w-full p-4 bg-gradient-to-br from-[#FFF7ED] to-white rounded-xl border border-[#E9CA9E] justify-start items-center gap-2 inline-flex">
                        <div className="flex-1 flex-col justify-center items-start gap-2 inline-flex">
                          <div className="justify-start items-start gap-2 inline-flex">
                            <div className="w-5 h-5 relative flex items-center justify-center">
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="2" width="16" height="16" rx="8" stroke="#222222" strokeWidth="1.5"/>
                                <path d="M10 6V11" stroke="#222222" strokeWidth="1.5" strokeLinecap="round"/>
                                <circle cx="10" cy="14" r="1" fill="#222222"/>
                              </svg>
                            </div>
                            <div className="text-[#222222] text-[18px] font-bold font-['Segoe_UI'] leading-[20px]">
                              {t('checkout.multipleShippingTitle')}
                            </div>
                          </div>
                          <div className="self-stretch text-[#444444] text-[14px] font-normal font-['Segoe_UI'] leading-[18.20px]">
                            {t.rich('checkout.multipleShippingDesc', {
                              registerLink: (chunks) => (
                                <button
                                  type="button"
                                  onClick={() => setIsLoginPopupOpen(true)}
                                  className="text-[#F18800] underline font-['Segoe_UI'] hover:text-[#d97706] cursor-pointer bg-transparent border-none p-0 inline align-baseline font-semibold"
                                >
                                  {chunks}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {!form.sameAsBilling && (
                      <div className="flex flex-col gap-4 mt-2">
                        {/* First Name & Last Name */}
                        <div className="self-stretch justify-start items-start gap-4 inline-flex w-full">
                          <div className="flex-1 flex-col justify-start items-start gap-2 inline-flex">
                            <div className="text-[#222222] text-[18px] font-bold font-['Segoe_UI'] leading-[20px]">
                              {t('checkout.firstName')} *
                            </div>
                            <input
                              type="text"
                              value={form.shippingFirstName}
                              onChange={(e) => handleChange("shippingFirstName", e.target.value)}
                              placeholder="First name"
                              className={inputClasses(Boolean(errors.shippingFirstName))}
                            />
                            {errors.shippingFirstName && <span className="text-xs text-red-500">{errors.shippingFirstName}</span>}
                          </div>
                          <div className="flex-1 flex-col justify-start items-start gap-2 inline-flex">
                            <div className="text-[#222222] text-[18px] font-bold font-['Segoe_UI'] leading-[20px]">
                              {t('checkout.lastName')} *
                            </div>
                            <input
                              type="text"
                              value={form.shippingLastName}
                              onChange={(e) => handleChange("shippingLastName", e.target.value)}
                              placeholder="Last name"
                              className={inputClasses(Boolean(errors.shippingLastName))}
                            />
                            {errors.shippingLastName && <span className="text-xs text-red-500">{errors.shippingLastName}</span>}
                          </div>
                        </div>

                        {/* Email & Phone Number */}
                        <div className="self-stretch justify-start items-start gap-4 inline-flex w-full">
                          <div className="flex-1 flex-col justify-start items-start gap-2 inline-flex">
                            <div className="text-[#222222] text-[18px] font-bold font-['Segoe_UI'] leading-[20px]">
                              {t('checkout.email')} *
                            </div>
                            <input
                              type="email"
                              value={form.email}
                              onChange={(e) => handleChange("email", e.target.value)}
                              placeholder="you@example.com"
                              className={inputClasses(Boolean(errors.email))}
                            />
                            {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                          </div>
                          <div className="flex-1 flex-col justify-start items-start gap-2 inline-flex">
                            <div className="text-[#222222] text-[18px] font-bold font-['Segoe_UI'] leading-[20px]">
                              {t('checkout.mobileNumber')} *
                            </div>
                            <input
                              type="tel"
                              value={form.mobileNumber}
                              onChange={(e) => handleChange("mobileNumber", e.target.value)}
                              placeholder="+555-113324"
                              className={inputClasses(Boolean(errors.mobileNumber))}
                            />
                            {errors.mobileNumber && <span className="text-xs text-red-500">{errors.mobileNumber}</span>}
                          </div>
                        </div>

                        {/* Country / Region */}
                        <div className="w-full flex-col justify-start items-start gap-2 inline-flex">
                          <div className="text-[#222222] text-[18px] font-bold font-['Segoe_UI'] leading-[20px]">
                            {t('checkout.country') || "Country / Region"}
                          </div>
                          <div className="relative w-full">
                            <select
                              value={form.shippingCountry}
                              onChange={(e) => handleChange("shippingCountry", e.target.value)}
                              className={`${inputClasses()} appearance-none pr-10`}
                            >
                              <option value="Netherlands">{t('countries.netherlands')}</option>
                              <option value="Belgium">{t('countries.belgium')}</option>
                              <option value="Germany">{t('countries.germany')}</option>
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6L8 10L12 6" stroke="#888888" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Street & Postcode */}
                        <div className="self-stretch justify-start items-start gap-4 inline-flex w-full">
                          <div className="flex-1 flex-col justify-start items-start gap-2 inline-flex">
                            <div className="text-[#222222] text-[18px] font-bold font-['Segoe_UI'] leading-[20px]">
                              {t('checkout.streetAddress')} *
                            </div>
                            <AddressAutocomplete
                              value={form.shippingStreetAddress}
                              onChange={(val) => handleChange("shippingStreetAddress", val)}
                              onAddressSelect={(addr) => onAddressSelect(addr, true)}
                              className={inputClasses(Boolean(errors.shippingStreetAddress))}
                              placeholder="Street and house number"
                            />
                            {errors.shippingStreetAddress && <span className="text-xs text-red-500">{errors.shippingStreetAddress}</span>}
                          </div>
                          <div className="flex-1 flex-col justify-start items-start gap-2 inline-flex">
                            <div className="text-[#222222] text-[18px] font-bold font-['Segoe_UI'] leading-[20px]">
                              {t('checkout.postcode')} *
                            </div>
                            <input
                              type="text"
                              value={form.shippingPostcode}
                              onChange={(e) => handleChange("shippingPostcode", e.target.value)}
                              placeholder="Postcode"
                              className={inputClasses(Boolean(errors.shippingPostcode))}
                            />
                            {errors.shippingPostcode && <span className="text-xs text-red-500">{errors.shippingPostcode}</span>}
                          </div>
                        </div>

                        {/* City (Place) & State */}
                        <div className="self-stretch justify-start items-start gap-4 inline-flex w-full">
                          <div className="flex-1 flex-col justify-start items-start gap-2 inline-flex">
                            <div className="text-[#222222] text-[18px] font-bold font-['Segoe_UI'] leading-[20px]">
                              {t('checkout.city') || "Place"} *
                            </div>
                            <input
                              type="text"
                              value={form.shippingCity}
                              onChange={(e) => handleChange("shippingCity", e.target.value)}
                              placeholder="Place"
                              className={inputClasses(Boolean(errors.shippingCity))}
                            />
                            {errors.shippingCity && <span className="text-xs text-red-500">{errors.shippingCity}</span>}
                          </div>
                          <div className="flex-1 flex-col justify-start items-start gap-2 inline-flex">
                            <div className="text-[#222222] text-[18px] font-bold font-['Segoe_UI'] leading-[20px]">
                              {t('checkout.state') || "State (optional)"}
                            </div>
                            <input
                              type="text"
                              value={form.shippingState}
                              onChange={(e) => handleChange("shippingState", e.target.value)}
                              placeholder="State"
                              className={inputClasses(Boolean(errors.shippingState))}
                            />
                            {errors.shippingState && <span className="text-xs text-red-500">{errors.shippingState}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: PAYMENT METHOD */}
                {step === 3 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-[#222222] text-[28px] font-bold leading-[33.6px]">{t('checkout.paymentMethod')} *</h2>
                      <p className="text-[#444444] text-[16px] font-normal leading-[20.8px]">
                        {t('checkout.paymentMethodDesc')}
                      </p>
                    </div>
                    <div className="h-px bg-[#EDF2F7] w-full" />

                    <div className="flex flex-col gap-4">
                      {/* iDEAL */}
                      <label
                        className={`flex cursor-pointer items-center justify-between p-4 rounded-xl border transition-all ${
                          form.paymentMethod === "ideal"
                            ? "border-[#F18800] bg-[rgba(241,136,0,0.02)]"
                            : "border-[#E0E7EE] bg-white hover:border-amber-200"
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
                            <div className="w-5 h-5 rounded-full bg-[#F18800] flex items-center justify-center shrink-0">
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-[#CAD3DF] shrink-0" />
                          )}
                          <div className="flex items-center gap-[10px]">
                            <img className="w-[32px] h-[28px] object-contain" src="/ideal-logo.png" alt="iDEAL" />
                            <span className="text-[#222222] text-[22px] font-bold font-['Segoe_UI'] leading-[28px]">{t('checkout.ideal')}</span>
                          </div>
                        </div>
                      </label>

                      {/* Credit Card */}
                      <label
                        className={`flex cursor-pointer items-center justify-between p-4 rounded-xl border transition-all ${
                          form.paymentMethod === "creditcard"
                            ? "border-[#F18800] bg-[rgba(241,136,0,0.02)]"
                            : "border-[#E0E7EE] bg-white hover:border-amber-200"
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
                            <div className="w-5 h-5 rounded-full bg-[#F18800] flex items-center justify-center shrink-0">
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
                              <span className="text-[#222222] text-[22px] font-bold font-['Segoe_UI'] leading-[28px]">{t('checkout.creditCard')}</span>
                              <span className="text-xs text-amber-600 font-medium font-['Segoe_UI']">+2.5% fee</span>
                            </div>
                          </div>
                        </div>
                      </label>

                      {/* Bancontact */}
                      <label
                        className={`flex cursor-pointer items-center justify-between p-4 rounded-xl border transition-all ${
                          form.paymentMethod === "bancontact"
                            ? "border-[#F18800] bg-[rgba(241,136,0,0.02)]"
                            : "border-[#E0E7EE] bg-white hover:border-amber-200"
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
                            <div className="w-5 h-5 rounded-full bg-[#F18800] flex items-center justify-center shrink-0">
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-[#CAD3DF] shrink-0" />
                          )}
                          <div className="flex items-center gap-[10px]">
                            <img className="w-[33px] h-[28px] object-contain rounded" src="/bancontact-logo.webp" alt="Bancontact" />
                            <span className="text-[#222222] text-[22px] font-bold font-['Segoe_UI'] leading-[28px]">{t('checkout.bancontact')}</span>
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
                                  ? "cursor-pointer border-[#F18800] bg-[rgba(241,136,0,0.02)]"
                                  : "cursor-pointer border-[#E0E7EE] bg-white hover:border-amber-200"
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
                                <div className="w-5 h-5 rounded-full bg-[#F18800] flex items-center justify-center shrink-0">
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
                                  <span className={`text-[22px] font-bold font-['Segoe_UI'] leading-[28px] ${isLoggedIn ? "text-[#222222]" : "text-neutral-500"}`}>
                                    {t('checkout.invoice')}
                                  </span>
                                  {!isLoggedIn && (
                                    <span className="text-xs font-semibold leading-4 text-neutral-500 font-['Segoe_UI']">
                                      {t('checkout.invoiceAccountOnly')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </label>
                        </TooltipTrigger>
                        <TooltipContent className="p-4 bg-white border border-slate-200 shadow-xl text-neutral-800 rounded-2xl max-w-[300px]">
                          <p className="font-medium text-sm font-['Segoe_UI']">
                            {isLoggedIn ? t('checkout.bankTransferTooltip') : t('checkout.invoiceAccountOnly')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {errors.paymentMethod && <p className="text-sm text-red-500 font-medium font-['Segoe_UI']">{errors.paymentMethod}</p>}
                  </div>
                )}

                {/* BOTTOM NAVIGATION ACTIONS */}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-[#EDF2F7]">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep((step - 1) as 1 | 2)}
                      className="w-[160px] h-[52px] rounded-full border border-[rgba(0,0,0,0.10)] text-[#444444] font-bold text-[18px] hover:bg-slate-50 transition-colors flex items-center justify-center"
                    >
                      {t('common.previous') || "Back"}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 h-[52px] bg-[#F18800] text-white rounded-full font-bold text-[18px] flex items-center justify-center gap-2 hover:bg-[#d97706] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              </form>
            )}
          </div>

          {/* Right Sidebar: Order Summary & Purchase Reference */}
          <div className="w-full lg:w-[360px] flex flex-col gap-6 shrink-0">
            
            {/* Your Order Card */}
            <div className="w-full bg-white shadow-[2px_4px_20px_rgba(109,109,120,0.06)] rounded-xl border border-[#EDF2F7] flex flex-col overflow-hidden">
              <div className="w-full p-4 bg-[#F7F9FA] border-[#E5E7EB] border flex items-center justify-center">
                <h3 className="text-[#222222] text-xl font-bold uppercase tracking-wider">{t('checkout.yourOrder')}</h3>
              </div>

              <div className="p-4 flex flex-col gap-4">
                {/* Product List */}
                <div className="flex flex-col gap-4">
                  {items.map((item) => {
                    const imageSrc = item.mainImage?.trim() || "https://placehold.co/62x62";
                    return (
                      <div key={item.key} className="w-full flex items-center gap-3">
                        <div className="w-[62px] h-[62px] p-1 bg-[#EDF2F7] rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                          <img src={imageSrc} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 flex items-start justify-between gap-2 min-w-0">
                          <div className="flex flex-col min-w-0">
                            <h4 className="text-[#444444] text-[16px] font-bold truncate leading-[19.2px]">{item.name}</h4>
                            <span className="text-[#888888] text-sm mt-1">{item.quantity} {item.quantity === 1 ? t('checkout.item') : t('checkout.items')}</span>
                          </div>
                          <span className="text-[#222222] text-[18px] font-bold shrink-0">{formatEuro(linePrice(item))}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="h-px bg-[#EDF2F7] w-full" />

                {/* Subtotals */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[18px]">
                    <span className="text-[#222222] font-bold">{t('checkout.subtotal')}</span>
                    <span className="text-[#222222] font-bold">{formatEuro(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[18px]">
                    <span className="text-[#222222] font-bold">{t('checkout.shipping')}</span>
                    <span className="text-[#222222] font-bold">{formatEuro(shippingAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[18px]">
                    <span className="text-[#222222] font-bold">{t('checkout.vat')} (21%)</span>
                    <span className="text-[#222222] font-bold">{formatEuro(taxAmount)}</span>
                  </div>
                  {paymentFee > 0 && (
                    <div className="flex justify-between items-center text-[18px]">
                      <span className="text-[#222222] font-bold">{t('checkout.paymentFeeLabel')}</span>
                      <span className="text-[#222222] font-bold">{formatEuro(paymentFee)}</span>
                    </div>
                  )}
                  {paymentFee < 0 && (
                    <div className="flex justify-between items-center text-[18px]">
                      <span className="text-[#222222] font-bold">{t('checkout.discount')}</span>
                      <span className="text-[#DD3333] font-bold">-{formatEuro(Math.abs(paymentFee))}</span>
                    </div>
                  )}

                  <div className="h-px bg-[#D9E3ED] w-full mt-1" />

                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[#222222] text-[20px] font-bold">{t('checkout.totalInclVat')}</span>
                    <span className="text-[#222222] text-[20px] font-semibold">{formatEuro(finalTotal)}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Purchase Reference Card */}
            <div className="w-full p-4 bg-gradient-to-br from-[#FFF7ED] to-white rounded-xl border-2 border-[#FFEDD4] flex flex-col gap-3">
              <h3 className="text-[#222222] text-[20px] font-bold leading-6">{t('checkout.purchaseReference')}</h3>
              
              <div className="relative w-full h-[52px]">
                <input
                  type="text"
                  value={form.purchaseReference}
                  onChange={(e) => handleChange("purchaseReference", e.target.value)}
                  disabled={!isEditingRef}
                  className={`w-full h-full pl-5 pr-14 rounded-full border bg-white font-medium outline-none transition-all ${
                    isEditingRef ? "border-[#F18800]" : "border-[#DDE1EA] text-[#888888] cursor-not-allowed"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setIsEditingRef(!isEditingRef)}
                  className="absolute right-2 top-2 w-9 h-9 bg-[#EDF2F7] rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
                  aria-label="Edit Purchase Reference"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      <LoginPopup
        open={isLoginPopupOpen}
        onOpenChange={setIsLoginPopupOpen}
        onSwitchToRegister={() => {
          setIsLoginPopupOpen(false);
          setIsRegisterPopupOpen(true);
        }}
      />
      <RegisterPopup
        open={isRegisterPopupOpen}
        onOpenChange={setIsRegisterPopupOpen}
        onSwitchToLogin={() => {
          setIsRegisterPopupOpen(false);
          setIsLoginPopupOpen(true);
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

function countryFromAddress(address: Record<string, unknown>, fallback: string) {
  const countryId = readString(address, ["country_id", "countryCode", "country_code"]).toUpperCase();

  if (countryId === "NL") return "Netherlands";
  if (countryId === "BE") return "Belgium";
  if (countryId === "DE") return "Germany";

  return readString(address, ["country_name", "country"]) || fallback;
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
    ]) ||
    readNestedString(address, ["state", "province", "region"], ["name", "title", "label", "code"])
  );
}

function valueWhenBlank(current: string, next: string) {
  return current.trim() ? current : next || current;
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
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRemember, setLoginRemember] = useState(true);
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [loginMessage, setLoginMessage] = useState("");
  const [isLoginPending, setIsLoginPending] = useState(false);

  const autofillCustomerDetails = useCallback(async () => {
    if (isDemoMode) return;

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
      setIsAutofilled(true);
      return;
    }

    const preferredAddress =
      addresses.find((address) => readString(address, ["type"]) === "billing") ??
      addresses.find((address) => readString(address, ["type"]) === "shipping") ??
      addresses[0] ??
      null;

    const profileName = splitName(finalProfile);
    const storedName = splitName(storedUserData);
    const addressName = splitName(preferredAddress);
    const profilePhone = readString(finalProfile, ["phone", "telephone", "mobile", "mobile_number", "mobileNumber"]);
    const storedPhone = readString(storedUserData, ["phone", "telephone", "mobile", "mobile_number", "mobileNumber"]);
    const addressPhone = readString(preferredAddress, ["phone", "telephone", "mobile", "mobile_number", "mobileNumber"]);

    setForm((prev) => ({
      ...prev,
      firstName: valueWhenBlank(prev.firstName, profileName.firstName || storedName.firstName || addressName.firstName),
      lastName: valueWhenBlank(prev.lastName, profileName.lastName || storedName.lastName || addressName.lastName),
      email: valueWhenBlank(prev.email, readString(finalProfile, ["email"]) || readString(storedUserData, ["email"]) || readString(preferredAddress, ["email"])),
      mobileNumber: valueWhenBlank(prev.mobileNumber, profilePhone || storedPhone || addressPhone),
      companyName: valueWhenBlank(
        prev.companyName,
        readString(preferredAddress, ["company", "company_name", "business_name"]) ||
          readString(finalProfile, ["company", "company_name", "business_name"]) ||
          readString(storedUserData, ["company", "company_name", "business_name"]),
      ),
      vatNumber: valueWhenBlank(
        prev.vatNumber,
        readString(preferredAddress, ["vat_number", "btw_number", "vatNumber"]) ||
          readString(finalProfile, ["vat_number", "btw_number", "vatNumber"]) ||
          readString(storedUserData, ["company", "company_name", "business_name"]),
      ),
      streetAddress: valueWhenBlank(prev.streetAddress, readString(preferredAddress, ["address", "street", "address_1", "street_address"])),
      city: valueWhenBlank(prev.city, readString(preferredAddress, ["city", "town", "locality"])),
      state: valueWhenBlank(prev.state, readAddressState(preferredAddress)),
      postcode: valueWhenBlank(prev.postcode, readString(preferredAddress, ["postalcode", "postcode", "zip", "postal_code"])),
      country: preferredAddress ? countryFromAddress(preferredAddress, prev.country) : prev.country,
    }));

    setIsAutofilled(true);
  }, [isDemoMode]);

  useEffect(() => {
    const refreshAuthState = () => {
      const hasUser = !!localStorage.getItem("auth_user");
      setIsLoggedIn(hasUser);

      if (!hasUser) {
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
    if (field === "paymentMethod" && value === "banktransfer" && !isLoggedIn) {
      setForm((current) => ({ ...current, paymentMethod: "" }));
      setErrors((current) => ({ ...current, paymentMethod: t("checkout.invoiceAccountOnly") }));
      return;
    }

    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleCheckoutLogin = async () => {
    setIsLoginPending(true);
    setLoginErrors({});
    setLoginMessage("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword, remember: loginRemember }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setLoginErrors({
          email: data.errors?.email?.[0],
          password: data.errors?.password?.[0],
        });
        setLoginMessage(data.message || t("checkout.loginError"));
        return;
      }

      const user = extractUser(data, loginEmail);
      localStorage.setItem("auth_user", JSON.stringify(user));
      setIsLoggedIn(true);
      setIsAutofilled(false);
      window.dispatchEvent(new Event("auth-user-updated"));
      toast.success(t("checkout.loginSuccess"));
    } catch {
      setLoginMessage(t("checkout.loginError"));
    } finally {
      setIsLoginPending(false);
    }
  };

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

    const shippingAmount = items.length > 0 ? DELIVERY_FEE : 0;
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
      notes: form.purchaseReference,
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
      billing_country_id: form.country === "Netherlands" ? "NL" : form.country === "Belgium" ? "BE" : "DE",
      
      shipping_firstname: shippingFirst,
      shipping_lastname: shippingLast,
      shipping_address: shippingStreet,
      shipping_city: shippingCityVal,
      shipping_state: shippingStateVal,
      shipping_province: shippingStateVal,
      shipping_postalcode: shippingPostcodeVal,
      shipping_country_id: shippingCountryVal === "Netherlands" ? "NL" : shippingCountryVal === "Belgium" ? "BE" : "DE",

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
          window.location.href = `${localePath("/login", locale)}?redirect=${encodeURIComponent(localePath("/checkout", locale))}`;
          return;
        }
        
        toast.error(json.message || json.error || "Failed to create order");
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
      <div className="bg-[#FAFBFD] px-5 py-24 min-h-[70vh] flex items-center justify-center">
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
              <p className="text-2xl font-bold text-[#F18800]">{orderNumber}</p>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full pt-4">
            <Link 
              href="/my-account" 
              className="h-12 w-full rounded-full bg-[#F18800] px-6 text-base font-bold text-white transition-colors hover:bg-amber-600 flex items-center justify-center"
            >
              {t('checkout.viewMyOrders')}
            </Link>
            <Link 
              href="/product" 
              className="h-12 w-full rounded-full border border-slate-200 px-6 text-base font-bold text-neutral-700 transition-colors hover:bg-slate-50 flex items-center justify-center"
            >
              {t('common.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CheckoutShell
      items={items}
      totalAmount={totalAmount}
      removeItem={removeItem}
      incrementItemQuantity={incrementItemQuantity}
      decrementItemQuantity={decrementItemQuantity}
      handleSubmit={handleSubmit}
      form={form}
      errors={errors}
      handleChange={handleChange}
      isPending={isPending}
      loginEmail={loginEmail}
      loginPassword={loginPassword}
      loginRemember={loginRemember}
      loginErrors={loginErrors}
      loginMessage={loginMessage}
      isLoginPending={isLoginPending}
      onLoginEmailChange={setLoginEmail}
      onLoginPasswordChange={setLoginPassword}
      onLoginRememberChange={setLoginRemember}
      onLoginSubmit={handleCheckoutLogin}
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
    />
  );
}
