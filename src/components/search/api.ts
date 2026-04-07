import { ApiProxyConnector } from '@elastic/search-ui-elasticsearch-connector';

export const apiConnector = new ApiProxyConnector({
  basePath: '/api',
});

export type OverlaySortValue =
  | 'relevance'
  | 'latest'
  | 'oldest'
  | 'title_asc'
  | 'title_desc'
  | 'price_asc'
  | 'price_desc';

export const SORT_TO_SEARCH_UI: Record<OverlaySortValue, { field: string | null; direction: 'asc' | 'desc' | null }> = {
  relevance: { field: null, direction: null },
  latest: { field: 'created_at_timestamp', direction: 'desc' },
  oldest: { field: 'created_at_timestamp', direction: 'asc' },
  title_asc: { field: 'title_sort.keyword', direction: 'asc' },
  title_desc: { field: 'title_sort.keyword', direction: 'desc' },
  price_asc: { field: 'price', direction: 'asc' },
  price_desc: { field: 'price', direction: 'desc' },
};
