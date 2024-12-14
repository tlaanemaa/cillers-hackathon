export default class ItemExtractor {
    constructor(baseURL) {
      this.baseURL = baseURL;
    }
  
    async extractItems(userMessage) {
      console.log("Extracting items of interest from OpenAI...");
  
      const prompt = this.buildPrompt(userMessage);
  
      try {
        const response = await fetch(`${this.baseURL}/api/test/openai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
  
        if (!response.ok) {
          throw new Error("Failed to fetch OpenAI response");
        }
  
        const data = await response.json();
        return this.parseExtractedItems(data.message || "[]");
      } catch (error) {
        console.error("Error extracting items from OpenAI:", error);
        return [];
      }
    }
  
    buildPrompt(userMessage) {
      return `
        You are an intelligent assistant designed to extract items of interest from user input for product searches. 
        Your task is to identify all specific items, categories, or descriptive keywords mentioned in the user's message. 
        The output must strictly be a JSON array of strings. Do not include any explanations or additional text outside of the JSON array.
  
        Example:
        User Input: "I want a laptop and a headphone."
        Output: ["laptop", "headphone"]
  
        Extract items from the following user input:
        "${userMessage}"
      `;
    }
  
    parseExtractedItems(openAIResponse) {
      console.log("Parsing extracted items...");
      try {
        const extractedItems = JSON.parse(openAIResponse);
        if (Array.isArray(extractedItems)) {
          return extractedItems.map((item) => item.trim());
        }
        console.error("OpenAI response is not a valid JSON array.");
        return [];
      } catch (error) {
        console.error("Error parsing OpenAI response as JSON:", error);
        return [];
      }
    }
  }