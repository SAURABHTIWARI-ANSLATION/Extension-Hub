# 🌡️ Temperature Converter Chrome Extension

## 👨‍💻 Made by Saurabh Tiwari

### 🎯 Description
A beautiful, accessible temperature converter that instantly converts between Fahrenheit and Celsius with a modern interface following the **Extension Guide** theme system.

### 🎨 **Theme Applied: Sky Gradient**
- **Category**: General Utilities & Daily-Use Tools
- **Recommended Theme**: Sky Gradient
- **Characteristics**: Soft and approachable interface, easy to understand for new users, broad mass-user appeal

### ✨ Features
- **Bidirectional Conversion**: Convert F→C or C→F with a toggle switch
- **Real-time Conversion**: See results as you type
- **Temperature Context**: Get descriptive info about the temperature range
- **Quick Reference**: One-click access to common temperatures
- **Beautiful Animations**: Smooth transitions and visual feedback
- **Accessibility First**: Keyboard navigation, screen reader support
- **Theme Compliance**: Follows the official Extension Guide design system

### 🛠️ Tech Stack
- **HTML5**: Semantic markup with ARIA labels
- **CSS3**: Sky Gradient theme with CSS variables
- **JavaScript (Vanilla)**: No dependencies, pure logic
- **Chrome Extension (Manifest V3)**: Modern extension architecture

### 🏗️ Architecture
Temperature_Converter/
├── manifest.json # Extension configuration (Manifest V3)
├── popup.html # Semantic HTML with theme attribute
├── script.js # Conversion logic with animations
├── style.css # Sky Gradient theme implementation
└── README.md # Documentation

text

### ⚙️ Installation

#### Chrome Web Store (Recommended)
1. Visit Chrome Web Store
2. Search for "Temperature Converter"
3. Click "Add to Chrome"

#### Manual Installation (Developer)
1. Download or clone this repository
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click "Load unpacked" and select the folder
5. Pin the extension to your toolbar for quick access

### 🧮 How It Works

#### Conversion Formulas
- **Fahrenheit to Celsius**: `°C = (°F - 32) × 5/9`
- **Celsius to Fahrenheit**: `°F = (°C × 9/5) + 32`

#### Temperature Ranges
The extension provides context about temperature ranges:
- ❄️ Below Freezing: < 0°C / < 32°F
- 🥶 Cold: 0-10°C / 32-50°F
- ☁️ Cool: 10-20°C / 50-68°F
- 😊 Comfortable: 20-25°C / 68-77°F
- 🌤️ Warm: 25-30°C / 77-86°F
- 🌞 Hot: 30-40°C / 86-104°F
- 🔥 Extremely Hot: > 40°C / > 104°F

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Enter` | Convert temperature |
| `Tab` | Navigate between elements |
| `Space` | Toggle conversion direction |
| `Escape` | Clear all fields |
| `1, 2, 3` | Select quick reference temperatures |

### 🎨 Design System Compliance

#### Applied Design Principles
1. **Consistency First**: Uses standard spacing, typography, and components
2. **Color as Configuration**: Only color tokens differ between themes
3. **Minimalism**: No decorative elements without purpose
4. **Accessibility**: 4.5:1 contrast ratio, readable fonts
5. **Scalability**: Easy to maintain and extend

#### Sky Gradient Theme Tokens
- **Background Gradient**: `#0284C7 → #7DD3FC`
- **Header**: `#0369A1`
- **Primary Button**: `#38BDF8 → #0EA5E9`
- **Accent Color**: `#BAE6FD`
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#E0F2FE`

### 🔐 Privacy & Security
- **Local Processing**: All conversions happen in your browser
- **No Data Collection**: No tracking, no analytics, no external requests
- **No Permissions Needed**: Works entirely in the popup interface

### 📱 Browser Compatibility
- Google Chrome 88+
- Microsoft Edge 88+
- Other Chromium-based browsers

### 🧪 Testing
- Unit conversion accuracy tested against standard formulas
- UI tested for accessibility compliance
- Cross-browser compatibility verified
- Responsive design tested at multiple widths

### 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### 📄 License
MIT License - See LICENSE file for details

### 🙏 Acknowledgments
- Inspired by the Extension Guide theme system
- Thanks to all temperature scale standards
- Built for users who need quick, accurate conversions

### 🆘 Support
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Read this README for usage instructions
- **Community**: Share feedback and suggestions

---

**Stay comfortable in any temperature scale!** 🌡️✨