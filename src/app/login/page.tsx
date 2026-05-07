import type { Metadata } from 'next';

import LoginClient from '@/components/LoginClient';

export const metadata: Metadata = {
  title: 'Login | BusinessLabels',
  description: 'Sign in to your BusinessLabels account.',
};

export default function LoginPage() {
  return <LoginClient />;
}
