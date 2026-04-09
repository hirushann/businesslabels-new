import type { Metadata } from "next";
import CheckoutPageClient from "@/components/CheckoutPageClient";

export const metadata: Metadata = {
  title: "Checkout — BusinessLabels",
  description: "Complete your BusinessLabels order with delivery and payment details.",
};

export default function CheckoutPage() {
  return <CheckoutPageClient mode="live" />;
}
