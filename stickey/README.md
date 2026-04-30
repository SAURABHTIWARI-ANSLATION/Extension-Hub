# Stickey — Unified Annotation Engine (Chrome Extension)

Stickey merges **sticky notes** + **text highlights** into one clean annotation layer with **linking**, **search**, and a **graph view**.

## Features

- **Highlights (Range-based)**: create highlights from selection; persists using serialized DOM range selectors (XPath + offsets) with text fallback restoration.
- **Notes (Position-based)**: floating notes you can drag around; stored with page coordinates.
- **Integration**
  - Selection toolbar: **Highlight / Note / Link**
  - **Attach note** to a highlight
  - **Convert highlight → note**
  - **Hover card** shows highlight comment/snippet
- **Linking system**: `linkedIds: []` supports Note↔Note, Note↔Highlight, Highlight↔Highlight.
- **Search (global)**: popup searches across all pages with filters (All / Notes / Highlights).
- **Graph view**: lightweight canvas graph of all annotations + links.
- **CSP-safe UI**: no inline scripts, no `innerHTML` for user content; DOM created via `createElement`.
- **Performance**: `MutationObserver` triggers debounced highlight restoration (avoids heavy rerender loops).

## Folder Structure

```
stickey/
  manifest.json
  background/
    service_worker.js
  shared/
    shared.js
  content/
    content.js
    content.css
  popup/
    popup.html
    popup.js
    popup.css
  graph/
    graph.html
    graph.js
    graph.css
  assets/
    icons/
    fonts/
```

## Install (Dev)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `Extension-Hub/stickey` folder

## How to Use

- **Select text** on any website → a small toolbar appears:
  - **Highlight**: creates a highlight
  - **Note**: creates highlight + note and links them
  - **Link**: creates highlight + note and keeps linking flow
- Click the **Stickey** floating button (bottom-right) to open the in-page panel.
- Use the popup (extension icon) to:
  - create a new note
  - toggle the in-page panel
  - search across all annotations
  - open graph view

### Keyboard Shortcut

- Toggle panel: **Ctrl+Shift+Y** (Windows/Linux) / **Command+Shift+Y** (macOS)

## Unified Data Model

Every saved item is an **annotation**:

```ts
type Annotation = {
  id: string;
  type: "note" | "highlight";
  pageUrl: string;
  pageTitle: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  linkedIds: string[];
  note?: {
    title: string;
    content: string;
    position: { x: number; y: number };
    size: { w: number; h: number };
    minimized: boolean;
    anchorId: string | null; // e.g. highlight id
  };
  highlight?: {
    color: string;
    exactText: string;
    comment: string;
    selectors: {
      startXPath: string | null;
      startOffset: number;
      endXPath: string | null;
      endOffset: number;
    };
  };
};
```

## Storage Model

Stored in `chrome.storage.local`:

- `stickey_allAnnotations`: `{ [id]: Annotation }`
- `stickey_pageMap`: `{ [pageKey]: string[] }` where `pageKey = origin + pathname`
- `stickey_settings`: UI/behavior settings (highlight color, toolbar, hover card)

## Dev Notes

- Content UI is mounted with a high z-index and `pointer-events` managed via a root container.
- Highlight restoration is best-effort (DOM changes can invalidate selectors); Stickey falls back to searching for `exactText` and backfills selectors when found.

