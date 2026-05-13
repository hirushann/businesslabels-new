"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import EmptyState from "@/components/EmptyState";
import { type CartItem, useCart } from "@/components/CartProvider";
import { toast } from "sonner";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useTranslations } from 'next-intl';

type CheckoutFormState = {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
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
  browseHref,
  isPending,
  isLoggedIn,
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
  browseHref: string;
  isPending: boolean;
  isLoggedIn: boolean;
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
                  href="/products"
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
                    href="/products"
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

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-neutral-800 text-2xl font-bold leading-8">{t('checkout.deliveryInfo')}</h2>
                      <p className="text-neutral-600 text-sm leading-5">
                        {t('checkout.deliveryInfoDesc')}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.firstName')}</span>
                        <input className={inputClasses(Boolean(errors.firstName))} value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.lastName')}</span>
                        <input className={inputClasses(Boolean(errors.lastName))} value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.email')}</span>
                        <input className={inputClasses(Boolean(errors.email))} value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.mobileNumber')}</span>
                        <input className={inputClasses(Boolean(errors.mobileNumber))} value={form.mobileNumber} onChange={(e) => handleChange("mobileNumber", e.target.value)} />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-neutral-800 text-2xl font-bold leading-8">{t('checkout.address')}</h2>
                    </div>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-neutral-700">Snel adres zoeken (Google)</span>
                      <AddressAutocomplete
                        value={form.streetAddress}
                        onChange={(val) => handleChange("streetAddress", val)}
                        onAddressSelect={onAddressSelect}
                        className={inputClasses(Boolean(errors.streetAddress))}
                        hasError={Boolean(errors.streetAddress)}
                      />
                      <span className="text-sm font-semibold text-neutral-700">{t('checkout.streetAddress')}</span>
                      <input className={inputClasses(Boolean(errors.streetAddress))} value={form.streetAddress} onChange={(e) => handleChange("streetAddress", e.target.value)} />
                    </label>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <label className="flex flex-col gap-2 md:col-span-1">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.country')}</span>
                        <select className={inputClasses()} value={form.country} onChange={(e) => handleChange("country", e.target.value)}>
                          <option>Netherlands</option>
                          <option>Belgium</option>
                          <option>Germany</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 md:col-span-1">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.city')}</span>
                        <input className={inputClasses(Boolean(errors.city))} value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
                      </label>
                      <label className="flex flex-col gap-2 md:col-span-1">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.state')}</span>
                        <input className={inputClasses(Boolean(errors.state))} value={form.state} onChange={(e) => handleChange("state", e.target.value)} />
                      </label>
                      <label className="flex flex-col gap-2 md:col-span-1">
                        <span className="text-sm font-semibold text-neutral-700">{t('checkout.postcode')}</span>
                        <input className={inputClasses(Boolean(errors.postcode))} value={form.postcode} onChange={(e) => handleChange("postcode", e.target.value)} />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-neutral-800 text-2xl font-bold leading-8">{t('checkout.paymentMethod')}</h2>
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
                        <span className="text-base font-semibold text-neutral-800">Bancontact</span>
                      </label>

                      {isLoggedIn && (
                        <label 
                          className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${
                            form.paymentMethod === "banktransfer" ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:border-amber-200"
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            className="sr-only" 
                            checked={form.paymentMethod === "banktransfer"} 
                            onChange={() => handleChange("paymentMethod", "banktransfer")} 
                          />
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${form.paymentMethod === "banktransfer" ? "border-amber-500 bg-amber-500" : "border-slate-300"}`}>
                            {form.paymentMethod === "banktransfer" && <div className="h-2 w-2 rounded-full bg-white" />}
                          </div>
                          <span className="text-base font-semibold text-neutral-800">Bank Transfer</span>
                        </label>
                      )}
                    </div>
                    {errors.paymentMethod && <p className="text-sm text-red-500">{errors.paymentMethod}</p>}
                  </div>
                </div>
              </form>

              <aside className="bg-slate-50 p-8 lg:rounded-br-3xl lg:rounded-tr-3xl">
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-3">
                    <span className="text-neutral-600 text-base font-semibold leading-6">Total Price</span>
                    <span className="text-neutral-800 text-5xl font-bold leading-[56px]">{formatEuro(finalTotal)}</span>
                  </div>

                  <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between text-neutral-700">
                      <span>Subtotal</span>
                      <span className="font-semibold">{formatEuro(totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-700">
                      <span>Delivery</span>
                      <span className="font-semibold">{formatEuro(shippingAmount)}</span>
                    </div>
                    {paymentFee > 0 && (
                      <div className="flex items-center justify-between text-neutral-700">
                        <span>Payment Fee (2.5%)</span>
                        <span className="font-semibold">{formatEuro(paymentFee)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-neutral-700">
                      <span>Tax (21% VAT)</span>
                      <span className="font-semibold">{formatEuro(taxAmount)}</span>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="flex items-center justify-between text-neutral-800">
                      <span className="font-semibold">Final Total</span>
                      <span className="text-xl font-bold">{formatEuro(finalTotal)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-neutral-800 text-2xl font-bold leading-8">Product Information</h2>
                      <span className="text-amber-500 text-base font-semibold leading-6">({items.length})</span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {items.map((item) => {
                        const imageSrc = item.mainImage?.trim() || "https://placehold.co/120x96";
                        const isWarrantyItem = item.itemKind === "warranty";
                        const href = item.slug
                          ? item.type
                            ? { pathname: `/products/${item.slug}`, query: { type: item.type } }
                            : { pathname: `/products/${item.slug}` }
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
                                    <p className="text-blue-400 text-sm leading-5">SKU: {item.sku}</p>
                                    {isWarrantyItem ? (
                                      <p className="text-xs leading-4 text-neutral-500">Linked warranty</p>
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
                                      Qty {item.quantity}
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
                        Processing...
                      </>
                    ) : (
                      `Make Payment - ${formatEuro(finalTotal)}`
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

export default function CheckoutPageClient({
  mode = "live",
  demoItems = [],
}: CheckoutPageClientProps) {
  const cart = useCart();
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

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('auth_user'));
  }, []);

  useEffect(() => {
    if (isDemoMode || isAutofilled) return;

    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        
        // Split name if first/last are missing
        let firstName = user.firstName || user.firstname || user.first_name || '';
        let lastName = user.lastName || user.lastname || user.last_name || '';
        
        if (!firstName && user.name) {
          const parts = user.name.trim().split(/\s+/);
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }

        // Initial pre-fill from user object
        setForm(prev => ({
          ...prev,
          firstName: firstName || prev.firstName,
          lastName: lastName || prev.lastName,
          email: user.email || prev.email,
          mobileNumber: user.phone || user.mobile || user.mobile_number || user.mobileNumber || prev.mobileNumber,
        }));

        // Fetch addresses for more complete pre-fill
        fetch('/api/account/addresses')
          .then(res => res.json())
          .then(data => {
            const addresses = data.data || data.addresses || (Array.isArray(data) ? data : []);
            if (addresses.length > 0) {
              // Prefer shipping, then billing, then first available
              const addr = addresses.find((a: any) => a.type === 'shipping') || 
                           addresses.find((a: any) => a.type === 'billing') || 
                           addresses[0];
              
              setForm(prev => ({
                ...prev,
                firstName: addr.firstname || firstName || prev.firstName,
                lastName: addr.lastname || lastName || prev.lastName,
                streetAddress: addr.address || addr.street || addr.address_1 || addr.street_address || prev.streetAddress,
                city: addr.city || prev.city,
                state: addr.state || addr.province || addr.region || addr.province_id || prev.state,
                postcode: addr.postalcode || addr.postcode || addr.zip || addr.postal_code || prev.postcode,
                country: addr.country_id === 'NL' ? 'Netherlands' : 
                         addr.country_id === 'BE' ? 'Belgium' : 
                         addr.country_id === 'DE' ? 'Germany' : 
                         (addr.country_name || addr.country || prev.country),
              }));
            }
            setIsAutofilled(true);
          })
          .catch(err => {
            console.error('Failed to fetch addresses for autofill:', err);
            setIsAutofilled(true); // Don't keep trying if it fails
          });
      } catch (e) {
        console.error('Failed to parse auth_user for autofill:', e);
      }
    }
  }, [isDemoMode, isAutofilled]);


  const handleChange = (field: keyof CheckoutFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
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

    for (const field of requiredFields) {
      if (!form[field].trim()) {
        nextErrors[field] = "Required";
      }
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email";
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
    const productItems = items.filter(item => item.itemKind !== "warranty" && typeof item.id === "number");
    if (productItems.length === 0) {
      toast.error("Your cart doesn't contain any valid products.");
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
      billing_address: form.streetAddress,
      billing_city: form.city,
      billing_postalcode: form.postcode,
      billing_country_id: form.country === "Netherlands" ? "NL" : form.country === "Belgium" ? "BE" : "DE",
      shipping_amount: shippingAmount,
      tax_amount: taxAmount,
      payment_fee: paymentFee,
      payment_method: form.paymentMethod,
      total: finalTotal,
      order_items: items
        // Warranty items are addons and don't have numeric product IDs — exclude them
        .filter(item => item.itemKind !== "warranty" && typeof item.id === "number")
        .map(item => ({
          product_id: item.id as number,
          name: item.name?.trim() || item.sku || "Product",
          price: typeof item.price === "number" && Number.isFinite(item.price) ? item.price : 0,
          quantity: item.quantity
        }))
    };

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
        throw new Error(json.message || json.error || "Failed to create order");
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
      toast.success("Order placed successfully!");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to place order. Please check your details and try again.");
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
            <h1 className="text-3xl font-bold text-neutral-800">Order Placed!</h1>
            <p className="text-neutral-600 text-lg">
              Thank you for your order. We&apos;ve sent a confirmation email to <span className="font-semibold text-neutral-800">{form.email}</span>.
            </p>
          </div>
          
          {orderNumber && (
            <div className="bg-slate-50 rounded-xl px-6 py-4 border border-slate-100">
              <p className="text-sm text-neutral-500 font-medium uppercase tracking-wider">Order Number</p>
              <p className="text-2xl font-bold text-amber-500">{orderNumber}</p>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full pt-4">
            <Link 
              href="/my-account" 
              className="h-12 w-full rounded-full bg-amber-500 px-6 text-base font-semibold text-white transition-colors hover:bg-amber-600 flex items-center justify-center"
            >
              View My Orders
            </Link>
            <Link 
              href="/products" 
              className="h-12 w-full rounded-full border border-slate-200 px-6 text-base font-semibold text-neutral-700 transition-colors hover:bg-slate-50 flex items-center justify-center"
            >
              Continue Shopping
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
      browseHref={isDemoMode ? "/category/demo" : "/products"}
      isPending={isPending}
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
