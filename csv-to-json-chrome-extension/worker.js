self.onmessage = e => {
  const { mode, text } = e.data;
  try {
    if (mode === "csv2json") {
      const result = parseCSV(text);
      self.postMessage({ type: "done", data: JSON.stringify(result, null, 2) });
    } else {
      const csv = jsonToCSV(JSON.parse(text));
      self.postMessage({ type: "done", data: csv });
    }
  } catch {
    self.postMessage({ type: "error", data: "Invalid file format" });
  }
};

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines.shift().split(",");
  const result = [];
  lines.forEach((line, i) => {
    const row = line.split(",");
    const obj = {};
    headers.forEach((h, j) => obj[h.trim()] = (row[j] || "").trim());
    result.push(obj);
    if (i % 50 === 0) {
      self.postMessage({ type: "progress", data: Math.floor((i / lines.length) * 100) });
    }
  });
  self.postMessage({ type: "progress", data: 100 });
  return result;
}

function jsonToCSV(json) {
  const headers = Object.keys(json[0]).join(",");
  const rows = json.map(o =>
    Object.values(o).map(v => `"${v}"`).join(",")
  );
  return [headers, ...rows].join("\n");
}
