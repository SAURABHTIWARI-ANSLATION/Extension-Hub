document.addEventListener("DOMContentLoaded", () => {
  const textInput = document.getElementById("text");
  const voiceSelect = document.getElementById("voice");
  const rateInput = document.getElementById("rate");
  const pitchInput = document.getElementById("pitch");
  const rateVal = document.getElementById("rateVal");
  const pitchVal = document.getElementById("pitchVal");
  const speakBtn = document.getElementById("speak");
  const stopBtn = document.getElementById("stop");

  let voices = [];

  // Live slider display
  if (rateVal && rateInput) {
    rateInput.addEventListener("input", () => {
      rateVal.textContent = rateInput.value + "x";
    });
    rateVal.textContent = rateInput.value + "x";
  }

  if (pitchVal && pitchInput) {
    pitchInput.addEventListener("input", () => {
      pitchVal.textContent = pitchInput.value;
    });
    pitchVal.textContent = pitchInput.value;
  }

  function loadVoices() {
    voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = "";

    voices.forEach((v, i) => {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `${v.name} (${v.lang})`;
      voiceSelect.appendChild(option);
    });
  }

  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  speakBtn.addEventListener("click", () => {
    const text = textInput.value.trim();
    if (!text) {
      alert("Please enter some text.");
      return;
    }

    if (!voices.length) {
      alert("Voices are still loading, please wait a second and try again.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices[voiceSelect.value];

    if (voice) utterance.voice = voice;
    utterance.rate = parseFloat(rateInput.value);
    utterance.pitch = parseFloat(pitchInput.value);

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  });

  stopBtn.addEventListener("click", () => {
    speechSynthesis.cancel();
  });
});
