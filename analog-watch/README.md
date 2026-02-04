# ⌚ Floating Analog Watch


### 🧩 Description
**Floating Analog Watch** adds a stylish, draggable analog clock with Roman numerals to every webpage you visit. Never lose track of time while browsing in full-screen mode or reading long articles.

### 🚀 Features
- **Classic Design**: Elegant analog watch with Roman numerals (I, II, III, ...)
- **Always Visible**: Floats on top of page content
- **Full Draggable**: Click and move anywhere on the screen
- **Real-Time Accuracy**: Smooth analog movement with hour, minute, and second hands
- **Non-Intrusive**: Small footprint with transparent dark design
- **Responsive Positioning**: Starts at bottom-right corner but can be moved anywhere

### 🎨 Design Features
- **Roman Numeral Dial**: Classic I through XII numbering
- **Minute Markers**: Subtle dots between hour markers
- **Colored Hands**: 
  - Red second hand for visibility
  - Light gray minute hand
  - Dark gray hour hand
- **Center Dot**: White pivot point for hands
- **Dark Theme**: Black gradient background with metallic border

### 🛠️ Tech Stack
- **HTML5**: Clock structure and elements
- **CSS3**: Styling, positioning, and animations
- **JavaScript**: Real-time updates and drag-and-drop functionality
- **Chrome Extension (Manifest V3)**: Content scripts for cross-site compatibility

### 📂 Updated Folder Structure
analog-watch-extension/
├── content.js # Main injection, clock logic & drag functionality
├── style.css # Complete clock styling with Roman numerals
├── manifest.json # Chrome extension configuration
├── icons/ # Extension icons
│ ├── icon16.png
│ ├── icon48.png
│ └── icon128.png
└── README.md # This documentation

### ⚙️ Installation (Developer Mode)
1. Download or clone the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked** button
5. Select the `analog-watch-extension` folder
6. The watch will automatically appear on all websites!

### 🧠 How It Works
1. **Automatic Injection**: On every page load, `content.js` injects a complete analog watch into the page
2. **Roman Numeral Generation**: Dynamically creates and positions all 12 Roman numerals around the dial
3. **Real-Time Updates**: Updates clock hands every second using system time
4. **Smooth Dragging**: Implements full drag-and-drop functionality with boundary checking
5. **Visual Polish**: Applies gradient backgrounds, shadows, and smooth transitions

### 🖱️ Usage
- **Default Position**: Bottom-right corner of the screen
- **Drag**: Click and hold anywhere on the watch to move it
- **Drop**: Release mouse button to place watch in new location
- **Automatic Updates**: Clock updates every second automatically

### 🔐 Privacy & Security
- **No Tracking**: The extension does not collect any data
- **No Page Reading**: Does not access or modify page content
- **Local Processing**: All time calculations use your local system clock
- **Minimal Permissions**: Only requires permission to inject the clock element

### 🎯 Perfect For
- Full-screen browsing sessions
- Reading long articles or documentation
- Time management while working online
- Adding a stylish utility to your browser

### 📸 Preview
*(Extension displays a 120px analog watch with:)*
- Black gradient circular face
- Metallic border with shadow
- Roman numerals I through XII
- Three moving hands (hour, minute, second)
- Red second hand for emphasis
- Draggable to any screen position

### 🔧 Technical Details
- **Update Frequency**: 1000ms (1 second)
- **Clock Size**: 120px × 120px
- **Z-Index**: 999999 (stays on top)
- **Browser Support**: Chrome 114+
- **Memory Usage**: Minimal (< 1MB)

### 📄 License
This project is licensed under the **MIT License** - free for personal and commercial use.

### 🔄 Updates
- **v1.0**: Initial release with Roman numerals and drag functionality
- **v1.1**: Improved numeral positioning and visual polish

### 💡 Tips
- The watch remembers its position until you refresh the page
- Works on almost all websites including YouTube, Gmail, and social media
- Can be temporarily hidden using browser zoom if needed
