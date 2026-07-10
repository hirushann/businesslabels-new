import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  categoryName,
  type CategoryNode,
  categoryPublicPath,
} from "@/lib/categories/tree";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";

type CategorySubnavProps = {
  /** Direct children of the category the visitor is currently browsing. */
  subcategories: CategoryNode[];
  ancestors: CategoryNode[];
  locale: string;
  hrefForCategory?: (category: CategoryNode) => string;
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
  hrefForCategory,
}: CategorySubnavProps) {
  if (!subcategories.length) return null;

  const t = await getTranslations();

  return (
    <nav
      aria-label={t("categoryArchive.subcategoriesLabel")}
      className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4"
    >
      {subcategories.map((category) => {
        const name = categoryName(category, locale);
        const href = categoryPublicPath(category, ancestors, locale);
        const imageUrl = toDisplayImageUrl(category.image || category.main_image);

        return (
          <Link
            key={category.id}
            href={hrefForCategory?.(category) ?? href}
            className="group flex flex-col items-center justify-center gap-6 rounded-xl border border-line bg-white px-4 py-6 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.1)] transition-colors hover:border-brand hover:bg-brand-soft h-[280px]"
          >
            <div className="relative flex h-full w-full md:h-40 md:w-40 shrink-0 items-center justify-center">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  className="object-contain"
                  fill
                  sizes="(max-width: 768px) 100vw, 160px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-12 w-12"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="w-full text-center px-2">
              <span className="block text-xl font-bold leading-[1.2] text-ink transition-colors group-hover:text-brand line-clamp-2">
                {name}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
