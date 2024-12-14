import { OpenAI } from "https://cdn.jsdelivr.net/npm/openai@4.76.3/+esm";
import { OPENAI_KEY } from "./keys.js";
import { AGENT_SYS, getAgentPrompt } from "./prompts.js";
import { rag_search_items, addMessage } from "./util.js";

const MODEL = "gpt-4o-mini";

const tools = [
  {
    type: "function",
    function: {
      name: "get_product_details",
      description: "Get product details from the Footway API",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "A detailed query describing what you want to look for",
          },
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
      model: MODEL,
      messages: this.messages,
      tools: tools,
      response_format: { type: "json_object" },
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
            const function_call_result_message = {
              role: "tool",
              content: null,
              tool_call_id: toolCall.id,
            };

            try {
              const query = JSON.parse(toolCall.function.arguments).query;
              addMessage(`Searching for "${query}"...`, "thought");
              const productDetails = await rag_search_items(query, 10);
              addMessage(
                `Found ${productDetails.length} products... thinking...`,
                "thought"
              );
              function_call_result_message.content =
                JSON.stringify(productDetails);
            } catch (error) {
              console.error("Error in get_product_details:", error);
              function_call_result_message.content = String(error);
            }

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
