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
  it("resets clean URLs to Dutch even with a persisted English cookie (N01: URL is the source of truth)", () => {
    const response = proxy(makeRequest("/product?focus=true", `${LOCALE_COOKIE}=en`));

    expect(response.status).not.toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("nl");
  });

  it("resets checkout return URLs to Dutch even with a persisted English cookie (N01: URL is the source of truth)", () => {
    const response = proxy(makeRequest("/bedankt?order_number=BL-123", `${LOCALE_COOKIE}=en`));

    expect(response.status).not.toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("nl");
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

  it("uses Dutch for product-categorie URLs even with an English cookie", () => {
    const response = proxy(
      makeRequest(
        "/product-categorie/labelprinters/verbruiksmaterialen-nl",
        `${LOCALE_COOKIE}=en`,
      ),
    );

    expect(response.status).not.toBeGreaterThanOrEqual(300);
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("nl");
  });

  it("keeps auth redirects locale-aware", () => {
    const response = proxy(makeRequest("/en/my-account"));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBe("http://localhost/en/login?redirect=%2Fen%2Fmy-account");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects unauthenticated /my-account to the Dutch login, even with a persisted English cookie (N01)", () => {
    const response = proxy(makeRequest("/my-account", `${LOCALE_COOKIE}=en`));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBe("http://localhost/login?redirect=%2Fmy-account");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("nl");
  });

  it("serves /my-account in Dutch for an authenticated user, even with a persisted English cookie (N01)", () => {
    const response = proxy(makeRequest("/my-account", `${LOCALE_COOKIE}=en; auth_token=test_token`));

    expect(response.status).not.toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("nl");
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

    expect(response.status).toBe(301);
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

    expect(response.status).toBe(301);
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

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/en/support-2/");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("keeps /inkt-recyclen-epson-colorworks in Dutch even with an English cookie (N01)", () => {
    const response = proxy(makeRequest("/inkt-recyclen-epson-colorworks", `${LOCALE_COOKIE}=en`));

    expect(response.status).not.toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("nl");
  });

  it("redirects /en/custom-made-form to /en/material-customization", () => {
    const response = proxy(makeRequest("/en/custom-made-form"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/en/material-customization");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /en/maatwerk to /en/material-customization", () => {
    const response = proxy(makeRequest("/en/maatwerk"));

    expect(response.status).toBe(301);
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

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/en/shop");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("keeps /winkel in Dutch even with an English cookie (N01)", () => {
    const response = proxy(makeRequest("/winkel", `${LOCALE_COOKIE}=en`));

    expect(response.status).not.toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("nl");
  });

  it("rewrites /en/cart internally to /winkelmand", () => {
    const response = proxy(makeRequest("/en/cart"));

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost/winkelmand");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /en/winkelmand to /en/cart", () => {
    const response = proxy(makeRequest("/en/winkelmand"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/en/cart");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });


  it("redirects /contact to /contact-us", () => {
    const response = proxy(makeRequest("/contact"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/contact-us");
  });

  it("redirects /en/contact to /en/contact-us", () => {
    const response = proxy(makeRequest("/en/contact"));

    expect(response.status).toBe(301);
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

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/en/terms-and-conditions");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /terms-and-conditions to /algemene-voorwaarden", () => {
    const response = proxy(makeRequest("/terms-and-conditions"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/algemene-voorwaarden");
  });

  it("redirects /brand to /merken", () => {
    const response = proxy(makeRequest("/brand"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/merken");
  });

  it("redirects /en/brand to /en/brands", () => {
    const response = proxy(makeRequest("/en/brand"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/en/brands");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects /en/brands/expobadge to canonical /en/brand/expo_badge", () => {
    const response = proxy(makeRequest("/en/brands/expobadge"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/en/brand/expo_badge");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects alias /brand/expobadge to canonical /brand/expo_badge", () => {
    const response = proxy(makeRequest("/brand/expobadge"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/brand/expo_badge");
  });

  it("redirects alias /en/brand/seiko to canonical /en/brand/sii", () => {
    const response = proxy(makeRequest("/en/brand/seiko"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/en/brand/sii");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("redirects alias /brand/epson-nl to canonical /brand/epson", () => {
    const response = proxy(makeRequest("/brand/epson-nl"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/brand/epson");
  });

  it("redirects alias /brand/diamondlabels to canonical /brand/diamondlabels-nl", () => {
    const response = proxy(makeRequest("/brand/diamondlabels"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/brand/diamondlabels-nl");
  });

  it("redirects /brands/epson to /brand/epson", () => {
    const response = proxy(makeRequest("/brands/epson"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/brand/epson");
  });

  it("redirects legacy /bierfles-labels-printen to /material", () => {
    const response = proxy(makeRequest("/bierfles-labels-printen"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/material");
  });

  it("redirects double slashes to normalized single slash", () => {
    const response = proxy(makeRequest("//product/colorworks-cw-c6500ae-bk"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/product/colorworks-cw-c6500ae-bk");
  });

  it("strips redundant ?lang=en from /en URLs", () => {
    const response = proxy(makeRequest("/en/product/zx1200i?lang=en"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/en/product/zx1200i");
  });

  it("redirects legacy product_cat parameters to modern category archives", () => {
    const response = proxy(
      makeRequest("/?product_cat=printer-nl/kleuren-labelprinters-nl/midrange-labelprinters-nl&lang=nl"),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "http://localhost/product-categorie/labelprinters/kleuren-labelprinters/midrange-kleurenprinters",
    );
  });

  it("redirects legacy post_type=product plain permalinks to /product", () => {
    const response = proxy(makeRequest("/en?post_type=product&p=52555"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/en/product");
  });

  it("strips legacy filter query parameters from brand archive URLs", () => {
    const response = proxy(makeRequest("/brand/epson?bbnl=1&paged=1&really_curr_tax=5005-brand"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost/brand/epson");
  });

  it("rewrites /wp-content/uploads/ internally to /api/media-proxy", () => {
    const response = proxy(makeRequest("/wp-content/uploads/2023/06/Inkt-kosten-ColorWorks-LR.pdf"));

    expect(response.status).not.toBeGreaterThanOrEqual(300);
    expect(response.headers.get("x-middleware-rewrite")).toContain("/api/media-proxy?url=");
    expect(response.headers.get("x-middleware-rewrite")).toContain("Inkt-kosten-ColorWorks-LR.pdf");
  });
});
