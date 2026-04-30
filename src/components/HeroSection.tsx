"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PrinterSelect } from "./PrinterSelect";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";

export default function HeroSection() {
  const [selectedPrinters, setSelectedPrinters] = useState<number[]>([]);
  const [productType, setProductType] = useState<string>("");

  const handleShowProducts = () => {
    if (selectedPrinters.length === 0) {
      toast.error("Please select at least one printer model");
      return;
    }
    if (!productType) {
      toast.error("Please select a product type");
      return;
    }
    // TODO: Make API call with selectedPrinters and productType
    console.log("API call with:", { selectedPrinters, productType });
  };

  return (
    <section className="relative w-full h-[85vh] overflow-hidden">
      {/* Background image */}
      <Image
        src="/Herobg.png"
        alt="Hero background"
        fill
        className="object-cover object-center"
        priority
      />
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-black/40 to-black/0" />
      <div className="absolute inset-0 bg-gradient-to-br from-stone-700/70 to-yellow-950/60" />

      {/* Content */}
      <div className="relative z-10 max-w-360 mx-auto h-full flex items-center">
        <div className="w-full flex justify-start items-center gap-12">
          {/* Left: text & CTAs */}
          <div className="flex-1 flex flex-col gap-12">
            <div className="flex flex-col gap-6">
              {/* Badge */}
              <div className="flex items-center gap-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.4787 12.8896L16.9937 21.4156C17.0107 21.516 16.9966 21.6192 16.9533 21.7114C16.9101 21.8036 16.8397 21.8803 16.7516 21.9314C16.6636 21.9825 16.562 22.0055 16.4605 21.9974C16.359 21.9892 16.2624 21.9502 16.1837 21.8856L12.6037 19.1986C12.4309 19.0695 12.2209 18.9998 12.0052 18.9998C11.7895 18.9998 11.5795 19.0695 11.4067 19.1986L7.8207 21.8846C7.74202 21.9491 7.64557 21.988 7.5442 21.9962C7.44283 22.0044 7.34138 21.9815 7.25337 21.9305C7.16536 21.8796 7.09498 21.803 7.05162 21.711C7.00827 21.619 6.99399 21.516 7.0107 21.4156L8.5247 12.8896"
                    stroke="#F18800"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 14C15.3137 14 18 11.3137 18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 11.3137 8.68629 14 12 14Z"
                    stroke="#F18800"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-amber-500 text-lg font-semibold font-['Segoe_UI'] uppercase leading-5">
                  Epson ColorWorks Gold Partner
                </span>
              </div>
              {/* Headline */}
              <div className="flex flex-col gap-4">
                <h1 className="text-white text-7xl font-bold font-['Segoe_UI'] leading-[86.4px]">
                  Find the right label in seconds
                </h1>
                <p className="text-white text-xl font-normal font-['Segoe_UI'] leading-8">
                  Compatible labels for Epson ColorWorks printers.
                </p>
              </div>
            </div>
            {/* Buttons */}
            <div className="flex items-center gap-4">
              <Link
                href="/products"
                className="px-7 py-4 bg-amber-500 rounded-full flex items-center gap-2.5 text-white text-lg font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors"
              >
                Browse Products
              </Link>
              <Link
                href="/contact"
                className="px-7 py-4 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm flex items-center gap-2.5 text-white text-lg font-semibold font-['Segoe_UI'] leading-6 hover:bg-white/20 transition-colors"
              >
                Talk to Expert
              </Link>
            </div>
          </div>

          {/* Right: Smart Product Finder widget */}
          <div className="w-[540px] pb-5 bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col gap-6 overflow-hidden">
            {/* Widget header */}
            <div className="px-6 py-5 bg-white shadow border border-gray-200 flex items-center gap-4">
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.594 18.0833C11.4898 17.6796 11.2794 17.3111 10.9845 17.0163C10.6897 16.7214 10.3212 16.511 9.91749 16.4068L2.75999 14.5612C2.63788 14.5265 2.5304 14.453 2.45387 14.3517C2.37734 14.2504 2.33594 14.1269 2.33594 14C2.33594 13.8731 2.37734 13.7496 2.45387 13.6483C2.5304 13.547 2.63788 13.4735 2.75999 13.4388L9.91749 11.592C10.3211 11.4879 10.6895 11.2777 10.9843 10.983C11.2791 10.6884 11.4897 10.3202 11.594 9.91666L13.4397 2.75916C13.474 2.63657 13.5474 2.52856 13.6489 2.45162C13.7503 2.37468 13.8741 2.33304 14.0014 2.33304C14.1287 2.33304 14.2525 2.37468 14.3539 2.45162C14.4554 2.52856 14.5288 2.63657 14.5632 2.75916L16.4077 9.91666C16.5118 10.3204 16.7223 10.6889 17.0171 10.9837C17.3119 11.2786 17.6804 11.489 18.0842 11.5932L25.2417 13.4377C25.3647 13.4716 25.4733 13.545 25.5506 13.6466C25.628 13.7482 25.6699 13.8723 25.6699 14C25.6699 14.1277 25.628 14.2518 25.5506 14.3534C25.4733 14.455 25.3647 14.5284 25.2417 14.5623L18.0842 16.4068C17.6804 16.511 17.3119 16.7214 17.0171 17.0163C16.7223 17.3111 16.5118 17.6796 16.4077 18.0833L14.562 25.2408C14.5277 25.3634 14.4542 25.4714 14.3528 25.5484C14.2514 25.6253 14.1275 25.667 14.0002 25.667C13.8729 25.667 13.7491 25.6253 13.6477 25.5484C13.5463 25.4714 13.4728 25.3634 13.4385 25.2408L11.594 18.0833Z"
                  stroke="#888888"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M23.332 3.5V8.16667"
                  stroke="#888888"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M25.6667 5.83301H21"
                  stroke="#888888"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.66797 19.833V22.1663"
                  stroke="#888888"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.83333 21H3.5"
                  stroke="#888888"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-neutral-800 text-2xl font-semibold font-['Segoe_UI'] leading-7">
                Smart Product Finder
              </span>
            </div>
            {/* Printer select */}
            <div className="px-6 flex flex-col gap-4">
              <span className="text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">
                Select your printer model
              </span>
              <PrinterSelect
                value={selectedPrinters}
                onValueChange={setSelectedPrinters}
                placeholder="Search printers"
              />
            </div>
            {/* Product type */}
            <div className="px-6 flex flex-col gap-4">
              <span className="text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">
                What are you looking for?
              </span>
              <RadioGroup value={productType} onValueChange={setProductType}>
                <div className="flex gap-4">
                  <Field>
                    <FieldLabel
                      htmlFor="labels"
                      className="w-60 px-3 py-3 bg-gray-50 rounded-lg border border-zinc-100 flex items-center gap-3 cursor-pointer hover:border-amber-300 transition-colors data-checked:border-amber-400 data-checked:bg-amber-50"
                    >
                      <RadioGroupItem
                        value="labels"
                        id="labels"
                        className="sr-only"
                      />
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M14.6667 28.9729C15.0721 29.2069 15.5319 29.3301 16 29.3301C16.4681 29.3301 16.9279 29.2069 17.3333 28.9729L26.6667 23.6395C27.0717 23.4057 27.408 23.0695 27.6421 22.6647C27.8761 22.2598 27.9995 21.8005 28 21.3329V10.6662C27.9995 10.1986 27.8761 9.73929 27.6421 9.33443C27.408 8.92956 27.0717 8.59336 26.6667 8.35954L17.3333 3.02621C16.9279 2.79216 16.4681 2.66895 16 2.66895C15.5319 2.66895 15.0721 2.79216 14.6667 3.02621L5.33333 8.35954C4.92835 8.59336 4.59197 8.92956 4.35795 9.33443C4.12392 9.73929 4.00048 10.1986 4 10.6662V21.3329C4.00048 21.8005 4.12392 22.2598 4.35795 22.6647C4.59197 23.0695 4.92835 23.4057 5.33333 23.6395L14.6667 28.9729Z"
                          stroke="#888888"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 29.3333V16"
                          stroke="#888888"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4.38672 9.33301L16.0001 15.9997L27.6134 9.33301"
                          stroke="#888888"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 5.69336L22 12.56"
                          stroke="#888888"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-neutral-700 text-base font-semibold font-['Segoe_UI'] leading-5">
                          Label Rolls
                        </span>
                        <span className="text-zinc-500 text-sm font-normal font-['Segoe_UI'] leading-5">
                          Paper, BOPP, etc.
                        </span>
                      </div>
                    </FieldLabel>
                  </Field>

                  <Field>
                    <FieldLabel
                      htmlFor="ink"
                      className="w-60 px-3 py-3 bg-gray-50 rounded-lg border border-zinc-100 flex items-center gap-3 cursor-pointer hover:border-amber-300 transition-colors data-checked:border-amber-400 data-checked:bg-amber-50"
                    >
                      <RadioGroupItem
                        value="ink"
                        id="ink"
                        className="sr-only"
                      />
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.0013 24H5.33464C4.62739 24 3.94911 23.719 3.44902 23.219C2.94892 22.7189 2.66797 22.0406 2.66797 21.3333V14.6667C2.66797 13.9594 2.94892 13.2811 3.44902 12.781C3.94911 12.281 4.62739 12 5.33464 12H26.668C27.3752 12 28.0535 12.281 28.5536 12.781C29.0537 13.2811 29.3346 13.9594 29.3346 14.6667V21.3333C29.3346 22.0406 29.0537 22.7189 28.5536 23.219C28.0535 23.719 27.3752 24 26.668 24H24.0013"
                          stroke="#888888"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 12.0003V4.00033C8 3.6467 8.14048 3.30756 8.39052 3.05752C8.64057 2.80747 8.97971 2.66699 9.33333 2.66699H22.6667C23.0203 2.66699 23.3594 2.80747 23.6095 3.05752C23.8595 3.30756 24 3.6467 24 4.00033V12.0003"
                          stroke="#888888"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M22.6667 18.667H9.33333C8.59695 18.667 8 19.2639 8 20.0003V28.0003C8 28.7367 8.59695 29.3337 9.33333 29.3337H22.6667C23.403 29.3337 24 28.7367 24 28.0003V20.0003C24 19.2639 23.403 18.667 22.6667 18.667Z"
                          stroke="#888888"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-neutral-700 text-base font-semibold font-['Segoe_UI'] leading-5">
                          Ink
                        </span>
                        <span className="text-zinc-500 text-sm font-normal font-['Segoe_UI'] leading-5">
                          Cartridges
                        </span>
                      </div>
                    </FieldLabel>
                  </Field>
                </div>
              </RadioGroup>
            </div>
            {/* CTA Button */}
            <div className="px-6">
              <button
                onClick={handleShowProducts}
                className="w-full py-3 bg-blue-400 rounded-full flex justify-center items-center gap-2 hover:bg-blue-500 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="6.75"
                    cy="6.75"
                    r="4.75"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10.5 10.5L13.5 13.5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-white text-base font-semibold font-['Segoe_UI'] leading-6">
                  Show Compatible Products
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
