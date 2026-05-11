import RegisterClient from '@/components/RegisterClient';
import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Register | BusinessLabels',
  description: 'Create your BusinessLabels account.',
};

export default function RegisterPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <>
      <Script
        id="google-maps-api"
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        strategy="afterInteractive"
      />
      <RegisterClient />
    </>
  );
}
