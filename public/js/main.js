import { chatInput, chatMain, sendButton } from "./constants.js";
import ItemExtractor from "./itemExtractor.js";
import VectorSearch from "./VectorSearch.js";
import FootwayAPI from "./FootwayAPI.js";
import { a } from "./agent.js";

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

    // Step 2: Fetch top vector database results
    const topVectors = await vectorSearch.fetchTopVectorsForItems(
      extractedItems
    );

    // Step 3: Fetch top product data from Footway API
    const topProducts = await footwayAPI.fetchProductDetails(topVectors);

    // Step 4: Display product data
    if (topProducts.length > 0) {
      addMessage("Here are the top product recommendations:", "bot");

      // Create a container for product cards
      const productGrid = document.createElement("div");
      productGrid.classList.add("product-grid");

      // Create a product card for each product
      topProducts.forEach((product) => {
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

      // Append the product grid to the chat
      chatMain.appendChild(productGrid);
      chatMain.scrollTop = chatMain.scrollHeight;
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
