# 🎵 Simple Music Player Extension

A privacy-focused music player that works in your browser's new tab. Play local audio files directly without any server uploads.

## ✨ Features

### 🎶 **Music Playback**
- Play/Pause/Next/Previous controls
- Volume control
- Playback speed adjustment (0.5x to 2x)
- Progress bar with seek functionality
- Automatic track switching

### 📁 **File Management**
- Upload local audio files (MP3, WAV, OGG, M4A)
- Drag & drop support
- File info display (size, duration)
- Browse files from computer

### 🎨 **Playlist Management**
- Create custom playlists
- Add/remove tracks from playlists
- Playlist-specific playback
- Track count display

### 🔍 **Library Features**
- Search across all tracks
- Filter by: All, Recent, Favorites
- Track statistics
- Clear library option

### 🛡️ **Privacy & Security**
- **100% Local Storage** - Files stay in your browser
- **No Server Uploads** - Everything processes locally
- **No Tracking** - We don't collect any data
- **Dark/Light Theme** - Eye-friendly modes

## 🚀 Installation

### Method 1: Developer Mode (For Testing)
1. **Download** this extension folder
2. **Open Chrome** → `chrome://extensions/`
3. **Enable** Developer mode (top-right toggle)
4. **Click** "Load unpacked"
5. **Select** the extension folder
6. **Open** a new tab to see the player!

### Method 2: Packaged Extension
1. **Zip** the extension folder
2. **Rename** to `.crx` (optional)
3. **Drag & drop** into Chrome extensions page

## 📁 Project Structure
music-player-extension/
├── manifest.json # Extension configuration
├── index.html # Main interface
├── style.css # Styling (Dark/Light theme)
├── script.js # Core functionality
├── icons/ # Extension icons
│ ├── icon16.png
│ ├── icon48.png
│ └── icon128.png
└── README.md # This documentation

text

## 🎮 How to Use

### Adding Music:
1. Click "Browse Files" or drag audio files into the upload area
2. Select MP3, WAV, OGG, or M4A files
3. Files are instantly added to your library

### Playing Music:
1. Click any track in the library to play it
2. Use player controls: Play/Pause, Next, Previous
3. Adjust volume and playback speed as needed

### Creating Playlists:
1. Click "+" button in Playlists section
2. Enter playlist name
3. Add tracks to playlists (feature in development)

### Searching & Filtering:
- Use search box to find specific tracks
- Filter by: All songs, Recently added, or Favorites
- Click heart icon to favorite/unfavorite tracks

## 🔧 Technical Details

### Storage:
- **LocalStorage**: Tracks stored as Data URLs
- **Capacity**: Limited by browser storage (~5-10MB typically)
- **Persistence**: Survives browser restarts

### Supported Formats:
- MP3 (audio/mpeg)
- WAV (audio/wav)
- OGG (audio/ogg)
- M4A (audio/mp4)

### Performance:
- Lightweight design
- Minimal memory usage
- Fast track loading
- Smooth playback

## 🎨 Themes

### Light Theme:
- Clean white background
- Blue accent colors
- Easy on the eyes

### Dark Theme:
- Dark gray background
- Purple/blue accents
- Reduces eye strain

Toggle theme using the moon/sun button in header.

## 📱 Responsive Design

Works on:
- Desktop computers
- Laptops
- Tablets
- Large monitors

## 🔒 Privacy Policy

### We Store Locally:
- Audio files (as Data URLs)
- Playlist data
- Settings (volume, theme, etc.)

### We Do NOT:
- Upload files to any server
- Collect usage statistics
- Track user behavior
- Share data with third parties

All data remains in your browser and can be cleared at any time.

## 🚨 Limitations

### Browser Storage Limits:
- Maximum storage varies by browser
- Typically 5-10MB for localStorage
- Large music libraries may exceed limits

### File Size:
- Recommended: Files under 5MB each
- Large files may cause performance issues

### Format Support:
- Only browser-supported audio formats
- Some proprietary formats may not work

## 🔄 Future Features

Planned enhancements:
- [ ] Equalizer settings
- [ ] Lyrics display
- [ ] Album art from files
- [ ] Keyboard shortcuts
- [ ] Sleep timer
- [ ] Cross-device sync (optional)
- [ ] Audio visualization
- [ ] Import from URLs

## 🐛 Troubleshooting

### Common Issues:

1. **Files not uploading?**
   - Check file format (MP3, WAV, OGG, M4A)
   - Try smaller file size
   - Clear browser cache

2. **Audio not playing?**
   - Check if file format is supported
   - Try a different audio file
   - Ensure browser audio isn't muted

3. **Slow performance?**
   - Reduce number of tracks
   - Use smaller audio files
   - Clear old tracks

4. **Storage full?**
   - Delete unused tracks
   - Use lower quality files
   - Export data before clearing

### Error Messages:
- **"Unsupported format"**: File type not supported
- **"Storage full"**: Browser storage limit reached
- **"Playback error"**: Corrupted audio file

## 📄 License

MIT License - Free for personal and commercial use.

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Code optimization
- Additional features
- Bug fixes
- UI/UX improvements

## 🌟 Support

Found a bug or have a feature request?
1. Check existing issues
2. Create a new issue with details
3. Include: Chrome version, steps to reproduce

---

**Enjoy your music privately!** 🎵

*"Your music, your privacy, your control."*
🎵 Additional Files Needed:
Icons (Create these or use placeholders):
icons/icon16.png - 16x16 pixels

icons/icon48.png - 48x48 pixels

icons/icon128.png - 128x128 pixels

Default Cover Image (Optional):
assets/default-cover.png - 150x150 pixels for album art

🚀 Step-by-Step Setup:
Step 1: Create Folder Structure
bash
music-player-extension/
├── manifest.json
├── index.html
├── style.css
├── script.js
├── icons/
└── assets/
Step 2: Add the 4 Main Files
Copy the code above for each file.

Step 3: Add Icons
Create simple icons or use these placeholders:

Use any 16x16, 48x48, 128x128 PNG images

Music-themed icons work best

Can use emoji screenshots as placeholders

Step 4: Load in Chrome
Open chrome://extensions/

Enable Developer mode

Click "Load unpacked"

Select the music-player-extension folder

Open a new tab to see your music player!

🎯 Features Ready to Use:
✅ Upload Music - Drag & drop or browse
✅ Playback Controls - Play, pause, skip, volume
✅ Progress Bar - Seek through tracks
✅ Playlists - Create and manage playlists
✅ Library - Search and filter tracks
✅ Local Storage - Saves everything in browser
✅ Dark/Light Theme - Toggle between modes
✅ Responsive Design - Works on all screen sizes

💡 Tips for Testing:
Start small - Upload 2-3 small MP3 files first

Test controls - Play, pause, volume, seek

Create playlists - Try organizing tracks

Toggle theme - Check both light and dark modes

Search/filter - Test library features

Your music player extension is ready! 🎶