const messageEl = document.getElementById("message");
const outputEl = document.getElementById("output");
const statusEl = document.getElementById("status");

const encryptBtn = document.getElementById("encryptBtn");
const decryptBtn = document.getElementById("decryptBtn");
const copyBtn = document.getElementById("copyBtn");

// 🔒 INTERNAL HIDDEN KEY (user ko nahi dikhegi)
const SECRET_KEY = "MSG_ENCRYPTOR_INTERNAL_SECRET_KEY_2026";

// ---------- ENCRYPT ----------
encryptBtn.onclick = () => {
  if (!messageEl.value.trim()) {
    return setStatus("Please enter a message", true);
  }

  const encrypted = CryptoJS.AES.encrypt(
    messageEl.value.trim(),
    SECRET_KEY
  ).toString();

  outputEl.value = encrypted;
  autoSelect();
  setStatus("Message encrypted");
};

// ---------- DECRYPT ----------
decryptBtn.onclick = () => {
  if (!messageEl.value.trim()) {
    return setStatus("Please enter encrypted text", true);
  }

  try {
    const bytes = CryptoJS.AES.decrypt(
      messageEl.value.trim(),
      SECRET_KEY
    );
    const original = bytes.toString(CryptoJS.enc.Utf8);

    if (!original) throw new Error();

    outputEl.value = original;
    autoSelect();
    setStatus("Message decrypted");
  } catch {
    setStatus("Invalid encrypted text", true);
  }
};

// ---------- COPY ----------
copyBtn.onclick = async () => {
  if (!outputEl.value) return;

  await navigator.clipboard.writeText(outputEl.value);
  setStatus("Copied to clipboard");
};

// ---------- HELPERS ----------
function autoSelect() {
  outputEl.focus();
  outputEl.select();
}

function setStatus(msg, error = false) {
  statusEl.textContent = msg;
  statusEl.style.color = error ? "red" : "green";
}

// ------------ CLEAR BUTTON ------------
document.getElementById("clearBtn").onclick = () => {
  messageEl.value = "";
  outputEl.value = "";
  setStatus("Cleared");
};

// ------------ COPY BUTTON ------------
copyBtn.onclick = async () => {
  if (!outputEl.value) return;

  await navigator.clipboard.writeText(outputEl.value);

  // Button animation look
  copyBtn.classList.add("copied");
  copyBtn.textContent = "Copied!";

  setTimeout(() => {
    copyBtn.classList.remove("copied");
    copyBtn.textContent = "Copy";
  }, 1200);
};
