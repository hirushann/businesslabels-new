// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  pathname: '/',
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation,
  useSearchParams: () => navigation.searchParams,
}));
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => Object.assign((key: string) => key, { has: () => true }),
}));
vi.mock('next/image', () => ({ default: (props: Record<string, unknown>) => <span {...props} /> }));
vi.mock('./CartProvider', () => ({ useCart: () => ({ totalItemCount: 0, isCartOpen: false, openCart: vi.fn(), closeCart: vi.fn() }) }));
vi.mock('./WishlistProvider', () => ({ useWishlist: () => ({ uniqueItemCount: 0 }) }));
vi.mock('./HelpProvider', () => ({ useHelp: () => ({ isHelpOpen: false, openHelp: vi.fn(), closeHelp: vi.fn() }) }));
vi.mock('./CartDrawer', () => ({ default: () => null }));
vi.mock('./WishlistDrawer', () => ({ default: () => null }));
vi.mock('./HelpDrawer', () => ({ default: () => null }));
vi.mock('./LanguageSwitcher', () => ({ default: () => null }));
vi.mock('./nav/PrintersMenu', () => ({ default: () => null, menuItems: [] }));
vi.mock('./nav/LabelsMenu', () => ({ default: () => null, menuItems: [] }));
vi.mock('./nav/AccessoriesMenu', () => ({ default: () => null, menuItems: [] }));
vi.mock('./nav/ResourcesMenu', () => ({ default: () => null, columnOne: [], columnTwo: [] }));
vi.mock('./nav/BrandsMenu', () => ({ default: () => null, brands: [] }));
vi.mock('@/components/LoginPopup', () => ({
  default: ({ open, onLoginSuccess }: { open: boolean; onLoginSuccess?: () => void }) =>
    open ? <button onClick={onLoginSuccess}>complete login</button> : null,
}));
vi.mock('@/components/RegisterPopup', () => ({ default: () => null }));

import Header from './Header';

describe('Header authentication redirects', () => {
  afterEach(cleanup);

  beforeEach(() => {
    localStorage.clear();
    navigation.push.mockClear();
    navigation.refresh.mockClear();
    navigation.replace.mockClear();
    navigation.pathname = '/';
    navigation.searchParams = new URLSearchParams('auth=login&redirect=%2Fen%2Fmy-account');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ data: [] }) }));
  });

  it('consumes a post-login redirect only once', async () => {
    render(<Header />);

    const completeLogin = await screen.findByRole('button', { name: 'complete login' });
    fireEvent.click(completeLogin);

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/en/my-account'));
    navigation.push.mockClear();
    fireEvent.click(completeLogin);

    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('does not let stale local auth suppress the login dialog', async () => {
    localStorage.setItem('auth_user', JSON.stringify({ id: 1 }));

    render(<Header />);

    expect(await screen.findByRole('button', { name: 'complete login' })).toBeTruthy();
  });

  it('clears expired auth cookies before redirecting back to login', async () => {
    navigation.pathname = '/my-account';
    navigation.searchParams = new URLSearchParams();
    render(<Header hasAuthToken />);

    window.dispatchEvent(new CustomEvent('auth-expired'));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/logout', { method: 'POST' }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/en/?auth=login&redirect=%2Fmy-account'));
  });
});
