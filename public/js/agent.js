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

  // Run the OpenAI conversation
  async getOpenAIResponse() {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: this.messages,
      tools: tools,
    });

    const aiMessage = response.choices[0].message;
    this.messages.push(aiMessage); // Save the AI's response to the thread
    if (aiMessage.content) return aiMessage.content;

    const toolCalls = aiMessage.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      await Promise.all(
        toolCalls.map(async (toolCall) => {
          console.log("Tool call:", toolCall);
          if (toolCall.function.name === "get_product_details") {
            const query = JSON.parse(toolCall.function.arguments).query;
            const productDetails = await rag_search_items(query, 3);
            const function_call_result_message = {
              role: "tool",
              content: JSON.stringify(productDetails),
              tool_call_id: toolCall.id,
            };

            this.messages.push(function_call_result_message);
          }
        })
      );
      return this.getOpenAIResponse();
    }
  }

  // Main question handler: question -> vector search -> AI call -> response
  async askQuestion(userQuestion) {
    const agentPrompt = getAgentPrompt(userQuestion);
    this.addUserMessage(agentPrompt);

    const aiResponse = await this.getOpenAIResponse();
    const parsedResponse = JSON.parse(aiResponse);

    // Return the structured response
    return parsedResponse;
  }
}
