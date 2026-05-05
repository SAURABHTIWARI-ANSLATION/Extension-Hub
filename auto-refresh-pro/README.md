# Auto Refresh Pro — Chrome Extension

A premium, production-ready Chrome extension for auto refresh, countdown timers, and page monitoring.

## Features

- **Auto Refresh** — set interval (seconds/minutes/hours) with quick-select chips
- **Random Interval** — refresh at a random time between min/max seconds
- **Hard Refresh** — bypass cache on every reload
- **Stop on Interaction** — pause when user interacts with the page
- **Refresh Limit** — stop after N refreshes
- **Countdown Timer** — refresh after a duration OR at a specific date & time
- **Page Monitor** — detect when a keyword appears, disappears, or any change occurs
- **Active Tabs Panel** — see all refreshing tabs with live countdown timers
- **Hotkeys** — Alt+R to toggle, Alt+S to stop all
- **Notifications** — browser alert when keyword is detected

## Project Structure

```
auto-refresh-pro/
├── manifest.json          # Manifest V3 config
├── background.js          # Service worker (alarms, refresh, monitor)
├── content.js             # Injected script (interaction detection, overlay)
├── popup.html             # Extension popup
├── popup.css              # Full design system (blue theme, Manrope font)
├── popup.js               # Popup logic (CSP-compliant)
├── fonts/
│   ├── Manrope-Regular.ttf
│   ├── Manrope-Medium.ttf
│   ├── Manrope-SemiBold.ttf
│   └── Manrope-Bold.ttf
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Setup Instructions

### 1. Download Manrope Font

Download from https://fonts.google.com/specimen/Manrope
Extract and place these files in the `fonts/` folder:
- `Manrope-Regular.ttf`
- `Manrope-Medium.ttf`
- `Manrope-SemiBold.ttf`
- `Manrope-Bold.ttf`

### 2. Create Icons

Create PNG icons in these sizes and place in `icons/`:
- 16×16px → `icon16.png`
- 32×32px → `icon32.png`
- 48×48px → `icon48.png`
- 128×128px → `icon128.png`

Use your logo or a simple refresh icon in blue (#2563EB) on white/transparent background.

### 3. Load in Chrome

1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load Unpacked**
4. Select the `auto-refresh-pro/` folder

### 4. Pin the Extension

Click the puzzle icon in Chrome toolbar → pin Auto Refresh Pro

## Design System

| Token | Value |
|---|---|
| Primary | `#2563EB` |
| Background | `#FFFFFF` |
| Heading | `#111111` |
| Subtext | `#6B7280` |
| Border | `#E5E7EB` |
| Font | Manrope (400/500/600/700) |
| Shadow | `0 2px 8px rgba(0,0,0,0.06)` |

## Hotkeys

| Shortcut | Action |
|---|---|
| `Alt+R` | Toggle refresh on/off for active tab |
| `Alt+S` | Stop all active refreshes |

## CSP Compliance

- No `innerHTML` anywhere — uses `createElement` + `textContent`
- No inline JS
- No `eval`
- No external CDN fonts (local Manrope only)
- Manifest V3 service worker

## Chrome Web Store Checklist

- [x] Manifest V3
- [x] No remote code execution
- [x] No inline scripts
- [x] CSP defined in manifest
- [x] Permissions minimized to what's needed
- [x] Icons at all required sizes
- [x] Single purpose (auto refresh)