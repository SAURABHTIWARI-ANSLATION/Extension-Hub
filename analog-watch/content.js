if (!document.getElementById("analog-watch")) {
  const watch = document.createElement("div");
  watch.id = "analog-watch";

  // Create clock face with Roman numerals
  const romanNumerals = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
  
  // Add hour marks (Roman numerals) - positioned properly inside
  for (let i = 0; i < 12; i++) {
    const mark = document.createElement("div");
    mark.className = "mark mark-hour";
    
    // Calculate position - properly centered inside
    const angle = (i * 30) * Math.PI / 180;
    const radius = 35; // Even closer to center
    const x = 50 + Math.sin(angle) * radius;
    const y = 50 - Math.cos(angle) * radius;
    
    mark.textContent = romanNumerals[i];
    mark.style.left = `${x}%`;
    mark.style.top = `${y}%`;
    mark.style.transform = `translate(-50%, -50%)`;
    watch.appendChild(mark);
  }

  // Add minute marks (small lines instead of dots)
  for (let i = 0; i < 60; i++) {
    if (i % 5 !== 0) { // Skip where hour marks are
      const mark = document.createElement("div");
      mark.className = "mark mark-minute";
      
      const angle = (i * 6) * Math.PI / 180;
      const radius = 42; // Position for minute marks
      const x = 50 + Math.sin(angle) * radius;
      const y = 50 - Math.cos(angle) * radius;
      
      // Position and rotate the minute mark
      mark.style.left = `${x}%`;
      mark.style.top = `${y}%`;
      mark.style.transform = `translate(-50%, -50%) rotate(${i * 6}deg)`;
      mark.style.transformOrigin = 'center';
      watch.appendChild(mark);
    }
  }

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

  // Make watch draggable
  let isDragging = false;
  let offsetX, offsetY;

  watch.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);

  function startDrag(e) {
    isDragging = true;
    const rect = watch.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    watch.style.cursor = 'grabbing';
  }

  function drag(e) {
    if (!isDragging) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - watch.offsetWidth;
    const maxY = window.innerHeight - watch.offsetHeight;
    
    watch.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
    watch.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
    watch.style.right = 'auto';
    watch.style.bottom = 'auto';
  }

  function stopDrag() {
    isDragging = false;
    watch.style.cursor = 'move';
  }

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