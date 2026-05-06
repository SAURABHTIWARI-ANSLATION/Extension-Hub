// toolService.js — Executes tools by injecting scripts into active tab

export const toolService = {
  async getActiveTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0] || null);
      });
    });
  },

  async executeInTab(func, args = []) {
    const tab = await this.getActiveTab();
    if (!tab) throw new Error("No active tab");
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func,
      args
    });
    return results[0]?.result;
  },

  async injectFile(file) {
    const tab = await this.getActiveTab();
    if (!tab) throw new Error("No active tab");
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [file]
    });
  },

  // ── Page Tools ──────────────────────────────────────────────────────────────

  async disableCSS(active) {
    return this.executeInTab((enable) => {
      const ATTR = "data-wdt-disabled";
      if (enable) {
        document.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
          el.setAttribute(ATTR, "true");
          el.disabled = true;
        });
      } else {
        document.querySelectorAll(`[${ATTR}]`).forEach(el => {
          el.removeAttribute(ATTR);
          el.disabled = false;
        });
      }
    }, [active]);
  },

  async disableJS(active) {
    return this.executeInTab((enable) => {
      const KEY = "__wdt_disable_js__";
      const EVENTS = [
        "click","dblclick","mousedown","mouseup","mousemove","mouseover","mouseout",
        "pointerdown","pointerup","pointermove",
        "keydown","keyup","keypress",
        "submit","input","change",
        "touchstart","touchmove","touchend",
        "dragstart","dragover","drop",
        "contextmenu","wheel"
      ];

      if (enable) {
        if (window[KEY]?.enabled) return true;

        const stopAll = (e) => {
          try {
            e.preventDefault();
            e.stopImmediatePropagation();
          } catch {}
        };

        // Capture-phase blockers prevent most page interaction handlers from firing.
        for (const type of EVENTS) {
          document.addEventListener(type, stopAll, true);
        }

        window[KEY] = { enabled: true, stopAll, EVENTS };
        return true;
      }

      const state = window[KEY];
      if (!state?.enabled) return true;
      for (const type of state.EVENTS || []) {
        document.removeEventListener(type, state.stopAll, true);
      }
      delete window[KEY];
      return true;
    }, [active]);
  },

  async disableImages(active) {
    return this.executeInTab((enable) => {
      const ID = "wdt-no-images";
      if (enable) {
        if (document.getElementById(ID)) return;
        const style = document.createElement("style");
        style.id = ID;
        style.textContent = "img, picture, [style*='background-image'] { visibility: hidden !important; }";
        document.head.appendChild(style);
      } else {
        document.getElementById(ID)?.remove();
      }
    }, [active]);
  },

  async editPageMode(active) {
    return this.executeInTab((enable) => {
      document.designMode = enable ? "on" : "off";
    }, [active]);
  },

  async outlineElements(active) {
    return this.executeInTab((enable) => {
      const ID = "wdt-outline-style";
      if (enable) {
        document.getElementById(ID)?.remove();
        const style = document.createElement("style");
        style.id = ID;
        style.textContent = "* { outline: 1px solid rgba(37,99,235,0.4) !important; }";
        document.head.appendChild(style);
      } else {
        document.getElementById(ID)?.remove();
      }
    }, [active]);
  },

  async showBlockElements(active) {
    return this.executeInTab((enable) => {
      const ID = "wdt-block-style";
      const tags = ["div","section","article","main","header","footer","aside","nav","p","ul","ol","li","table","form","blockquote","figure"];
      if (enable) {
        document.getElementById(ID)?.remove();
        const style = document.createElement("style");
        style.id = ID;
        const font = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
        style.textContent = tags.map(t => `${t}::before { content: "<${t}>"; font-size: 10px; font-family: ${font}; color: #2563EB; background: rgba(37,99,235,0.08); padding: 0 2px; position: relative; z-index: 9999; }`).join("\n");
        document.head.appendChild(style);
      } else {
        document.getElementById(ID)?.remove();
      }
    }, [active]);
  },

  async showElementInfo(active) {
    return this.executeInTab((enable) => {
      const KEY = "__wdt_info_handler__";
      if (enable) {
        if (window[KEY]) return;
        const tooltip = document.createElement("div");
        tooltip.id = "wdt-element-tooltip";
        Object.assign(tooltip.style, {
          position: "fixed", zIndex: "2147483647", background: "#111",
          color: "#fff", fontSize: "11px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "6px 8px", borderRadius: "4px", pointerEvents: "none",
          display: "none", maxWidth: "280px", lineHeight: "1.5"
        });
        document.body.appendChild(tooltip);

        window[KEY] = (e) => {
          const el = e.target;
          const rect = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const lines = [
            `<${el.tagName.toLowerCase()}${el.id ? " #"+el.id : ""}${el.className ? " ."+[...el.classList].join(".") : ""}>`,
            `${Math.round(rect.width)}×${Math.round(rect.height)}px`,
            `font: ${cs.fontSize} ${cs.fontFamily.split(",")[0]}`,
            `margin: ${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
            `padding: ${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`
          ];
          tooltip.textContent = lines.join("\n");
          tooltip.style.display = "block";
          const x = Math.min(e.clientX + 12, window.innerWidth - 290);
          const y = Math.min(e.clientY + 12, window.innerHeight - 100);
          tooltip.style.left = x + "px";
          tooltip.style.top = y + "px";
        };
        document.addEventListener("mousemove", window[KEY]);
      } else {
        document.removeEventListener("mousemove", window[KEY]);
        delete window[KEY];
        document.getElementById("wdt-element-tooltip")?.remove();
      }
    }, [active]);
  },

  async viewSource() {
    const tab = await this.getActiveTab();
    if (tab) {
      chrome.tabs.create({ url: `view-source:${tab.url}` });
    }
  },

  async clearCacheAndCookies() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "CLEAR_BROWSING_DATA" }, resolve);
    });
  },

  // ── Form Tools ──────────────────────────────────────────────────────────────

  async showFormDetails(active) {
    return this.executeInTab((enable) => {
      const CLASS = "wdt-form-badge";
      if (enable) {
        document.querySelectorAll(`.${CLASS}`).forEach(el => el.remove());
        document.querySelectorAll("form").forEach(form => {
          const badge = document.createElement("div");
          badge.className = CLASS;
          Object.assign(badge.style, {
            position: "absolute", background: "#2563EB", color: "#fff",
            fontSize: "10px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", padding: "2px 6px",
            borderRadius: "3px", zIndex: "9999", pointerEvents: "none"
          });
          badge.textContent = `${form.method?.toUpperCase() || "GET"} → ${form.action || "self"}`;
          const rect = form.getBoundingClientRect();
          form.style.position = form.style.position || "relative";
          form.appendChild(badge);
        });
      } else {
        document.querySelectorAll(`.${CLASS}`).forEach(el => el.remove());
      }
    }, [active]);
  },

  async showHiddenFields(active) {
    return this.executeInTab((enable) => {
      const ATTR = "data-wdt-revealed";
      if (enable) {
        document.querySelectorAll('input[type="hidden"]').forEach(el => {
          if (el.hasAttribute(ATTR)) return;
          el.setAttribute(ATTR, "true");
          el.type = "text";
          el.style.border = "2px dashed #2563EB";
          el.style.background = "rgba(37,99,235,0.08)";
        });
      } else {
        document.querySelectorAll(`[${ATTR}]`).forEach(el => {
          el.type = "hidden";
          el.removeAttribute(ATTR);
          el.style.border = "";
          el.style.background = "";
        });
      }
    }, [active]);
  },

  async autoFillForms() {
    return this.executeInTab(() => {
      const FAKES = {
        text: "Test User", email: "test@example.com", tel: "+1-555-0100",
        url: "https://example.com", search: "test query", number: "42",
        password: "TestPass123!", textarea: "This is auto-filled test content.",
        date: "2024-01-15", time: "09:00", month: "2024-01"
      };
      document.querySelectorAll("input, textarea, select").forEach(el => {
        if (el.disabled || el.readOnly) return;
        if (el.tagName === "SELECT" && el.options.length > 1) {
          el.selectedIndex = 1;
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return;
        }
        if (el.tagName === "TEXTAREA") {
          el.value = FAKES.textarea;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          return;
        }
        const type = el.type || "text";
        if (type === "checkbox" || type === "radio") { el.checked = true; return; }
        if (FAKES[type] !== undefined) {
          el.value = FAKES[type];
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
    });
  },

  async enableDisabledFields(active) {
    return this.executeInTab((enable) => {
      const ATTR = "data-wdt-was-disabled";
      if (enable) {
        document.querySelectorAll("[disabled]").forEach(el => {
          if (el.hasAttribute(ATTR)) return;
          el.setAttribute(ATTR, "true");
          el.removeAttribute("disabled");
          el.style.opacity = "1";
        });
      } else {
        document.querySelectorAll(`[${ATTR}]`).forEach(el => {
          el.setAttribute("disabled", "true");
          el.removeAttribute(ATTR);
          el.style.opacity = "";
        });
      }
    }, [active]);
  },

  async removeMaxlength(active) {
    return this.executeInTab((enable) => {
      const ATTR = "data-wdt-maxlen";
      if (enable) {
        document.querySelectorAll("[maxlength]").forEach(el => {
          if (el.hasAttribute(ATTR)) return;
          el.setAttribute(ATTR, el.getAttribute("maxlength"));
          el.removeAttribute("maxlength");
        });
      } else {
        document.querySelectorAll(`[${ATTR}]`).forEach(el => {
          el.setAttribute("maxlength", el.getAttribute(ATTR));
          el.removeAttribute(ATTR);
        });
      }
    }, [active]);
  },

  // ── Inspection Tools ─────────────────────────────────────────────────────────

  async showAltAttributes(active) {
    return this.executeInTab((enable) => {
      const CLASS = "wdt-alt-badge";
      if (enable) {
        document.querySelectorAll(`.${CLASS}`).forEach(el => el.remove());
        document.querySelectorAll("img").forEach(img => {
          const badge = document.createElement("span");
          badge.className = CLASS;
          const altText = img.alt || "(no alt)";
          const isEmpty = !img.alt;
          Object.assign(badge.style, {
            position: "absolute", background: isEmpty ? "#DC2626" : "#16A34A",
            color: "#fff", fontSize: "10px", padding: "1px 5px",
            borderRadius: "2px", zIndex: "9999", maxWidth: "200px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            pointerEvents: "none"
          });
          badge.textContent = altText;
          img.style.position = img.style.position || "relative";
          img.parentElement.style.position = img.parentElement.style.position || "relative";
          img.parentElement.appendChild(badge);
        });
      } else {
        document.querySelectorAll(`.${CLASS}`).forEach(el => el.remove());
      }
    }, [active]);
  },

  async highlightHeadings(active) {
    return this.executeInTab((enable) => {
      const ID = "wdt-headings-style";
      if (enable) {
        document.getElementById(ID)?.remove();
        const colors = { h1: "#7C3AED", h2: "#2563EB", h3: "#0891B2", h4: "#16A34A", h5: "#D97706", h6: "#DC2626" };
        let css = "";
        for (const [tag, color] of Object.entries(colors)) {
          css += `${tag} { outline: 2px solid ${color} !important; position: relative !important; }
          ${tag}::before { content: "${tag.toUpperCase()}"; font-size: 10px; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; font-weight: bold; color: #fff; background: ${color}; padding: 0 4px; position: absolute; top: 0; left: 0; z-index: 9999; }\n`;
        }
        const style = document.createElement("style");
        style.id = ID;
        style.textContent = css;
        document.head.appendChild(style);
      } else {
        document.getElementById(ID)?.remove();
      }
    }, [active]);
  },

  async showLinkDetails(active) {
    return this.executeInTab((enable) => {
      const CLASS = "wdt-link-badge";
      if (enable) {
        document.querySelectorAll(`.${CLASS}`).forEach(el => el.remove());
        document.querySelectorAll("a[href]").forEach(a => {
          const badge = document.createElement("span");
          badge.className = CLASS;
          const isExternal = a.hostname !== location.hostname;
          Object.assign(badge.style, {
            fontSize: "10px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", background: isExternal ? "#7C3AED" : "#2563EB",
            color: "#fff", padding: "1px 4px", borderRadius: "2px",
            verticalAlign: "middle", marginLeft: "4px", whiteSpace: "nowrap"
          });
          badge.textContent = `[${isExternal ? "ext" : "int"}: ${a.getAttribute("href").substring(0, 40)}]`;
          a.appendChild(badge);
        });
      } else {
        document.querySelectorAll(`.${CLASS}`).forEach(el => el.remove());
      }
    }, [active]);
  },

  async highlightBrokenImages() {
    return this.executeInTab(() => {
      let count = 0;
      document.querySelectorAll("img").forEach(img => {
        if (!img.complete || img.naturalWidth === 0) {
          img.style.outline = "3px solid #DC2626";
          img.style.background = "rgba(220,38,38,0.1)";
          img.title = "BROKEN IMAGE: " + (img.src || "no src");
          count++;
        }
      });
      return count;
    });
  },

  async inspectMetadata() {
    return this.executeInTab(() => {
      const metas = {};
      document.querySelectorAll("meta").forEach(m => {
        const key = m.getAttribute("name") || m.getAttribute("property") || m.getAttribute("http-equiv") || "unknown";
        metas[key] = m.getAttribute("content") || "";
      });
      return {
        title: document.title,
        canonical: document.querySelector('link[rel="canonical"]')?.href || null,
        metas
      };
    });
  },

  // ── SEO Tools ──────────────────────────────────────────────────────────────

  async metaTagChecker() {
    return this.executeInTab(() => {
      const get = (sel) => document.querySelector(sel)?.getAttribute("content") || null;
      return {
        title: { value: document.title, length: document.title.length, ok: document.title.length >= 30 && document.title.length <= 60 },
        description: { value: get('meta[name="description"]'), ok: !!get('meta[name="description"]') },
        ogTitle: { value: get('meta[property="og:title"]'), ok: !!get('meta[property="og:title"]') },
        ogDescription: { value: get('meta[property="og:description"]'), ok: !!get('meta[property="og:description"]') },
        ogImage: { value: get('meta[property="og:image"]'), ok: !!get('meta[property="og:image"]') },
        twitterCard: { value: get('meta[name="twitter:card"]'), ok: !!get('meta[name="twitter:card"]') },
        viewport: { value: get('meta[name="viewport"]'), ok: !!get('meta[name="viewport"]') },
        robots: { value: get('meta[name="robots"]'), ok: true }
      };
    });
  },

  async headingStructure() {
    return this.executeInTab(() => {
      const headings = [];
      document.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach(el => {
        headings.push({ tag: el.tagName, text: el.textContent.trim().substring(0, 80) });
      });
      return headings;
    });
  },

  async imageAltAudit() {
    return this.executeInTab(() => {
      const results = { total: 0, missing: [], empty: [], ok: 0 };
      document.querySelectorAll("img").forEach(img => {
        results.total++;
        if (!img.hasAttribute("alt")) {
          results.missing.push(img.src.substring(0, 60));
        } else if (img.alt.trim() === "") {
          results.empty.push(img.src.substring(0, 60));
        } else {
          results.ok++;
        }
      });
      return results;
    });
  },

  // ── Accessibility Tools ──────────────────────────────────────────────────────

  async missingAriaLabels() {
    return this.executeInTab(() => {
      const issues = [];
      const interactives = "button, a, input, select, textarea, [role='button'], [role='link'], [tabindex]";
      document.querySelectorAll(interactives).forEach(el => {
        const hasLabel = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.textContent.trim();
        if (!hasLabel) {
          el.style.outline = "2px solid #DC2626";
          issues.push({ tag: el.tagName, id: el.id, type: el.type || "" });
        }
      });
      return issues;
    });
  },

  async focusOrderVisualize(active) {
    return this.executeInTab((enable) => {
      const CLASS = "wdt-focus-badge";
      if (enable) {
        document.querySelectorAll(`.${CLASS}`).forEach(el => el.remove());
        const focusable = document.querySelectorAll("a,button,input,select,textarea,[tabindex]");
        [...focusable].sort((a, b) => (parseInt(a.tabIndex) || 0) - (parseInt(b.tabIndex) || 0))
          .forEach((el, i) => {
            const badge = document.createElement("span");
            badge.className = CLASS;
            Object.assign(badge.style, {
              position: "absolute", background: "#7C3AED", color: "#fff",
              fontSize: "10px", fontWeight: "bold", width: "16px", height: "16px",
              borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", zIndex: "9999", pointerEvents: "none"
            });
            badge.textContent = String(i + 1);
            el.style.position = el.style.position || "relative";
            el.appendChild(badge);
          });
      } else {
        document.querySelectorAll(`.${CLASS}`).forEach(el => el.remove());
      }
    }, [active]);
  },

  // ── Storage Tools ──────────────────────────────────────────────────────────

  async getCookies() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "GET_COOKIES" }, (res) => {
        resolve(res?.cookies || []);
      });
    });
  },

  async deleteCookie(url, name) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "DELETE_COOKIE", url, name }, resolve);
    });
  },

  async getLocalStorage() {
    return this.executeInTab(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      return data;
    });
  },

  async getSessionStorage() {
    return this.executeInTab(() => {
      const data = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        data[key] = sessionStorage.getItem(key);
      }
      return data;
    });
  },

  async clearSiteStorage() {
    return this.executeInTab(() => {
      localStorage.clear();
      sessionStorage.clear();
      return true;
    });
  },

  // ── Responsive Tools ──────────────────────────────────────────────────────

  async resizeViewport(width, height) {
    const tab = await this.getActiveTab();
    if (!tab || !tab.windowId) return;
    chrome.windows.update(tab.windowId, { width: width + 16, height: (height || 900) + 88 });
  },

  // ── Debugging Tools ──────────────────────────────────────────────────────

  async getResourceCount() {
    return this.executeInTab(() => {
      return {
        scripts: document.querySelectorAll("script[src]").length,
        inlineScripts: document.querySelectorAll("script:not([src])").length,
        stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
        inlineStyles: document.querySelectorAll("style").length,
        images: document.querySelectorAll("img").length,
        iframes: document.querySelectorAll("iframe").length,
        links: document.querySelectorAll("a[href]").length,
        totalElements: document.querySelectorAll("*").length
      };
    });
  },

  async getScriptList() {
    return this.executeInTab(() => {
      return [...document.querySelectorAll("script[src]")].map(s => s.src);
    });
  },

  async getStylesheetList() {
    return this.executeInTab(() => {
      return [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href);
    });
  },

  async pageSnapshot() {
    return this.executeInTab(() => {
      function buildTree(el, depth = 0) {
        if (depth > 4) return null;
        const children = [...el.children].slice(0, 10).map(c => buildTree(c, depth + 1)).filter(Boolean);
        return {
          tag: el.tagName,
          id: el.id || undefined,
          classes: el.className ? [...el.classList].join(" ") : undefined,
          children: children.length ? children : undefined
        };
      }
      return {
        url: location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
        tree: buildTree(document.documentElement)
      };
    });
  }
};
