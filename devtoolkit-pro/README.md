# Dev Toolkit Pro

An advanced all-in-one browser toolkit for developers, testers, SEO analysts, and frontend engineers. Built as a Chrome Extension (Manifest V3).

---

## Features

### Page Tools
- Disable CSS — strip all stylesheets instantly
- Disable Images — hide all page images
- Edit Page Mode — make the page directly editable
- Outline Elements — draw borders around all DOM elements
- Show Block Elements — label and highlight block-level tags
- Show Element Information — hover inspector with dimensions, font, margin/padding
- View Source — open page source in new tab
- Clear Cache & Cookies — wipe browsing data for the current site

### Form Tools
- Show Form Details — display form action and method as badges
- Show Hidden Fields — reveal `input[type="hidden"]` fields visually
- Auto-fill Forms — populate all inputs with realistic test data
- Enable Disabled Fields — remove the `disabled` attribute from inputs
- Remove Max Length — strip `maxlength` restrictions from inputs

### Inspection Tools
- Show Alt Attributes — overlay alt text on all images
- Highlight Headings — color-code H1–H6 with visual labels
- Show Link Details — annotate links with href and internal/external status
- Broken Image Audit — highlight images with loading errors
- Inspect Metadata — read all page `<meta>` tags

### SEO Tools
- Meta Tag Checker — audit title, description, Open Graph, Twitter Card tags
- Heading Structure — visualize H1–H6 hierarchy as a tree
- Image Alt Audit — find images missing or with empty alt text

### Accessibility Tools
- Contrast Checker — highlight low-contrast text areas
- Missing ARIA Labels — find interactive elements without accessible labels
- Focus Order Visualizer — show keyboard tab order as numbered badges

### Storage Tools
- View Cookies — list and manage all cookies for the current domain
- Delete All Cookies — remove all site cookies
- View LocalStorage — browse localStorage key-value pairs
- View SessionStorage — browse sessionStorage data
- Clear Site Storage — wipe all local and session storage

### Responsive Tools
- Viewport presets: 375px (Mobile), 768px (Tablet), 1024px (Laptop), 1440px (Desktop)
- Custom viewport resizing with width × height inputs

### Debugging Tools
- Resource Count — count scripts, styles, images, iframes, links, total elements
- Script List — list all external script sources
- Stylesheet List — list all external stylesheet sources
- Page Snapshot — export the DOM tree as a structured JSON file

### Premium Features
- **Command Palette** (`Ctrl+K`) — instant fuzzy search across all tools
- **Dark Mode** — toggle and persist light/dark theme via `chrome.storage`
- **Pinned Tools** — pin any tool to a quick-access grid at the top
- **Export JSON** — export result data from any inspection tool

---

## Architecture

```
web-dev-toolkit-pro/
├── manifest.json
├── icons/
│   └── icon{16,32,48,128}.png
├── fonts/
│   ├── Manrope-Regular.ttf
│   ├── Manrope-Medium.ttf
│   ├── Manrope-SemiBold.ttf
│   └── Manrope-Bold.ttf
└── src/
    ├── background.js               — Service worker (MV3)
    ├── services/
    │   ├── toolRegistry.js         — All tool definitions (single source of truth)
    │   ├── toolService.js          — Tool execution logic (scripting API)
    │   └── storageService.js       — chrome.storage wrapper
    ├── content/
    │   └── contentBridge.js        — Lightweight content script bridge
    ├── ui/
    │   ├── popup.html              — Extension popup shell
    │   ├── popup.css               — Complete design system
    │   └── popup.js                — UI controller (ES Module)
    └── utils/
        ├── domHelpers.js           — CSP-safe DOM utilities
        └── validators.js           — Input validation
```

---

## Setup

### 1. Add Manrope fonts

Download Manrope from [Google Fonts](https://fonts.google.com/specimen/Manrope) and place the TTF files in `/fonts/`:

```
fonts/
  Manrope-Regular.ttf
  Manrope-Medium.ttf
  Manrope-SemiBold.ttf
  Manrope-Bold.ttf
```

### 2. Load the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select this folder

---

## Design System

| Token | Value |
|---|---|
| Primary | `#2563EB` |
| Background | `#FFFFFF` |
| Heading | `#111111` |
| Subtext | `#6B7280` |
| Border | `#E5E7EB` |
| Font | Manrope → system-ui → Segoe UI → Roboto |

---

## CSP Compliance

- No `eval()`, no `innerHTML`, no inline JavaScript
- All DOM manipulation uses `createElement`, `textContent`, `appendChild`, `classList`
- Manifest V3 service worker architecture
- Script injection uses `chrome.scripting.executeScript` with function references only

---

## Chrome Web Store Readiness

- Manifest V3 compliant
- All permissions justified and minimal
- No remote code loading
- CSP defined in manifest
- Icons provided in all required sizes (16, 32, 48, 128)
