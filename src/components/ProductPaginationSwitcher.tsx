"use client";

type ProductPaginationSwitcherProps = {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

function buildVisiblePages(currentPage: number, lastPage: number): Array<number | "ellipsis"> {
  if (lastPage <= 1) {
    return [1];
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(lastPage);

  const start = Math.max(1, currentPage - 3);
  const end = Math.min(lastPage, currentPage + 3);

  for (let page = start; page <= end; page += 1) {
    pages.add(page);
  }

  const sortedPages = [...pages].sort((left, right) => left - right);
  const visible: Array<number | "ellipsis"> = [];

  for (let index = 0; index < sortedPages.length; index += 1) {
    const page = sortedPages[index];
    const previous = sortedPages[index - 1];

    if (previous && page - previous > 1) {
      visible.push("ellipsis");
    }

    visible.push(page);
  }

  return visible;
}

export default function ProductPaginationSwitcher({
  currentPage,
  pageCount,
  onPageChange,
}: ProductPaginationSwitcherProps) {
  const page = Math.min(Math.max(1, currentPage), pageCount);
  const visiblePages = buildVisiblePages(page, pageCount);

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="rounded-[50px] border border-slate-100 px-6 py-2.5 text-base font-medium text-neutral-800 disabled:opacity-50"
      >
        Previous
      </button>

      {visiblePages.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-2 text-sm font-semibold text-zinc-500">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={`flex h-10 min-w-10 items-center justify-center rounded-[50px] border border-slate-100 px-3 text-sm font-semibold ${
              item === page ? "bg-amber-500 text-white" : "text-neutral-700"
            }`}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
        className="rounded-[50px] border border-slate-100 px-6 py-2.5 text-base font-semibold text-neutral-800 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
