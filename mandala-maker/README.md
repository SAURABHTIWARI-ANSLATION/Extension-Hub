# Mandala Artist Chrome Extension

Create beautiful and intricate mandala drawings with symmetry and patterns.

## Features

### 🎨 Canvas Customization
- Change background color
- Adjust canvas center point
- Center at touch point
- Enable/disable canvas mirroring
- Multiple symmetry options (4 to 32-fold)

### 🖌️ Brush Customization
- Multiple brush styles (round, square, patterns)
- Custom brush colors
- Random color selection
- Adjustable brush sizes

### 🌑 Shadow Properties
- Enable/disable shadows
- Custom shadow colors
- Adjustable shadow blur
- Random shadow generator

### 🔷 Patterns
- Predefined patterns (Radial, Circular, Flower, Spiral, Geometric, Mandala)
- One-click pattern application
- Symmetrical pattern drawing

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `mandala-artist-extension` folder

## Usage

1. Click the extension icon in your toolbar
2. Click "Start Drawing" to begin on the current page
3. Or click "Open Canvas" for a full-screen drawing experience
4. Use the sidebar controls to customize your mandala
5. Draw in one segment to see symmetrical drawing
6. Save or export your creation

## File Structure

- `manifest.json` - Extension configuration
- `popup.html/css/js` - Extension popup interface
- `content/` - Main canvas application
- `lib/` - Third-party libraries
- `assets/` - Icons and resources

## Technologies Used

- Fabric.js for canvas manipulation
- Vanilla JavaScript for extension logic
- Chrome Extension API for browser integration
- CSS3 for styling and animations

## License

MIT License - Feel free to modify and distribute!