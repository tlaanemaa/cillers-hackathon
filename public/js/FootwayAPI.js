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

  async fetchProductDetails(vectorItems) {
    console.log("Fetching product details for vector items...");
    const allProducts = [];
    for (const vectorItem of vectorItems) {
      const products = await this.fetchProducts(vectorItem.name);
      allProducts.push(...products);
    }
    return allProducts;
  }
}