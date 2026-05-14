import CartPageClient from '@/components/CartPageClient';

export const metadata = {
  title: 'Your Shopping Cart | Businesslabels',
  description: 'Review the items in your shopping cart before proceeding to checkout.',
};

export default function CartPage() {
  return (
    <main className="min-h-screen bg-slate-50/50">
      <CartPageClient />
    </main>
  );
}
