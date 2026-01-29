if (!document.getElementById("analog-watch")) {
  const watch = document.createElement("div");
  watch.id = "analog-watch";

  const hour = document.createElement("div");
  hour.className = "hand hour";

  const minute = document.createElement("div");
  minute.className = "hand minute";

  const second = document.createElement("div");
  second.className = "hand second";

  const center = document.createElement("div");
  center.className = "center-dot";

  watch.appendChild(hour);
  watch.appendChild(minute);
  watch.appendChild(second);
  watch.appendChild(center);
  document.body.appendChild(watch);

  function updateClock() {
    const now = new Date();
    const sec = now.getSeconds();
    const min = now.getMinutes();
    const hr = now.getHours();

    const secDeg = sec * 6;
    const minDeg = min * 6 + sec * 0.1;
    const hrDeg = hr * 30 + min * 0.5;

    second.style.transform = `rotate(${secDeg}deg) translateY(-50%)`;
    minute.style.transform = `rotate(${minDeg}deg) translateY(-50%)`;
    hour.style.transform = `rotate(${hrDeg}deg) translateY(-50%)`;
  }

  setInterval(updateClock, 1000);
  updateClock();
}
