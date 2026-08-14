import re

path = '/Users/hirushanperera/Sites/businesslabels-new/src/components/ProductPurchase.tsx'
with open(path, 'r') as f:
    content = f.read()

# Desktop revert
desktop_new = """                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(quantity);
                      }}
                      disabled={!resolvedInStock}
                      aria-describedby={quantityError ? "quantity-error" : undefined}
                      className="w-full sm:flex-1 h-12 px-4 py-2.5 bg-brand rounded-[100px] justify-center items-center gap-2 hover:bg-brand-hover transition-colors shadow-sm flex disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:hover:bg-zinc-300"
                    >
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.33366 20.1663C7.83992 20.1663 8.25033 19.7559 8.25033 19.2497C8.25033 18.7434 7.83992 18.333 7.33366 18.333C6.8274 18.333 6.41699 18.7434 6.41699 19.2497C6.41699 19.7559 6.8274 20.1663 7.33366 20.1663Z" stroke="white" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M17.4167 20.1663C17.9229 20.1663 18.3333 19.7559 18.3333 19.2497C18.3333 18.7434 17.9229 18.333 17.4167 18.333C16.9104 18.333 16.5 18.7434 16.5 19.2497C16.5 19.7559 16.9104 20.1663 17.4167 20.1663Z" stroke="white" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M1.87988 1.87988H3.71322L6.15155 13.2649C6.241 13.6818 6.473 14.0546 6.80762 14.3189C7.14224 14.5833 7.55855 14.7227 7.98488 14.7132H16.9499C17.3671 14.7125 17.7717 14.5696 18.0967 14.3079C18.4217 14.0462 18.6477 13.6815 18.7374 13.274L20.2499 6.46322H16.3609C16.3609 6.46322 15.5833 9.16667 12.375 9.16667C9.16667 9.16667 8.58301 6.46322 8.58301 6.46322H4.69405" stroke="white" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10.083 4.125H14.6663" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12.375 1.83301V6.41634" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>

                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-white text-base font-bold whitespace-nowrap leading-[1]">{t("product.addToCart")}</span>
                        <span className="text-white/80 text-[10px] whitespace-nowrap leading-[1] mt-[2px]">
                          {t("product.box")} ({normalizedPackingGroup ?? 0} {rollsStackLabel})
                        </span>
                      </div>
                    </button>"""

desktop_old = """                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(Math.max(1, Math.ceil(quantity / (normalizedPackingGroup || 1))) * (normalizedPackingGroup || 1));
                      }}
                      disabled={!resolvedInStock}
                      className="w-full sm:flex-1 h-12 px-4 py-2.5 bg-amber-100 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-amber-300 justify-center items-center gap-2 hover:bg-amber-300 transition-colors flex disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:outline-zinc-200 disabled:hover:bg-zinc-100"
                    >
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.33366 20.1663C7.83992 20.1663 8.25033 19.7559 8.25033 19.2497C8.25033 18.7434 7.83992 18.333 7.33366 18.333C6.8274 18.333 6.41699 18.7434 6.41699 19.2497C6.41699 19.7559 6.8274 20.1663 7.33366 20.1663Z" stroke="orange" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M17.4167 20.1663C17.9229 20.1663 18.3333 19.7559 18.3333 19.2497C18.3333 18.7434 17.9229 18.333 17.4167 18.333C16.9104 18.333 16.5 18.7434 16.5 19.2497C16.5 19.7559 16.9104 20.1663 17.4167 20.1663Z" stroke="orange" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M1.87988 1.87988H3.71322L6.15155 13.2649C6.241 13.6818 6.473 14.0546 6.80762 14.3189C7.14224 14.5833 7.55855 14.7227 7.98488 14.7132H16.9499C17.3671 14.7125 17.7717 14.5696 18.0967 14.3079C18.4217 14.0462 18.6477 13.6815 18.7374 13.274L20.2499 6.46322H16.3609C16.3609 6.46322 15.5833 9.16667 12.375 9.16667C9.16667 9.16667 8.58301 6.46322 8.58301 6.46322H4.69405" stroke="orange" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10.083 4.125H14.6663" stroke="orange" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12.375 1.83301V6.41634" stroke="orange" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>

                      <span className="text-brand text-base font-bold whitespace-nowrap">
                        {t("product.box")}{" "}
                        <span className="text-xs text-brand">
                          ({normalizedPackingGroup ?? 0} {rollsStackLabel})
                        </span>
                      </span>
                    </button>"""

if desktop_new in content:
    content = content.replace(desktop_new, desktop_old)
else:
    print("Desktop chunk not found")

# Mobile revert
mobile_new = """                <button
                  type="button"
                  onClick={() => handleAddToCart(quantity)}
                  disabled={!resolvedInStock}
                  aria-describedby={quantityError ? "quantity-error" : undefined}
                  className="w-full h-11 px-4 bg-brand rounded-[100px] justify-center items-center gap-2 hover:bg-brand-hover transition-colors shadow-sm flex disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:hover:bg-zinc-300"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-white text-sm font-bold whitespace-nowrap leading-[1]">{t("product.addToCart")}</span>
                    <span className="text-white/80 text-[9px] whitespace-nowrap leading-[1] mt-[1px]">
                      {t("product.box")} ({normalizedPackingGroup ?? 0} {rollsStackLabel})
                    </span>
                  </div>
                </button>"""

mobile_old = """                <button
                  type="button"
                  onClick={() => handleAddToCart(Math.max(1, Math.ceil(quantity / (normalizedPackingGroup || 1))) * (normalizedPackingGroup || 1))}
                  disabled={!resolvedInStock}
                  className="w-full h-11 px-4 bg-amber-100 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-amber-300 justify-center items-center gap-2 hover:bg-amber-300 transition-colors flex disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:outline-zinc-200 disabled:hover:bg-zinc-100"
                >
                  <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-brand text-sm font-bold whitespace-nowrap">
                    {t("product.box")}{" "}
                    <span className="text-[10px] text-brand">
                      ({normalizedPackingGroup ?? 0} {rollsStackLabel})
                    </span>
                  </span>
                </button>"""

if mobile_new in content:
    content = content.replace(mobile_new, mobile_old)
else:
    print("Mobile chunk not found")

with open(path, 'w') as f:
    f.write(content)
