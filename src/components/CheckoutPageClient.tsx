"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { useCart } from "@/components/CartProvider";

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
  cardNumber: string;
  expiryDate: string;
  cvv: string;
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
  cardNumber: "",
  expiryDate: "",
  cvv: "",
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

export default function CheckoutPageClient() {
  const {
    items,
    totalAmount,
    removeItem,
    incrementItemQuantity,
    decrementItemQuantity,
    clearCart,
  } = useCart();
  const [form, setForm] = useState<CheckoutFormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormState, string>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const finalTotal = useMemo(
    () => totalAmount + (items.length > 0 ? DELIVERY_FEE : 0),
    [items.length, totalAmount],
  );

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
      "cardNumber",
      "expiryDate",
      "cvv",
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (items.length === 0) {
      return;
    }

    if (!validate()) {
      return;
    }

    clearCart();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="bg-slate-50 px-6 py-12 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1240px]">
          <div className="rounded-[28px] border border-slate-200 bg-white px-8 py-16 shadow-[2px_8px_40px_0px_rgba(109,109,120,0.10)]">
            <EmptyState
              title="Order placed successfully"
              description="This is a demo checkout flow. Your cart has been cleared and no payment was processed."
            />
            <div className="mt-8 flex justify-center">
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center rounded-full bg-amber-500 px-6 text-base font-semibold text-white transition-colors hover:bg-amber-600"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 px-6 py-12 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-[1240px]">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[2px_8px_40px_0px_rgba(109,109,120,0.10)]">
          {items.length === 0 ? (
            <div className="px-8 py-16">
              <EmptyState
                title="Your cart is empty"
                description="Add products to your cart before moving to checkout."
              />
              <div className="mt-8 flex justify-center">
                <Link
                  href="/products"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-amber-500 px-6 text-base font-semibold text-white transition-colors hover:bg-amber-600"
                >
                  Browse Products
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr]">
              <form id="checkout-form" onSubmit={handleSubmit} className="border-b border-slate-200 p-8 lg:border-b-0 lg:border-r">
                <div className="flex flex-col gap-8">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 transition-colors hover:text-amber-500"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M11.25 4.5L6.75 9L11.25 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6.75 9H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Go Back to Cart
                  </Link>

                  <div className="flex flex-col gap-2">
                    <h1 className="text-neutral-800 text-4xl font-bold leading-[48px]">Checkout</h1>
                    <p className="text-neutral-600 text-base leading-6">
                      Fill out your delivery and payment details to complete this demo checkout flow.
                    </p>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-neutral-800 text-2xl font-bold leading-8">Delivery Information</h2>
                      <p className="text-neutral-600 text-sm leading-5">
                        We&apos;ll use these details for shipping and order confirmation.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">First Name</span>
                        <input className={inputClasses(Boolean(errors.firstName))} value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">Last Name</span>
                        <input className={inputClasses(Boolean(errors.lastName))} value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">Email</span>
                        <input className={inputClasses(Boolean(errors.email))} value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">Mobile Number</span>
                        <input className={inputClasses(Boolean(errors.mobileNumber))} value={form.mobileNumber} onChange={(e) => handleChange("mobileNumber", e.target.value)} />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-neutral-800 text-2xl font-bold leading-8">Address</h2>
                    </div>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-neutral-700">Street Address</span>
                      <input className={inputClasses(Boolean(errors.streetAddress))} value={form.streetAddress} onChange={(e) => handleChange("streetAddress", e.target.value)} />
                    </label>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <label className="flex flex-col gap-2 md:col-span-1">
                        <span className="text-sm font-semibold text-neutral-700">Country</span>
                        <select className={inputClasses()} value={form.country} onChange={(e) => handleChange("country", e.target.value)}>
                          <option>Netherlands</option>
                          <option>Belgium</option>
                          <option>Germany</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 md:col-span-1">
                        <span className="text-sm font-semibold text-neutral-700">Town/City</span>
                        <input className={inputClasses(Boolean(errors.city))} value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
                      </label>
                      <label className="flex flex-col gap-2 md:col-span-1">
                        <span className="text-sm font-semibold text-neutral-700">State</span>
                        <input className={inputClasses(Boolean(errors.state))} value={form.state} onChange={(e) => handleChange("state", e.target.value)} />
                      </label>
                      <label className="flex flex-col gap-2 md:col-span-1">
                        <span className="text-sm font-semibold text-neutral-700">Postcode</span>
                        <input className={inputClasses(Boolean(errors.postcode))} value={form.postcode} onChange={(e) => handleChange("postcode", e.target.value)} />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-neutral-800 text-2xl font-bold leading-8">Payment Information</h2>
                      <p className="text-neutral-600 text-sm leading-5">
                        Payment details are for UI demo purposes only and are never submitted.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.8fr_1fr_0.7fr]">
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">Card Number</span>
                        <input className={inputClasses(Boolean(errors.cardNumber))} value={form.cardNumber} onChange={(e) => handleChange("cardNumber", e.target.value)} placeholder="XXXX XXXX XXXX XXXX" />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">Expiry Date</span>
                        <input className={inputClasses(Boolean(errors.expiryDate))} value={form.expiryDate} onChange={(e) => handleChange("expiryDate", e.target.value)} placeholder="MM/YY" />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-neutral-700">CVV</span>
                        <input className={inputClasses(Boolean(errors.cvv))} value={form.cvv} onChange={(e) => handleChange("cvv", e.target.value)} placeholder="XXX" />
                      </label>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-neutral-700">
                      Payment details are secure and encrypted in a real checkout. This demo only simulates the experience.
                    </div>
                  </div>
                </div>
              </form>

              <aside className="bg-slate-50 p-8">
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-3">
                    <span className="text-neutral-600 text-base font-semibold leading-6">Total Price</span>
                    <span className="text-neutral-800 text-5xl font-bold leading-[56px]">{formatEuro(finalTotal)}</span>
                  </div>

                  <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 border border-slate-200">
                    <div className="flex items-center justify-between text-neutral-700">
                      <span>Subtotal</span>
                      <span className="font-semibold">{formatEuro(totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-700">
                      <span>Delivery</span>
                      <span className="font-semibold">{formatEuro(DELIVERY_FEE)}</span>
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
                        const linePrice = (item.price ?? 0) * item.quantity;

                        return (
                          <div key={item.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[2px_6px_20px_0px_rgba(109,109,120,0.06)]">
                            <div className="flex gap-4">
                              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                <Image src={imageSrc} alt={item.name} fill sizes="96px" className="object-cover" unoptimized />
                              </div>

                              <div className="flex min-w-0 flex-1 flex-col gap-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="text-neutral-800 text-base font-semibold leading-6">{item.name}</h3>
                                    <p className="text-blue-400 text-sm leading-5">SKU: {item.sku}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.key)}
                                    className="text-zinc-500 text-sm underline underline-offset-2 transition-colors hover:text-red-600"
                                  >
                                    Remove
                                  </button>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-neutral-800 text-lg font-bold leading-6">{formatEuro(linePrice)}</span>

                                  <div className="flex h-10 items-center rounded-full border border-slate-200 bg-white px-1">
                                    <button
                                      type="button"
                                      onClick={() => decrementItemQuantity(item.key)}
                                      className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-slate-100"
                                      aria-label={`Decrease quantity for ${item.name}`}
                                    >
                                      -
                                    </button>
                                    <span className="min-w-8 text-center text-sm font-semibold text-neutral-800">{item.quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => incrementItemQuantity(item.key)}
                                      className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-slate-100"
                                      aria-label={`Increase quantity for ${item.name}`}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    form="checkout-form"
                    className="h-12 w-full rounded-full bg-amber-500 px-4 text-base font-semibold text-white transition-colors hover:bg-amber-600"
                  >
                    Make Payment - {formatEuro(finalTotal)}
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
