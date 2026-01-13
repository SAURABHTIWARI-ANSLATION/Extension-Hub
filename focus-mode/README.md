# 🧠 Focus Mode — Chrome Extension

Focus Mode is a lightweight productivity extension that helps you stay focused during work hours by blocking distracting websites and allowing controlled emergency access when needed.

---

## ✨ Features

- Block distracting websites during defined work hours  
- Enable / disable Focus Mode anytime  
- Emergency access for 10 minutes when required  
- Daily block statistics with auto reset  
- Works fully offline — no backend or account required  

---

## 🚀 How to Install (Local)

1. Open Chrome and go to: `chrome://extensions`
2. Enable **Developer Mode** (top-right corner)
3. Click **Load unpacked**
4. Select the `focus-mode-extension` folder

The extension will now appear in your toolbar 🎉

---

## 🛠 How to Use

1. Click the Focus Mode icon
2. Enable Focus Mode
3. Set your work hours (e.g., 09:00 – 18:00)
4. Add websites like `youtube.com`, `instagram.com`
5. Start browsing — distractions will be blocked automatically

To remove a site, simply click on it in the list.

---

## 🌐 How to Publish to Chrome Web Store

1. Visit the **Chrome Web Store Developer Dashboard**
2. Pay the one-time $5 developer registration fee
3. Zip the `focus-mode-extension` folder
4. Upload the ZIP file
5. Add:
   - Extension name and description
   - Screenshots (recommended: 1280×800)
   - A 128×128 icon
6. Submit for review and wait for approval

---

## 🧩 Project Structure

focus-mode-extension/
├─ manifest.json
├─ popup.html
├─ popup.js
├─ style.css
├─ background.js
├─ blocked.html
└─ README.md


---

## 💡 Tips

- Use a clean **128×128 PNG icon**
- Test blocking logic in Incognito mode
- Increase the `version` in `manifest.json` before publishing updates
- Test during and outside work hours to ensure correct behavior

---

## 🔐 Privacy

Focus Mode does **not collect, transmit, or track any personal data**.  
All settings are stored locally in your browser using Chrome storage.

---

## 📄 License

This project is free for personal and educational use.  
You may modify and extend it as you like.

---

Happy focusing! 🚀
