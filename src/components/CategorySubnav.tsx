import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  type CategoryNode,
  categoryPublicPath,
  categoryRouteSlug,
  resolveLocalized,
} from "@/lib/categories/tree";

type CategorySubnavProps = {
  /** Direct children of the category the visitor is currently browsing. */
  subcategories: CategoryNode[];
  ancestors: CategoryNode[];
  locale: string;
  parentPublicPath?: string | null;
};

/**
 * Subcategory navigation shown above the product grid on a category archive
 * page. Each card drills one level deeper into the hierarchy; rendering is
 * identical at every level so the visitor can step through the tree without
 * losing context. Renders nothing at the deepest level (no children).
 */
export default async function CategorySubnav({
  subcategories,
  ancestors,
  locale,
  parentPublicPath,
}: CategorySubnavProps) {
  if (!subcategories.length) return null;

  const t = await getTranslations();

  return (
    <nav
      aria-label={t("categoryArchive.subcategoriesLabel")}
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
    >
      {subcategories.map((category) => {
        const name = resolveLocalized(category.name, locale);
        // The card always shows the product count for the (sub)category —
        // including products in any deeper descendants, since `count` from
        // the backend aggregates by ancestor chain.
        const meta = t("categoryArchive.productCount", { count: category.count });
        const href = parentPublicPath
          ? `${parentPublicPath}/${encodeURIComponent(categoryRouteSlug(category, locale))}`
          : categoryPublicPath(category, ancestors, locale);

        return (
          <Link
            key={category.id}
            href={href}
            className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] transition-colors hover:border-amber-400 hover:bg-amber-50"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-base font-semibold leading-5 text-neutral-800 group-hover:text-amber-600">
                {name}
              </span>
              <span className="text-xs leading-4 text-neutral-500">{meta}</span>
            </span>
            <svg
              className="h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-amber-500"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6.75 3.94501L11.3025 8.49751L6.75 13.05"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        );
      })}
    </nav>
  );
}
