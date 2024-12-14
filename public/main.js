// script.js

// DOM elements
const chatInput = document.getElementById("chat-input");
const chatMain = document.getElementById("chat-main");
const sendButton = document.getElementById("send-btn");

// Utility: Add a message to the chat
function addMessage(content, sender = "bot") {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.textContent = content;
  chatMain.appendChild(messageDiv);
  chatMain.scrollTop = chatMain.scrollHeight;
}

// Handle user input
async function handleUserInput() {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  // Add user message to the chat
  addMessage(userMessage, "user");
  chatInput.value = "";

  // Get AI response and product results concurrently
  try {
    const [aiResponse, productResults] = await Promise.all([
      fetchOpenAIResponse(userMessage),
      fetchProductResults(userMessage),
    ]);

    // Add AI response to the chat
    addMessage(aiResponse);

    // Add product results to the chat
    if (productResults.length > 0) {
      addMessage("Here are some product recommendations:");
      productResults.forEach((product) => {
        addMessage(`- ${product.name}: ${product.description}`, "bot");
      });
    } else {
      addMessage("No products found for your search.", "bot");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    addMessage("Sorry, something went wrong. Please try again.", "bot");
  }
}

// Fetch OpenAI response
async function fetchOpenAIResponse(prompt) {
  const response = await fetch("http://localhost:3001/api/test/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch OpenAI response");
  }

  const data = await response.json();
  return data.response || "I couldn’t find an answer for that.";
}

// Fetch product results from vector database
async function fetchProductResults(query) {
  const response = await fetch(
    `http://localhost:3001/api/test/vector?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch product results");
  }

  const data = await response.json();
  return data.results || [];
}

// Event listener for send button
sendButton.addEventListener("click", handleUserInput);

// Event listener for Enter key
chatInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    handleUserInput();
  }
});
