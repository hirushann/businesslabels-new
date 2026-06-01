import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const EN_PREFIX = '/en';
const LABEL_PRINTERS_PUBLIC_PATH = '/product-category/labelprinters';
const LABEL_PRINTERS_INTERNAL_PATH = '/printers';

function mapPublicPathToInternalPath(pathname: string) {
  return pathname === LABEL_PRINTERS_PUBLIC_PATH
    ? LABEL_PRINTERS_INTERNAL_PATH
    : pathname;
}

/**
 * Locale-prefix routing:
 * - /en/* → rewrite internally to /* + set NEXT_LOCALE=en cookie
 * - /* with NEXT_LOCALE=en cookie → redirect to /en/*
 * - /* with NEXT_LOCALE=nl (or no cookie) → serve as-is
 *
 * Auth guard for /my-account/* is applied after locale routing.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ── Locale routing ──────────────────────────────────────────────────────────

  if (pathname.startsWith(EN_PREFIX + '/') || pathname === EN_PREFIX) {
    // Strip the /en prefix and rewrite internally; the browser keeps /en/...
    const stripped = pathname.slice(EN_PREFIX.length) || '/';
    const internalPath = mapPublicPathToInternalPath(stripped);
    const rewriteUrl = new URL(internalPath + search, request.url);
    const response = NextResponse.rewrite(rewriteUrl);
    // Ensure the EN cookie is set so server components read the right locale
    response.cookies.set(LOCALE_COOKIE, 'en', { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (localeCookie === 'en') {
    // EN user visiting a non-prefixed path → redirect to /en prefix
    const redirectUrl = new URL(EN_PREFIX + pathname + search, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const internalPath = mapPublicPathToInternalPath(pathname);
  if (internalPath !== pathname) {
    const rewriteUrl = new URL(internalPath + search, request.url);
    return NextResponse.rewrite(rewriteUrl);
  }

  // ── Auth guard (/my-account) ─────────────────────────────────────────────────

  if (pathname.startsWith('/my-account')) {
    const authToken = request.cookies.get('auth_token')?.value;
    const authSession = request.cookies.get('auth_session')?.value;

    if (!authToken && !authSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
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
