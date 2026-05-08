"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import EmptyState from "@/components/EmptyState";

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order_number");
  const cart = useCart();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear the cart as soon as we reach the thank you page with an order number
    if (orderNumber) {
      cart.clearCart();
    }
  }, [orderNumber]); // Only run when orderNumber is present

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/checkout?number=${orderNumber}`);
        if (response.ok) {
          const json = await response.json();
          setOrder(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch order details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="bg-slate-50 px-5 py-15 min-h-[70vh] flex items-center justify-center">
        <div className="animate-pulse text-neutral-500">Loading order details...</div>
      </div>
    );
  }

  const isSuccess = order?.status === "processing" || order?.status === "completed";

  return (
    <div className="bg-slate-50 px-5 py-15 min-h-[70vh] flex items-center">
      <div className="mx-auto max-w-4xl w-full">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-16 shadow-[2px_8px_40px_0px_rgba(109,109,120,0.10)] text-center">
          <div className="mb-6 flex justify-center">
            {isSuccess ? (
              <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            ) : (
              <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
            )}
          </div>
          
          <h1 className="text-neutral-800 text-4xl font-bold mb-4">
            {isSuccess ? "Thank You for Your Order!" : "Order Payment Pending"}
          </h1>
          
          <div className="text-neutral-600 text-lg mb-8 max-w-md mx-auto">
            {orderNumber && (
              <p className="mb-2">Your order number is <span className="font-bold text-neutral-800">#{orderNumber}</span></p>
            )}
            {isSuccess ? (
              <p>Your payment has been received successfully. We'll start processing your order right away.</p>
            ) : (
              <p>We are waiting for your payment to be confirmed. Once received, your order status will be updated.</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center rounded-full bg-amber-500 px-8 text-base font-semibold text-white transition-colors hover:bg-amber-600"
            >
              Continue Shopping
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-base font-semibold text-neutral-700 transition-colors hover:bg-slate-50"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
