import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALE_HEADER, normalizeLocale } from '@/lib/i18n/config';

const EN_PREFIX = '/en';
const COOKIE_OPTIONS = { path: '/', sameSite: 'lax' as const, maxAge: LOCALE_COOKIE_MAX_AGE };

function requestHeadersWithLocale(request: NextRequest, locale: 'en' | 'nl') {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  return requestHeaders;
}

function persistLocale(response: NextResponse, locale: 'en' | 'nl') {
  response.cookies.set(LOCALE_COOKIE, locale, COOKIE_OPTIONS);
  return response;
}

/**
 * Locale-prefix routing:
 * - /en/* → English, rewrite internally to /* + persist NEXT_LOCALE=en
 * - /* → Use the persisted user locale, falling back to Dutch.
 *
 * The user's explicit language choice is the source of truth. This prevents
 * external returns (checkout/payment callbacks, email links, reloads, etc.)
 * from silently switching an English user back to Dutch just because the URL is
 * unprefixed.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasEnglishPrefix = pathname.startsWith(EN_PREFIX + '/') || pathname === EN_PREFIX;
  const persistedLocale = normalizeLocale(request.cookies.get(LOCALE_COOKIE)?.value);
  const locale = hasEnglishPrefix ? 'en' : persistedLocale;
  let cleanPathname = hasEnglishPrefix ? (pathname.slice(EN_PREFIX.length) || '/') : pathname;
  if (cleanPathname === '/software-2') {
    cleanPathname = '/software';
  }
  if (cleanPathname === '/knowledge-base') {
    cleanPathname = '/kennisbank-overzicht';
  }
  if (cleanPathname === '/brands') {
    cleanPathname = '/merken';
  }
  if (cleanPathname === '/support-2' || cleanPathname === '/support-2/') {
    cleanPathname = '/support';
  }
  if (cleanPathname === '/custom-made-labels') {
    cleanPathname = '/maatwerk';
  }
  if (cleanPathname === '/cart') {
    cleanPathname = '/winkelmand';
  }
  if (cleanPathname === '/checkout') {
    cleanPathname = '/afrekenen';
  }
  if (cleanPathname === '/terms-and-conditions' || cleanPathname === '/terms-and-conditions/') {
    cleanPathname = '/algemene-voorwaarden';
  }

  if (pathname === '/en/support' || pathname === '/en/support/') {
    const redirectUrl = new URL(`${EN_PREFIX}/support-2/${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl), 'en');
  }

  if (pathname === '/en/custom-made-form' || pathname === '/en/custom-made-form/' || pathname === '/en/maatwerk' || pathname === '/en/maatwerk/') {
    const redirectUrl = new URL(`${EN_PREFIX}/custom-made-labels${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl), 'en');
  }

  if (pathname === '/en/kennisbank-overzicht') {
    const redirectUrl = new URL(`${EN_PREFIX}/knowledge-base${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl), 'en');
  }

  if (pathname === '/en/merken') {
    const redirectUrl = new URL(`${EN_PREFIX}/brands${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl), 'en');
  }

  if (pathname === '/en/winkelmand') {
    const redirectUrl = new URL(`${EN_PREFIX}/cart${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl), 'en');
  }

  if (pathname === '/en/afrekenen') {
    const redirectUrl = new URL(`${EN_PREFIX}/checkout${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl), 'en');
  }

  if (pathname === '/en/algemene-voorwaarden' || pathname === '/en/algemene-voorwaarden/') {
    const redirectUrl = new URL(`${EN_PREFIX}/terms-and-conditions${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl), 'en');
  }

  if (pathname === '/terms-and-conditions' || pathname === '/terms-and-conditions/') {
    const redirectUrl = new URL(`/algemene-voorwaarden${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl), locale);
  }

  if (pathname === '/contact' || pathname === '/contact/') {
    const redirectUrl = new URL(`/contact-us${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl), locale);
  }

  if (pathname === '/en/contact' || pathname === '/en/contact/') {
    const redirectUrl = new URL(`${EN_PREFIX}/contact-us${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl), 'en');
  }

  // ── Locale routing ──────────────────────────────────────────────────────────

  // ── Auth guard (/my-account) ─────────────────────────────────────────────────

  if (cleanPathname.startsWith('/my-account')) {
    const authToken = request.cookies.get('auth_token')?.value;
    const authSession = request.cookies.get('auth_session')?.value;

    if (!authToken && !authSession) {
      const loginPath = locale === 'en' ? `${EN_PREFIX}/login` : '/login';
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set('redirect', locale === 'en' && !hasEnglishPrefix ? `${EN_PREFIX}${pathname}${search}` : pathname + search);
      return persistLocale(NextResponse.redirect(loginUrl), locale);
    }
  }

  if (hasEnglishPrefix) {
    // Strip the /en prefix and rewrite internally; the browser keeps /en/...
    const rewriteUrl = new URL(cleanPathname + search, request.url);
    const response = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeadersWithLocale(request, 'en') },
    });
    return persistLocale(response, 'en');
  }

  const response = NextResponse.next({
    request: { headers: requestHeadersWithLocale(request, locale) },
  });
  return persistLocale(response, locale);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, robots.txt, sitemap.xml and other static assets
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|eot)).*)',
  ],
};
