// toolRegistry.js — Central source of truth for all tools

export const TOOL_GROUPS = [
  {
    id: "page",
    label: "Page",
    icon: {
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      children: [
        { tag: "rect", attrs: { x: "3", y: "3", width: "18", height: "18", rx: "2" } },
        { tag: "path", attrs: { d: "M3 9h18M9 21V9" } }
      ]
    },
    tools: [
      { id: "disableCSS", label: "Disable CSS", description: "Remove all stylesheets", toggle: true },
      { id: "disableJS", label: "Disable JS", description: "Freeze page interactions & timers", toggle: true },
      { id: "disableImages", label: "Disable Images", description: "Hide all page images", toggle: true },
      { id: "editPageMode", label: "Edit Page Mode", description: "Make page directly editable", toggle: true },
      { id: "outlineElements", label: "Outline Elements", description: "Draw borders around all elements", toggle: true },
      { id: "showBlockElements", label: "Show Block Elements", description: "Highlight block-level elements", toggle: true },
      { id: "showElementInfo", label: "Element Information", description: "Inspect any element on hover", toggle: true },
      { id: "viewSource", label: "View Source", description: "Open page source in new tab", toggle: false },
      { id: "clearCacheAndCookies", label: "Clear Cache & Cookies", description: "Wipe browsing data for this site", toggle: false }
    ]
  },
  {
    id: "forms",
    label: "Forms",
    icon: {
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      children: [
        { tag: "rect", attrs: { x: "3", y: "5", width: "18", height: "14", rx: "2" } },
        { tag: "path", attrs: { d: "M7 9h10M7 13h6" } }
      ]
    },
    tools: [
      { id: "showFormDetails", label: "Show Form Details", description: "Display form action and method", toggle: true },
      { id: "showHiddenFields", label: "Show Hidden Fields", description: "Reveal hidden input elements", toggle: true },
      { id: "autoFillForms", label: "Auto-fill Forms", description: "Populate fields with test data", toggle: false },
      { id: "enableDisabledFields", label: "Enable Disabled Fields", description: "Remove disabled attribute from inputs", toggle: true },
      { id: "removeMaxlength", label: "Remove Max Length", description: "Remove all maxlength restrictions", toggle: true }
    ]
  },
  {
    id: "inspection",
    label: "Inspection",
    icon: {
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      children: [
        { tag: "circle", attrs: { cx: "11", cy: "11", r: "8" } },
        { tag: "path", attrs: { d: "M21 21l-4.35-4.35" } }
      ]
    },
    tools: [
      { id: "showAltAttributes", label: "Show Alt Attributes", description: "Display image alt text as overlays", toggle: true },
      { id: "highlightHeadings", label: "Highlight Headings", description: "Color-code H1 through H6", toggle: true },
      { id: "showLinkDetails", label: "Show Link Details", description: "Display href and target info", toggle: true },
      { id: "highlightBrokenImages", label: "Broken Image Audit", description: "Find and flag broken images", toggle: false },
      { id: "inspectMetadata", label: "Inspect Metadata", description: "Read all page meta tags", toggle: false }
    ]
  },
  {
    id: "seo",
    label: "SEO",
    icon: {
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      children: [
        { tag: "path", attrs: { d: "M22 12h-4l-3 9L9 3l-3 9H2" } }
      ]
    },
    tools: [
      { id: "metaTagChecker", label: "Meta Tag Checker", description: "Audit title, description, OG tags", toggle: false },
      { id: "headingStructure", label: "Heading Structure", description: "Visualize H1–H6 hierarchy", toggle: false },
      { id: "imageAltAudit", label: "Image Alt Audit", description: "Find images missing alt text", toggle: false }
    ]
  },
  {
    id: "accessibility",
    label: "Accessibility",
    icon: {
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      children: [
        { tag: "circle", attrs: { cx: "12", cy: "12", r: "10" } },
        { tag: "path", attrs: { d: "M12 8v4M12 16h.01" } }
      ]
    },
    tools: [
      { id: "contrastChecker", label: "Contrast Checker", description: "Highlight low-contrast text regions", toggle: true },
      { id: "missingAriaLabels", label: "Missing ARIA Labels", description: "Find interactive elements without labels", toggle: false },
      { id: "focusOrderVisualize", label: "Focus Order", description: "Visualize keyboard tab order", toggle: true }
    ]
  },
  {
    id: "storage",
    label: "Storage",
    icon: {
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      children: [
        { tag: "ellipse", attrs: { cx: "12", cy: "5", rx: "9", ry: "3" } },
        { tag: "path", attrs: { d: "M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" } },
        { tag: "path", attrs: { d: "M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" } }
      ]
    },
    tools: [
      { id: "viewCookies", label: "View Cookies", description: "List all cookies for this domain", toggle: false },
      { id: "deleteCookies", label: "Delete All Cookies", description: "Remove all site cookies", toggle: false },
      { id: "viewLocalStorage", label: "View LocalStorage", description: "Browse localStorage key-value pairs", toggle: false },
      { id: "viewSessionStorage", label: "View SessionStorage", description: "Browse sessionStorage data", toggle: false },
      { id: "clearSiteStorage", label: "Clear Site Storage", description: "Wipe all local/session storage", toggle: false }
    ]
  },
  {
    id: "responsive",
    label: "Responsive",
    icon: {
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      children: [
        { tag: "rect", attrs: { x: "5", y: "2", width: "14", height: "20", rx: "2" } },
        { tag: "path", attrs: { d: "M12 18h.01" } }
      ]
    },
    tools: [
      { id: "viewport375", label: "Mobile (375px)", description: "iPhone SE viewport", toggle: false },
      { id: "viewport768", label: "Tablet (768px)", description: "iPad portrait viewport", toggle: false },
      { id: "viewport1024", label: "Laptop (1024px)", description: "Small laptop viewport", toggle: false },
      { id: "viewport1440", label: "Desktop (1440px)", description: "Wide desktop viewport", toggle: false },
      { id: "viewportCustom", label: "Custom Size", description: "Set a custom viewport dimension", toggle: false }
    ]
  },
  {
    id: "debugging",
    label: "Debugging",
    icon: {
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      children: [
        { tag: "path", attrs: { d: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" } },
        { tag: "path", attrs: { d: "M12 8v4M12 16h.01" } }
      ]
    },
    tools: [
      { id: "resourceCount", label: "Resource Count", description: "Count scripts, styles, images, fonts", toggle: false },
      { id: "scriptList", label: "Script List", description: "List all loaded scripts", toggle: false },
      { id: "stylesheetList", label: "Stylesheet List", description: "List all loaded stylesheets", toggle: false },
      { id: "pageSnapshot", label: "Page Snapshot", description: "Export DOM structure as JSON", toggle: false }
    ]
  }
];

export function getAllTools() {
  const all = [];
  for (const group of TOOL_GROUPS) {
    for (const tool of group.tools) {
      all.push({ ...tool, group: group.id, groupLabel: group.label });
    }
  }
  return all;
}

export function findTools(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  return getAllTools().filter(t =>
    t.label.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.groupLabel.toLowerCase().includes(q)
  );
}
