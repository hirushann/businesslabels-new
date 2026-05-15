const { elasticClient } = require('./src/lib/search/client');

async function test() {
  const client = elasticClient();
  const response = await client.search({
    index: "business_labels_catalog_products",
    size: 1,
    query: { match_all: {} }
  });
  console.log(JSON.stringify(response.hits.hits[0]._source, null, 2));
}

test().catch(console.error);
