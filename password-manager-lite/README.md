# 🔐 Password Manager Lite

A secure, local password manager browser extension that stores your passwords encrypted on your device. No cloud storage, no subscriptions - just simple, secure password management.

![Password Manager Preview](https://via.placeholder.com/400x650/0f172a/ffffff?text=Password+Manager)

## ✨ Features

### 🔒 **Security First**
- **AES-256 Encryption** - Military-grade encryption for all passwords
- **Master Password Protection** - Single password to unlock everything
- **Local Storage Only** - Your data never leaves your computer
- **Auto-lock Feature** - Automatically locks when closed

### 💾 **Password Management**
- **Save Passwords** - Store website, username, password, and notes
- **One-Click Copy** - Copy username or password to clipboard
- **Search & Filter** - Instantly find any password
- **Edit & Delete** - Full control over your passwords
- **Import/Export** - Backup and restore your passwords

### 🎨 **User Experience**
- **Dark Theme** - Easy on the eyes
- **Password Strength Indicator** - Visual feedback on password strength
- **Website Favicons** - Visual identification
- **Toast Notifications** - Confirmation when copying
- **Auto-detect Website** - Automatically fills website from current tab

## 🚀 Installation

### Method 1: Load Unpacked (Development)
1. Download or clone this repository
2. Open Chrome/Edge and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **"Load unpacked"**
5. Select the `password-manager` folder
6. Pin the extension to your toolbar

### Method 2: From Chrome Web Store
*(Coming soon)*

## 📖 How to Use

### First Time Setup
1. **Click** the Password Manager icon in your toolbar
2. **Set Master Password** - Enter a strong password (min 8 characters)
3. **Remember this password** - You'll need it every time to unlock

### Adding Passwords
1. **Click** the "+" button or "Add Password"
2. **Website** - Automatically detected from current tab (or enter manually)
3. **Username/Email** - Enter your login username
4. **Password** - Enter your password (type or paste)
5. **Notes** - Optional additional information
6. **Save** - Securely stores the password

### Using Saved Passwords
1. **Search** for a website or username
2. **Click** 🔑 to copy password to clipboard
3. **Click** 👤 to copy username to clipboard
4. **Paste** where needed
5. **Click** ✏️ to edit or 🗑️ to delete

### Backup & Restore
- **Export**: Click "Export" to download all passwords as JSON
- **Import**: Click "Import" to restore from JSON backup file

## 🔧 Technical Details

### Browser Compatibility
- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave 1.20+
- ✅ Opera 74+

### File Structure
```
password-manager/
├── manifest.json          # Extension configuration
├── popup.html            # Main interface
├── popup.css             # Styles
├── popup.js              # Core logic (encryption, storage)
├── background.js         # Background service worker
└── icons/
    ├── icon16.png        # Toolbar icon (small)
    ├── icon48.png        # Extension icon (medium)
    └── icon128.png       # Store icon (large)
```

### Security Implementation
- **PBKDF2** - Password-based key derivation (100,000 iterations)
- **AES-GCM** - Authenticated encryption algorithm
- **SHA-256** - Master password hashing
- **Secure Key Storage** - Keys derived on-the-fly, never stored

## 🛡️ Privacy & Security

### What We Do NOT Collect:
- ❌ No personal information
- ❌ No browsing history
- ❌ No usage analytics
- ❌ No cloud synchronization
- ❌ No third-party tracking

### What We Do:
- ✅ All encryption happens locally
- ✅ Master password never leaves your device
- ✅ Passwords encrypted before storage
- ✅ No internet connection required

### Security Best Practices:
1. Use a **strong master password** (12+ characters, mix of types)
2. **Export backups** regularly
3. **Lock** when not in use
4. Keep your browser updated
5. Use on trusted devices only

## 🔄 Import/Export Format

### Export File (JSON):
```json
[
  {
    "id": "unique-id",
    "website": "example.com",
    "username": "user@example.com",
    "password": "encrypted-password",
    "notes": "Optional notes",
    "createdAt": "2024-01-29T10:30:00.000Z",
    "updatedAt": "2024-01-29T10:30:00.000Z"
  }
]
```

## 🚨 Known Limitations

### Current Limitations:
- No automatic form filling
- No password generator (intentional - use existing passwords)
- No mobile app (browser extension only)
- No cross-device sync (local storage only)

### Planned Features:
- [ ] Password audit (weak/duplicate detection)
- [ ] Categories/tags for organization
- [ ] Two-factor authentication codes
- [ ] Emergency access for trusted contacts
- [ ] Browser autofill integration

## 🛠️ Development

### Prerequisites
- Basic knowledge of HTML, CSS, JavaScript
- Chrome/Edge browser
- Text editor (VS Code recommended)

### Building from Source
1. Clone repository:
   ```bash
   git clone https://github.com/yourusername/password-manager-lite.git
   cd password-manager-lite
   ```

2. Install dependencies (if any):
   ```bash
   npm install
   ```

3. Load extension in browser as described above

### Customizing
- **Change Theme**: Modify CSS variables in `popup.css`
- **Add Features**: Extend `popup.js` functionality
- **Update Icons**: Replace files in `icons/` folder

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add some feature'`
6. Push: `git push origin feature-name`
7. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Test on multiple browsers
- Ensure no security vulnerabilities
- Update documentation if needed

## 📝 Changelog

### v1.0.0 (Current)
- Initial release
- AES-256 encryption
- Master password protection
- Password storage and management
- Import/export functionality
- Search and filtering
- Dark theme interface

## ⚠️ Important Notes

### Before Using:
1. **Backup your passwords** - Export immediately after setup
2. **Remember master password** - Cannot be recovered if forgotten
3. **Test with dummy data** first
4. **Export regularly** for backup

### If You Forget Master Password:
1. You cannot recover your passwords
2. You must reset the extension
3. Import from your backup file
4. Set a new master password

## 📧 Support

### Getting Help:
1. **Check FAQ** below
2. **Create GitHub Issue** with:
   - Browser version
   - Steps to reproduce
   - Screenshots if applicable
   - Console errors (F12 → Console)

### Quick Troubleshooting:
- **Extension not loading?** Check browser compatibility
- **Passwords not saving?** Check storage permissions
- **Import not working?** Verify JSON format
- **Copy not working?** Check clipboard permissions

## ❓ FAQ

### Q: Is my data safe?
**A:** Yes! All encryption happens locally on your device. We never send your data anywhere.

### Q: What if I forget my master password?
**A:** You cannot recover it. You'll need to reset the extension and import from backup.

### Q: Can I use this on multiple computers?
**A:** Yes, but you need to export/import manually as there's no cloud sync.

### Q: Is this better than LastPass/1Password?
**A:** For basic needs - yes! It's free, open-source, and completely private.

### Q: Can I contribute to development?
**A:** Absolutely! See the Contributing section above.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Web Crypto API documentation
- Chrome Extensions API
- Security researchers and contributors
- Open source community
- Early testers and feedback providers

## 🌟 Why Choose Password Manager Lite?

### 🏆 **For Security-Conscious Users**
- **Complete Privacy** - No data leaves your device
- **Open Source** - Code can be audited by anyone
- **No Subscriptions** - Free forever
- **Simple & Effective** - Does one thing well

### 🛠️ **For Developers**
- **Clean Codebase** - Well-structured and documented
- **Modern Web APIs** - Uses Web Crypto API
- **Easy to Extend** - Modular architecture
- **Educational** - Learn about encryption and browser extensions

---

## 🚀 Quick Start Summary

1. **Install** extension
2. **Set** master password
3. **Add** your passwords
4. **Export** backup
5. **Use** daily with copy-paste

**That's it!** You now have a secure password manager that works entirely on your device. 🎉

---

*Made with ❤️ for the privacy-conscious internet user*

*Last Updated: January 2024*