import { describe, expect, it } from "vitest";

import type { estypes } from "@elastic/elasticsearch";
import { buildMaterialSortClause, buildMaterialTextQuery, printMethodFilterValues } from "./materials";

describe("material print method filters", () => {
  it("matches category/taxon slugs for inkjet materials", () => {
    expect(printMethodFilterValues("inkjet")).toEqual(
      expect.arrayContaining([
        "inkjet",
        "inkjet-printer-media",
        "inkjetpapier-labels",
        "kunststof-inkjet-labels",
      ]),
    );
  });

  it("matches category/taxon slugs for thermal transfer materials", () => {
    expect(printMethodFilterValues("thermal-transfer")).toEqual(
      expect.arrayContaining([
        "thermal-transfer",
        "thermal-transfer-printer-media",
        "thermische-overdracht-printer-media",
        "papieren-labels-tt",
        "kunststof-labels-tt",
      ]),
    );
  });

  it("matches category/taxon slugs for thermal direct materials", () => {
    expect(printMethodFilterValues("thermal-direct")).toEqual(
      expect.arrayContaining([
        "td",
        "thermal-direct",
        "thermal-direct-printer-media",
        "thermisch-directe-printer-media",
        "papieren-labels-td",
        "kunststof-labels-td",
      ]),
    );
  });
});

describe("material search ranking", () => {
  it("ranks an exact material code above title, tag, specification, content, and partial code matches", () => {
    const query = buildMaterialTextQuery("DIA055") as estypes.QueryDslQueryContainer;
    const clauses = query.bool?.should as estypes.QueryDslQueryContainer[];
    const exact = clauses.find((clause) => clause.term?.["code.keyword"])?.term?.["code.keyword"] as estypes.QueryDslTermQuery;
    const title = (clauses.find((clause) => clause.match_phrase?.title)?.match_phrase as Record<string, estypes.QueryDslMatchPhraseQuery>).title;
    const groups = clauses.filter((clause) => clause.multi_match).map((clause) => clause.multi_match!);
    const tag = groups.find((group) => group.fields?.includes("category_slugs^3"));
    const specification = groups.find((group) => group.fields?.includes("specifications.*"));
    const content = groups.find((group) => group.fields?.includes("description"));
    const partial = clauses.find((clause) => clause.wildcard?.["code.keyword"])?.wildcard?.["code.keyword"] as estypes.QueryDslWildcardQuery;

    expect(exact.value).toBe("DIA055");
    expect(exact.boost).toBeGreaterThan(title.boost as number);
    expect(title.boost).toBeGreaterThan(tag?.boost as number);
    expect(tag?.boost).toBeGreaterThan(specification?.boost as number);
    expect(specification?.boost).toBeGreaterThan(content?.boost as number);
    expect(exact.boost).toBeGreaterThan(partial.boost as number);
  });

  it("keeps partial material-code searches relevant and sorts search results by score first", () => {
    const query = buildMaterialTextQuery("DIA05") as estypes.QueryDslQueryContainer;
    const clauses = query.bool?.should as estypes.QueryDslQueryContainer[];
    const partial = clauses.find((clause) => clause.wildcard?.["code.keyword"])?.wildcard?.["code.keyword"] as estypes.QueryDslWildcardQuery;

    expect(partial.value).toBe("dia05*");
    expect(buildMaterialSortClause("DIA05", "name_asc")).toEqual([
      { _score: { order: "desc" } },
      { "title_sort.keyword": { order: "asc", unmapped_type: "keyword" } },
    ]);
  });
});
