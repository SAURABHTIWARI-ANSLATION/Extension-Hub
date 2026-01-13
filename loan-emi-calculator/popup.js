document.getElementById("calculate").addEventListener("click", () => {
  const P = parseFloat(document.getElementById("amount").value);
  const R = parseFloat(document.getElementById("rate").value);
  const N = parseInt(document.getElementById("months").value);

  if (!P || !R || !N) {
    alert("Please fill all fields correctly.");
    return;
  }

  const r = R / 12 / 100;
  const emi = P * r * Math.pow(1 + r, N) / (Math.pow(1 + r, N) - 1);
  const total = emi * N;
  const interest = total - P;

  document.getElementById("emi").textContent = "₹" + emi.toFixed(2);
  document.getElementById("interest").textContent = "₹" + interest.toFixed(2);
  document.getElementById("total").textContent = "₹" + total.toFixed(2);
});
