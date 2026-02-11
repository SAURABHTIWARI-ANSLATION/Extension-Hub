// ======== REVIEWER-SAFE BACKGROUND SCRIPT ========

// Helper: safely check if a file exists on the page
function checkFileExists(url) {
  return new Promise((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("HEAD", url, true);

      xhr.onload = () => {
        resolve(xhr.status === 200);
      };

      xhr.onerror = () => {
        resolve(false);
      };

      xhr.send();
    } catch (err) {
      resolve(false);
    }
  });
}

// Main detection function
async function detectTechStack(tabId) {
  try {
    const checks = [
      { name: "node", file: "/package.json" },
      { name: "python", file: "/requirements.txt" },
      { name: "next", file: "/next.config.js" },
      { name: "react", file: "/src/App.js" },
      { name: "java", file: "/pom.xml" },
      { name: "php", file: "/composer.json" },
      { name: "go", file: "/go.mod" },
      { name: "rust", file: "/Cargo.toml" },
      { name: "docker", file: "/Dockerfile" }
    ];

    const injectionResult = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (fileChecks) => {
        const results = [];

        for (const check of fileChecks) {
          const exists = await new Promise((resolve) => {
            try {
              const xhr = new XMLHttpRequest();
              xhr.open("HEAD", check.file, true);

              xhr.onload = () => resolve(xhr.status === 200);
              xhr.onerror = () => resolve(false);

              xhr.send();
            } catch {
              resolve(false);
            }
          });

          if (exists) {
            results.push(check.name);
          }
        }

        return results;
      },
      args: [checks] // <-- Safer than capturing outer variables
    });

    return Array.isArray(injectionResult?.[0]?.result)
      ? injectionResult[0].result
      : [];
  } catch (error) {
    console.log("Detection error:", error);
    return [];
  }
}

// Message listener (unchanged behavior, safer style)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.action === "detectTechStack") {
    detectTechStack(request.tabId)
      .then(sendResponse)
      .catch(() => sendResponse([]));

    return true; // keeps message channel open for async response
  }
});
