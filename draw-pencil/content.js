(function() {
  // --- STATE ---
  let enabled = false;
  let drawing = false;
  let paths = [];
  let current = null;
  let currentColor = "#ff0000";
  let currentSize = 3;

  // DOM references
  let canvas = null;
  let ctx = null;
  let toolbar = null;

  function showNotification(text) {
    const note = document.createElement("div");
    note.textContent = text;
    Object.assign(note.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "10px 20px",
      background: "#333",
      color: "#fff",
      borderRadius: "30px",
      zIndex: "2147483647",
      fontFamily: "sans-serif",
      fontSize: "14px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
      pointerEvents: "none",
      transition: "opacity 0.3s",
      border: "1px solid #555"
    });
    document.body.appendChild(note);
    setTimeout(() => {
      note.style.opacity = "0";
      setTimeout(() => note.remove(), 300);
    }, 1500);
  }

  function init() {
    if (!document.body) return;

    // Reuse existing or create new
    canvas = document.getElementById("magic-pencil-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "magic-pencil-canvas";
      document.documentElement.appendChild(canvas);
    }

    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      zIndex: "999999",
      pointerEvents: "none",
      background: "transparent",
      display: "block"
    });

    ctx = canvas.getContext("2d");
    resize();

    toolbar = document.getElementById("magic-pencil-toolbar");
    if (!toolbar) {
      toolbar = document.createElement("div");
      toolbar.id = "magic-pencil-toolbar";
      toolbar.innerHTML = `
        <input type="color" id="mp-color" value="${currentColor}" title="Color">
        <input type="range" id="mp-size" min="1" max="16" value="${currentSize}" title="Size">
        <button id="mp-undo" title="Undo">↩️</button>
        <button id="mp-clear" title="Clear">🧹</button>
        <button id="mp-save" title="Save">💾</button>
        <button id="mp-close" title="Close">✖️</button>
      `;
      Object.assign(toolbar.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        display: "none",
        flexDirection: "column",
        gap: "12px",
        padding: "15px",
        background: "linear-gradient(180deg, #0d47a1 0%, #1976d2 100%)",
        borderRadius: "20px",
        zIndex: "1000000",
        alignItems: "center",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        border: "1px solid rgba(255,255,255,0.1)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      });
      document.body.appendChild(toolbar);

      // Style Color Picker
      const colorPicker = toolbar.querySelector("#mp-color");
      Object.assign(colorPicker.style, {
        width: "40px",
        height: "40px",
        border: "none",
        borderRadius: "10px",
        background: "#ffffff",
        padding: "2px",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      });

      // Style Size Slider
      const sizeSlider = toolbar.querySelector("#mp-size");
      Object.assign(sizeSlider.style, {
        width: "80px",
        cursor: "pointer",
        accentColor: "#42a5f5"
      });

      // Style Buttons
      toolbar.querySelectorAll("button").forEach(b => {
        Object.assign(b.style, {
          background: "#42a5f5",
          border: "none",
          borderRadius: "10px",
          color: "#ffffff",
          cursor: "pointer",
          fontSize: "20px",
          padding: "8px",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          transition: "background 0.2s"
        });
        b.onmouseover = () => b.style.background = "#64b5f6";
        b.onmouseout = () => b.style.background = "#42a5f5";
      });

      // Listeners
      toolbar.querySelector("#mp-color").onchange = e => currentColor = e.target.value;
      toolbar.querySelector("#mp-size").oninput = e => currentSize = +e.target.value;
      toolbar.querySelector("#mp-undo").onclick = undo;
      toolbar.querySelector("#mp-clear").onclick = clear;
      toolbar.querySelector("#mp-save").onclick = save;
      toolbar.querySelector("#mp-close").onclick = toggle;
    }

    // Canvas Events (Always re-attach for new script context)
    canvas.onmousedown = startDraw;
    window.onmousemove = moveDraw;
    window.onmouseup = endDraw;
    window.onresize = resize;
  }

  function startDraw(e) {
    if (!enabled) return;
    drawing = true;
    current = {
      color: currentColor,
      size: currentSize,
      points: [{ x: e.clientX, y: e.clientY }]
    };
  }

  function moveDraw(e) {
    if (!drawing) return;
    current.points.push({ x: e.clientX, y: e.clientY });
    redraw();
  }

  function endDraw() {
    if (!drawing) return;
    drawing = false;
    paths.push(current);
    current = null;
  }

  function redraw() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths.forEach(drawPath);
    if (current) drawPath(current);
  }

  function drawPath(path) {
    const pts = path.points;
    if (pts.length < 2) return;
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }

  function undo() { paths.pop(); redraw(); }
  function clear() { paths = []; redraw(); }
  function save() {
    const link = document.createElement("a");
    link.download = "magic-pencil.png";
    link.href = canvas.toDataURL();
    link.click();
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw();
  }

  function toggle() {
    enabled = !enabled;
    if (enabled) {
      init();
      canvas.style.pointerEvents = "auto";
      toolbar.style.display = "flex";
      document.body.style.cursor = "crosshair";
    } else {
      canvas.style.pointerEvents = "none";
      if (toolbar) toolbar.style.display = "none";
      document.body.style.cursor = "default";
    }
  }

  // --- MESSAGE LISTENER ---
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "PING") {
      sendResponse("PONG");
    } else if (msg.action === "TOGGLE") {
      toggle();
      sendResponse({ status: "ok" });
    }
  });

  console.log("Magic Pencil: Content Script Loaded");
})();
