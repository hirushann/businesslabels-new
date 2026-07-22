import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { proxy } from "./proxy";

function makeRequest(path: string, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("proxy locale routing", () => {
  it("keeps clean URLs in the user's persisted English locale", () => {
    const response = proxy(makeRequest("/product?focus=true", `${LOCALE_COOKIE}=en`));

    expect(response.status).not.toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("keeps checkout return URLs in the user's persisted English locale", () => {
    const response = proxy(makeRequest("/bedankt?order_number=BL-123", `${LOCALE_COOKIE}=en`));

    expect(response.status).not.toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("defaults clean URLs to Dutch when no locale has been selected", () => {
    const response = proxy(makeRequest("/product?focus=true"));

    expect(response.status).not.toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("nl");
  });

  it("keeps prefixed English URLs English", () => {
    const response = proxy(makeRequest("/en/product?focus=true", `${LOCALE_COOKIE}=nl`));

    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("keeps auth redirects locale-aware", () => {
    const response = proxy(makeRequest("/en/my-account"));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBe("http://localhost/en/login?redirect=%2Fen%2Fmy-account");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("keeps auth redirects locale-aware from clean URLs with an English cookie", () => {
    const response = proxy(makeRequest("/my-account", `${LOCALE_COOKIE}=en`));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBe("http://localhost/en/login?redirect=%2Fen%2Fmy-account");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /my-account to /en/my-account when user is authenticated with an English cookie", () => {
    const response = proxy(makeRequest("/my-account", `${LOCALE_COOKIE}=en; auth_token=test_token`));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/en/my-account");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("rewrites /en/software-2 internally to /software", () => {
    const response = proxy(makeRequest("/en/software-2"));

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost/software");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("rewrites /en/knowledge-base internally to /kennisbank-overzicht", () => {
    const response = proxy(makeRequest("/en/knowledge-base"));

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost/kennisbank-overzicht");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /en/kennisbank-overzicht to /en/knowledge-base", () => {
    const response = proxy(makeRequest("/en/kennisbank-overzicht"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/en/knowledge-base");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("rewrites /en/brands internally to /merken", () => {
    const response = proxy(makeRequest("/en/brands"));

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost/merken");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /en/merken to /en/brands", () => {
    const response = proxy(makeRequest("/en/merken"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/en/brands");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("rewrites /en/support-2/ internally to /support", () => {
    const response = proxy(makeRequest("/en/support-2/"));

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost/support");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("rewrites /en/support-2 internally to /support", () => {
    const response = proxy(makeRequest("/en/support-2"));

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost/support");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /en/support to /en/support-2/", () => {
    const response = proxy(makeRequest("/en/support"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/en/support-2/");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /inkt-recyclen-epson-colorworks to /en/inkt-recyclen-epson-colorworks when cookie is en", () => {
    const response = proxy(makeRequest("/inkt-recyclen-epson-colorworks", `${LOCALE_COOKIE}=en`));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/en/inkt-recyclen-epson-colorworks");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /en/custom-made-form to /en/material-customization", () => {
    const response = proxy(makeRequest("/en/custom-made-form"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/en/material-customization");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /en/maatwerk to /en/material-customization", () => {
    const response = proxy(makeRequest("/en/maatwerk"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/en/material-customization");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("rewrites /en/material-customization internally to /maatwerk", () => {
    const response = proxy(makeRequest("/en/material-customization"));

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost/maatwerk");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("rewrites /en/shop internally to /winkel", () => {
    const response = proxy(makeRequest("/en/shop"));

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost/winkel");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /en/winkel to /en/shop", () => {
    const response = proxy(makeRequest("/en/winkel"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/en/shop");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /winkel to /en/shop when cookie is en", () => {
    const response = proxy(makeRequest("/winkel", `${LOCALE_COOKIE}=en`));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/en/shop");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("rewrites /en/cart internally to /winkelmand", () => {
    const response = proxy(makeRequest("/en/cart"));

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost/winkelmand");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /en/winkelmand to /en/cart", () => {
    const response = proxy(makeRequest("/en/winkelmand"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/en/cart");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });


  it("redirects /contact to /contact-us", () => {
    const response = proxy(makeRequest("/contact"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/contact-us");
  });

  it("redirects /en/contact to /en/contact-us", () => {
    const response = proxy(makeRequest("/en/contact"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/en/contact-us");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("rewrites /en/terms-and-conditions internally to /algemene-voorwaarden", () => {
    const response = proxy(makeRequest("/en/terms-and-conditions"));

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost/algemene-voorwaarden");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /en/algemene-voorwaarden to /en/terms-and-conditions", () => {
    const response = proxy(makeRequest("/en/algemene-voorwaarden"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/en/terms-and-conditions");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /terms-and-conditions to /algemene-voorwaarden", () => {
    const response = proxy(makeRequest("/terms-and-conditions"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/algemene-voorwaarden");
  });
});
