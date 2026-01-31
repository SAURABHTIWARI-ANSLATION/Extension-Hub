🌄 Image Cropper (Chrome Extension)

A fast, modern, and easy-to-use image cropping tool built as a Chrome extension.
Upload any image → crop freely or use preset aspect ratios → download instantly.
Clean blue-gradient UI, powered by Cropper.js.

✨ Features
📤 Upload Any Image

Supports all image formats (PNG, JPG, JPEG, WEBP).
Upload directly from your local device.


popup

✂️ Professional Cropping Tool

Powered by Cropper.js v1.6.1

Drag & resize crop box

Move image inside frame

Zoom in/out

Smooth performance


cropper.min

📐 Aspect Ratio Options

Choose between:

Free crop

1:1

16:9

4:3

Aspect ratio changes use a debounce system for perfect smoothness.


popup

🎨 Beautiful UI

Your extension uses a stunning blue gradient with:

Rounded controls

Smooth button animations

Clean preview area


popup

💾 High-Quality Export

Download the cropped image as a PNG at maximum quality using:

High-quality canvas rendering

toBlob() export


popup

📂 Project Structure
Image-Cropper/
│── manifest.json
│── popup.html
│── popup.js
│── popup.css
│── cropper.min.css
│── cropper.min.js
│── icons/
│     ├── icon16.png
│     ├── icon48.png
│     ├── icon128.png

🧠 How It Works
1️⃣ Upload Image

The FileReader converts your image to Base64 and displays it.


popup

2️⃣ Crop with Tools

Cropper.js initializes automatically once the image loads.

3️⃣ Choose Ratio

Changes crop box aspect ratio using real-time debounce logic.

4️⃣ Download Cropped Image

Click Download Cropped Image → extension exports the crop using a high-resolution canvas.


popup

📜 Manifest (MV3)

Your extension uses a simple popup UI and doesn’t require background scripts.


manifest

{
  "manifest_version": 3,
  "name": "Image Cropper",
  "description": "Upload, crop freely and download images",
  "version": "1.1",
  "action": {
    "default_popup": "popup.html"
  }
}

💻 Technologies Used

Cropper.js (Image manipulation engine)

HTML5

CSS3

JavaScript

Chrome Extensions (MV3)

🚀 Installation (Developer Mode)

Open chrome://extensions

Turn on Developer Mode

Click Load unpacked

Select your extension folder

Done! 🎉

🔥 Future Enhancements

Rotate image

Flip (horizontal / vertical)

Zoom slider

Dark mode

Export as JPG / WEBP

Custom crop resolutions

📄 License

MIT — Free to use & modify.

