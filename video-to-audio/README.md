# 🎬 Video to Audio Converter — Chrome Extension

Convert MP4, WebM, and MOV videos to MP3 **entirely in your browser**.  
No servers. No uploads. No APIs. 100% local via **ffmpeg.wasm**.

---

## 📁 Folder Structure

```
video-to-audio-ext/
│
├── manifest.json          ← Chrome Extension config (MV3)
├── popup.html             ← Extension popup UI
├── popup.js               ← Conversion logic
├── make_icons.py          ← Helper to regenerate icons
│
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
└── ffmpeg/                ← ⚠️ YOU MUST CREATE THIS FOLDER
    ├── ffmpeg.min.js
    ├── ffmpeg-core.js
    ├── ffmpeg-core.wasm
    └── ffmpeg-core.worker.js
```

---

## ⬇️ Step 1 — Download ffmpeg.wasm Files

The extension requires **ffmpeg.wasm v0.11.x** (the last version that uses the
`createFFmpeg` / `fetchFile` API that works in a browser without a backend).

### Option A — Download from jsDelivr CDN (easiest)

Run these commands in your terminal from inside `video-to-audio-ext/`:

```bash
mkdir -p ffmpeg

# Core JS loader
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js" \
     -o ffmpeg/ffmpeg.min.js

# Core WASM wrapper
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js" \
     -o ffmpeg/ffmpeg-core.js

# Core WASM binary (~25 MB)
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm" \
     -o ffmpeg/ffmpeg-core.wasm

# Web worker (needed by ffmpeg.wasm)
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js" \
     -o ffmpeg/ffmpeg-core.worker.js
```

### Option B — Install via npm and copy

```bash
npm install @ffmpeg/ffmpeg@0.11.6 @ffmpeg/core@0.11.0

mkdir -p ffmpeg

cp node_modules/@ffmpeg/ffmpeg/dist/ffmpeg.min.js          ffmpeg/
cp node_modules/@ffmpeg/core/dist/ffmpeg-core.js           ffmpeg/
cp node_modules/@ffmpeg/core/dist/ffmpeg-core.wasm         ffmpeg/
cp node_modules/@ffmpeg/core/dist/ffmpeg-core.worker.js    ffmpeg/
```

### Option C — Manual download

Visit these URLs in your browser and save each file into the `ffmpeg/` folder:

| File | URL |
|------|-----|
| `ffmpeg.min.js` | https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js |
| `ffmpeg-core.js` | https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js |
| `ffmpeg-core.wasm` | https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm |
| `ffmpeg-core.worker.js` | https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js |

> ⚠️ The `.wasm` file is ~25 MB — it may take a moment to download.

---

## 🚀 Step 2 — Load the Extension in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the `video-to-audio-ext/` folder
5. The extension icon will appear in your toolbar 🎉

---

## 🎯 How to Use

1. Click the extension icon in Chrome's toolbar
2. **Drop a video file** onto the upload area, or click to browse
3. *(Optional)* Set a custom output filename and choose audio quality
4. Click **"Convert to MP3"**
5. Wait — the first run loads the WASM engine (~2–5 sec)
6. Your MP3 will **automatically download** when done ✓

---

## 🎛️ Quality Options

| Setting | Type | Description |
|---------|------|-------------|
| High (VBR 2) | Variable | ~190 kbps avg, best quality |
| Medium (VBR 4) | Variable | ~165 kbps avg, default |
| Low (VBR 6) | Variable | ~130 kbps avg, smaller file |
| 128 kbps CBR | Constant | Standard streaming quality |
| 192 kbps CBR | Constant | High streaming quality |
| 320 kbps CBR | Constant | Maximum constant bitrate |

---

## 🔧 Technical Details

| Property | Value |
|----------|-------|
| Manifest Version | 3 (MV3) |
| ffmpeg.wasm version | 0.11.6 |
| Audio codec | libmp3lame |
| Sample rate | 44,100 Hz |
| Channels | Stereo |
| Processing | 100% in-browser (Web Worker + WASM) |
| Data leaves device | Never |

---

## 🛠️ Troubleshooting

**"Cannot load ffmpeg.min.js"**  
→ Make sure the `ffmpeg/` folder exists and all 4 files are present.

**Extension shows but popup is blank**  
→ Right-click the extension icon → "Inspect popup" → check the Console tab.

**Conversion is very slow**  
→ Normal for large files. A 100 MB video may take 30–90 seconds.  
→ The WASM engine runs single-threaded inside the browser.

**"Failed to init FFmpeg"**  
→ Make sure you downloaded `ffmpeg-core.wasm` (the full ~25 MB binary,  
not a redirect HTML page). Re-download if the file is unexpectedly small.

**Chrome blocks the extension**  
→ Ensure Developer Mode is enabled in `chrome://extensions/`.

---

## 📜 License

MIT — free to use, modify, and distribute.
