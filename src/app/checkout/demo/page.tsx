import type { Metadata } from "next";
import CheckoutPageClient from "@/components/CheckoutPageClient";
import { demoCheckoutItems } from "@/lib/demoCatalog";

export const metadata: Metadata = {
  title: "Demo Checkout — BusinessLabels",
  description: "Preview the BusinessLabels checkout experience with demo products.",
};

export default function DemoCheckoutPage() {
  return <CheckoutPageClient mode="demo" demoItems={demoCheckoutItems} />;
}
