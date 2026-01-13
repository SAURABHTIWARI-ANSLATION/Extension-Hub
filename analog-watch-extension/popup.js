document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("watch-container");
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  function drawWatch() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = new Date();
    const radius = canvas.width / 2;
    ctx.save();
    ctx.translate(radius, radius);

    // Draw face
    ctx.beginPath();
    ctx.arc(0, 0, radius - 10, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw hour marks
    for (let i = 0; i < 12; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 6);
      ctx.beginPath();
      ctx.moveTo(0, -radius + 20);
      ctx.lineTo(0, -radius + 35);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // Draw minute marks
    for (let i = 0; i < 60; i++) {
      if (i % 5 !== 0) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 30);
        ctx.beginPath();
        ctx.moveTo(0, -radius + 28);
        ctx.lineTo(0, -radius + 35);
        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw hands
    const hour = now.getHours() % 12;
    const minute = now.getMinutes();
    const second = now.getSeconds();

    // Hour hand
    ctx.save();
    ctx.rotate(((hour + minute / 60) * Math.PI) / 6);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, -radius + 60);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    // Minute hand
    ctx.save();
    ctx.rotate(((minute + second / 60) * Math.PI) / 30);
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(0, -radius + 40);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Second hand
    ctx.save();
    ctx.rotate((second * Math.PI) / 30);
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(0, -radius + 30);
    ctx.strokeStyle = "#e33";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, 2 * Math.PI);
    ctx.fillStyle = "#333";
    ctx.fill();

    ctx.restore();
  }

  setInterval(drawWatch, 1000);
  drawWatch();
});
