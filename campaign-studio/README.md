# UTM Link Builder

`UTM Link Builder` ek compact Chrome extension hai jo marketing campaigns ke liye clean tracking URLs generate karta hai. Isme user base URL aur required UTM parameters fill karta hai, aur extension instantly ready-to-copy final link create kar deta hai.

## Overview

Manual UTM links banana repetitive aur error-prone hota hai. Ye extension isi workflow ko fast karta hai by giving a focused popup jahan marketer ya growth team bina spreadsheet ke proper campaign URL generate kar sakti hai.

## Current Features

- Base URL validation
- Required UTM field checks
- Optional `utm_term` and `utm_content`
- Instant live URL generation
- Existing query parameters ke sath safe merge
- One-click copy
- Token-free URL shortening
- Keyboard shortcuts
- Premium blue campaign-studio popup
- Chrome MV3 and CSP-safe structure

## Fields Supported

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

## How It Works

1. Base URL enter karo
2. `Source`, `Medium`, aur `Campaign` fill karo
3. Optional `Term` aur `Content` add karo
4. Extension automatically final UTM URL generate karega
5. `Copy URL` se link clipboard me copy ho jayega

## Keyboard Shortcuts

- `Ctrl + U` : focus base URL field
- `Ctrl + C` : generated URL copy
- `Esc` : clear all fields

## Project Structure

```text
UTM-Link-Builder/
├── _locales/
│   └── en/messages.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
└── README.md
```

## Permissions

### `clipboardWrite`

Generated UTM URL ko one-click copy karne ke liye.

### `storage`

Theme, history, aur presets ke liye.

## CSP Notes

Manifest V3 CSP configured:

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

Is implementation me:

- inline scripts use nahi hui
- popup events JavaScript se bind hote hain
- unsafe eval patterns nahi hain

## Installation

1. `chrome://extensions` open karo
2. `Developer mode` enable karo
3. `Load unpacked` click karo
4. `UTM-Link-Builder` folder select karo

## URL Shortener

Shortener tab `is.gd` API use karta hai. User ko sirf long URL paste karna hota hai aur extension directly short URL generate karta hai.

## Notes

- Shortener tab me user se koi API token nahi manga jata
- Extension currently focused hai clean UTM building plus quick shortening workflow par

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Chrome Extension Manifest V3
- Chrome i18n

## Summary

`UTM Link Builder` ek focused and production-safe extension hai jo unnecessary complexity ke bina fast UTM generation provide karta hai. Premium popup design, validation, and one-click copy isko daily campaign workflow ke liye practical banate hain.
