const analyzeBtn = document.getElementById("analyze")
const resultBox = document.getElementById("result")
const scoreBox = document.getElementById("scoreBox")
const scoreText = document.getElementById("seoScore")

analyzeBtn.addEventListener("click", () => {
  analyzeBtn.innerText = "Analyzing..."
  analyzeBtn.disabled = true

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: "GET_SEO_DATA" },
      data => {
        analyzeBtn.innerText = "🔍 Analyze Current Page"
        analyzeBtn.disabled = false

        if (!data) {
          resultBox.innerHTML = `<p>Unable to analyze this page.</p>`
          resultBox.classList.remove("hidden")
          return
        }

        const score = calculateScore(data)
        renderScore(score)
        renderResults(data)

        scoreBox.classList.remove("hidden")
        resultBox.classList.remove("hidden")
      }
    )
  })
})

function calculateScore(data) {
  let score = 0

  if (data.title.length >= 30 && data.title.length <= 60) score += 20

  if (data.metaDesc.length >= 70 && data.metaDesc.length <= 160) score += 20

  if (data.headings.h1 === 1) score += 20

  if (data.imagesWithoutAlt === 0) score += 20

  if (data.wordCount >= 300) score += 20

  return score
}

function renderScore(score) {
  scoreText.innerText = score

  scoreText.parentElement.style.color =
    score >= 80 ? "#16a34a" : score >= 50 ? "#ca8a04" : "#dc2626"
}

function renderResults(data) {
  resultBox.innerHTML = `
    <p><b>Title:</b> ${data.title || "Missing"} (${data.title.length} chars)</p>
    <p><b>Meta Description:</b> ${data.metaDesc || "Missing"} (${
      data.metaDesc.length
    } chars)</p>
    <p><b>Word Count:</b> ${data.wordCount}</p>

    <p><b>Images:</b> ${data.images}</p>
    <p><b>Images Missing ALT:</b> ${data.imagesWithoutAlt}</p>

    <p><b>Headings:</b></p>
    <ul>
      ${Object.entries(data.headings)
        .map(([tag, count]) => `<li>${tag.toUpperCase()}: ${count}</li>`)
        .join("")}
    </ul>

    ${renderWarnings(data)}
  `
}

function renderWarnings(data) {
  const warnings = []

  if (data.title.length < 30 || data.title.length > 60)
    warnings.push("⚠️ Title length should be 30–60 characters")

  if (!data.metaDesc)
    warnings.push("⚠️ Meta description is missing")

  if (data.headings.h1 !== 1)
    warnings.push("⚠️ Page should contain exactly one H1")

  if (data.imagesWithoutAlt > 0)
    warnings.push("⚠️ Some images are missing ALT attributes")

  if (data.wordCount < 300)
    warnings.push("⚠️ Content is too short (min 300 words)")

  if (!warnings.length) return `<p>✅ No major SEO issues found</p>`

  return `
    <p><b>Issues:</b></p>
    <ul>
      ${warnings.map(w => `<li>${w}</li>`).join("")}
    </ul>
  `
}
