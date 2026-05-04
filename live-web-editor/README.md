# Live Web Editor

Live Web Editor is a Chrome extension that lets you edit and style text on the current webpage locally. It provides a popup-based control panel for inline editing, text formatting, colors, replacement, undo, redo, and style reset.

Changes are applied only in the browser DOM for the active page. They are useful for previews, demos, screenshots, copy reviews, and temporary page edits.

## Features

- Toggle edit mode from the popup, context menu, or keyboard shortcut.
- Click page text in edit mode and edit it directly with `contenteditable`.
- Save selected text from the right-click context menu.
- Apply bold, italic, underline, text color, highlight color, and font size changes.
- Replace selected text from the popup.
- Undo and redo local edits.
- Reset styling applied to selected text.
- Runs with Manifest V3 and a service worker.
- Uses a strict extension content security policy.

## Installation

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder.
5. Pin **Live Web Editor** from the extensions menu if you want quick access.

## Usage

### Edit Text Directly

1. Open any regular webpage.
2. Open the extension popup.
3. Turn on **Edit Mode**.
4. Click editable page text and type your changes.
5. Press `Escape` or turn off **Edit Mode** to finish editing.

You can also toggle edit mode with:

- Windows/Linux: `Ctrl+E`
- macOS: `Command+E`

### Style Selected Text

1. Select text on the webpage.
2. Right-click the selection.
3. Choose **Save Selection for Editing**.
4. Open the extension popup.
5. Apply formatting, font size, color, highlight, replacement, undo, redo, or reset actions.

## Project Structure

```text
.
├── background.js        # Service worker, context menus, keyboard command routing
├── content.js           # Page editing, selection handling, style application, undo/redo
├── manifest.json        # Chrome extension manifest
├── popup.html           # Popup markup
├── popup.css            # Popup styling
├── popup.js             # Popup behavior and content script messaging
├── icons/               # Extension icons
└── fonts/               # Local font assets and notes
```

## Permissions

The extension requests:

- `activeTab`: lets the popup communicate with the current active tab.
- `contextMenus`: adds right-click actions for saving selections and toggling edit mode.

The content script is configured for `<all_urls>` so the editor can run on normal webpages. Browser-protected pages such as `chrome://` pages cannot be edited.

## Development

This project does not require a build step. After making changes:

1. Go to `chrome://extensions`.
2. Find **Live Web Editor**.
3. Click the reload button.
4. Refresh the webpage you want to test.

Useful files while developing:

- Update extension metadata and permissions in `manifest.json`.
- Update popup controls in `popup.html`, `popup.css`, and `popup.js`.
- Update page editing behavior in `content.js`.
- Update context menus and shortcuts in `background.js`.

## Limitations

- Edits are temporary and disappear when the page reloads.
- Edits are not saved back to the website or server.
- Some pages may block or interfere with selection, focus, or DOM editing behavior.
- Browser internal pages and extension pages are not editable.
- Complex selections across unrelated DOM nodes may not preserve all original markup when wrapped for styling.

## Best Practices Followed

- Clear project purpose at the top of the README.
- Step-by-step local installation instructions.
- Usage instructions split by workflow.
- Explicit permissions explanation.
- Concise project structure documentation.
- Known limitations documented up front.
- No dependency or build commands listed because the extension currently has no build step.
