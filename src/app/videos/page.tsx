import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("videos");

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function VideosPage() {
  const t = await getTranslations();
  const title = t("menus.resources.videosTitle");
  const description = t("menus.resources.videosDesc");

  return (
    <div className="bg-white min-h-screen">
      <div className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-360 flex-col gap-12">
          {/* Breadcrumbs */}
          <div className="w-full">
            <Breadcrumbs
              className="text-slate-500"
              items={[{ label: title }]}
            />
          </div>

          {/* Page Title */}
          <div className="w-full text-left">
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">
              {title}
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed font-medium">
              {description}
            </p>
          </div>

          {/* Empty Content Area */}
          <div className="w-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 p-8 text-center">
            <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-4">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 6H3C1.9 6 1 6.9 1 8V16C1 17.1 1.9 18 3 18H21C22.1 18 23 17.1 23 16V8C23 6.9 22.1 6 21 6Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 9L15 12L10 15V9Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {title}
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
