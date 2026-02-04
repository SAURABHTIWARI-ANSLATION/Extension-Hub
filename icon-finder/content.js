/* content.js */

function extractIcons() {
  const icons = [];
  const seen = new Set();
  let index = 0;

  // Helper to process a node and its children (including Shadow DOM)
  function traverse(node) {
    if (!node) return;

    if (node.nodeType === Node.ELEMENT_NODE) {
      processElement(node);
    }

    if (node.children) {
      Array.from(node.children).forEach(child => traverse(child));
    }

    if (node.shadowRoot) {
      Array.from(node.shadowRoot.children).forEach(child => traverse(child));
    }
  }

  function processElement(el) {
    if (el.tagName.toLowerCase() === "svg") {
      processSVG(el);
      return;
    }
    if (el.tagName.toLowerCase() === "img") {
      processImg(el);
    }
    processStyles(el);
    processStyles(el, "::before");
    processStyles(el, "::after");
  }

  /* ---------------- PROCESSORS ---------------- */

  function addIcon(type, content, ext, srcUrl = null) {
    const key = srcUrl || content;
    if (seen.has(key)) return;
    seen.add(key);

    icons.push({
      id: index++,
      type,
      content,
      url: srcUrl,
      ext,
      name: `${type}-${index}.${ext}`
    });
  }

  function processSVG(svg) {
    try {
      const useElement = svg.querySelector("use");
      if (useElement) {
        resolveSvgSprite(svg, useElement);
      }
      if (!svg.getAttribute("xmlns")) {
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      }
      const content = svg.outerHTML;
      const rect = svg.getBoundingClientRect();
      
      if (rect.width > 0 && rect.height > 0) {
        addIcon("svg", content, "svg");
      }
    } catch (e) {
      // Ignore
    }
  }

  function processImg(img) {
    const src = img.currentSrc || img.src;
    if (!src || src.startsWith("data:")) return;

    if ((img.naturalWidth > 512 || img.naturalHeight > 512) && !src.includes(".svg")) return;

    const base64 = getBase64Image(img);
    addIcon("image", base64 || src, getExt(src), src);
  }

  function processStyles(el, pseudo = null) {
    const style = window.getComputedStyle(el, pseudo);
    handleUrlProperty(style.backgroundImage);
    handleUrlProperty(style.webkitMaskImage || style.maskImage);
  }

  function handleUrlProperty(propValue) {
    if (!propValue || propValue === "none" || propValue.includes("gradient")) return;
    
    const match = propValue.match(/url\(["']?(.*?)["']?\)/);
    if (match) {
      let url = match[1];
      if (url.startsWith('"') || url.startsWith("'")) url = url.slice(1, -1);
      
      if (url.startsWith('/')) {
         url = window.location.origin + url;
      } else if (!url.startsWith('http') && !url.startsWith('data:')) {
         url = new URL(url, window.location.href).href;
      }

      if (isIconUrl(url)) {
        addIcon("image", url, getExt(url), url);
      }
    }
  }

  /* ---------------- HELPERS ---------------- */

  function resolveSvgSprite(svg, use) {
    try {
      const href = use.getAttribute("href") || use.getAttribute("xlink:href");
      if (!href || !href.startsWith("#")) return;
      const id = href.substring(1);
      const sourceSymbol = document.getElementById(id);
      
      if (sourceSymbol) {
        const g = document.createElement("g");
        g.innerHTML = sourceSymbol.innerHTML;
        if (sourceSymbol.getAttribute("viewBox")) {
           svg.setAttribute("viewBox", sourceSymbol.getAttribute("viewBox"));
        }
        use.replaceWith(g);
      }
    } catch(e) {}
  }

  function getBase64Image(img) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL(`image/${getExt(img.src)}`);
    } catch (e) {
      return null;
    }
  }

  function isIconUrl(url) {
    return /\.(svg|png|webp|ico|gif)(\?.*)?$/i.test(url);
  }

  function getExt(url) {
    try {
      return url.split("?")[0].split(".").pop().toLowerCase() || "png";
    } catch { return "png"; }
  }

  // START SCAN
  traverse(document.body);
  return icons;
}

/* ---------------- LISTENER ---------------- */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SCAN_ICONS") {
    const icons = extractIcons();
    sendResponse({ icons });
  }
});