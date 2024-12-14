import VectorSearch from "./VectorStore.js";
import FootwayAPI from "./FootwayAPI.js";

const vectorSearch = new VectorSearch("http://localhost:3001");
const footwayAPI = new FootwayAPI("http://localhost:3001");

export async function rag_search_items(query, num_items) {
  const vectors = await vectorSearch.fetchTopVectorsForItems(
    [query],
    0.3,
    num_items
  );

  const topProducts = await footwayAPI.fetchProductDetails(
    vectors.map((item) => item.metadata.product_name) // Map to the expected structure
  );
  return topProducts;
}
