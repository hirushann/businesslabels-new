"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState, useEffect } from "react";
import EmptyState from "@/components/EmptyState";
import { type CartItem, useCart } from "@/components/CartProvider";
import { toast } from "sonner";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useTranslations, useLocale } from 'next-intl';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
  return `h-12 rounded-xl border bg-white px-4 text-neutral-800 outline-none transition-colors ${
    hasError
      ? "border-red-300 focus:border-red-400"
      : "border-slate-200 focus:border-amber-400"
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
}: {
  items: CartItem[];
  totalAmount: number;
  removeItem: (key: string) => void;
  incrementItemQuantity: (key: string) => void;
  decrementItemQuantity: (key: string) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  form: CheckoutFormState;
  errors: Partial<Record<keyof CheckoutFormState, string>>;
  handleChange: (field: keyof CheckoutFormState, value: string) => void;
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
  }) => void;
}) {
  const t = useTranslations();
  const shippingAmount = useMemo(() => (items.length > 0 ? DELIVERY_FEE : 0), [items.length]);
  const paymentFee = useMemo(() => (form.paymentMethod === "creditcard" ? totalAmount * 0.025 : 0), [totalAmount, form.paymentMethod]);
  const taxAmount = useMemo(() => (totalAmount + shippingAmount + paymentFee) * 0.21, [totalAmount, shippingAmount, paymentFee]);
  const finalTotal = useMemo(() => totalAmount + shippingAmount + paymentFee + taxAmount, [totalAmount, shippingAmount, paymentFee, taxAmount]);
  const handleLoginKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onLoginSubmit();
    }
  };


  return (
    <div className="bg-slate-50 px-5 py-15">
      <div className="mx-auto max-w-[80%]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[2px_8px_40px_0px_rgba(109,109,120,0.10)]">
          {items.length === 0 ? (
            <div className="px-8 py-16">
              <EmptyState
                title={t('checkout.emptyCart')}
                description={t('checkout.emptyCartDescription')}
              />
              <div className="mt-8 flex justify-center">
                <Link
                  href="/product"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-amber-500 px-6 text-base font-semibold text-white transition-colors hover:bg-amber-600"
                >
                  {t('common.browseProducts')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_0.75fr]">
              <form
                id="checkout-form"
                onSubmit={handleSubmit}
                className="border-b border-slate-200 p-8 lg:border-b-0 lg:border-r"
              >
                <div className="flex flex-col gap-8">
                  <Link
                    href="/product"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 transition-colors hover:text-amber-500"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M11.25 4.5L6.75 9L11.25 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6.75 9H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {t('checkout.goBackToCart')}
                  </Link>
 
                  <div className="flex flex-col gap-2">
                    <h1 className="text-neutral-800 text-4xl font-bold leading-[48px]">{t('checkout.title')}</h1>
                    <p className="text-neutral-600 text-base leading-6">
                      {t('checkout.checkoutDescription')}
                    </p>
                  </div>

                  {!isLoggedIn && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
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
                              className="size-4 rounded border-slate-300 accent-amber-500"
                            />
                            {t('login.rememberMe')}
                          </label>
                          <button
                            type="button"
                            onClick={onLoginSubmit}
                            disabled={isLoginPending}
                            className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-800 px-5 text-sm font-bold text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isLoginPending ? t('checkout.loginLoading') : t('checkout.loginButton')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
 
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-neutral-800 text-2xl font-bold leading-8">{t('checkout.deliveryInfo')}</h2>
                      <p className="text-neutral-600 text-sm leading-5">
                        {t('checkout.deliveryInfoDesc')}
                      </p>
                    </div>
 
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.firstName')} <span className="text-red-500">*</span></span>
                        <input className={inputClasses(Boolean(errors.firstName))} value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
                        {errors.firstName && <span className="text-xs text-red-500 font-medium">{errors.firstName}</span>}
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.lastName')} <span className="text-red-500">*</span></span>
                        <input className={inputClasses(Boolean(errors.lastName))} value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
                        {errors.lastName && <span className="text-xs text-red-500 font-medium">{errors.lastName}</span>}
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.email')} <span className="text-red-500">*</span></span>
                        <input className={inputClasses(Boolean(errors.email))} value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
                        {errors.email && <span className="text-xs text-red-500 font-medium">{errors.email}</span>}
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.mobileNumber')} <span className="text-red-500">*</span></span>
                        <input className={inputClasses(Boolean(errors.mobileNumber))} value={form.mobileNumber} onChange={(e) => handleChange("mobileNumber", e.target.value)} />
                        {errors.mobileNumber && <span className="text-xs text-red-500 font-medium">{errors.mobileNumber}</span>}
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.companyName')}</span>
                        <input className={inputClasses(Boolean(errors.companyName))} value={form.companyName} onChange={(e) => handleChange("companyName", e.target.value)} />
                        {errors.companyName && <span className="text-xs text-red-500 font-medium">{errors.companyName}</span>}
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.vatNumber')}</span>
                        <input className={inputClasses(Boolean(errors.vatNumber))} value={form.vatNumber} onChange={(e) => handleChange("vatNumber", e.target.value)} />
                        {errors.vatNumber && <span className="text-xs text-red-500 font-medium">{errors.vatNumber}</span>}
                      </label>
                    </div>
                  </div>
 
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-neutral-800 text-2xl font-bold leading-8">{t('checkout.address')}</h2>
                    </div>
 
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-neutral-700">{t('checkout.quickAddressSearch')}</span>
                      <AddressAutocomplete
                        value={form.streetAddress}
                        onChange={(val) => handleChange("streetAddress", val)}
                        onAddressSelect={onAddressSelect}
                        className={inputClasses(Boolean(errors.streetAddress))}
                        hasError={Boolean(errors.streetAddress)}
                      />
                      <span className="text-sm font-semibold text-neutral-700">{t('checkout.streetAddress')} <span className="text-red-500">*</span></span>
                      <input className={inputClasses(Boolean(errors.streetAddress))} value={form.streetAddress} onChange={(e) => handleChange("streetAddress", e.target.value)} />
                      {errors.streetAddress && <span className="text-xs text-red-500 font-medium">{errors.streetAddress}</span>}
                    </label>
 
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <label className="flex flex-col gap-2 md:col-span-1">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.country')}</span>
                        <select className={inputClasses()} value={form.country} onChange={(e) => handleChange("country", e.target.value)}>
                          <option value="Netherlands">{t('countries.netherlands')}</option>
                          <option value="Belgium">{t('countries.belgium')}</option>
                          <option value="Germany">{t('countries.germany')}</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 md:col-span-1">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.city')} <span className="text-red-500">*</span></span>
                        <input className={inputClasses(Boolean(errors.city))} value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
                        {errors.city && <span className="text-xs text-red-500 font-medium">{errors.city}</span>}
                      </label>
                      <label className="flex flex-col gap-2 md:col-span-1">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.state')} <span className="text-red-500">*</span></span>
                        <input className={inputClasses(Boolean(errors.state))} value={form.state} onChange={(e) => handleChange("state", e.target.value)} />
                        {errors.state && <span className="text-xs text-red-500 font-medium">{errors.state}</span>}
                      </label>
                      <label className="flex flex-col gap-2 md:col-span-1">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.postcode')} <span className="text-red-500">*</span></span>
                        <input className={inputClasses(Boolean(errors.postcode))} value={form.postcode} onChange={(e) => handleChange("postcode", e.target.value)} />
                        {errors.postcode && <span className="text-xs text-red-500 font-medium">{errors.postcode}</span>}
                      </label>
                    </div>
                  </div>
 
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-neutral-800 text-2xl font-bold leading-8">{t('checkout.paymentMethod')} <span className="text-red-500">*</span></h2>
                      <p className="text-neutral-600 text-sm leading-5">
                        {t('checkout.paymentMethodDesc')}
                      </p>
                    </div>
 
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label 
                        className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${
                          form.paymentMethod === "ideal" ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:border-amber-200"
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          className="sr-only" 
                          checked={form.paymentMethod === "ideal"} 
                          onChange={() => handleChange("paymentMethod", "ideal")} 
                        />
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${form.paymentMethod === "ideal" ? "border-amber-500 bg-amber-500" : "border-slate-300"}`}>
                          {form.paymentMethod === "ideal" && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                        <span className="text-base font-semibold text-neutral-800">{t('checkout.ideal')}</span>
                      </label>
 
                      <label 
 
                        className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${
                          form.paymentMethod === "creditcard" ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:border-amber-200"
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          className="sr-only" 
                          checked={form.paymentMethod === "creditcard"} 
                          onChange={() => handleChange("paymentMethod", "creditcard")} 
                        />
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${form.paymentMethod === "creditcard" ? "border-amber-500 bg-amber-500" : "border-slate-300"}`}>
                          {form.paymentMethod === "creditcard" && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-base font-semibold text-neutral-800">{t('checkout.creditCard')}</span>
                          <span className="text-xs text-amber-600 font-medium">+2.5% fee</span>
                        </div>
                      </label>
 
                      <label 
                        className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${
                          form.paymentMethod === "bancontact" ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:border-amber-200"
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          className="sr-only" 
                          checked={form.paymentMethod === "bancontact"} 
                          onChange={() => handleChange("paymentMethod", "bancontact")} 
                        />
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${form.paymentMethod === "bancontact" ? "border-amber-500 bg-amber-500" : "border-slate-300"}`}>
                          {form.paymentMethod === "bancontact" && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                        <span className="text-base font-semibold text-neutral-800">{t('checkout.bancontact')}</span>
                      </label>
 
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label 
                            className={`flex items-start gap-4 rounded-xl border p-4 transition-all ${
                              isLoggedIn
                                ? form.paymentMethod === "banktransfer"
                                  ? "cursor-pointer border-amber-400 bg-amber-50"
                                  : "cursor-pointer border-slate-200 hover:border-amber-200"
                                : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70"
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
                            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${form.paymentMethod === "banktransfer" ? "border-amber-500 bg-amber-500" : "border-slate-300"}`}>
                              {form.paymentMethod === "banktransfer" && <div className="h-2 w-2 rounded-full bg-white" />}
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className={`text-base font-semibold ${isLoggedIn ? "text-neutral-800" : "text-neutral-500"}`}>
                                {t('checkout.invoice')}
                              </span>
                              {!isLoggedIn && (
                                <span className="text-xs font-semibold leading-4 text-neutral-500">
                                  {t('checkout.invoiceAccountOnly')}
                                </span>
                              )}
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
                    {errors.paymentMethod && <p className="text-sm text-red-500">{errors.paymentMethod}</p>}
                  </div>
                </div>
              </form>

              <aside className="bg-slate-50 p-8 lg:rounded-br-3xl lg:rounded-tr-3xl">
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-3">
                    <span className="text-neutral-600 text-base font-semibold leading-6">{t('checkout.totalPrice')}</span>
                    <span className="text-neutral-800 text-5xl font-bold leading-[56px]">{formatEuro(finalTotal)}</span>
                  </div>

                   <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between text-neutral-700">
                      <span>{t('checkout.subtotal')}</span>
                      <span className="font-semibold">{formatEuro(totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-700">
                      <span>{t('checkout.shipping')}</span>
                      <span className="font-semibold">{formatEuro(shippingAmount)}</span>
                    </div>
                    {paymentFee > 0 && (
                      <div className="flex items-center justify-between text-neutral-700">
                        <span>{t('checkout.paymentFeeLabel')}</span>
                        <span className="font-semibold">{formatEuro(paymentFee)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-neutral-700">
                      <span>{t('checkout.taxVatLabel')}</span>
                      <span className="font-semibold">{formatEuro(taxAmount)}</span>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="flex items-center justify-between text-neutral-800">
                      <span className="font-semibold">{t('checkout.finalTotal')}</span>
                      <span className="text-xl font-bold">{formatEuro(finalTotal)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-neutral-800 text-2xl font-bold leading-8">{t('checkout.productInformation')}</h2>
                      <span className="text-amber-500 text-base font-semibold leading-6">({items.length})</span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {items.map((item) => {
                        const imageSrc = item.mainImage?.trim() || "https://placehold.co/120x96";
                        const isWarrantyItem = item.itemKind === "warranty";
                        const href = item.slug
                          ? item.type
                            ? { pathname: `/product/${item.slug}`, query: { type: item.type } }
                            : { pathname: `/product/${item.slug}` }
                          : undefined;

                        const cardContent = (
                          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[2px_6px_20px_0px_rgba(109,109,120,0.06)]">
                            <div className="flex gap-4">
                              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                <Image src={imageSrc} alt={item.name} fill sizes="96px" className="object-cover" unoptimized />
                              </div>

                              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-neutral-800 text-base font-semibold leading-6">
                                      {item.name}
                                    </h3>
                                    <p className="text-[#479EF5] text-sm leading-5">SKU: {item.sku}</p>
                                    {isWarrantyItem ? (
                                      <p className="text-xs leading-4 text-neutral-500">{t('cart.linkedWarranty')}</p>
                                    ) : null}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      removeItem(item.key);
                                    }}
                                    aria-label={`Remove ${item.name} from checkout`}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                      <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                  </button>
                                </div>

                                <div className="mt-auto flex items-end justify-between gap-3">
                                  <span className="text-neutral-800 text-lg font-bold leading-6">{formatEuro(linePrice(item))}</span>

                                  {isWarrantyItem ? (
                                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                                      {t('cart.qty', { count: item.quantity })}
                                    </div>
                                  ) : (
                                    <div className="flex h-10 items-center rounded-full border border-slate-200 bg-white px-1">
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          decrementItemQuantity(item.key);
                                        }}
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-slate-100"
                                        aria-label={`Decrease quantity for ${item.name}`}
                                      >
                                        -
                                      </button>
                                      <span className="min-w-8 text-center text-sm font-semibold text-neutral-800">{item.quantity}</span>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          incrementItemQuantity(item.key);
                                        }}
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-slate-100"
                                        aria-label={`Increase quantity for ${item.name}`}
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );

                        if (!href || isWarrantyItem) {
                          return <div key={item.key}>{cardContent}</div>;
                        }

                        return (
                          <Link key={item.key} href={href} className="block">
                            {cardContent}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={isPending}
                    className="h-12 w-full rounded-full bg-amber-500 px-4 text-base font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('checkout.processing')}
                      </>
                    ) : (
                      t('checkout.makePayment', { amount: formatEuro(finalTotal) })
                    )}
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
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
    let profile = profilePayload ? extractPayloadObject(profilePayload) : {};
    let addresses = addressPayload ? extractAddressList(addressPayload) : [];

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
          readString(storedUserData, ["vat_number", "btw_number", "vatNumber"]),
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


  const handleChange = (field: keyof CheckoutFormState, value: string) => {
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

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof CheckoutFormState, string>> = {};
    const requiredFields: Array<keyof CheckoutFormState> = [
      "firstName",
      "lastName",
      "email",
      "mobileNumber",
      "streetAddress",
      "city",
      "state",
      "postcode",
      "paymentMethod",
    ];

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
      paymentMethod: t('checkout.paymentMethod'),
    };

    for (const field of requiredFields) {
      if (!form[field]?.trim()) {
        nextErrors[field] = t('validation.required', { field: fieldLabels[field] || field });
      }
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = t('validation.invalidEmail');
    }

    if (!isLoggedIn && form.paymentMethod === "banktransfer") {
      nextErrors.paymentMethod = t("checkout.invoiceAccountOnly");
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

    if (items.length === 0 || !validate()) {
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

    const orderData = {
      status: "pending",
      notes: "Customer order via checkout",
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
          window.location.href = "/login?redirect=/checkout";
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
      <div className="bg-slate-50 px-5 py-24 min-h-[70vh] flex items-center justify-center">
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
              <p className="text-2xl font-bold text-amber-500">{orderNumber}</p>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full pt-4">
            <Link 
              href="/my-account" 
              className="h-12 w-full rounded-full bg-amber-500 px-6 text-base font-semibold text-white transition-colors hover:bg-amber-600 flex items-center justify-center"
            >
              {t('checkout.viewMyOrders')}
            </Link>
            <Link 
              href="/product" 
              className="h-12 w-full rounded-full border border-slate-200 px-6 text-base font-semibold text-neutral-700 transition-colors hover:bg-slate-50 flex items-center justify-center"
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
      onAddressSelect={(address) => {
        setForm((prev) => {
          // Map Google Maps country names to our select options
          let normalizedCountry = address.country;
          if (address.country === "Nederland") normalizedCountry = "Netherlands";
          if (address.country === "België" || address.country === "Belgique") normalizedCountry = "Belgium";
          if (address.country === "Deutschland") normalizedCountry = "Germany";
          
          // Only update if it's one of our supported countries
          const supportedCountries = ["Netherlands", "Belgium", "Germany"];
          const finalCountry = supportedCountries.includes(normalizedCountry) ? normalizedCountry : prev.country;

          return {
            ...prev,
            streetAddress: address.street,
            city: address.city || prev.city,
            state: address.state || prev.state,
            postcode: address.postcode || prev.postcode,
            country: finalCountry,
          };
        });
        
        // Clear errors for auto-filled fields
        setErrors((prev) => {
          const next = { ...prev };
          if (address.street) delete next.streetAddress;
          if (address.city) delete next.city;
          if (address.state) delete next.state;
          if (address.postcode) delete next.postcode;
          return next;
        });
      }}
      isLoggedIn={isLoggedIn}
    />
  );
}
