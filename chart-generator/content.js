function extractData() {
  const tables = [];

  document.querySelectorAll("table").forEach((table, tableIndex) => {
    const rows = [];
    let columnTypes = [];

    table.querySelectorAll("tr").forEach(tr => {
      const cells = Array.from(tr.querySelectorAll("th, td")).map(td =>
        td.innerText.replace(/\s+/g, " ").trim()
      );

      if (cells.every(c => c === "")) return;
      rows.push(cells);
    });

    if (!rows.length) return;

    const header = rows[0];
    const dataRows = rows.slice(1);

    // Detect column data types
    const colCount = Math.max(...rows.map(r => r.length));
    columnTypes = Array(colCount).fill(null).map((_, colIdx) => {
      const samples = dataRows.slice(0, 10).map(r => r[colIdx]).filter(v => v);
      
      const numericCount = samples.filter(v => {
        const cleaned = String(v).replace(/[^0-9.-]+/g, "");
        return !isNaN(parseFloat(cleaned)) && cleaned !== "";
      }).length;
      
      const dateCount = samples.filter(v => !isNaN(Date.parse(v))).length;
      
      if (numericCount / samples.length > 0.7) return "numeric";
      if (dateCount / samples.length > 0.7) return "date";
      return "text";
    });

    // Normalize row lengths
    const normalized = rows.map(r => {
      const copy = [...r];
      while (copy.length < colCount) copy.push("");
      return copy;
    });

    // Calculate basic statistics for numeric columns
    const stats = columnTypes.map((type, colIdx) => {
      if (type !== "numeric") return null;
      
      const values = dataRows
        .map(r => parseFloat(String(r[colIdx]).replace(/[^0-9.-]+/g, "")))
        .filter(v => !isNaN(v));
      
      if (!values.length) return null;
      
      const sorted = [...values].sort((a, b) => a - b);
      return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
        sum: values.reduce((a, b) => a + b, 0)
      };
    });

    tables.push({
      index: tableIndex,
      header,
      rows: normalized,
      columns: colCount,
      rowCount: normalized.length,
      columnTypes,
      stats
    });
  });

  return tables;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "EXTRACT_DATA") {
    sendResponse(extractData());
  }
});