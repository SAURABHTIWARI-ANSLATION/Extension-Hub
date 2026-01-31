📩 Message Encryptor & Decryptor

Securely encrypt and decrypt any message using AES encryption — fast, offline, and private.

🚀 Features

✔ AES-256 Encryption & Decryption (Powered by CryptoJS)
✔ Instant Message Encryption
✔ Instant Message Decryption
✔ Copy to Clipboard with animation
✔ Clear Input & Output
✔ Beautiful Modern UI with blue gradient
✔ Fully Offline — no API required
✔ Fast and Lightweight

📂 File Structure
/YourExtension/
│── manifest.json
│── popup.html
│── popup.js
│── crypto.js
│── icons/
│     ├── icon16.png
│     ├── icon48.png
│     ├── icon128.png

🧠 How It Works

The extension uses an internal secret encryption key stored inside JavaScript to securely encrypt and decrypt text.
Encryption logic from your code:


popup

It runs AES:

CryptoJS.AES.encrypt(message, SECRET_KEY)
CryptoJS.AES.decrypt(encrypted, SECRET_KEY)


CryptoJS library is included inside the extension:


crypto

🛠 Installation (Developer Mode)

Download the project folder.

Open Chrome → go to:

chrome://extensions/


Enable Developer Mode (top-right).

Click Load Unpacked.

Select your extension folder.

The extension will now appear in your browser toolbar.

🧪 Usage

Open the extension popup.

Type your message in the input box.

Click ENCRYPT → encrypted string appears.

Click DECRYPT to restore original text.

Use Copy to copy output.

Use Clear to reset both fields.

UI reference from your popup:


popup

🔒 Security Note

The secret key is internal, so only the extension can encrypt/decrypt correctly.

Works fully offline — your data never leaves your device.

📜 manifest.json

manifest
