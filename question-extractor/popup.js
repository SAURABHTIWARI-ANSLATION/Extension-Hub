const input = document.getElementById("inputText");
const output = document.getElementById("output");

// Get selected text from webpage
document.getElementById("extractFromPage").onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ["content.js"]
      },
      () => {
        chrome.tabs.sendMessage(
          tab.id,
          { type: "GET_SELECTED_TEXT" },
          (res) => {
            if (res && res.text) {
              input.value = res.text;
            } else {
              alert("Please select some text first.");
            }
          }
        );
      }
    );
  });
};

// Generate questions
document.getElementById("generate").onclick = () => {
  const text = input.value.trim();
  if (!text) return alert("Please provide content");

  const questions = generateQuestions(text);
  output.innerHTML = "";

  questions.forEach((qa, i) => {
    const div = document.createElement("div");
    div.className = "qa";
    div.innerHTML = `
      <b>Q${i + 1}: ${qa.question}</b>
      <span>A: ${qa.answer}</span>
    `;
    output.appendChild(div);
  });
};

// Copy all Q&A
document.getElementById("copy").onclick = () => {
  navigator.clipboard.writeText(output.innerText);
};

// ================================
// QUESTION GENERATION LOGIC
// ================================
function generateQuestions(text) {
  const sentences = text
    .replace(/\n/g, " ")
    .split(".")
    .map(s => s.trim())
    .filter(s => s.length > 20);

  const qas = [];

  sentences.forEach(sentence => {
    if (sentence.includes(" is ")) {
      const topic = sentence.split(" is ")[0];
      qas.push({
        question: `What is ${topic}?`,
        answer: sentence + "."
      });
    }

    if (sentence.includes(" are ")) {
      const topic = sentence.split(" are ")[0];
      qas.push({
        question: `What are ${topic}?`,
        answer: sentence + "."
      });
    }

    if (sentence.toLowerCase().includes("process")) {
      qas.push({
        question: `Explain the process mentioned.`,
        answer: sentence + "."
      });
    }

    if (sentence.toLowerCase().includes("because")) {
      qas.push({
        question: `Why does this happen?`,
        answer: sentence + "."
      });
    }
  });

  return qas.slice(0, 10); // limit to 10 questions
}
