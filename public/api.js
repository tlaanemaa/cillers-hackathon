class APIClientBase {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    );

    if (this.baseURL === "mock") {
      return this.mockGet(endpoint, params);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GET ${endpoint} failed: ${response.statusText}`);
    }
    return await response.json();
  }

  async post(endpoint, body = {}) {
    if (this.baseURL === "mock") {
      return this.mockPost(endpoint, body);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`POST ${endpoint} failed: ${response.statusText}`);
    }
    return await response.json();
  }

  mockGet(endpoint, params) {
    throw new Error(`Mock GET not implemented for ${endpoint}`);
  }

  mockPost(endpoint, body) {
    throw new Error(`Mock POST not implemented for ${endpoint}`);
  }
}

class OpenAIClient extends APIClientBase {
  async fetchResponse(prompt) {
    return await this.post("/api/test/openai", { prompt });
  }

  mockPost(endpoint, body) {
    if (endpoint === "/api/test/openai") {
      console.log(`[Mock OpenAI] Prompt: ${body.prompt}`);
      return { message: `Mocked response for prompt: "${body.prompt}"` };
    }
    throw new Error(`Mock POST not implemented for ${endpoint}`);
  }
}

class VectorDBClient extends APIClientBase {
  async search(query) {
    return await this.get("/api/test/vector", { query });
  }

  mockGet(endpoint, params) {
    if (endpoint === "/api/test/vector") {
      console.log(`[Mock Vector DB] Query: ${params.query}`);
      return {
        items: [
          {
            id: "1",
            name: "Mock Product 1",
            description: "This is a description of Mock Product 1.",
            similarity_score: 0.95,
            metadata: { category: "Electronics", price: "$100" },
          },
          {
            id: "2",
            name: "Mock Product 2",
            description: "This is a description of Mock Product 2.",
            similarity_score: 0.89,
            metadata: { category: "Home Appliances", price: "$200" },
          },
        ],
      };
    }
    throw new Error(`Mock GET not implemented for ${endpoint}`);
  }
}
