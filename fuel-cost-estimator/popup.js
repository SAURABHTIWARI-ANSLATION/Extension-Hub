const distanceInput = document.getElementById("distance");
const mileageInput = document.getElementById("mileage");
const priceInput = document.getElementById("price");
const result = document.getElementById("result");
const calcBtn = document.getElementById("calculate");

// Load saved values
chrome.storage.local.get(["distance", "mileage", "price"], data => {
  if (data.distance) distanceInput.value = data.distance;
  if (data.mileage) mileageInput.value = data.mileage;
  if (data.price) priceInput.value = data.price;
});

calcBtn.onclick = () => {
  const distance = parseFloat(distanceInput.value);
  const mileage = parseFloat(mileageInput.value);
  const price = parseFloat(priceInput.value);

  if (isNaN(distance) || isNaN(mileage) || isNaN(price) || mileage <= 0) {
    result.textContent = "Enter valid values.";
    return;
  }

  const liters = distance / mileage;
  const cost = liters * price;

  chrome.storage.local.set({ distance, mileage, price });

  result.textContent = `Estimated fuel cost: ₹${cost.toFixed(2)} (${liters.toFixed(2)} L)`;
};
