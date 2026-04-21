import MyAccountClient from "@/components/MyAccountClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account | BusinessLabels",
  description: "Manage your account, orders, addresses and profile details.",
};

export default function MyAccountPage() {
  return <MyAccountClient />;
}
