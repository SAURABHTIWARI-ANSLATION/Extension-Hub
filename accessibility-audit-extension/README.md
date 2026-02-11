# 🚀 Accessibility Score Calculator - Browser Extension

<div align="center">

![Extension Icon](https://img.shields.io/badge/Extension-Accessibility%20Audit-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)
![WCAG](https://img.shields.io/badge/WCAG-2.1%20Compliant-orange)

**Automated Accessibility Audit Tool for Web Developers & Designers**

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-4285F4?logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox-Add--ons-FF7139?logo=firefox&logoColor=white)](https://addons.mozilla.org)

</div>

## 📖 Table of Contents
- [✨ Features](#-features)
- [🖼️ Screenshots](#%EF%B8%8F-screenshots)
- [🚀 Installation](#-installation)
- [🎯 Usage Guide](#-usage-guide)
- [🔧 Technical Architecture](#-technical-architecture)
- [🎨 Theme System](#-theme-system)
- [📊 Features Breakdown](#-features-breakdown)
- [🛠️ Development Setup](#%EF%B8%8F-development-setup)
- [📁 Project Structure](#-project-structure)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

## ✨ Features

### 🎯 **Core Accessibility Auditing**
- **Automatic WCAG 2.1 Compliance Checking**
- **Real-time Score Calculation** (0-100 with letter grades)
- **Comprehensive Category Analysis**:
  - ✅ **Color Contrast** - WCAG AA/AAA compliance
  - ✅ **Image Alt Text** - Missing alt attribute detection
  - ✅ **Heading Hierarchy** - Proper H1-H6 structure
  - ✅ **Form Accessibility** - Label and ARIA validation
  - ✅ **Navigation** - Skip links and accessible anchors
  - ✅ **Semantic HTML** - Proper element usage

### 📊 **Advanced Analytics Dashboard**
- **Historical Scan Tracking** - View all previous audits
- **Trend Analysis** - Score improvement over time
- **Category Breakdown** - Visual progress charts
- **Export Functionality** - JSON, CSV, and PDF reports
- **Comparative Analysis** - Track improvements across scans

### 🎨 **Professional UI Theme**
- **Indigo Night Theme** - Optimized for data-driven tools
- **High Contrast Design** - WCAG AAA compliant interface
- **Dark Mode First** - Reduces eye strain during extended use
- **Consistent Design System** - Professional enterprise appearance

### 🔧 **Developer-Friendly Tools**
- **No API Keys Required** - 100% local processing
- **Cross-browser Compatibility** - Chrome, Firefox, Edge
- **Keyboard Shortcuts** - Quick access (Ctrl+Shift+A)
- **Export Formats** - JSON, CSS Variables, Tailwind config, Figma tokens
- **Real-time Highlighting** - Visual issue indicators on page

## 🖼️ Screenshots

### Main Scanner Interface
![Popup Scanner](https://via.placeholder.com/800x450/1E1B4B/FFFFFF?text=Accessibility+Scanner+Interface)

### Dashboard Analytics
![Dashboard](https://via.placeholder.com/800x450/312E81/FFFFFF?text=Analytics+Dashboard)

### Detailed Report View
![Report](https://via.placeholder.com/800x450/020617/FFFFFF?text=Detailed+Accessibility+Report)

## 🚀 Installation

### Method 1: Browser Web Stores (Recommended)
1. **Chrome**: Visit [Chrome Web Store](#) (Coming Soon)
2. **Firefox**: Visit [Firefox Add-ons](#) (Coming Soon)
3. **Edge**: Visit [Microsoft Edge Add-ons](#) (Coming Soon)

### Method 2: Manual Installation (Developer)
```bash
# 1. Clone or download the repository
git clone https://github.com/yourusername/accessibility-audit-extension.git
cd accessibility-audit-extension

# 2. Load unpacked extension
```

#### **For Chrome/Edge:**
1. Navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the extension folder

#### **For Firefox:**
1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on"**
3. Select the `manifest.json` file

#### **For Brave/Opera:**
Same as Chrome instructions

## 🎯 Usage Guide

### Quick Start
1. **Click the extension icon** in your browser toolbar
2. **Press "Scan Current Page"** to start the audit
3. **Review your accessibility score** (0-100 with grade)
4. **Check improvement suggestions** with priority levels
5. **Export the report** for documentation

### Detailed Workflow

#### **Step 1: Single Page Audit**
```javascript
// Example: Scan a webpage
1. Navigate to any website
2. Click extension icon
3. Click "🔍 Scan Current Page"
4. Wait for analysis (typically 2-5 seconds)
5. Review score and suggestions
```

#### **Step 2: Analyze Results**
- **Score 90-100 (A)**: Excellent - WCAG AAA compliant
- **Score 80-89 (B)**: Good - WCAG AA compliant  
- **Score 70-79 (C)**: Fair - Needs minor improvements
- **Score 60-69 (D)**: Poor - Significant issues
- **Score 0-59 (F)**: Critical - Major accessibility barriers

#### **Step 3: Implement Fixes**
```html
<!-- Example: Fixing common issues -->

<!-- BAD: Missing alt text -->
<img src="logo.png">

<!-- GOOD: Proper alt text -->
<img src="logo.png" alt="Company Logo">

<!-- BAD: Poor contrast -->
<div style="color: #888; background: #eee;">Text</div>

<!-- GOOD: WCAG compliant -->
<div style="color: #000; background: #fff;">Text</div>

<!-- BAD: Missing heading hierarchy -->
<h3>Main Title</h3>
<h5>Subtitle</h5>

<!-- GOOD: Proper hierarchy -->
<h1>Main Title</h1>
<h2>Subtitle</h2>
```

#### **Step 4: Track Progress**
1. Open **Dashboard** (from extension popup)
2. View **score history chart**
3. Compare **category improvements**
4. Export **progress reports**

### Keyboard Shortcuts
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+A` | Open Scanner | Quick access to main tool |
| `Esc` | Close Modal | Close any open dialog |
| `Ctrl+E` | Export Report | Quick export of current scan |
| `Ctrl+H` | Open History | Jump to dashboard |

## 🔧 Technical Architecture

### System Overview
```
┌─────────────────────────────────────────────┐
│               Browser Extension             │
├─────────────────────────────────────────────┤
│  Content Script    │  Popup UI     │  Bg   │
│  (DOM Analysis)    │  (Interface)  │  (SW) │
└─────────────────────────────────────────────┘
         │                    │            │
         ▼                    ▼            ▼
┌─────────────────────────────────────────────┐
│     WCAG Checks    │  Analytics   │ Storage │
│  • Contrast        │  • Scoring   │ • Local │
│  • Semantics       │  • Trends    │ • Sync  │
│  • Navigation      │  • Charts    │         │
└─────────────────────────────────────────────┘
```

### Core Components

#### **1. Content Script (`content.js`)**
- **DOM Traversal**: Analyzes page structure
- **Color Contrast**: WCAG contrast ratio calculations
- **Element Validation**: Checks HTML semantics
- **Real-time Highlighting**: Visual issue indicators

#### **2. Popup Interface (`popup/`)**
- **Score Display**: Visual progress circle
- **Category Breakdown**: Detailed pass/fail stats
- **Suggestions Panel**: Priority-based recommendations
- **Export Controls**: Multiple format options

#### **3. Background Service Worker (`background.js`)**
- **Data Management**: Local storage handling
- **Cross-tab Communication**: Message passing
- **State Persistence**: Session management
- **Update Handling**: Version control

#### **4. Dashboard (`dashboard.html/js`)**
- **Historical Analysis**: Trend visualization
- **Comparative Reports**: Multi-scan comparison
- **Data Export**: JSON/CSV generation
- **Category Analytics**: Detailed breakdowns

### Algorithms & Calculations

#### **WCAG Contrast Ratio**
```javascript
// Formula: (L1 + 0.05) / (L2 + 0.05)
// Where L1 and L2 are relative luminance values

function calculateContrastRatio(color1, color2) {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG Standards:
// - AA: 4.5:1 for normal text
// - AAA: 7:1 for normal text
// - Large Text: 3:1 for AA, 4.5:1 for AAA
```

#### **Accessibility Score Calculation**
```javascript
// Weighted scoring algorithm
const weights = {
  contrast: 0.25,    // 25% of total score
  images: 0.15,      // 15% of total score
  headings: 0.20,    // 20% of total score
  forms: 0.20,       // 20% of total score
  navigation: 0.10,  // 10% of total score
  semantics: 0.10    // 10% of total score
};

function calculateTotalScore(categoryScores) {
  let total = 0;
  Object.keys(weights).forEach(category => {
    total += categoryScores[category] * weights[category];
  });
  return Math.round(total);
}
```

## 🎨 Theme System

### Applied Theme: **Indigo Night**
```css
/* Theme Configuration */
:root {
  --bg-gradient-start: #1E1B4B;      /* Deep Indigo */
  --bg-gradient-end: #312E81;        /* Royal Purple */
  --header-bg: #020617;              /* Near Black */
  --primary-btn-start: #6366F1;      /* Electric Indigo */
  --primary-btn-end: #4F46E5;        /* Deep Indigo */
  --accent-color: #818CF8;           /* Light Purple */
  --text-primary: #FFFFFF;           /* Pure White */
  --text-secondary: #E0E7FF;         /* Light Lavender */
}
```

### Why Indigo Night?
| Aspect | Rationale | Benefit |
|--------|-----------|---------|
| **Professional Tone** | Dark theme conveys seriousness | Builds trust for compliance tool |
| **High Contrast** | White text on dark background | WCAG AAA compliant by design |
| **Eye Strain Reduction** | Dark mode for extended use | Better for developers/designers |
| **Data Visualization** | Purple spectrum for charts | Clear distinction in analytics |
| **Brand Alignment** | Matches developer tools | Consistent with tech ecosystem |

### Theme Components
1. **Gradient Backgrounds**: Smooth transitions between colors
2. **Card-based Layout**: Clear information hierarchy
3. **Consistent Spacing**: 8px grid system
4. **Accessible Typography**: Minimum 16px for body text
5. **Interactive States**: Clear hover/focus indicators

## 📊 Features Breakdown

### 1. **Color Contrast Analysis**
- **Algorithm**: WCAG 2.1 contrast ratio calculation
- **Sampling**: 50+ text elements per page
- **Validation**: AA (4.5:1) and AAA (7:1) standards
- **Suggestions**: Specific color improvement recommendations

### 2. **Image Accessibility**
- **Alt Text Detection**: Missing or generic alt attributes
- **Decorative Images**: Identifies empty alt attributes
- **SVG Accessibility**: Checks for title/desc elements
- **Background Images**: Warns about text-over-image issues

### 3. **Heading Structure**
- **Hierarchy Validation**: Proper H1-H6 sequence
- **Missing Headings**: Identifies skipped levels
- **Multiple H1 Check**: Flags SEO/accessibility issues
- **Semantic Flow**: Ensures logical document outline

### 4. **Form Accessibility**
- **Label Association**: `for` attribute validation
- **ARIA Attributes**: Required states and properties
- **Keyboard Navigation**: Tab order and focus management
- **Error Identification**: ARIA error message patterns

### 5. **Navigation Analysis**
- **Skip Links**: Presence of "Skip to content" links
- **Link Text Quality**: Generic link detection
- **Focus Indicators**: Visible focus styles
- **Landmark Roles**: ARIA landmark validation

### 6. **Semantic HTML Audit**
- **Div/Span Overuse**: Identifies semantic misuse
- **Proper Elements**: Button vs div, nav vs div, etc.
- **ARIA Overuse**: Warns about unnecessary ARIA
- **HTML5 Elements**: Usage of modern semantic tags

## 🛠️ Development Setup

### Prerequisites
```bash
# Required Tools
- Node.js (v16 or higher)
- npm or yarn
- Git
- Modern browser (Chrome 88+, Firefox 85+, Edge 88+)
```

### Installation & Build
```bash
# Clone repository
git clone https://github.com/yourusername/accessibility-audit-extension.git
cd accessibility-audit-extension

# Install dependencies (if any)
npm install

# Development mode with hot reload (optional)
npm run dev

# Build for production
npm run build

# Create distribution package
npm run package
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "webpack --mode development --watch",
    "build": "webpack --mode production",
    "package": "zip -r extension.zip dist/",
    "lint": "eslint src/",
    "test": "jest",
    "format": "prettier --write 'src/**/*.{js,css,html}'"
  }
}
```

### Environment Setup
```bash
# Project Structure
accessibility-audit-extension/
├── src/                    # Source files
│   ├── content/           # Content scripts
│   ├── popup/             # Popup UI
│   ├── background/        # Service worker
│   └── utils/             # Utilities
├── dist/                  # Built files
├── tests/                 # Test files
├── docs/                  # Documentation
└── scripts/               # Build scripts
```

## 📁 Project Structure

```
accessibility-audit-extension/
├── manifest.json                    # Extension configuration
├── background.js                    # Service worker
├── content.js                       # Main content script
├── dashboard.html                   # Analytics dashboard
├── dashboard.js                     # Dashboard logic
├── popup/                           # Popup interface
│   ├── popup.html                   # Main popup
│   ├── popup.css                    # Popup styles (Indigo Night)
│   └── popup.js                     # Popup logic
├── styles/                          # CSS stylesheets
│   ├── content.css                  # Content script styles
│   └── theme.css                    # Theme configuration
├── utils/                           # Utility modules
│   ├── contrast-calculator.js       # WCAG contrast calculations
│   └── theme-manager.js             # Theme management
├── icons/                           # Extension icons
│   ├── icon16.png                   # 16x16 toolbar icon
│   ├── icon48.png                   # 48x48 extension page
│   └── icon128.png                  # 128x128 web store
├── locales/                         # Internationalization
│   ├── en/                          # English translations
│   ├── es/                          # Spanish translations
│   └── ...                          # Other languages
├── tests/                           # Test files
│   ├── unit/                        # Unit tests
│   ├── integration/                  # Integration tests
└── docs/                            # Documentation
    ├── api.md                       # API documentation
    ├── contributing.md              # Contribution guide
    └── examples/                    # Usage examples
```

## 🧪 Testing

### Test Coverage
```bash
# Run test suite
npm test

# Test coverage report
npm run test:coverage

# End-to-end testing
npm run test:e2e
```

### Test Categories
1. **Unit Tests**: Individual function testing
2. **Integration Tests**: Component interaction
3. **E2E Tests**: Full user workflows
4. **Accessibility Tests**: Tool self-auditing
5. **Cross-browser Tests**: Compatibility verification

### Testing Tools
- **Jest**: Unit and integration testing
- **Puppeteer**: E2E browser testing
- **Axe-core**: Accessibility testing
- **ESLint**: Code quality
- **Prettier**: Code formatting

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors
```bash
# 1. Fork the repository
# 2. Clone your fork
git clone https://github.com/yourusername/accessibility-audit-extension.git

# 3. Create a feature branch
git checkout -b feature/amazing-feature

# 4. Make your changes
# 5. Run tests
npm test

# 6. Commit changes
git commit -m "Add amazing feature"

# 7. Push to branch
git push origin feature/amazing-feature

# 8. Open a Pull Request
```

### Development Guidelines
1. **Follow WCAG 2.1** in all code changes
2. **Write tests** for new functionality
3. **Update documentation** for API changes
4. **Use semantic commit messages**
5. **Keep the codebase accessible**

### Areas Needing Contribution
- [ ] Additional language translations
- [ ] More WCAG guideline checks
- [ ] Performance optimizations
- [ ] Browser compatibility fixes
- [ ] Documentation improvements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

<<<<<<< HEAD
Copyright (c) 2026 Accessibility Score Calculator
=======
Copyright (c) 2026 Saurabh Tiwari and ANSLATION COMPANY
>>>>>>> 97b4785 (Update Accessibility Audit README copyright)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

### Built With
- **WCAG 2.1 Guidelines** - Web Content Accessibility Guidelines
- **Chrome Extension APIs** - Google Chrome Extensions
- **WebExtensions API** - Cross-browser extension standard
- **Axe-core Inspiration** - Accessibility testing patterns

### Special Thanks
- **W3C WAI** - For WCAG standards
- **Open Source Community** - For invaluable tools and libraries
- **Beta Testers** - For feedback and bug reports
- **Accessibility Advocates** - For championing inclusive design

### Resources
- [WCAG 2.1 Specification](https://www.w3.org/TR/WCAG21/)
- [WebExtensions Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions/)
- [A11Y Project](https://www.a11yproject.com/)

---

<div align="center">

### 🌟 **Star this repo if you found it useful!**

**Made with ❤️ for the web accessibility community**

[Report Bug](https://github.com/yourusername/accessibility-audit-extension/issues) · 
[Request Feature](https://github.com/yourusername/accessibility-audit-extension/issues) · 
[Documentation](https://github.com/yourusername/accessibility-audit-extension/wiki)

</div>

## 📞 Support

### Getting Help
- **Documentation**: Check the [Wiki](https://github.com/yourusername/accessibility-audit-extension/wiki)
- **Issues**: Use [GitHub Issues](https://github.com/yourusername/accessibility-audit-extension/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/yourusername/accessibility-audit-extension/discussions)

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Scan not working | Refresh page and try again |
| Low score on valid site | Check for dynamic content loading |
| Extension icon missing | Reinstall or restart browser |
| Export failing | Check browser permissions |
| Dashboard not loading | Clear extension storage |

### Browser Compatibility
| Browser | Version | Status |
|---------|---------|--------|
| Google Chrome | 88+ | ✅ Fully Supported |
| Mozilla Firefox | 85+ | ✅ Fully Supported |
| Microsoft Edge | 88+ | ✅ Fully Supported |
| Brave Browser | 1.20+ | ✅ Fully Supported |
| Opera | 74+ | ✅ Fully Supported |
| Safari | 14+ | ⚠️ Partial Support |

---

**Happy Accessibility Auditing! 🚀**

*Empowering developers to build a more accessible web, one scan at a time.*
