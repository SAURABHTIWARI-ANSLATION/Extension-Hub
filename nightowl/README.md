# 🦉 NightOwl – Dark Mode & Eye Protection
**Chrome Extension (Manifest V3)**

A single, unified extension that combines Universal Dark Mode and Eye Guardian into one beautiful, fully-featured tool for comfortable browsing day and night.

---

## ✨ Features

### 🌙 Dark Mode Tab
- **One-click Light/Dark toggle** — Intelligently inverts page colors using `invert()` + `hue-rotate(180deg)`
- **Smart image correction** — Images, videos, and canvas elements are re-inverted to look natural
- **Brightness control** — Slider from 20% to 100%
- **Google Workspace safe** — Docs, Sheets, and Slides are excluded from the invert filter
- **Persistent settings** — Your mode is saved across sessions via Chrome Storage

### 👁️ Eye Guard Tab
- **Warm/Cool screen tint** — A fullscreen transparent overlay blends with your screen using `mix-blend-mode: multiply`
  - Warm (orange tint) — great for night use
  - Cool (blue tint) — reduces strain in bright environments
- **Auto Night Mode** — Toggle it on and warm filter applies automatically between 6 PM and 6 AM, then resets at dawn
- **Reset button** — Instantly removes all eye filter effects

---

## 📁 File Structure

```
NightOwl/
├── manifest.json     # MV3 config, permissions, content script
├── content.js        # Applies dark mode + eye overlay in every page
├── popup.html        # UI with tabs, sliders, toggles
├── popup.js          # All interaction and Chrome API logic
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
```

---

## 🚀 Installation

1. Open `chrome://extensions`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the `NightOwl` folder

---

## 🛠 How It Works

### Content Script (`content.js`)
- Injected at `document_start` into every page
- Applies `filter: invert(1) hue-rotate(180deg) brightness(X)` to `<html>` for dark mode
- Creates a fixed overlay div for the warm/cool eye filter
- Listens for messages from the popup to update in real-time
- MutationObserver ensures fix styles persist on dynamic pages

### Popup (`popup.js`)
- Loads settings from `chrome.storage.local` on open
- Sends `applyTheme` messages to the active tab's content script
- Falls back to re-injecting `content.js` if it's not loaded (e.g., on extension install)
- Auto Night logic checks `new Date().getHours()` client-side

---

## 🔑 Permissions Used

| Permission | Why |
|-----------|-----|
| `storage` | Save user settings |
| `activeTab` | Interact with current tab |
| `scripting` | Inject/re-inject content.js |
| `tabs` | Query active tab URL and ID |

---

## 📜 License
MIT — free to use and customize.
