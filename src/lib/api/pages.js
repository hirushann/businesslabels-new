/**
 * Pages & Posts API
 *
 * `/pages` and `/posts` are served by the same Laravel controller and resource,
 * so both return the {@link import('./types').Page} shape. Each item carries a
 * `translations` array with every locale bundled — switch language client-side
 * without refetching.
 *
 * @see Laravel: App\Http\Controllers\API\PageController
 * @see Laravel: App\Http\Resources\Api\PageResource
 */

import api from './client';

/**
 * List all published CMS pages.
 * @returns {Promise<{ data: import('./types').Page[] }>}
 */
export async function listPages() {
  const { data } = await api.get('/pages');
  return data;
}

/**
 * Get a single published CMS page by slug.
 * @param {string} slug
 * @returns {Promise<{ data: import('./types').Page }>}
 */
export async function getPage(slug) {
  const { data } = await api.get(`/pages/slug/${slug}`);
  return data;
}

/**
 * List all published blog posts.
 * @returns {Promise<{ data: import('./types').Page[] }>}
 */
export async function listPosts() {
  const { data } = await api.get('/posts');
  return data;
}

/**
 * Get a single published blog post by slug.
 * @param {string} slug
 * @returns {Promise<{ data: import('./types').Page }>}
 */
export async function getPost(slug) {
  const { data } = await api.get(`/posts/slug/${slug}`);
  return data;
}
