function drawChart(wallet) {
  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");

  const totals = {};
  wallet.forEach(w => {
    if (w.type === "expense") totals[w.category] = (totals[w.category] || 0) + w.amount;
  });

  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  let angle = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let c in totals) {
    const slice = (totals[c] / sum) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(140, 100);
    ctx.arc(140, 100, 80, angle, angle + slice);
    ctx.fillStyle = `hsl(${Math.random() * 360},70%,60%)`;
    ctx.fill();
    angle += slice;
  }
}
