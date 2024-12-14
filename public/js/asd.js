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

  async fetchTopVectorsForItems(items, similarityThreshold = 0.3, topN = 3) {
    console.log("Fetching top vector results for multiple items...");
    const topVectors = await Promise.all(
      items.map(async (item) => {
        const results = await this.search(item);

        // Filter results based on similarity threshold
        const filteredResults = results.filter(
          (result) => result.similarity_score >= similarityThreshold
        );

        // Sort filtered results by similarity_score in descending order
        filteredResults.sort((a, b) => b.similarity_score - a.similarity_score);

        // Return top N results
        return filteredResults.slice(0, topN);
      })
    );

    // Flatten the results and remove any empty arrays
    return topVectors.flat();
  }
}