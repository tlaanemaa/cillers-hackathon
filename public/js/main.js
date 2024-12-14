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

    // Step 2: Fetch top vector database results
    const topVectors = await vectorSearch.fetchTopVectorsForItems(
      extractedItems
    );

    // Step 3: Fetch top product data from Footway API
    const topProducts = await footwayAPI.fetchProductDetails(topVectors);

    // Step 4: Display product data
    if (topProducts.length > 0) {
      addMessage("Here are the top product recommendations:", "bot");

      // Log each product in a formatted manner
      topProducts.forEach((product) => {
        const productDetails = `
          Name: ${product.productName || "Unknown"}
          Vendor: ${product.vendor || "Unknown"}
          Description: ${
            product.product_description || "No description available"
          }
          Size: ${product.size || "N/A"}
          Department: ${product.department?.join(", ") || "N/A"}
          Type: ${product.productType?.join(", ") || "N/A"}
          Group: ${product.productGroup?.join(", ") || "N/A"}
          Quantity: ${product.quantity || 0}
          Price: ${product.price !== null ? `$${product.price}` : "N/A"}
          Image: ${product.image_url || "No image available"}
        `;
        console.log(productDetails); // Log the product details to the console

        // Display product details in the chat
        const productMessage = `
          - **${product.productName || "Unknown"}** by ${
          product.vendor || "Unknown"
        }
          ${product.product_description || "No description available"}
          ${
            product.image_url
              ? `<img src="${product.image_url}" alt="${product.productName}" width="100">`
              : ""
          }
        `;
        addMessage(productMessage, "bot");
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
