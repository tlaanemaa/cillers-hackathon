import { chatInput, chatMain, sendButton } from "./constants.js";
import ItemExtractor from "./itemExtractor.js";

// Initialize ItemExtractor with OpenAI API base URL
const itemExtractor = new ItemExtractor("http://localhost:3001");

// Utility: Add a message to the chat
function addMessage(content, sender = "bot") {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.textContent = content;
  chatMain.appendChild(messageDiv);
  chatMain.scrollTop = chatMain.scrollHeight;
}

// Step 1: Extract items of interest using ItemExtractor
async function extractItems(userMessage) {
  console.log("Step 1: Extracting items of interest from OpenAI...");
  const extractedItems = await itemExtractor.extractItems(userMessage);
  console.log("Extracted Items:", extractedItems);

  if (extractedItems.length === 0) {
    addMessage(
      "I couldn't extract any items of interest. Please try again.",
      "bot"
    );
    throw new Error("No items extracted");
  }

  addMessage(`I found these items: ${extractedItems.join(", ")}`, "bot");
  return extractedItems;
}

// Step 2: Fetch vector database results for each extracted item
async function fetchVectorsForItems(items) {
  console.log("Step 2: Fetching results from the vector database...");
  const vectorResults = await Promise.all(
    items.map((item) => fetchVectorResults(item))
  );

  console.log("Vector Results:", vectorResults);
  return vectorResults.flatMap((result) => result.items);
}

// Step 3: Fetch product data from Footway API for each vector result
async function fetchFootwayData(vectorItems) {
  console.log("Step 3: Fetching product data from Footway...");
  const allProducts = [];
  for (const vectorItem of vectorItems) {
    const productResults = await fetchFootwayProducts(vectorItem.name);
    allProducts.push(...productResults.items);
  }

  console.log("Footway Product Results:", allProducts);
  return allProducts;
}

// Orchestrator function to handle user input
async function handleUserInput() {
  console.log("Processing user input...");
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  // Add user message to the chat
  addMessage(userMessage, "user");
  chatInput.value = "";

  try {
    const extractedItems = await extractItems(userMessage);
    const vectorResults = await fetchVectorsForItems(extractedItems);
    const products = await fetchFootwayData(vectorResults);

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

// Fetch vector database results
async function fetchVectorResults(query) {
  console.log(`Fetching vector results for query: ${query}...`);
  const response = await fetch(
    `http://localhost:3001/api/test/vector?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch vector results");
  }

  const data = await response.json();
  return data;
}

// Fetch Footway product data
async function fetchFootwayProducts(productName) {
  console.log(`Fetching Footway products for: ${productName}...`);
  const response = await fetch(
    `http://localhost:3001/api/test/footway?product_name=${encodeURIComponent(
      productName
    )}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Footway products");
  }

  const data = await response.json();
  return data;
}

// Event listener for send button
sendButton.addEventListener("click", handleUserInput);

// Event listener for Enter key
chatInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    handleUserInput();
  }
});