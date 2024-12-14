export default class VectorSearch {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async search(query) {
    console.log(`Fetching vector results for query: "${query}"...`);
    try {
      const response = await fetch(
        `${this.baseURL}/api/test/vector?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch vector results");
      }

      const data = await response.json();
      console.log(`Vector search results for "${query}":`, data.items);
      return data.items || [];
    } catch (error) {
      console.error("Error in vector search:", error);
      return [];
    }
  }
}
