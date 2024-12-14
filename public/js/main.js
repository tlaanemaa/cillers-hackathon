import { chatInput, chatMain, sendButton } from "./constants.js";
import VectorSearch from "./VectorStore.js";
import FootwayAPI from "./FootwayAPI.js";
import { Agent } from "./agent.js";
import { addMessage } from "./util.js";

// Initialize API classes
const vectorSearch = new VectorSearch("http://localhost:3001");
const footwayAPI = new FootwayAPI("http://localhost:3001");
const agent = new Agent(vectorSearch, footwayAPI);

async function handleUserInput() {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  // Add user message to the chat
  addMessage(userMessage, "user");
  chatInput.value = "";

  try {
    console.log("Processing user input...");

    // Use the agent to process the question
    const response = await agent.askQuestion(userMessage);

    // Display the freetext response in the chat
    addMessage(response.response, "bot");

    // If items are included, fetch and display product details
    if (response.items && response.items.length > 0) {
      const productGrid = document.createElement("div");
      productGrid.classList.add("product-grid");

      response.items.forEach((product) => {
        const productCard = document.createElement("div");
        productCard.classList.add("product-card");

        productCard.innerHTML = `
          <img src="${product.image_url}" alt="${product.productName}" />
          <h4>${product.productName || "Unknown"}</h4>
          <p>${product.product_description || "No description available"}</p>
          <p class="price">${
            product.price !== null ? `$${product.price}` : "N/A"
          }</p>
          <p class="vendor">${product.vendor || "Unknown Vendor"}</p>
        `;

        productGrid.appendChild(productCard);
      });

      chatMain.appendChild(productGrid);
      chatMain.scrollTop = chatMain.scrollHeight;
    }
  } catch (error) {
    console.error("Error in orchestrator:", error);
    addMessage("Sorry, something went wrong. Please try again.", "bot");
  }
}

// Initialize conversation on page load
agent.initializeConversation(
  "You are a helpful assistant helping users find the best products."
);

// Event listener for send button
sendButton.addEventListener("click", handleUserInput);

// Event listener for Enter key
chatInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    handleUserInput();
  }
});
