const stopWords = new Set([
  "the","is","at","which","on","and","a","an","to","of","for","in","with","that","this","it","as","are","was","were","by","be"
]);

document.getElementById("extract").onclick = async () => {
  const textarea = document.getElementById("text");
  let text = textarea.value.trim();

  if (!text) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText
    });
    text = result[0].result || "";
  }

  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq = {};

  words.forEach(w => {
    if (!stopWords.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });

  const sorted = Object.entries(freq)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 15);

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = sorted.length
    ? sorted.map(([w,c]) => `<div>${w} — ${c}</div>`).join("")
    : "<div>No keywords found.</div>";
};
