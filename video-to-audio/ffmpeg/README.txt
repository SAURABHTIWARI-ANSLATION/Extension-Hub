# ffmpeg/ — Place ffmpeg.wasm files here

This folder must contain these 4 files before the extension works:

| File | Size (approx) |
|------|--------------|
| `ffmpeg.min.js` | ~20 KB |
| `ffmpeg-core.js` | ~20 KB |
| `ffmpeg-core.wasm` | ~25 MB |
| `ffmpeg-core.worker.js` | ~1 KB |

See the main README.md for download instructions.

Quick download (run from the project root):

```bash
mkdir -p ffmpeg
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js" -o ffmpeg/ffmpeg.min.js
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js" -o ffmpeg/ffmpeg-core.js
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm" -o ffmpeg/ffmpeg-core.wasm
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js" -o ffmpeg/ffmpeg-core.worker.js
```
