export interface WhyChooseBusinessLabelImages {
  why_choose_business_label_image?: string | null;
  left_logo?: string | null;
  right_logo?: string | null;
}

export interface QuickLinksImages {
  find_the_right_printer_image?: string | null;
  find_labels_materials_image?: string | null;
  quick_reorder_image?: string | null;
}

export interface HomePageData {
  hero_banner?: string | null;
  why_choose_business_label?: WhyChooseBusinessLabelImages | null;
  quick_links?: QuickLinksImages | null;
  footer_banner?: string | null;
}

export interface HomeApiResponse {
  data: HomePageData;
}

/**
 * Fetch home page content and images from backend.
 * Endpoint: /api/home
 */
export async function getHomeData(): Promise<HomePageData | null> {
  const baseUrl = (process.env.BBNL_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

  try {
    const response = await fetch(`${baseUrl}/api/home`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch home data: ${response.status} ${response.statusText}`);
      return null;
    }

    const json = (await response.json()) as HomeApiResponse;
    return json?.data ?? null;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      (error as { digest?: string }).digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw error;
    }
    console.error('Error fetching home data:', error);
    return null;
  }
}
