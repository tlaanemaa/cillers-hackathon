import { OpenAI } from "https://cdn.jsdelivr.net/npm/openai@4.76.3/+esm";
import { OPENAI_KEY } from "./keys.js";
import { AGENT_SYS, getAgentPrompt } from "./prompts.js";

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
      });
      const aiMessage = response.choices[0].message.content;
      this.addAssistantMessage(aiMessage); // Save the AI's response to the thread
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
        0.3, // Similarity threshold
        3 // Top N results
      );

      // If no context is found, continue with just the question
      const contextInfo = contextResults.map(
        (result) => `${result.metadata.product_name} - ${result.description}`
      );

      // Step 3: Format the prompt with question and context
      const contextString =
        contextInfo.length > 0 ? contextInfo.join("\n") : "No context found.";
      const aiPrompt = getAgentPrompt(userQuestion, contextString);
      this.addUserMessage(aiPrompt);

      // Step 4: Get AI response
      const aiResponse = await this.getOpenAIResponse();

      // Step 5: Parse the AI response as JSON
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
          "Invalid JSON response format. Expected 'freetext' and 'items' fields."
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
