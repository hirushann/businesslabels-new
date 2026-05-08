import type {
  APIConnector,
  AutocompleteQueryConfig,
  AutocompleteResponseState,
  QueryConfig,
  RequestState,
  ResponseState,
} from "@elastic/search-ui";

/**
 * A Search UI API connector that proxies to /api/search just like
 * ApiProxyConnector, but additionally sends archive scope values in every
 * request body so the server can scope both results and stats aggregations.
 */
export class CategoryScopedProxyConnector implements APIConnector {
  private readonly basePath: string;
  private readonly categorySlug?: string;
  private readonly brandSlug?: string;

  constructor({
    basePath = "/api",
    categorySlug,
    brandSlug,
  }: {
    basePath?: string;
    categorySlug?: string;
    brandSlug?: string;
  }) {
    this.basePath = basePath.replace(/\/$/, "");
    this.categorySlug = categorySlug;
    this.brandSlug = brandSlug;
  }

  async onSearch(state: RequestState, queryConfig: QueryConfig): Promise<ResponseState> {
    const response = await fetch(`${this.basePath}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, queryConfig, categorySlug: this.categorySlug, brandSlug: this.brandSlug }),
    });

    if (!response.ok) {
      return {
        results: [],
        totalResults: 0,
        totalPages: 0,
        requestId: "",
        facets: {},
        rawResponse: null,
      } as unknown as ResponseState;
    }

    return response.json() as Promise<ResponseState>;
  }

  async onAutocomplete(
    _state: RequestState,
    _queryConfig: AutocompleteQueryConfig,
  ): Promise<AutocompleteResponseState> {
    return { autocompletedResults: [], autocompletedResultsRequestId: "", autocompletedSuggestions: {}, autocompletedSuggestionsRequestId: "" } as AutocompleteResponseState;
  }

  onResultClick(): void {}
  onAutocompleteResultClick(): void {}
}
