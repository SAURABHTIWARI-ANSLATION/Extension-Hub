/* -------------------------------------------------
   SEO Analyzer Pro – Enhanced Popup Script
   Version 3.0
-------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initializeTheme();
  initializeElements();
  initializeTabs();
});

let currentReport = null;
let analysisHistory = [];

/* ================= INITIALIZATION ================= */

async function initializeTheme() {
  const toggle = document.getElementById('darkModeToggle');
  const container = document.querySelector('.container');
  
  // Load saved theme
  const result = await chrome.storage.sync.get(['theme']);
  const savedTheme = result.theme || 'light';
  
  // Apply theme
  container.setAttribute('data-theme', savedTheme);
  toggle.checked = savedTheme === 'dark';
  
  // Add event listener
  toggle.addEventListener('change', async (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    container.setAttribute('data-theme', theme);
    await chrome.storage.sync.set({ theme: theme });
    
    // Update UI elements that need theme-specific adjustments
    updateThemeColors();
  });
  
  // Initialize theme-specific colors
  updateThemeColors();
}

function updateThemeColors() {
  // Update any dynamic colors here if needed
  const isDark = document.querySelector('.container').getAttribute('data-theme') === 'dark';
  
  // Example: Update gauge colors based on theme
  const gaugeFill = document.getElementById('gaugeFill');
  if (gaugeFill) {
    if (isDark) {
      gaugeFill.style.background = 'linear-gradient(to right, #ef4444, #f59e0b, #10b981)';
    } else {
      gaugeFill.style.background = 'linear-gradient(to right, #ef4444, #f59e0b, #10b981)';
    }
  }
}

function initializeElements() {
  // Main Actions
  document.getElementById("analyzeBtn")?.addEventListener("click", analyzeCurrentPage);
  document.getElementById("analyzeCustomBtn")?.addEventListener("click", analyzeCustomUrl);
  
  // Export Actions
  document.getElementById("copyReportBtn")?.addEventListener("click", copyFullReport);
  document.getElementById("downloadReportBtn")?.addEventListener("click", downloadReport);
  document.getElementById("exportPDFBtn")?.addEventListener("click", exportPDF);
  
  // Quick Actions
  document.getElementById("quickHeadings")?.addEventListener("click", () => quickAnalyze('headings'));
  document.getElementById("quickMeta")?.addEventListener("click", () => quickAnalyze('meta'));
  document.getElementById("quickImages")?.addEventListener("click", () => quickAnalyze('images'));
  document.getElementById("quickLinks")?.addEventListener("click", () => quickAnalyze('links'));
  
  // Extra Actions
  document.getElementById("screenshotBtn")?.addEventListener("click", takeScreenshot);
  document.getElementById("historyBtn")?.addEventListener("click", showHistory);
  document.getElementById("settingsBtn")?.addEventListener("click", showSettings);
  
  // Footer Links
  document.getElementById("helpBtn")?.addEventListener("click", showHelp);
  document.getElementById("feedbackBtn")?.addEventListener("click", showFeedback);
  document.getElementById("aboutBtn")?.addEventListener("click", showAbout);
  
  // Info Button
  document.getElementById("infoBtn")?.addEventListener("click", showInstructions);
  
  // Enter key for custom URL
  document.getElementById("customUrl")?.addEventListener("keypress", (e) => {
    if (e.key === 'Enter') analyzeCustomUrl();
  });
}

function initializeTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Hide all tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
      });
      
      // Show selected tab content
      const tabId = tab.dataset.tab + 'Tab';
      document.getElementById(tabId).style.display = 'block';
    });
  });
}

/* ================= ANALYZE WEBSITE ================= */
async function analyzeCurrentPage() {
  console.log("Starting analysis...");
  showLoading();
  updateProgress(10);
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log("Current tab:", tab);
    
    if (!tab || !tab.id) {
      throw new Error("No active tab found");
    }
    
    if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
      throw new Error("Please open a normal website (http/https)");
    }
    
    console.log("Injecting content script...");
    await injectContentScript(tab.id);
    updateProgress(30);
    
    console.log("Fetching SEO report...");
    const report = await fetchSEOReport();
    console.log("Report fetched:", report);
    updateProgress(80);
    
    if (report) {
      currentReport = report;
      saveToHistory(report, tab.url);
      renderSEOReport(report);
      updateProgress(100);
    } else {
      throw new Error("Failed to get SEO report");
    }
    
  } catch (error) {
    console.error("Analysis error:", error);
    showError(error.message);
  } finally {
    hideLoading();
  }
}

async function analyzeCustomUrl() {
  const urlInput = document.getElementById('customUrl');
  const url = urlInput.value.trim();
  
  if (!url) {
    showError("Please enter a URL");
    return;
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showError("Please enter a valid URL starting with http:// or https://");
    return;
  }
  
  showLoading();
  
  try {
    // In a real extension, you would need to create a new tab and analyze it
    // For demo purposes, we'll simulate analysis
    const simulatedReport = {
      url: url,
      title: "Test Page - " + new URL(url).hostname,
      metaDescription: "This is a simulated analysis for custom URL",
      h1: ["Test Heading"],
      h2: ["Sub Heading 1", "Sub Heading 2"],
      canonical: url,
      robots: "index, follow",
      viewport: "width=device-width, initial-scale=1.0",
      charset: "UTF-8",
      og: {
        title: "Test Page",
        description: "Simulated analysis"
      },
      images: []
    };
    
    currentReport = simulatedReport;
    renderSEOReport(simulatedReport);
    
  } catch (error) {
    showError("Failed to analyze URL: " + error.message);
  } finally {
    hideLoading();
  }
}

async function injectContentScript(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

async function fetchSEOReport() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "GET_SEO_REPORT" },
      (report) => {
        if (chrome.runtime.lastError) {
          console.error("Error fetching report:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log("Report received:", report);
          resolve(report);
        }
      }
    );
  });
}

/* ================= QUICK ANALYZE ================= */
async function quickAnalyze(type) {
  showLoading();
  updateLoadingStat(`Checking ${type}...`);
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab");
    
    await injectContentScript(tab.id);
    
    chrome.tabs.sendMessage(tab.id, { type: `QUICK_${type.toUpperCase()}` }, (result) => {
      if (chrome.runtime.lastError) {
        showQuickResult(type, { error: "Failed to analyze" });
      } else {
        showQuickResult(type, result);
      }
      hideLoading();
    });
    
  } catch (error) {
    showError(error.message);
    hideLoading();
  }
}

function showQuickResult(type, data) {
  let message = "";
  
  switch(type) {
    case 'headings':
      const h1Count = data.h1?.length || 0;
      const h2Count = data.h2?.length || 0;
      message = `H1: ${h1Count}, H2: ${h2Count}`;
      break;
    case 'meta':
      const title = data.title ? "✓" : "✗";
      const desc = data.metaDescription ? "✓" : "✗";
      message = `Title: ${title}, Desc: ${desc}`;
      break;
    case 'images':
      const altCount = data.imagesWithAlt || 0;
      const totalImages = data.totalImages || 0;
      message = `Images: ${altCount}/${totalImages} have alt text`;
      break;
    case 'links':
      const internal = data.internalLinks || 0;
      const external = data.externalLinks || 0;
      message = `Links: ${internal} internal, ${external} external`;
      break;
  }
  
  alert(`Quick ${type} analysis:\n${message}`);
}

/* ================= RENDER REPORT ================= */
function renderSEOReport(report) {
  const reportSection = document.getElementById("seoReport");
  reportSection.style.display = "block";
  
  // Basic Info
  document.getElementById("rTitle").textContent = report.title || "Missing";
  document.getElementById("rDesc").textContent = report.metaDescription || "Missing";
  document.getElementById("rH1").textContent = report.h1?.length || 0;
  document.getElementById("rH2").textContent = report.h2?.length || 0;
  
  // Advanced Info
  document.getElementById("rCanonical").textContent = report.canonical ? report.canonical : "No";
  document.getElementById("rRobots").textContent = report.robots || "No";
  document.getElementById("rViewport").textContent = report.viewport || "No";
  document.getElementById("rCharset").textContent = report.charset || "No";
  
  // Calculate lengths and status
  updateLengthStats(report);
  
  // Calculate and display score
  const score = calculateEnhancedScore(report);
  displayScore(score);
  
  // Render warnings and recommendations
  renderWarnings(report);
  renderRecommendations(report);
  renderIssues(report);
  
  // Update issues count
  updateIssuesCount(report);
}

function updateLengthStats(report) {
  const titleLength = report.title?.length || 0;
  const descLength = report.metaDescription?.length || 0;
  
  document.getElementById("titleLength").textContent = `${titleLength} chars`;
  document.getElementById("descLength").textContent = `${descLength} chars`;
  
  // Update status badges
  document.getElementById("titleStatus").textContent = 
    titleLength >= 50 && titleLength <= 60 ? "Good" : 
    titleLength < 30 ? "Too Short" : "Needs Work";
  document.getElementById("titleStatus").className = 
    `status-badge ${getStatusClass(titleLength >= 50 && titleLength <= 60)}`;
  
  document.getElementById("descStatus").textContent = 
    descLength >= 120 && descLength <= 160 ? "Good" : 
    descLength < 100 ? "Too Short" : "Needs Work";
  document.getElementById("descStatus").className = 
    `status-badge ${getStatusClass(descLength >= 120 && descLength <= 160)}`;
  
  document.getElementById("h1Status").textContent = 
    (report.h1?.length || 0) === 1 ? "Good" : 
    (report.h1?.length || 0) === 0 ? "Missing" : "Multiple";
  document.getElementById("h1Status").className = 
    `status-badge ${getStatusClass((report.h1?.length || 0) === 1)}`;
}

function getStatusClass(isGood) {
  return isGood ? "good" : "warning";
}

/* ================= SCORE CALCULATION ================= */
function calculateEnhancedScore(report) {
  let score = 0;
  const maxScore = 100;
  
  // Title (15 points)
  if (report.title) {
    const titleLength = report.title.length;
    if (titleLength >= 50 && titleLength <= 60) score += 15;
    else if (titleLength >= 30 && titleLength < 70) score += 10;
    else score += 5;
  }
  
  // Meta Description (15 points)
  if (report.metaDescription) {
    const descLength = report.metaDescription.length;
    if (descLength >= 120 && descLength <= 160) score += 15;
    else if (descLength >= 80 && descLength < 180) score += 10;
    else score += 5;
  }
  
  // H1 (20 points)
  const h1Count = report.h1?.length || 0;
  if (h1Count === 1) score += 20;
  else if (h1Count > 1) score += 10;
  
  // H2 (10 points)
  if ((report.h2?.length || 0) > 0) score += 10;
  
  // Canonical (10 points)
  if (report.canonical) score += 10;
  
  // Robots (10 points)
  if (report.robots && report.robots.includes('index')) score += 10;
  
  // Viewport (5 points)
  if (report.viewport && report.viewport.includes('width=device-width')) score += 5;
  
  // Charset (5 points)
  if (report.charset && report.charset.toLowerCase().includes('utf-8')) score += 5;
  
  // Open Graph (10 points)
  if (Object.keys(report.og || {}).length >= 2) score += 10;
  
  return Math.min(score, maxScore);
}

function displayScore(score) {
  // Update score badge
  document.getElementById("scoreBadge").textContent = score;
  
  // Update gauge
  const gaugeFill = document.getElementById("gaugeFill");
  const gaugeText = document.getElementById("gaugeText");
  
  gaugeFill.style.height = `${score}%`;
  gaugeText.textContent = score;
  
  // Update gauge color based on score
  if (score >= 80) {
    gaugeFill.style.background = "linear-gradient(to right, #10b981, #34d399)";
  } else if (score >= 50) {
    gaugeFill.style.background = "linear-gradient(to right, #f59e0b, #fbbf24)";
  } else {
    gaugeFill.style.background = "linear-gradient(to right, #ef4444, #f87171)";
  }
}

/* ================= WARNINGS & RECOMMENDATIONS ================= */
function renderWarnings(report) {
  const warningsList = document.getElementById("warningsList");
  warningsList.innerHTML = "";
  
  const warnings = [];
  
  // Check title
  if (!report.title) {
    warnings.push("Missing title tag");
  } else if (report.title.length < 30) {
    warnings.push("Title is too short (minimum 30 characters)");
  } else if (report.title.length > 60) {
    warnings.push("Title is too long (maximum 60 characters)");
  }
  
  // Check meta description
  if (!report.metaDescription) {
    warnings.push("Missing meta description");
  } else if (report.metaDescription.length < 120) {
    warnings.push("Meta description is too short (minimum 120 characters)");
  } else if (report.metaDescription.length > 160) {
    warnings.push("Meta description is too long (maximum 160 characters)");
  }
  
  // Check H1
  if (!report.h1 || report.h1.length === 0) {
    warnings.push("Missing H1 tag");
  } else if (report.h1.length > 1) {
    warnings.push("Multiple H1 tags found");
  }
  
  // Check canonical
  if (!report.canonical) {
    warnings.push("Missing canonical tag");
  }
  
  // Check robots
  if (!report.robots) {
    warnings.push("Missing robots meta tag");
  }
  
  // Check viewport
  if (!report.viewport || !report.viewport.includes('width=device-width')) {
    warnings.push("Missing or improper viewport tag");
  }
  
  // Render warnings
  warnings.forEach(warning => {
    const warningDiv = document.createElement("div");
    warningDiv.className = "warning-item";
    warningDiv.textContent = warning;
    warningsList.appendChild(warningDiv);
  });
}

function renderRecommendations(report) {
  const recommendationsList = document.getElementById("recommendationsList");
  recommendationsList.innerHTML = "";
  
  const recommendations = [];
  
  if (report.title && report.title.length < 50) {
    recommendations.push("Optimize title length to 50-60 characters");
  }
  
  if (report.metaDescription && report.metaDescription.length < 120) {
    recommendations.push("Expand meta description to 120-160 characters");
  }
  
  if (report.h1 && report.h1.length === 0) {
    recommendations.push("Add a single H1 tag with primary keyword");
  }
  
  if (!report.canonical) {
    recommendations.push("Add canonical tag to avoid duplicate content");
  }
  
  if (!report.robots) {
    recommendations.push("Add robots meta tag for better crawl control");
  }
  
  // Add general recommendations if less than 3 specific ones
  if (recommendations.length < 3) {
    recommendations.push("Add schema markup for rich results");
    recommendations.push("Optimize images with alt text");
    recommendations.push("Ensure mobile responsiveness");
  }
  
  // Render recommendations
  recommendations.forEach(rec => {
    const li = document.createElement("li");
    li.textContent = rec;
    recommendationsList.appendChild(li);
  });
}

function renderIssues(report) {
  const issuesList = document.getElementById("issuesList");
  issuesList.innerHTML = "";
  
  // This would be populated based on actual issues found
  // For now, using warnings as issues
  const issues = [
    { severity: "high", title: "Missing Meta Description", description: "Add a compelling meta description" },
    { severity: "medium", title: "No Canonical Tag", description: "Add canonical URL to avoid duplicate content" },
    { severity: "low", title: "Multiple H1 Tags", description: "Use only one H1 tag per page" }
  ];
  
  issues.forEach(issue => {
    const issueDiv = document.createElement("div");
    issueDiv.className = "issue-item";
    
    let icon = "⚠️";
    if (issue.severity === "high") icon = "🔴";
    if (issue.severity === "medium") icon = "🟡";
    if (issue.severity === "low") icon = "🟢";
    
    issueDiv.innerHTML = `
      <div class="issue-icon">${icon}</div>
      <div class="issue-content">
        <h5>${issue.title}</h5>
        <p>${issue.description}</p>
      </div>
    `;
    
    issuesList.appendChild(issueDiv);
  });
}

function updateIssuesCount(report) {
  // Count warnings as issues for now
  const warnings = document.querySelectorAll('.warning-item').length;
  document.getElementById("issuesCount").textContent = warnings;
}

/* ================= EXPORT FUNCTIONS ================= */
function buildEnhancedReport(report, score) {
  const date = new Date().toLocaleString();
  
  return `SEO ANALYZER PRO REPORT
===============================
Generated: ${date}
URL: ${report.url || 'Current Page'}
Score: ${score}/100

📊 BASIC SEO METRICS
-------------------------
Title: ${report.title || 'Missing'}
Title Length: ${report.title?.length || 0} characters

Meta Description: ${report.metaDescription || 'Missing'}
Description Length: ${report.metaDescription?.length || 0} characters

H1 Count: ${report.h1?.length || 0}
H2 Count: ${report.h2?.length || 0}

🔧 TECHNICAL SEO
-------------------------
Canonical: ${report.canonical || 'Missing'}
Robots Meta: ${report.robots || 'Missing'}
Viewport: ${report.viewport || 'Missing'}
Charset: ${report.charset || 'Missing'}

📱 OPEN GRAPH TAGS
-------------------------
${Object.entries(report.og || {}).map(([key, value]) => `${key}: ${value}`).join('\n') || 'No Open Graph tags found'}

⚠️ ISSUES FOUND
-------------------------
${Array.from(document.querySelectorAll('.warning-item')).map(w => `• ${w.textContent}`).join('\n') || 'No issues found'}

💡 RECOMMENDATIONS
-------------------------
${Array.from(document.querySelectorAll('#recommendationsList li')).map(li => `• ${li.textContent}`).join('\n') || 'No recommendations'}

===============================
Generated by SEO Analyzer Pro v3.0
`;
}

async function copyFullReport() {
  if (!currentReport) {
    showError("No report available. Please analyze a page first.");
    return;
  }
  
  const score = document.getElementById("scoreBadge").textContent;
  const reportText = buildEnhancedReport(currentReport, score);
  
  try {
    await navigator.clipboard.writeText(reportText);
    showNotification("✅ Report copied to clipboard!");
  } catch (err) {
    showError("Failed to copy report: " + err.message);
  }
}

async function downloadReport() {
  if (!currentReport) {
    showError("No report available. Please analyze a page first.");
    return;
  }
  
  const score = document.getElementById("scoreBadge").textContent;
  const reportText = buildEnhancedReport(currentReport, score);
  const date = new Date().toISOString().split('T')[0];
  
  const blob = new Blob([reportText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `seo-report-${date}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification("📥 Report downloaded!");
}

async function exportPDF() {
  showNotification("PDF export feature coming soon!");
  // In a real implementation, you would use a PDF library like jsPDF
}

/* ================= EXTRA FEATURES ================= */
async function takeScreenshot() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        showError("Failed to take screenshot");
        return;
      }
      
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `seo-screenshot-${new Date().getTime()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      showNotification("📸 Screenshot saved!");
    });
  } catch (error) {
    showError("Failed to take screenshot: " + error.message);
  }
}

function showHistory() {
  // Simple history implementation
  if (analysisHistory.length === 0) {
    alert("No analysis history yet. Analyze some pages first!");
    return;
  }
  
  const historyText = analysisHistory.map((item, index) => 
    `${index + 1}. ${item.url} - Score: ${item.score}/100`
  ).join('\n');
  
  alert(`Analysis History:\n\n${historyText}`);
}

function showSettings() {
  alert("Settings feature coming soon!\n\nPlanned features:\n• API integration\n• Custom scoring rules\n• Export templates\n• Auto-analysis");
}

function saveToHistory(report, url) {
  const score = document.getElementById("scoreBadge").textContent;
  
  analysisHistory.unshift({
    url: url,
    score: parseInt(score),
    timestamp: new Date().toISOString(),
    title: report.title || 'Untitled'
  });
  
  // Keep only last 10 analyses
  if (analysisHistory.length > 10) {
    analysisHistory.pop();
  }
  
  // Save to storage
  chrome.storage.local.set({ analysisHistory });
}

/* ================= UI UTILITIES ================= */
function showLoading() {
  document.getElementById("loading").classList.add("active");
  document.getElementById("analyzeBtn").disabled = true;
  updateProgress(0);
}

function hideLoading() {
  document.getElementById("loading").classList.remove("active");
  document.getElementById("analyzeBtn").disabled = false;
}

function updateProgress(percent) {
  const progressBar = document.getElementById("progressBar");
  if (progressBar) {
    progressBar.style.width = `${percent}%`;
  }
}

function updateLoadingStat(text) {
  const statElement = document.getElementById("loadingStat");
  if (statElement) {
    statElement.textContent = text;
  }
}

function showError(message) {
  alert(`❌ Error: ${message}`);
}

function showNotification(message) {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    font-size: 14px;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

/* ================= FOOTER ACTIONS ================= */
function showHelp() {
  const helpText = `
SEO Analyzer Pro - Help Guide

🚀 HOW TO USE:
1. Open any website in Chrome
2. Click "Analyze Current Page"
3. View detailed SEO report

📊 QUICK ACTIONS:
• H1/H2: Check heading structure
• Meta: Check title & description
• Images: Check image optimization
• Links: Check link structure

📈 SCORE BREAKDOWN:
• 80-100: Excellent
• 50-79: Good
• 0-49: Needs Improvement

Need more help? Contact support@example.com
`;
  
  alert(helpText);
}

function showFeedback() {
  const feedbackUrl = "https://forms.gle/example"; // Replace with actual form
  chrome.tabs.create({ url: feedbackUrl });
}

function showAbout() {
  const aboutText = `
SEO Analyzer Pro v3.0

🔧 A powerful SEO analysis tool for web developers, marketers, and SEO specialists.

✨ FEATURES:
• Complete SEO analysis
• Technical SEO audit
• Performance recommendations
• Export capabilities
• Dark/Light theme

📝 Made with ❤️ for the SEO community

🌐 Website: https://example.com
🐙 GitHub: https://github.com/example
`;
  
  alert(aboutText);
}

function showInstructions() {
  const instructions = `
🔍 How to use SEO Analyzer Pro:

1. Navigate to any website
2. Click the "Analyze Current Page" button
3. Wait for the analysis to complete
4. Review the SEO score and recommendations
5. Use the tabs to view different report sections
6. Export the report if needed

💡 Tips:
• Use Quick Actions for specific checks
• Switch to Dark Mode for better visibility
• Check Recommendations for improvement ideas
• Save reports for tracking progress
`;
  
  alert(instructions);
}

/* ================= INITIALIZE HISTORY ================= */
// Load history from storage on startup
chrome.storage.local.get(['analysisHistory'], (result) => {
  if (result.analysisHistory) {
    analysisHistory = result.analysisHistory;
  }
});