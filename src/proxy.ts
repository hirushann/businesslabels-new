import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CHECKOUT_RETURN_LOCALE_COOKIE, DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALE_HEADER, LOCALE_PATH_HEADER } from '@/lib/i18n/config';

const EN_PREFIX = '/en';
const COOKIE_OPTIONS = { path: '/', sameSite: 'lax' as const, maxAge: LOCALE_COOKIE_MAX_AGE };

const LEGACY_PRODUCT_CAT_MAP: Record<string, { path: string; locale: 'nl' | 'en' }> = {
  'printer-nl/kleuren-labelprinters-nl/midrange-labelprinters-nl': {
    path: '/product-categorie/labelprinters/kleuren-labelprinters-nl/midrange-labelprinters-nl',
    locale: 'nl',
  },
  'printer-nl/kleuren-labelprinters-nl/industriele-labelprinters-nl': {
    path: '/product-categorie/labelprinters/kleuren-labelprinters-nl/industriele-labelprinters-nl',
    locale: 'nl',
  },
  'labels-en-tickets/toepassingen/verzendetiketten': {
    path: '/product-categorie/labels-en-tickets/thermal-direct/verzendetiketten',
    locale: 'nl',
  },
  'printer/color-labelprinters/midrange-labelprinters': {
    path: '/en/product-category/labelprinters/color-labelprinters/midrange-labelprinters',
    locale: 'en',
  },
  'ink-cartridges-epson-cw-c8000': {
    path: '/product-categorie/labelprinters/verbruiksmaterialen-nl/inkt-cartridges-nl/inkt-cartridges-epson-cw-c8000',
    locale: 'nl',
  },
  'shipping-label-starter-kits': {
    path: '/product-categorie/labels-en-tickets/thermal-direct/verzendetiketten',
    locale: 'nl',
  },
  'labels-and-tickets/applications/shipping-labels': {
    path: '/en/product-category/shipping-labels',
    locale: 'en',
  },
};

const LEGACY_ARCHIVE_PATH_MAP: Record<string, { path: string; locale: 'nl' | 'en' }> = {
  '/product-categorie/labelprinters/kleuren-labelprinters/midrange-kleurenprinters': {
    path: '/product-categorie/labelprinters/kleuren-labelprinters-nl/midrange-labelprinters-nl',
    locale: 'nl',
  },
  '/product-categorie/labelprinters/kleuren-labelprinters/industriele-labelprinters': {
    path: '/product-categorie/labelprinters/kleuren-labelprinters-nl/industriele-labelprinters-nl',
    locale: 'nl',
  },
  '/product-categorie/etiketten/toepassing/verzendetiketten': {
    path: '/product-categorie/labels-en-tickets/thermal-direct/verzendetiketten',
    locale: 'nl',
  },
  '/en/product-category/label-printers/color-label-printers/mid-range-color-printers': {
    path: '/en/product-category/labelprinters/color-labelprinters/midrange-labelprinters',
    locale: 'en',
  },
  '/product-categorie/labelprinters/inktcartridges/epson-cw-c8000-inktcartridges': {
    path: '/product-categorie/labelprinters/verbruiksmaterialen-nl/inkt-cartridges-nl/inkt-cartridges-epson-cw-c8000',
    locale: 'nl',
  },
  '/en/product-category/labels/applications/shipping-labels': {
    path: '/en/product-category/shipping-labels',
    locale: 'en',
  },
};

const LEGACY_UPLOADS_REDIRECT_MAP: Record<string, string> = {
  '/wp-content/uploads/2021/08/STARTER-SET-DHL-100x210-SHIPPING-LABELS-ZX420I-13.png':
    '/api/media-proxy?url=https%3A%2F%2Fbbnl.dayzsolutions.com%2Fstorage%2F7709%2FSTARTER-SET-DHL-100%25C3%2597210-SHIPPING-LABELS-ZX420I-13.png',
  '/wp-content/uploads/2023/06/Inkt-kosten-ColorWorks-LR.pdf':
    '/epson-colorworks-faq',
  '/wp-content/uploads/2025/04/colorworks-d6500pe-datasheet.pdf':
    '/product/colorworks-cw-d6500pe',
  '/wp-content/uploads/2025/04/colorworks-d6000ae-datasheet.pdf':
    '/product/colorworks-cw-d6000ae',
  '/wp-content/uploads/2025/04/colorworks-d6500ae-datasheet.pdf':
    '/product/colorworks-cw-d6500ae',
  '/wp-content/uploads/2025/04/colorworks-d6000pe-datasheet.pdf':
    '/product/colorworks-cw-d6000pe',
  '/wp-content/uploads/2022/01/Epson_SJIC42P-Y_Yellow_C13T52M440-150x121.png':
    '/api/media-proxy?url=https%3A%2F%2Fdashboard.businesslabels.nl%2Fstorage%2F12264%2FEpson_SJIC42P-Y_Yellow_C13T52M440.png',
  '/wp-content/uploads/2022/01/Epson-CW-C4000-WiFi-dongle-150x119.png':
    '/api/media-proxy?url=https%3A%2F%2Fdashboard.businesslabels.nl%2Fstorage%2F7542%2FEpson-CW-C4000-WiFi-dongle.png',
  '/wp-content/uploads/2022/01/Epson-Cw-C4000-auto-cutter-unit-150x104.png':
    '/api/media-proxy?url=https%3A%2F%2Fdashboard.businesslabels.nl%2Fstorage%2F7543%2FEpson-Cw-C4000-auto-cutter-unit.png',
  '/wp-content/uploads/2022/01/Epson_SJIC42P-MK_matt_Black_C13T52M540-150x121.png':
    '/api/media-proxy?url=https%3A%2F%2Fdashboard.businesslabels.nl%2Fstorage%2F12267%2FEpson_SJIC42P-MK_matt_Black_C13T52M540.png',
  '/wp-content/uploads/2022/01/Epson-CW-C4000-paper-tray-part-150x121.png':
    '/api/media-proxy?url=https%3A%2F%2Fdashboard.businesslabels.nl%2Fstorage%2F7540%2FEpson-CW-C4000-paper-tray-opvangbakje.png',
  '/wp-content/uploads/2022/01/Epson_SJIC42P-M_Magenta_C13T52M340-150x121.png':
    '/api/media-proxy?url=https%3A%2F%2Fdashboard.businesslabels.nl%2Fstorage%2F12266%2FEpson_SJIC42P-M_Magenta_C13T52M340.png',
  '/wp-content/uploads/2022/01/Epson_SJIC42P-BK_Black_C13T52M140-150x121.png':
    '/api/media-proxy?url=https%3A%2F%2Fdashboard.businesslabels.nl%2Fstorage%2F12268%2FEpson_SJIC42P-BK_Black_C13T52M140.png',
  '/wp-content/uploads/2022/02/Epson-left-CW-C4000-Europe.png':
    '/api/media-proxy?url=https%3A%2F%2Fdashboard.businesslabels.nl%2Fstorage%2F10883%2FEpson-left-CW-C4000-Europe.png',
  '/wp-content/uploads/2022/01/Epson-left-CW-C4000-LR-1-150x131.png':
    '/api/media-proxy?url=https%3A%2F%2Fdashboard.businesslabels.nl%2Fstorage%2F10883%2FEpson-left-CW-C4000-Europe.png',
  '/wp-content/uploads/2022/01/Epson_SJIC42P-C_Cyan_C13T52M240-150x121.png':
    '/api/media-proxy?url=https%3A%2F%2Fdashboard.businesslabels.nl%2Fstorage%2F12265%2FEpson_SJIC42P-C_Cyan_C13T52M240.png',
  '/wp-content/uploads/2022/01/Epson_C4000e_maintenance_box_SJMB4000-1-e1643380482940-150x120.png':
    '/api/media-proxy?url=https%3A%2F%2Fdashboard.businesslabels.nl%2Fstorage%2F12263%2FEpson_C4000e_maintenance_box_SJMB4000-1-e1643380482940.png',
};

function requestHeadersWithLocale(request: NextRequest, locale: 'en' | 'nl') {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  requestHeaders.set(LOCALE_PATH_HEADER, request.nextUrl.pathname);
  return requestHeaders;
}

function persistLocale(response: NextResponse, locale: 'en' | 'nl') {
  response.cookies.set(LOCALE_COOKIE, locale, COOKIE_OPTIONS);
  return response;
}

/**
 * Locale-prefix routing:
 * - /en/* → English, rewrite internally to /* + persist NEXT_LOCALE=en
 * - /product-categorie/* → Dutch, regardless of a previous English cookie
 * - /* → Dutch, regardless of a previous English cookie
 *
 * The URL is the sole source of truth for locale. An unprefixed URL always
 * renders Dutch — no falling back to a persisted cookie — so a Dutch URL
 * can't get indexed or land a fresh visitor in English (N01). Flows that must
 * keep an English user on English across a redirect (e.g. /my-account) do so
 * by redirecting to an explicit /en/-prefixed URL, not by relying on this
 * fallback.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Normalize consecutive slashes (e.g. //product/... -> /product/...)
  if (pathname.includes('//')) {
    const clean = pathname.replace(/\/+/g, '/');
    const redirectUrl = new URL(clean + search, request.url);
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Handle direct requests to legacy category archive paths
  const mappedArchive = LEGACY_ARCHIVE_PATH_MAP[pathname];
  if (mappedArchive) {
    const redirectUrl = new URL(mappedArchive.path + search, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), mappedArchive.locale);
  }

  const hasEnglishPrefix = pathname.startsWith(EN_PREFIX + '/') || pathname === EN_PREFIX;
  const hasDutchArchivePrefix =
    pathname.startsWith('/product-categorie/') || pathname === '/product-categorie';
  const locale = hasEnglishPrefix ? 'en' : hasDutchArchivePrefix ? 'nl' : DEFAULT_LOCALE;

  // Handle legacy WordPress ?product_cat= query param
  if (request.nextUrl.searchParams.has('product_cat')) {
    const rawCat = request.nextUrl.searchParams.get('product_cat') || '';
    const cleanCat = rawCat.replace(/^\/+|\/+$/g, '').toLowerCase();
    const mapped = LEGACY_PRODUCT_CAT_MAP[cleanCat] || LEGACY_PRODUCT_CAT_MAP[rawCat];
    if (mapped) {
      const redirectUrl = new URL(mapped.path, request.url);
      return persistLocale(NextResponse.redirect(redirectUrl, 301), mapped.locale);
    }
    const defaultTarget = hasEnglishPrefix || locale === 'en'
      ? `/en/product-category/${cleanCat}`
      : `/product-categorie/${cleanCat}`;
    const redirectUrl = new URL(defaultTarget, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
  }

  // Handle legacy WordPress plain permalinks (?post_type=product or /?p=...)
  if (
    request.nextUrl.searchParams.has('post_type') ||
    ((pathname === '/' || pathname === '/en') && request.nextUrl.searchParams.has('p'))
  ) {
    const postType = request.nextUrl.searchParams.get('post_type');
    if (postType === 'product' || request.nextUrl.searchParams.has('p')) {
      const target = hasEnglishPrefix ? `${EN_PREFIX}/product` : '/product';
      const redirectUrl = new URL(target, request.url);
      return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
    }
  }

  // Handle redundant / legacy ?lang= query param
  if (request.nextUrl.searchParams.has('lang')) {
    const langParam = request.nextUrl.searchParams.get('lang');
    const nextSearch = new URLSearchParams(request.nextUrl.searchParams);
    nextSearch.delete('lang');
    const qs = nextSearch.toString();
    const searchSuffix = qs ? `?${qs}` : '';

    if (langParam === 'en' && !hasEnglishPrefix) {
      const redirectUrl = new URL(`${EN_PREFIX}${pathname}${searchSuffix}`, request.url);
      return persistLocale(NextResponse.redirect(redirectUrl, 301), 'en');
    } else if (langParam === 'nl' && hasEnglishPrefix) {
      const targetPath = (pathname.slice(EN_PREFIX.length) || '/');
      const redirectUrl = new URL(`${targetPath}${searchSuffix}`, request.url);
      return persistLocale(NextResponse.redirect(redirectUrl, 301), 'nl');
    } else {
      const redirectUrl = new URL(`${pathname}${searchSuffix}`, request.url);
      return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
    }
  }
  let cleanPathname = hasEnglishPrefix ? (pathname.slice(EN_PREFIX.length) || '/') : pathname;

  // Handle legacy WordPress /category/materialen/* paths
  if (cleanPathname.startsWith('/category/materialen')) {
    let target = '/material';
    if (cleanPathname.includes('/inkjet')) target = '/material/inkjet';
    else if (cleanPathname.includes('/thermal-direct')) target = '/material/thermal-direct';
    else if (cleanPathname.includes('/thermal-transfer')) target = '/material/thermal-transfer';

    const redirectUrl = new URL(hasEnglishPrefix ? `${EN_PREFIX}${target}` : target, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
  }
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
  if (cleanPathname === '/material-customization') {
    cleanPathname = '/maatwerk';
  }
  if (cleanPathname === '/shop') {
    cleanPathname = '/winkel';
  }
  if (cleanPathname === '/cart') {
    cleanPathname = '/winkelmand';
  }
  if (cleanPathname === '/thank-you' || cleanPathname === '/thank-you/') {
    cleanPathname = '/bedankt';
  }

  if (
    !hasEnglishPrefix &&
    cleanPathname === '/bedankt' &&
    request.nextUrl.searchParams.has('order_number') &&
    request.cookies.get(CHECKOUT_RETURN_LOCALE_COOKIE)?.value === 'en'
  ) {
    const redirectUrl = new URL(`${EN_PREFIX}/thank-you${search}`, request.url);
    const response = persistLocale(NextResponse.redirect(redirectUrl), 'en');
    response.cookies.set(CHECKOUT_RETURN_LOCALE_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
    return response;
  }

  if (cleanPathname === '/terms-and-conditions' || cleanPathname === '/terms-and-conditions/') {
    cleanPathname = '/algemene-voorwaarden';
  }

  if (pathname === '/en/support' || pathname === '/en/support/') {
    const redirectUrl = new URL(`${EN_PREFIX}/support-2/${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), 'en');
  }

  if (pathname === '/inkt-recyclen-epson-colorworks' || pathname === '/inkt-recyclen-epson-colorworks/') {
    if (locale === 'en') {
      const redirectUrl = new URL(`${EN_PREFIX}/inkt-recyclen-epson-colorworks${search}`, request.url);
      return persistLocale(NextResponse.redirect(redirectUrl, 301), 'en');
    }
  }

  if (pathname === '/en/custom-made-form' || pathname === '/en/custom-made-form/' || pathname === '/en/maatwerk' || pathname === '/en/maatwerk/' || pathname === '/en/custom-made-labels' || pathname === '/en/custom-made-labels/') {
    const redirectUrl = new URL(`${EN_PREFIX}/material-customization${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), 'en');
  }

  if (pathname === '/en/kennisbank-overzicht') {
    const redirectUrl = new URL(`${EN_PREFIX}/knowledge-base${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), 'en');
  }

  if (pathname === '/en/merken') {
    const redirectUrl = new URL(`${EN_PREFIX}/brands${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), 'en');
  }

  if (pathname === '/en/winkel' || pathname === '/en/winkel/') {
    const redirectUrl = new URL(`${EN_PREFIX}/shop${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), 'en');
  }

  if (pathname === '/winkel' || pathname === '/winkel/') {
    if (locale === 'en') {
      const redirectUrl = new URL(`${EN_PREFIX}/shop${search}`, request.url);
      return persistLocale(NextResponse.redirect(redirectUrl, 301), 'en');
    }
  }

  if (pathname === '/en/winkelmand') {
    const redirectUrl = new URL(`${EN_PREFIX}/cart${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), 'en');
  }



  if (pathname === '/en/algemene-voorwaarden' || pathname === '/en/algemene-voorwaarden/') {
    const redirectUrl = new URL(`${EN_PREFIX}/terms-and-conditions${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), 'en');
  }

  if (pathname === '/terms-and-conditions' || pathname === '/terms-and-conditions/') {
    const redirectUrl = new URL(`/algemene-voorwaarden${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
  }

  if (pathname === '/contact' || pathname === '/contact/') {
    const redirectUrl = new URL(`/contact-us${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
  }

  if (pathname === '/en/contact' || pathname === '/en/contact/') {
    const redirectUrl = new URL(`${EN_PREFIX}/contact-us${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), 'en');
  }

  if (cleanPathname === '/brand' || cleanPathname === '/brand/') {
    const redirectUrl = new URL(hasEnglishPrefix ? `${EN_PREFIX}/brands${search}` : `/merken${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
  }

  const BRAND_CANONICAL_SLUGS: Record<string, string> = {
    diamondlabels: 'diamondlabels-nl',
    'epson-nl': 'epson',
    expobadge: 'expo_badge',
    'expobadge-2': 'expo_badge',
    'expo-badge': 'expo_badge',
    seiko: 'sii',
    'seiko-nl': 'sii',
  };

  if (cleanPathname.startsWith('/brand/')) {
    const rawBrandSlug = cleanPathname.slice('/brand/'.length).replace(/\/$/, '').toLowerCase();
    const canonicalBrandSlug = BRAND_CANONICAL_SLUGS[rawBrandSlug] || rawBrandSlug;
    const hasLegacyParams =
      request.nextUrl.searchParams.has('really_curr_tax') ||
      request.nextUrl.searchParams.has('bbnl') ||
      request.nextUrl.searchParams.has('paged');

    if (canonicalBrandSlug !== rawBrandSlug || hasLegacyParams) {
      const nextSearch = new URLSearchParams(request.nextUrl.searchParams);
      nextSearch.delete('really_curr_tax');
      nextSearch.delete('bbnl');
      nextSearch.delete('paged');
      const qs = nextSearch.toString();
      const searchSuffix = qs ? `?${qs}` : '';
      const redirectUrl = new URL(
        hasEnglishPrefix ? `${EN_PREFIX}/brand/${canonicalBrandSlug}${searchSuffix}` : `/brand/${canonicalBrandSlug}${searchSuffix}`,
        request.url
      );
      return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
    }
  }

  if (cleanPathname.startsWith('/brands/')) {
    const rawBrandSlug = cleanPathname.slice('/brands/'.length).replace(/\/$/, '').toLowerCase();
    const canonicalBrandSlug = BRAND_CANONICAL_SLUGS[rawBrandSlug] || rawBrandSlug;
    if (canonicalBrandSlug) {
      const redirectUrl = new URL(
        hasEnglishPrefix ? `${EN_PREFIX}/brand/${canonicalBrandSlug}${search}` : `/brand/${canonicalBrandSlug}${search}`,
        request.url
      );
      return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
    }
  }

  if (cleanPathname === '/bierfles-labels-printen' || cleanPathname === '/bierfles-labels-printen/') {
    const redirectUrl = new URL(hasEnglishPrefix ? `${EN_PREFIX}/material${search}` : `/material${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
  }

  if (cleanPathname === '/shipping-labels' || cleanPathname === '/verzendetiketten' || cleanPathname === '/trouble-free-shipping-labels') {
    const redirectUrl = new URL(hasEnglishPrefix ? `${EN_PREFIX}/material${search}` : `/material${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
  }

  if (cleanPathname === '/nieuw-epson-cw-c4000-colorworks') {
    const redirectUrl = new URL(hasEnglishPrefix ? `${EN_PREFIX}/epson-cw-c4000-printer-preview${search}` : `/epson-cw-c4000-printer-preview${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
  }

  if (cleanPathname === '/epson-colorworks-c8000e') {
    const redirectUrl = new URL(hasEnglishPrefix ? `${EN_PREFIX}/printers${search}` : `/printers${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
  }

  if (decodeURIComponent(cleanPathname).startsWith('/epson-mk-bk')) {
    const redirectUrl = new URL(hasEnglishPrefix ? `${EN_PREFIX}/epson-colorworks-faq${search}` : `/epson-colorworks-faq${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
  }

  if (cleanPathname === '/software/afinity-designer') {
    const redirectUrl = new URL(hasEnglishPrefix ? `${EN_PREFIX}/software-2${search}` : `/software${search}`, request.url);
    return persistLocale(NextResponse.redirect(redirectUrl, 301), locale);
  }

  if (cleanPathname.startsWith('/wp-content/uploads/')) {
    const directRedirect = LEGACY_UPLOADS_REDIRECT_MAP[cleanPathname];
    if (directRedirect) {
      const redirectUrl = new URL(directRedirect, request.url);
      return NextResponse.redirect(redirectUrl, 301);
    }
    const backendBase = process.env.BBNL_API_BASE_URL || 'https://bbnl.dayzsolutions.com';
    const targetUrl = new URL(cleanPathname + search, backendBase);
    const rewriteUrl = new URL(`/api/media-proxy?url=${encodeURIComponent(targetUrl.toString())}`, request.url);
    return NextResponse.rewrite(rewriteUrl);
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

    if (locale === 'en' && !hasEnglishPrefix) {
      const redirectUrl = new URL(`${EN_PREFIX}${pathname}${search}`, request.url);
      return persistLocale(NextResponse.redirect(redirectUrl), 'en');
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
