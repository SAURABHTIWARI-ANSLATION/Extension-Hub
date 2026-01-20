# Auto Text Case Converter Extension

An intelligent browser extension that automatically scans and converts text case in real-time across web pages, Google Docs, Sheets, and editable fields.

## Features
- **Auto-scan** - Detects text on active page automatically
- **Smart detection** - Works with selections, inputs, Google Docs/Sheets
- **One-click conversion** - 8 different case formats
- **Direct apply** - Apply changes back to original document
- **Clipboard support** - Copy converted text instantly
- **Real-time updates** - See changes immediately

## Supported Platforms
- Google Docs
- Google Sheets
- Web pages with text
- Text areas & input fields
- ContentEditable elements
- Text selections

## Installation
1. Download or clone this folder
2. Open Chrome/Edge → `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** and select this folder

## Usage
1. Open any webpage with text
2. Click extension icon
3. Click "Scan Current Page"
4. Select conversion type (UPPERCASE, lowercase, etc.)
5. Click "Apply to Original" to update the page
6. Or "Copy to Clipboard" for manual use

## Theme
Uses **Theme 4: Sky Gradient** for a friendly, approachable interface.

## Icons
Place icon files (`icon16.png`, `icon48.png`, `icon128.png`) in root folder.

## Permissions
- `activeTab` - To access current page content
- `scripting` - To modify page text
- `clipboardWrite` - To copy results

## License
MIT