document.addEventListener("DOMContentLoaded", () => {
  const SUMMARY_STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "been", "being", "but", "by", "for",
    "from", "had", "has", "have", "he", "her", "here", "him", "his", "how", "i",
    "if", "in", "into", "is", "it", "its", "me", "more", "most", "my", "of", "on",
    "or", "our", "out", "she", "so", "than", "that", "the", "their", "them", "then",
    "there", "these", "they", "this", "to", "up", "was", "we", "were", "what", "when",
    "where", "which", "who", "will", "with", "would", "you", "your"
  ]);

  const caseInput = document.getElementById("caseInput");
  const caseOutput = document.getElementById("caseOutput");
  const summarizeInput = document.getElementById("summarizeInput");
  const summaryOutput = document.getElementById("summaryOutput");
  const scannedContent = document.getElementById("scannedContent");
  const resultCharCount = document.getElementById("resultCharCount");
  const summaryStats = document.getElementById("summaryStats");
  const scanWordCount = document.getElementById("scanWordCount");
  const keyPointsContainer = document.getElementById("keyPointsContainer");
  const keyPointsList = document.getElementById("keyPointsList");
  const pageInfo = document.getElementById("pageInfo");
  const pageTitle = document.getElementById("pageTitle");
  const pagePreview = document.getElementById("pagePreview");
  const summaryRatio = document.getElementById("summaryRatio");
  const ratioValue = document.getElementById("ratioValue");

  const mainTabs = Array.from(document.querySelectorAll(".main-tab"));
  const tabContents = Array.from(document.querySelectorAll(".tab-content"));
  const caseButtons = Array.from(document.querySelectorAll(".case-btn"));
  const lengthButtons = Array.from(document.querySelectorAll(".length-btn"));

  const fetchSelectionBtn = document.getElementById("fetchSelectionBtn");
  const clearCaseBtn = document.getElementById("clearCaseBtn");
  const copyCaseResultBtn = document.getElementById("copyCaseResult");
  const applyToPageBtn = document.getElementById("applyToPage");
  const generateSummaryBtn = document.getElementById("generateSummaryBtn");
  const copySummaryBtn = document.getElementById("copySummaryBtn");
  const downloadSummaryBtn = document.getElementById("downloadSummaryBtn");
  const pasteTextBtn = document.getElementById("pasteTextBtn");
  const clearSummarizeBtn = document.getElementById("clearSummarizeBtn");
  const scanPageBtn = document.getElementById("scanPageBtn");
  const useForCaseBtn = document.getElementById("useForCaseBtn");
  const useForSummaryBtn = document.getElementById("useForSummaryBtn");

  const placeholders = {
    caseOutput: "Converted text will appear here.",
    summaryOutput: "Generate a summary to see the condensed version here.",
    scannedContent: "Scan the current page to pull in readable content."
  };

  let currentPageContent = "";
  let lastSummary = "";
  let isSummarizing = false;
  let summaryJobId = 0;

  initializeTabs();
  setupEventListeners();
  initializeUi();

  function initializeUi() {
    resetCaseResult();
    resetSummaryResult();
    resetScannedContent();
    ratioValue.textContent = `${summaryRatio.value}%`;
    updateCaseStats();
    updateSummarizeStats();
    updateActionStates();
  }

  function initializeTabs() {
    mainTabs.forEach((tab) => {
      tab.addEventListener("click", () => activateTab(tab.dataset.tab));
    });
  }

  function activateTab(tabName) {
    mainTabs.forEach((tab) => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    tabContents.forEach((content) => {
      content.classList.toggle("active", content.id === `${tabName}-tab`);
    });
  }

  function setupEventListeners() {
    caseButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const text = caseInput.value.trim();
        if (!text) {
          return;
        }

        const converted = convertCase(text, button.dataset.case);
        setResultContent(caseOutput, converted, placeholders.caseOutput);
        resultCharCount.textContent = `${converted.length} chars`;
        updateActionStates();
      });
    });

    fetchSelectionBtn.addEventListener("click", fetchPageSelection);
    clearCaseBtn.addEventListener("click", clearCasePanel);
    copyCaseResultBtn.addEventListener("click", () => copyToClipboard(caseOutput.textContent, "Case result"));
    applyToPageBtn.addEventListener("click", applyToPage);

    caseInput.addEventListener("input", () => {
      updateCaseStats();
      resetCaseResult();
      updateActionStates();
    });

    generateSummaryBtn.addEventListener("click", generateSummary);
    copySummaryBtn.addEventListener("click", () => copyToClipboard(summaryOutput.textContent, "Summary"));
    downloadSummaryBtn.addEventListener("click", downloadSummary);
    pasteTextBtn.addEventListener("click", pasteFromClipboard);
    clearSummarizeBtn.addEventListener("click", clearSummaryPanel);

    summarizeInput.addEventListener("input", () => {
      cancelSummaryProgress();
      updateSummarizeStats();
      resetSummaryResult();
      updateActionStates();
    });

    lengthButtons.forEach((button) => {
      button.addEventListener("click", () => {
        lengthButtons.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        summaryRatio.value = button.dataset.length;
        ratioValue.textContent = `${button.dataset.length}%`;
      });
    });

    summaryRatio.addEventListener("input", () => {
      ratioValue.textContent = `${summaryRatio.value}%`;
      lengthButtons.forEach((button) => button.classList.remove("active"));
    });

    scanPageBtn.addEventListener("click", scanCurrentPage);
    useForCaseBtn.addEventListener("click", () => {
      if (!currentPageContent) return;

      caseInput.value = currentPageContent;
      updateCaseStats();
      resetCaseResult();
      updateActionStates();
      activateTab("case");
    });
    useForSummaryBtn.addEventListener("click", () => {
      if (!currentPageContent) return;

      cancelSummaryProgress();
      summarizeInput.value = currentPageContent;
      updateSummarizeStats();
      resetSummaryResult();
      updateActionStates();
      activateTab("summarize");
    });

    setupMessageListener();
  }

  function clearCasePanel() {
    caseInput.value = "";
    updateCaseStats();
    resetCaseResult();
    updateActionStates();
  }

  function clearSummaryPanel() {
    cancelSummaryProgress();
    summarizeInput.value = "";
    updateSummarizeStats();
    resetSummaryResult();
    updateActionStates();
  }

  function setResultContent(element, text, placeholder) {
    const cleanText = text ? text.trim() : "";
    const hasContent = Boolean(cleanText);

    element.textContent = hasContent ? cleanText : placeholder;
    element.classList.toggle("is-placeholder", !hasContent);

    return hasContent;
  }

  function resetCaseResult() {
    setResultContent(caseOutput, "", placeholders.caseOutput);
    resultCharCount.textContent = "0 chars";
  }

  function resetSummaryResult() {
    lastSummary = "";
    setResultContent(summaryOutput, "", placeholders.summaryOutput);
    summaryStats.textContent = "0% reduction";
    keyPointsContainer.hidden = true;
    keyPointsList.innerHTML = "";
  }

  function resetScannedContent() {
    currentPageContent = "";
    pageInfo.hidden = true;
    pageTitle.textContent = "";
    pagePreview.textContent = "";
    setResultContent(scannedContent, "", placeholders.scannedContent);
    scanWordCount.textContent = "0 words";
  }

  function updateActionStates() {
    const hasCaseInput = Boolean(caseInput.value.trim());
    const hasSummaryInput = Boolean(summarizeInput.value.trim());
    const hasCaseOutput = !caseOutput.classList.contains("is-placeholder");
    const hasSummaryOutput = !summaryOutput.classList.contains("is-placeholder");
    const hasScannedContent = Boolean(currentPageContent);

    caseButtons.forEach((button) => {
      button.disabled = !hasCaseInput;
    });

    generateSummaryBtn.disabled = !hasSummaryInput || isSummarizing;
    copyCaseResultBtn.disabled = !hasCaseOutput;
    applyToPageBtn.disabled = !hasCaseOutput;
    copySummaryBtn.disabled = !hasSummaryOutput;
    downloadSummaryBtn.disabled = !lastSummary;
    useForCaseBtn.disabled = !hasScannedContent;
    useForSummaryBtn.disabled = !hasScannedContent;
  }

  function updateCaseStats() {
    const text = caseInput.value.trim();
    const charCount = text.length;
    const wordCount = text ? text.split(/\s+/).length : 0;

    document.getElementById("caseCharCount").textContent = `${charCount} chars`;
    document.getElementById("caseWordCount").textContent = `${wordCount} words`;
  }

  function updateSummarizeStats() {
    const text = summarizeInput.value.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    const sentenceCount = text ? text.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0).length : 0;

    document.getElementById("summarizeWordCount").textContent = `${wordCount} words`;
    document.getElementById("summarizeSentenceCount").textContent = `${sentenceCount} sentences`;
  }

  async function safeSendToContentScript(tabId, message, timeoutMs = 3000) {
    return new Promise((resolve) => {
      let timeoutId = setTimeout(() => {
        resolve({ success: false, message: "Timeout waiting for content script" });
      }, timeoutMs);
      
      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          clearTimeout(timeoutId);
          if (chrome.runtime.lastError) {
            chrome.scripting.executeScript({
              target: { tabId },
              files: ["content.js"]
            }).then(() => {
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, message, (retryResponse) => {
                  if (chrome.runtime.lastError) {
                    resolve({ success: false, message: "Content script unavailable" });
                  } else {
                    resolve(retryResponse || { success: false });
                  }
                });
              }, 150);
            }).catch(() => {
              resolve({ success: false, message: "Cannot inject content script" });
            });
            return;
          }
          resolve(response || { success: false });
        });
      } catch (error) {
        clearTimeout(timeoutId);
        resolve({ success: false, message: error.message });
      }
    });
  }

  async function fetchPageSelection() {
    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      return;
    }

    try {
      const response = await safeSendToContentScript(tab.id, { action: "getCurrentSelection" });
      if (response?.success && response.text) {
        caseInput.value = response.text;
        updateCaseStats();
        resetCaseResult();
        updateActionStates();
      }
    } catch (error) {
      // Silent fail
    }
  }

  async function applyToPage() {
    if (caseOutput.classList.contains("is-placeholder")) {
      return;
    }

    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      return;
    }

    try {
      await safeSendToContentScript(tab.id, {
        action: "applyText",
        text: caseOutput.textContent.trim()
      });
    } catch (error) {
      // Silent fail
    }
  }

  async function scanCurrentPage() {
    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      return;
    }

    scanPageBtn.disabled = true;

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageContent
      });

      if (!results?.[0]?.result) {
        return;
      }

      const data = results[0].result;
      if (!data.content) {
        resetScannedContent();
        updateActionStates();
        return;
      }

      currentPageContent = data.content;
      pageTitle.textContent = data.title;
      pagePreview.textContent = data.preview;
      pageInfo.hidden = false;
      setResultContent(scannedContent, currentPageContent, placeholders.scannedContent);
      scanWordCount.textContent = `${data.wordCount} words`;
      updateActionStates();
    } catch (error) {
      // Silent fail
    } finally {
      scanPageBtn.disabled = false;
    }
  }

  function generateSummary() {
    const text = summarizeInput.value.trim();
    if (!text) {
      return;
    }

    const ratio = parseInt(summaryRatio.value, 10) / 100;
    const jobId = ++summaryJobId;

    isSummarizing = true;
    summaryOutput.textContent = "Analyzing text...";
    summaryOutput.classList.add("is-placeholder");
    keyPointsContainer.hidden = true;
    keyPointsList.innerHTML = "";
    updateActionStates();

    setTimeout(() => {
      try {
        const summary = summarizeText(text, ratio);
        if (jobId !== summaryJobId) {
          return;
        }

        const originalWords = text.split(/\s+/).length;
        const summaryWords = summary.split(/\s+/).length;
        const reduction = Math.max(0, Math.round((1 - summaryWords / originalWords) * 100));

        isSummarizing = false;
        lastSummary = summary;
        setResultContent(summaryOutput, summary, placeholders.summaryOutput);
        summaryStats.textContent = `${reduction}% reduction`;
        generateKeyPoints(summary);
        updateActionStates();
      } catch (error) {
        if (jobId !== summaryJobId) {
          return;
        }

        isSummarizing = false;
        resetSummaryResult();
        updateActionStates();
      }
    }, 10);
  }

  function summarizeText(text, ratio) {
    const normalizedText = text.replace(/\s+/g, " ").trim();
    if (!normalizedText) {
      return "";
    }

    const sentenceMatches = normalizedText.match(/[^.!?\n]+[.!?]?/g) || [];
    const sentences = sentenceMatches
      .map((sentence, index) => ({
        text: sentence.trim(),
        index
      }))
      .filter((sentence) => sentence.text.length > 0);

    if (sentences.length <= 2) {
      return normalizedText;
    }

    const frequencies = buildWordFrequency(sentences);
    const rankedSentences = sentences.map((sentence, index) => {
      const words = getMeaningfulWords(sentence.text);
      const keywordScore = words.reduce((sum, word) => sum + (frequencies[word] || 0), 0);
      const normalizedKeywordScore = words.length ? keywordScore / words.length : 0;
      const positionScore = Math.max(0, 1 - (index / sentences.length)) * 1.5;
      const lengthScore = sentence.text.length > 40 && sentence.text.length < 260 ? 0.8 : 0.2;
      const numericScore = /\d/.test(sentence.text) ? 0.35 : 0;

      return {
        ...sentence,
        score: normalizedKeywordScore + positionScore + lengthScore + numericScore
      };
    });

    const keepCount = Math.max(2, Math.min(sentences.length, Math.round(sentences.length * ratio)));
    const selected = rankedSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, keepCount)
      .sort((a, b) => a.index - b.index)
      .map((sentence) => normalizeSentenceEnding(sentence.text));

    return selected.join(" ").trim();
  }

  function buildWordFrequency(sentences) {
    const frequency = {};

    sentences.forEach((sentence) => {
      const words = getMeaningfulWords(sentence.text);
      words.forEach((word) => {
        frequency[word] = (frequency[word] || 0) + 1;
      });
    });

    return frequency;
  }

  function getMeaningfulWords(text) {
    return (text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [])
      .filter((word) => !SUMMARY_STOP_WORDS.has(word));
  }

  function normalizeSentenceEnding(sentence) {
    return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
  }

  function generateKeyPoints(text) {
    const sentences = text
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 30 && sentence.length < 200);

    if (sentences.length < 2) {
      keyPointsContainer.hidden = true;
      return;
    }

    keyPointsList.innerHTML = sentences
      .slice(0, 4)
      .map((sentence) => `<li>${escapeHtml(sentence)}</li>`)
      .join("");
    keyPointsContainer.hidden = false;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        return;
      }

      cancelSummaryProgress();
      summarizeInput.value = text;
      updateSummarizeStats();
      resetSummaryResult();
      updateActionStates();
    } catch (error) {
      // Silent fail
    }
  }

  async function downloadSummary() {
    if (!lastSummary) {
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const filename = `summary-${timestamp}.txt`;
    const blob = new Blob([lastSummary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function convertCase(text, caseType) {
    const converters = {
      upper: (value) => value.toUpperCase(),
      lower: (value) => value.toLowerCase(),
      title: (value) => value.split(/\s+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" "),
      sentence: (value) => value.toLowerCase().replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (match) => match.toUpperCase()),
      camel: (value) => {
        const words = value.toLowerCase().split(/\s+/);
        return words.map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)).join("");
      },
      pascal: (value) => value.split(/\s+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(""),
      snake: (value) => value.toLowerCase().split(/\s+/).join("_"),
      kebab: (value) => value.toLowerCase().split(/\s+/).join("-"),
      alternating: (value) => value.split("").map((char, index) => index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()).join(""),
      inverse: (value) => value.split("").map((char) => char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()).join("")
    };

    return converters[caseType] ? converters[caseType](text) : text;
  }

  async function copyToClipboard(text, name) {
    const cleanText = text ? text.trim() : "";
    if (!cleanText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(cleanText);
    } catch (error) {
      // Silent fail
    }
  }

  async function getActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab;
    } catch (error) {
      return null;
    }
  }

  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "textSelected" && request.text) {
        const currentText = caseInput.value.trim();
        if (!currentText) {
          caseInput.value = request.text;
          updateCaseStats();
          resetCaseResult();
          updateActionStates();
        }
        sendResponse({ received: true });
      }
      return true;
    });
  }

  function cancelSummaryProgress() {
    summaryJobId += 1;
    isSummarizing = false;
  }
});

function extractPageContent() {
  const title = document.title || "Untitled Page";
  const selectors = ["article", "[role='main']", "main", ".content", "#content", ".post-content", ".article-content"];
  let content = "";

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText && element.innerText.length > 200) {
      content = element.innerText;
      break;
    }
  }

  if (!content || content.length < 200) {
    const paragraphs = Array.from(document.querySelectorAll("p"))
      .map((paragraph) => paragraph.innerText?.trim() || "")
      .filter((text) => text.length > 30);
    content = paragraphs.join("\n\n");
  }

  if (!content || content.length < 100) {
    const bodyText = document.body?.innerText || "";
    content = bodyText.replace(/\s+/g, " ").trim();
    if (content.length > 5000) {
      content = content.substring(0, 5000);
    }
  }

  content = content.replace(/\s+/g, " ").trim();
  const wordCount = (content.match(/\b\S+\b/g) || []).length;

  return {
    title,
    content: content.substring(0, 10000),
    preview: content.length > 300 ? `${content.substring(0, 300)}...` : content,
    wordCount
  };
}