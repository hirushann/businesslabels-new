import { redirect } from 'next/navigation';

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = Array.isArray(params.redirect) ? params.redirect[0] : params.redirect;

  const query = new URLSearchParams({ auth: 'login' });
  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    query.set('redirect', redirectTo);
  }

  redirect(`/?${query.toString()}`);
}
