document.getElementById("summarize").addEventListener("click", () => {
  const text = document.getElementById("input").value;
  const output = document.getElementById("output");

  if (!text.trim()) {
    output.textContent = "Please paste some text.";
    return;
  }

  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];

  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);

  const scored = sentences.map(s => {
    const score = (s.toLowerCase().match(/\b[a-z]{3,}\b/g) || [])
      .reduce((sum, w) => sum + (freq[w] || 0), 0);
    return { sentence: s.trim(), score };
  });

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.ceil(scored.length * 0.3)))
    .map(s => s.sentence);

  output.textContent = top.join(" ");
});
