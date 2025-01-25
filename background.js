// background.js

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "executeInstruction") {
    const instruction = request.instruction;
    executeMidsceneInstruction(instruction)
      .then(response => sendResponse({ result: "success", data: response }))
      .catch(error => sendResponse({ result: "error", error: error.message }));
    return true; // Indicate we will send a response asynchronously
  }
});

async function executeMidsceneInstruction(instruction) {
  const midsceneApiUrl = "http://localhost:5800/api/automate"; // Use port 5800 as per feedback

  try {
    const response = await fetch(midsceneApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ instruction: instruction })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Midscene API Response:", data); // Log the response for debugging

    // Assuming Midscene returns an actionPlan in the response
    if (data.actionPlan) {
      // Execute the action plan using Midscene's Chrome Extension bridge (if available)
      if (typeof window !== 'undefined' && window.Midscene) { // Check if Midscene bridge is available in the background script (it might not be)
        console.log("Executing action plan using Midscene bridge (background script - might not work):", data.actionPlan);
        // window.Midscene.execute(data.actionPlan); // This might not work in background script
        return { message: "Action plan received", actionPlan: data.actionPlan }; // Return action plan to popup to execute in popup.js
      } else {
        console.log("Midscene bridge not available in background script.");
        return { message: "Action plan received, Midscene bridge not available in background script", actionPlan: data.actionPlan }; // Return action plan to popup
      }
    } else {
      return { message: "No action plan received from Midscene", data: data };
    }

  } catch (error) {
    console.error("Error executing Midscene instruction:", error);
    throw error;
  }
}
