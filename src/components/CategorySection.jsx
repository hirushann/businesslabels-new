import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";

// Configure the categories to display: slug (Dutch), and a fallback image per category
const targetCategories = [
  { slug: 'labelprinters', fallbackImage: '/labelprinters.jpeg' },
  { slug: 'labels-en-tickets', fallbackImage: '/labelrolls.png' },
  { slug: 'inkt-cartridges-nl', fallbackImage: '/inkandsupplies.png' },
  { slug: 'specials', fallbackImage: '/speciallabels.png' },
];

function flattenCategories(categories) {
  let flat = [];
  for (const cat of categories) {
    flat.push(cat);
    if (cat.children && cat.children.length > 0) {
      flat = flat.concat(flattenCategories(cat.children));
    }
  }
  return flat;
}

export default async function CategorySection() {
  const t = await getTranslations();
  const locale = await getServerLocale();
  const baseUrl = process.env.BBNL_API_BASE_URL || '';

  let apiCategories = [];
  try {
    const response = await fetch(withLocaleParam(`${baseUrl}/api/categories`, locale), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
    if (response.ok) {
      const json = await response.json();
      if (json.data) {
        apiCategories = json.data.flatMap(group => flattenCategories(group.categories || []));
      }
    }
  } catch (error) {
    console.error("Failed to fetch categories:", error);
  }

  const categories = targetCategories.map(({ slug, fallbackImage }) => {
    // Find category matching the slug or its translations
    const apiCat = apiCategories.find(c => 
      c.slug === slug || 
      c.translations?.en?.slug === slug || 
      c.translations?.nl?.slug === slug
    );

    if (!apiCat) return null;

    // Use the API image if available, otherwise use the per-category fallback
    const rawApiImage = apiCat.image || apiCat.main_image;
    const imageUrl = rawApiImage ? (toDisplayImageUrl(rawApiImage) || rawApiImage) : fallbackImage;

    // Use the localized slug for the href (English slug when locale is en)
    const localizedSlug = (locale === 'en' && apiCat.translations?.en?.slug) 
      ? apiCat.translations.en.slug 
      : apiCat.slug;
    // Use the localized name
    const localizedName = (locale === 'en' && apiCat.translations?.en?.name) 
      ? apiCat.translations.en.name 
      : apiCat.name;

    return {
      key: apiCat.slug,
      href: `/category/${localizedSlug}`,
      name: localizedName,
      image: imageUrl,
    };
  }).filter(Boolean);
  
  return (
    <section className="w-full px-4 md:px-8 lg:px-10 py-16 lg:py-28 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="w-[600px] h-[600px] absolute -top-48 -left-48 bg-gradient-to-br from-orange-300/25 to-amber-200/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="w-[600px] h-[600px] absolute -bottom-48 -right-48 bg-gradient-to-br from-orange-300/25 to-amber-200/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-360 mx-auto w-full flex flex-col gap-12">
        <h2 className="text-center text-neutral-800 text-3xl md:text-4xl font-semibold leading-tight md:leading-[48px]">
          {t('categories.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={cat.href}
              className="relative h-72 sm:h-98 bg-white rounded-xl shadow border-2 border-gray-200 overflow-hidden group hover:border-brand transition-colors"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-900/50 to-black/0" />
              {/* Label */}
              <div className="absolute bottom-6 left-6 flex items-center gap-2">
                <span className="text-white text-2xl font-normal leading-7">{cat.name}</span>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.8225 4.44751L15.375 9.00001L10.8225 13.5525" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.625 9H15.2475" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
