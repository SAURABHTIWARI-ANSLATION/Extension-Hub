// DOM Elements
const status = document.getElementById("status");
const scanBtn = document.getElementById("scan");
const tableSelect = document.getElementById("tableSelect");
const chartType = document.getElementById("chartType");
const preview = document.getElementById("preview");
const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");
const titleInput = document.getElementById("chartTitle");
const xLabel = document.getElementById("xLabel");
const yLabel = document.getElementById("yLabel");
const colorScheme = document.getElementById("colorScheme");
const colorPicker = document.getElementById("colorPicker");
const showGrid = document.getElementById("showGrid");
const showLegend = document.getElementById("showLegend");
const animateChart = document.getElementById("animateChart");
const columnSelector = document.getElementById("columnSelector");
const analyzeColumn = document.getElementById("analyzeColumn");
const statsGrid = document.getElementById("statsGrid");
const insights = document.getElementById("insights");

let tables = [];
let selectedColumns = [];

// Color Schemes
const colorSchemes = {
  default: ["#667eea", "#764ba2", "#f093fb", "#4facfe"],
  vibrant: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"],
  pastel: ["#FFB6D9", "#D5AAFF", "#85E3FF", "#BFFCC6", "#FFF5BA"],
  monochrome: ["#1a1a1a", "#4a4a4a", "#7a7a7a", "#aaaaaa", "#dadada"]
};

/* ========== Helpers ========== */
function setStatus(text, type = "info") {
  status.textContent = text;
  status.className = "status";
  if (type === "error") status.classList.add("error");
  if (type === "success") status.classList.add("success");
}

function safeNumber(val) {
  const n = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
  return isNaN(n) ? null : n;
}

function getColors() {
  if (colorScheme.value === "custom") {
    return [colorPicker.value];
  }
  return colorSchemes[colorScheme.value] || colorSchemes.default;
}

function saveSettings() {
  const settings = {
    chartType: chartType.value,
    colorScheme: colorScheme.value,
    customColor: colorPicker.value,
    showGrid: showGrid.checked,
    showLegend: showLegend.checked,
    animateChart: animateChart.checked
  };
  chrome.storage.local.set({ settings });
}

function loadSettings() {
  chrome.storage.local.get("settings", (data) => {
    if (data.settings) {
      chartType.value = data.settings.chartType || "bar";
      colorScheme.value = data.settings.colorScheme || "default";
      colorPicker.value = data.settings.customColor || "#667eea";
      showGrid.checked = data.settings.showGrid !== false;
      showLegend.checked = data.settings.showLegend !== false;
      animateChart.checked = data.settings.animateChart !== false;
    }
  });
}

/* ========== Tab Navigation ========== */
document.querySelectorAll(".tab").forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    
    tab.classList.add("active");
    document.getElementById(`${tab.dataset.tab}-tab`).classList.add("active");
  };
});

/* ========== Scan Page ========== */
scanBtn.onclick = async () => {
  setStatus("🔍 Scanning page...", "info");
  tableSelect.innerHTML = "";
  preview.innerHTML = "";
  columnSelector.innerHTML = "";
  analyzeColumn.innerHTML = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    tables = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_DATA" });

    if (!tables || !tables.length) {
      setStatus("❌ No tables found on this page.", "error");
      return;
    }

    setStatus(`✅ Found ${tables.length} table${tables.length > 1 ? 's' : ''}`, "success");

    tables.forEach((t) => {
      const o = document.createElement("option");
      o.value = t.index;
      o.textContent = `Table ${t.index + 1} (${t.rowCount} rows × ${t.columns} cols)`;
      tableSelect.appendChild(o);
    });

    tableSelect.value = tables[0].index;
    updateColumnSelector(tables[0].index);
    updateAnalyzeColumn(tables[0].index);
    renderPreview(tables[0].index);
    drawChart(tables[0].index);
  } catch (e) {
    console.error(e);
    setStatus("❌ Cannot scan this page (restricted or unsupported).", "error");
  }
};

/* ========== Column Selection ========== */
function updateColumnSelector(idx) {
  const table = tables.find(t => t.index === idx);
  if (!table) return;

  columnSelector.innerHTML = "";
  selectedColumns = table.header.map((_, i) => i);

  table.header.forEach((col, i) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.value = i;
    checkbox.onchange = () => {
      if (checkbox.checked) {
        selectedColumns.push(i);
      } else {
        selectedColumns = selectedColumns.filter(c => c !== i);
      }
      drawChart(idx);
    };

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(` ${col || `Col ${i + 1}`}`));
    columnSelector.appendChild(label);
  });

  document.getElementById("columnSection").style.display = "block";
}

/* ========== Analyze Column ========== */
function updateAnalyzeColumn(idx) {
  const table = tables.find(t => t.index === idx);
  if (!table) return;

  analyzeColumn.innerHTML = "";

  table.header.forEach((col, i) => {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = col || `Column ${i + 1}`;
    analyzeColumn.appendChild(o);
  });

  analyzeColumn.onchange = () => showStatistics(idx, parseInt(analyzeColumn.value));
  showStatistics(idx, 0);
}

function showStatistics(tableIdx, colIdx) {
  const table = tables.find(t => t.index === tableIdx);
  if (!table) return;

  const stats = table.stats[colIdx];
  statsGrid.innerHTML = "";
  insights.innerHTML = "";

  if (!stats) {
    document.getElementById("statsSection").style.display = "none";
    document.getElementById("insightsSection").style.display = "none";
    setStatus("This column doesn't contain numeric data.", "info");
    return;
  }

  document.getElementById("statsSection").style.display = "block";
  document.getElementById("insightsSection").style.display = "block";

  // Display stats
  const statItems = [
    { label: "Min", value: stats.min.toFixed(2) },
    { label: "Max", value: stats.max.toFixed(2) },
    { label: "Average", value: stats.avg.toFixed(2) },
    { label: "Median", value: stats.median.toFixed(2) },
    { label: "Sum", value: stats.sum.toFixed(2) },
    { label: "Range", value: (stats.max - stats.min).toFixed(2) }
  ];

  statItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `
      <div class="stat-label">${item.label}</div>
      <div class="stat-value">${item.value}</div>
    `;
    statsGrid.appendChild(card);
  });

  // Generate insights
  const insightsList = [];
  if (stats.max > stats.avg * 2) {
    insightsList.push("⚠️ High variance detected - some values are significantly above average");
  }
  if (stats.min < 0 && stats.max > 0) {
    insightsList.push("📊 Data contains both positive and negative values");
  }
  if (Math.abs(stats.avg - stats.median) < stats.avg * 0.1) {
    insightsList.push("✅ Data appears normally distributed");
  }

  insights.innerHTML = insightsList.map(i => `<p style="margin: 6px 0; font-size: 11px;">${i}</p>`).join("");
}

/* ========== Controls ========== */
tableSelect.onchange = () => {
  const idx = Number(tableSelect.value);
  updateColumnSelector(idx);
  updateAnalyzeColumn(idx);
  renderPreview(idx);
  drawChart(idx);
};

[chartType, colorScheme, titleInput, xLabel, yLabel, colorPicker, showGrid, showLegend, animateChart].forEach(el => {
  const handler = () => {
    drawChart(Number(tableSelect.value));
    saveSettings();
  };
  el.onchange = handler;
  el.oninput = handler;
});

colorScheme.onchange = () => {
  document.getElementById("customColorPicker").style.display = 
    colorScheme.value === "custom" ? "block" : "none";
  drawChart(Number(tableSelect.value));
  saveSettings();
};

/* ========== Export ========== */
document.getElementById("downloadChart").onclick = () => {
  chrome.downloads.download({
    url: canvas.toDataURL("image/png"),
    filename: `chart_${Date.now()}.png`,
  });
};

document.getElementById("downloadSVG").onclick = () => {
  const svgData = canvasToSVG();
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  chrome.downloads.download({
    url: URL.createObjectURL(blob),
    filename: `chart_${Date.now()}.svg`,
  });
};

document.getElementById("exportData").onclick = () => {
  const table = tables.find(t => t.index == tableSelect.value);
  if (!table) return;

  const rows = table.rows;
  if (!rows.length) return;

  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  chrome.downloads.download({
    url: URL.createObjectURL(blob),
    filename: `data_${Date.now()}.csv`,
  });
};

/* ========== Preview ========== */
document.getElementById("showPreview").onclick = () => {
  document.getElementById("previewOverlay").classList.remove("hidden");
};

document.getElementById("closePreview").onclick = () => {
  document.getElementById("previewOverlay").classList.add("hidden");
};

function renderPreview(i) {
  preview.innerHTML = "";
  const table = tables.find(t => t.index === i);
  if (!table) return;

  const rows = table.rows;
  rows.forEach((r, idx) => {
    const tr = document.createElement("tr");
    r.forEach((c) => {
      const cell = document.createElement(idx === 0 ? "th" : "td");
      cell.textContent = c;
      tr.appendChild(cell);
    });
    preview.appendChild(tr);
  });
}

/* ========== Chart Drawing ========== */
function drawChart(i) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const table = tables.find(t => t.index === i);
  if (!table || table.rows.length < 2) return;

  const labels = table.rows.slice(1).map(r => r[0]).slice(0, 10);
  const datasets = selectedColumns.slice(1).map((colIdx, dsIdx) => {
    const values = table.rows.slice(1).map(r => safeNumber(r[colIdx])).filter(v => v !== null).slice(0, 10);
    const colors = getColors();
    const color = colors[dsIdx % colors.length];

    return {
      label: table.header[colIdx] || `Dataset ${dsIdx + 1}`,
      data: values,
      color
    };
  }).filter(ds => ds.data.length > 0);

  if (!datasets.length) return;

  const type = chartType.value;
  const animate = animateChart.checked;

  if (type === "pie" || type === "doughnut") {
    drawPieChart(datasets[0], type === "doughnut", animate);
  } else if (type === "horizontal") {
    drawHorizontalBar(labels, datasets, animate);
  } else if (type === "area") {
    drawAreaChart(labels, datasets, animate);
  } else {
    drawStandardChart(labels, datasets, type, animate);
  }

  // Draw title
  if (titleInput.value) {
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(titleInput.value, canvas.width / 2, 20);
  }
}

function drawStandardChart(labels, datasets, type, animate) {
  const padding = { top: 40, right: 20, bottom: 50, left: 60 };
  const chartWidth = canvas.width - padding.left - padding.right;
  const chartHeight = canvas.height - padding.top - padding.bottom;

  const allValues = datasets.flatMap(ds => ds.data);
  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal;

  // Draw grid
  if (showGrid.checked) {
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }
  }

  // Draw axes
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  ctx.stroke();

  // Y-axis labels
  ctx.fillStyle = "#6b7280";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= 5; i++) {
    const val = maxVal - (range / 5) * i;
    const y = padding.top + (chartHeight / 5) * i;
    ctx.fillText(val.toFixed(0), padding.left - 10, y + 4);
  }

  // X-axis labels
  ctx.textAlign = "center";
  const barWidth = chartWidth / labels.length;
  labels.forEach((label, i) => {
    const x = padding.left + barWidth * i + barWidth / 2;
    ctx.save();
    ctx.translate(x, padding.top + chartHeight + 15);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText(label.substring(0, 10), 0, 0);
    ctx.restore();
  });

  // Draw data
  datasets.forEach((dataset, dsIdx) => {
    const offset = type === "bar" ? (barWidth / datasets.length) * dsIdx : 0;
    const w = type === "bar" ? barWidth / datasets.length - 2 : 0;

    ctx.fillStyle = dataset.color;
    ctx.strokeStyle = dataset.color;
    ctx.lineWidth = 3;

    if (type === "line") ctx.beginPath();

    dataset.data.forEach((val, i) => {
      const x = padding.left + barWidth * i + offset;
      const height = ((val - minVal) / range) * chartHeight;
      const y = padding.top + chartHeight - height;

      if (type === "bar") {
        ctx.fillRect(x + 1, y, w, height);
      } else if (type === "line") {
        if (i === 0) ctx.moveTo(x + barWidth / 2, y);
        else ctx.lineTo(x + barWidth / 2, y);
      }
    });

    if (type === "line") ctx.stroke();
  });

  // Axis labels
  if (xLabel.value) {
    ctx.fillStyle = "#374151";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(xLabel.value, canvas.width / 2, canvas.height - 5);
  }

  if (yLabel.value) {
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "#374151";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(yLabel.value, 0, 0);
    ctx.restore();
  }
}

function drawPieChart(dataset, isDoughnut, animate) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 40;
  const total = dataset.data.reduce((a, b) => a + b, 0);
  
  let startAngle = -Math.PI / 2;
  const colors = getColors();

  dataset.data.forEach((val, i) => {
    const sliceAngle = (val / total) * 2 * Math.PI;
    const color = colors[i % colors.length];

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();

    // Label
    const midAngle = startAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(midAngle) * (radius * 0.7);
    const labelY = centerY + Math.sin(midAngle) * (radius * 0.7);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${((val / total) * 100).toFixed(1)}%`, labelX, labelY);

    startAngle += sliceAngle;
  });

  if (isDoughnut) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawHorizontalBar(labels, datasets, animate) {
  const padding = { top: 40, right: 20, bottom: 30, left: 100 };
  const chartWidth = canvas.width - padding.left - padding.right;
  const chartHeight = canvas.height - padding.top - padding.bottom;

  const allValues = datasets.flatMap(ds => ds.data);
  const maxVal = Math.max(...allValues);

  const barHeight = chartHeight / labels.length;

  datasets.forEach((dataset) => {
    ctx.fillStyle = dataset.color;

    dataset.data.forEach((val, i) => {
      const width = (val / maxVal) * chartWidth;
      const y = padding.top + barHeight * i + barHeight / 4;
      ctx.fillRect(padding.left, y, width, barHeight / 2);

      // Value label
      ctx.fillStyle = "#374151";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(val.toFixed(0), padding.left + width + 5, y + barHeight / 4);
      ctx.fillStyle = dataset.color;
    });
  });

  // Y-axis labels
  ctx.fillStyle = "#374151";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "right";
  labels.forEach((label, i) => {
    const y = padding.top + barHeight * i + barHeight / 2;
    ctx.fillText(label.substring(0, 15), padding.left - 10, y);
  });
}

function drawAreaChart(labels, datasets, animate) {
  drawStandardChart(labels, datasets, "line", animate);

  const padding = { top: 40, right: 20, bottom: 50, left: 60 };
  const chartWidth = canvas.width - padding.left - padding.right;
  const chartHeight = canvas.height - padding.top - padding.bottom;
  const barWidth = chartWidth / labels.length;

  const allValues = datasets.flatMap(ds => ds.data);
  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal;

  datasets.forEach((dataset) => {
    ctx.fillStyle = dataset.color + "40";
    ctx.beginPath();

    dataset.data.forEach((val, i) => {
      const x = padding.left + barWidth * i + barWidth / 2;
      const height = ((val - minVal) / range) * chartHeight;
      const y = padding.top + chartHeight - height;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.lineTo(padding.left + barWidth * dataset.data.length, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.closePath();
    ctx.fill();
  });
}

function canvasToSVG() {
  // Simple SVG export - in production, use a proper library
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
      <image href="${canvas.toDataURL()}" width="${canvas.width}" height="${canvas.height}"/>
    </svg>
  `;
}

// Initialize
loadSettings();