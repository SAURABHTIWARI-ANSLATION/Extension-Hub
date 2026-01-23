# OTP Chrome Extension

A Chrome extension for generating Time-based One-Time Password (TOTP) codes for 2-factor authentication.

## Features

- Generate TOTP codes for multiple accounts
- Copy codes to clipboard with one click
- Search through your accounts
- Add/remove accounts easily
- Secure storage in Chrome sync
- Visual timer showing code validity

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `otp-extension` folder

## How to Use

1. Click the extension icon in Chrome toolbar
2. Click "+ Add Account"
3. Enter:
   - Account name (e.g., "GitHub")
   - Secret key (base32 format from your 2FA setup)
   - Optional issuer name
4. Click "Add Account"
5. Your TOTP code will appear and automatically refresh every 30 seconds

## Security Notes

- All secrets are stored encrypted in Chrome sync
- No data is sent to external servers
- Codes are generated locally in your browser
- Consider this for low-risk accounts only

## Development

Files:
- `manifest.json` - Extension configuration
- `popup.html` - Main interface
- `popup.js` - Popup logic and UI handling
- `totp.js` - TOTP generation algorithm
- `style.css` - Styling
- `assets/icon.png` - Extension icon

## License

MIT