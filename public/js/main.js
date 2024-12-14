import { chatInput, chatMain, sendButton } from "./constants.js";
import ItemExtractor from "./itemExtractor.js";
import VectorSearch from "./VectorSearch.js";
import FootwayAPI from "./FootwayAPI.js";

// Initialize API classes
const itemExtractor = new ItemExtractor("http://localhost:3001");
const vectorSearch = new VectorSearch("http://localhost:3001");
const footwayAPI = new FootwayAPI("http://localhost:3001");

// Utility: Add a message to the chat
function addMessage(content, sender = "bot") {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.textContent = content;
  chatMain.appendChild(messageDiv);
  chatMain.scrollTop = chatMain.scrollHeight;
}

// Orchestrator function to handle user input
async function handleUserInput() {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  // Add user message to the chat
  addMessage(userMessage, "user");
  chatInput.value = "";

  try {
    console.log("Processing user input...");

    // Step 1: Extract items of interest
    const extractedItems = await itemExtractor.extractItems(userMessage);
    addMessage(`I found these items: ${extractedItems.join(", ")}`, "bot");

    // Step 2: Fetch vector database results
    const vectorResults = await vectorSearch.fetchVectorsForItems(extractedItems);

    // Step 3: Fetch product data from Footway API
    const products = await footwayAPI.fetchProductDetails(vectorResults);

    // Step 4: Display product data
    if (products.length > 0) {
      addMessage("Here are the product recommendations:", "bot");
      products.forEach((product) => {
        addMessage(`- ${product.name}: ${product.description}`, "bot");
      });
    } else {
      addMessage("No products found for your search.", "bot");
    }
  } catch (error) {
    console.error("Error in orchestrator:", error);
    addMessage("Sorry, something went wrong. Please try again.", "bot");
  }
}

// Event listener for send button
sendButton.addEventListener("click", handleUserInput);

// Event listener for Enter key
chatInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    handleUserInput();
  }
});