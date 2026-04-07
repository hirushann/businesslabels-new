import Image from 'next/image';
import Link from 'next/link';

type Product = {
  id: number;
  type: string;
  name: string;
  sku: string;
  subtitle: string;
  excerpt: string;
  price: number;
  original_price: number;
  in_stock: boolean;
  main_image: string;
  material?: {
    title: string;
  };
};

type ProductsResponse = {
  data: Product[];
};

export default async function PopularProducts() {
  const baseUrl = process.env.BBNL_API_BASE_URL;

  if (!baseUrl) {
    throw new Error('BBNL_API_BASE_URL is not configured');
  }

  const response = await fetch(`${baseUrl}/api/products`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  const json = (await response.json()) as ProductsResponse;
  const products = json.data.slice(0, 4);

  return (
    <section className="relative w-full px-10 py-28 overflow-hidden">
      {/* Decorative blobs */}
      <div className="w-48 h-48 absolute right-52 top-0 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />
      <div className="w-48 h-48 absolute left-0 top-0 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-12">
        {/* Header row */}
        <div className="flex justify-between items-center">
          <h2 className="text-neutral-800 text-4xl font-bold font-['Segoe_UI'] leading-[48px]">
            Popular Products
          </h2>
          <Link
            href="/products"
            className="px-6 py-4 rounded-full border border-amber-500 flex items-center gap-2.5 text-amber-500 text-base font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-50 transition-colors"
          >
            View All Products
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.sku}
              className="bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] border border-slate-100 flex flex-col overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image area */}
              <div className="relative h-56 bg-slate-100 overflow-hidden">
                {/* Badges */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                  <div className="px-2.5 py-1 bg-white rounded-full flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="0.5" y="3" width="11" height="6" rx="0.5" stroke="#404040" />
                    </svg>
                    <span className="text-neutral-700 text-xs font-normal font-['Segoe_UI'] leading-4">{product.type}</span>
                  </div>
                  {product.in_stock ? (
                    <div className="px-2.5 py-1 bg-green-600 rounded-full flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-white text-xs font-normal font-['Segoe_UI'] leading-4">In Stock</span>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1 bg-gray-200 rounded-full">
                      <span className="text-gray-600 text-xs font-normal font-['Segoe_UI'] leading-4">Out of Stock</span>
                    </div>
                  )}
                </div>
                <Image
                  src={product.main_image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col gap-4 flex-1">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-blue-400 text-sm font-normal font-['Segoe_UI'] leading-5">
                      SKU: {product.sku}
                    </span>
                    <h3 className="text-neutral-800 text-xl font-semibold font-['Segoe_UI'] leading-6">
                      {product.name}
                    </h3>
                  </div>
                  <div className="flex flex-col gap-4">
                    {[product.subtitle, product.material?.title, product.excerpt]
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_89_3133)"><path d="M10.9013 4.99975C11.1296 6.1204 10.9669 7.28546 10.4402 8.30065C9.91352 9.31583 9.05473 10.1198 8.00704 10.5784C6.95935 11.037 5.7861 11.1226 4.68293 10.8209C3.57977 10.5192 2.61338 9.84845 1.94492 8.92046C1.27646 7.99247 0.946343 6.86337 1.00961 5.72144C1.07289 4.57952 1.52572 3.4938 2.29261 2.64534C3.05949 1.79688 4.09407 1.23697 5.22381 1.05898C6.35356 0.880989 7.51017 1.09568 8.50078 1.66725" stroke="#00C950" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.5 5.5L6 7L11 2" stroke="#00C950" strokeLinecap="round" strokeLinejoin="round"/></g><defs><clipPath id="clip0_89_3133"><rect width="12" height="12" fill="white"/></clipPath></defs>
                        </svg>
                        <span className="text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-5">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-auto">
                  <div className="bg-slate-100" />
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-end gap-2">
                        <span className="text-neutral-800 text-2xl font-bold font-['Segoe_UI'] leading-7">
                          €{product.price.toFixed(2)}
                        </span>
                        <span className="text-zinc-400 text-sm font-normal font-['Segoe_UI'] leading-5 line-through">
                          €{product.original_price.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-zinc-500 text-xs font-normal font-['Segoe_UI'] leading-4">ex. VAT</span>
                    </div>
                    <button className="px-4 py-2.5 bg-amber-500 rounded-full flex items-center gap-2 text-white text-base font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors">
                      Add
                      <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.33268 14.6663C7.83894 14.6663 8.24935 14.3679 8.24935 13.9997C8.24935 13.6315 7.83894 13.333 7.33268 13.333C6.82642 13.333 6.41602 13.6315 6.41602 13.9997C6.41602 14.3679 6.82642 14.6663 7.33268 14.6663Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M17.4167 14.6663C17.9229 14.6663 18.3333 14.3679 18.3333 13.9997C18.3333 13.6315 17.9229 13.333 17.4167 13.333C16.9104 13.333 16.5 13.6315 16.5 13.9997C16.5 14.3679 16.9104 14.6663 17.4167 14.6663Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.87891 1.36621H3.71224L6.15057 9.64621C6.24002 9.94945 6.47202 10.2205 6.80664 10.4128C7.14126 10.605 7.55757 10.7064 7.9839 10.6995H16.9489C17.3661 10.6991 17.7707 10.5951 18.0957 10.4048C18.4207 10.2145 18.6467 9.94923 18.7364 9.65288L20.2489 4.69954H4.69307" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
