import { OpenAI } from "https://cdn.jsdelivr.net/npm/openai@4.76.3/+esm";
import { OPENAI_KEY } from "./keys.js";
import { AGENT_SYS, getAgentPrompt } from "./prompts.js";
import { rag_search_items } from "./util.js";

const tools = [
  {
    type: "function",
    function: {
      name: "get_product_details",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
      },
    },
  },
];

rag_search_items("socks", 3)

export class Agent {
  constructor(vectorSearch, footwayAPI) {
    this.client = new OpenAI({
      apiKey: OPENAI_KEY,
      dangerouslyAllowBrowser: true,
    });
    this.vectorSearch = vectorSearch; // Instance of VectorSearch
    this.footwayAPI = footwayAPI; // Instance of FootwayAPI
    this.messages = []; // Message thread to keep the conversation history
  }

  // Initialize the conversation
  async initializeConversation(systemPrompt) {
    this.messages = [
      {
        role: "system",
        content: AGENT_SYS,
      },
    ];
  }

  // Add a user message
  addUserMessage(userMessage) {
    this.messages.push({ role: "user", content: userMessage });
  }

  // Add an assistant message
  addAssistantMessage(assistantMessage) {
    this.messages.push({ role: "assistant", content: assistantMessage });
  }

  // Run the OpenAI conversation
  async getOpenAIResponse() {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: this.messages,
        tools: tools,
      });
      const toolCalls = response.choices[0].message.tool_calls;
      const aiMessage = response.choices[0].message.content;
      this.addAssistantMessage(aiMessage); // Save the AI's response to the thread

      if (toolCalls && toolCalls.length > 0) {
        results = Promise.all(
          toolCalls.map(async (toolCall) => {
            if (toolCall.function === "get_product_details") {
              const query = toolCall.parameters.query;
              const productDetails = await this.footwayAPI.fetchProductDetails(
                [query]
              );
              return productDetails;
            }
          })
        );
        console.log("Tool calls detected in the response:")
      }
      return aiMessage;
    } catch (error) {
      console.error("Error communicating with OpenAI:", error);
      throw new Error("Failed to get OpenAI response.");
    }
  }

  // Main question handler: question -> vector search -> AI call -> response
  async askQuestion(userQuestion) {
    try {
      // Step 1: Add the user's question to the conversation
      this.addUserMessage(userQuestion);

      // Step 2: Run a vector search to get context
      const contextResults = await this.vectorSearch.fetchTopVectorsForItems(
        [userQuestion],
        0.5, // Similarity threshold
        10 // Top N results
      );

      // Step 2.5: Get product details from FootwayAPI
      const productDetails = await this.footwayAPI.fetchProductDetails(
        contextResults.map((result) => result.name)
      );

      const aiPrompt = getAgentPrompt(userQuestion, productDetails);
      this.addUserMessage(aiPrompt);

      // Step 5: Get AI response
      const aiResponse = await this.getOpenAIResponse();

      // Step 6: Parse the AI response as JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch (error) {
        console.error("Failed to parse AI response as JSON:", aiResponse);
        throw new Error("AI response is not valid JSON.");
      }

      // Validate the structure of the JSON response
      if (!parsedResponse.response || !Array.isArray(parsedResponse.items)) {
        throw new Error(
          "Invalid JSON response format. Expected 'response' and 'items' fields."
        );
      }

      // Return the structured response
      return parsedResponse;
    } catch (error) {
      console.error("Error handling question:", error);
      throw new Error("Failed to process the question.");
    }
  }
}
