# 🎙️ Audio Recorder Chrome Extension

A simple and reliable Chrome extension to record audio from any browser tab.

## Features
- ✅ Record audio from any browser tab
- ✅ High-quality WebM audio output
- ✅ Simple one-click recording
- ✅ Recording history with file details
- ✅ Visual status indicators
- ✅ Real-time recording timer
- ✅ Clean, modern UI

## Installation

### Method 1: Load as Unpacked Extension

1. **Download or create** the extension folder with all files
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the folder containing these files
6. The extension will appear in your toolbar

## How to Use

1. **Navigate** to a website with audio (YouTube, Spotify, podcast, etc.)
2. **Click** the Audio Recorder icon in your toolbar
3. The recorder opens in a **Chrome Side Panel**
4. **Start Recording** - Click "Record"
5. **Stop Recording** - Click "Stop"
6. **Save File** - Click "Save Recording" (downloads to your computer)

## Important Notes

- Make sure audio is playing in the tab before starting recording
- The extension can only record from one tab at a time
- Recording stops if you close the tab being recorded
- Files are saved in WebM format (can be converted to MP3 using online tools)

## Troubleshooting

### Recording doesn't start
- Refresh the tab and try again
- Make sure audio is actually playing
- Check Chrome permissions for the extension

### No audio in recording
- Ensure tab audio isn't muted
- Try a different website
- Check your system's audio output

### Extension not working
- Reload the extension from `chrome://extensions/`
- Restart Chrome
- Ensure you're using Chrome version 88 or newer

## Files Included

- `manifest.json` - Extension configuration
- `background.js` - Background service worker
- `offscreen.html/js` - Audio recording handling
- `sidebar.html/js/css` - Side panel user interface
- `icons/` - Extension icons

## Permissions Explained

- **tabCapture**: Required to capture audio from browser tabs
- **storage**: Saves your recording history
- **downloads**: Saves recorded files to your computer
- **activeTab**: Accesses current tab information
- **offscreen**: Creates an offscreen document for recording

## Technical Details

- Uses Chrome's `tabCapture` API
- Records audio using `MediaRecorder` API
- Saves files as WebM with Opus codec
- Works with Manifest V3
- No external dependencies
