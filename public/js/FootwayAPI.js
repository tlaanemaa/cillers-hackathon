export default class FootwayAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async fetchProducts(productName) {
    console.log(`Fetching Footway products for: "${productName}"...`);
    try {
      const response = await fetch(
        `${this.baseURL}/api/test/footway?product_name=${encodeURIComponent(
          productName
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Footway products");
      }

      const data = await response.json();
      console.log(`Footway products for "${productName}":`, data.items);
      return data.items || [];
    } catch (error) {
      console.error("Error fetching products from Footway:", error);
      return [];
    }
  }

  async fetchProductDetails(productNames) {
    console.log("Fetching product details for top vector items...");
    const allProducts = await Promise.all(
      productNames.map(async (productName) => {
        const products = await this.fetchProducts(productName);
        return products.length > 0 ? products[0] : null; // Take the top product
      })
    );

    // Filter out nulls (in case no products were found for some vectors)
    return allProducts.filter((product) => product !== null);
  }
}
