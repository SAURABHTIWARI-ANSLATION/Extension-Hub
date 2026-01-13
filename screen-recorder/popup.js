let mediaRecorder = null;
let recordedChunks = [];
let stream = null;
let timerInterval = null;
let seconds = 0;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusEl = document.getElementById("status");
const timerEl = document.getElementById("timer");
const recordDot = document.getElementById("recordDot");

// Format time mm:ss
function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Start recording
startBtn.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: true
    });

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = handleStop;

    mediaRecorder.start();
    startTimer();

    statusEl.textContent = "Recording...";
    recordDot.classList.add("recording");
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } catch (err) {
    alert("Recording failed: " + err.message);
  }
});

// Stop recording
stopBtn.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  cleanupStream();
  stopTimer();

  statusEl.textContent = "Saving...";
  recordDot.classList.remove("recording");
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

// Save file
function handleStop() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `screen-recording-${Date.now()}.webm`;
  a.click();

  URL.revokeObjectURL(url);
  statusEl.textContent = "Saved!";
}

// Timer
function startTimer() {
  seconds = 0;
  timerEl.textContent = "00:00";
  timerInterval = setInterval(() => {
    seconds++;
    timerEl.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// Stop screen capture tracks
function cleanupStream() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}
