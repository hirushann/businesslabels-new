import RegisterClient from '@/components/RegisterClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | BusinessLabels',
  description: 'Create your BusinessLabels account.',
};

export default function RegisterPage() {
  return <RegisterClient />;
}
