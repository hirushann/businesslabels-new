const { Client } = require('@elastic/elasticsearch');

async function test() {
  const client = new Client({
    node: 'http://localhost:9200'
  });
  const index = "business_labels_catalog_printers";
  
  // Default latest sort (created_at_timestamp desc)
  const response = await client.search({
    index,
    size: 24,
    body: {
      query: {
        bool: {
          must: [{ term: { status: "published" } }],
          filter: []
        }
      },
      sort: [
        { created_at_timestamp: { order: "desc" } }
      ]
    }
  });

  const hits = response.hits.hits;
  console.log("Unsorted Page 1:");
  hits.forEach((h, idx) => {
    console.log(`${idx + 1}. ID: ${h._source.id}, Name: ${h._source.title[0]}, Featured: ${h._source.featured}`);
  });
}

test().catch(console.error);
