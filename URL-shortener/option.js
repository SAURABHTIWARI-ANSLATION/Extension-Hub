let saveBtn = document.querySelector("#save");
let apiInput = document.querySelector("#myapi");
let toastError = document.querySelector(".toast-error");
let toastSuccess = document.querySelector(".toast-success");

// Load existing key
chrome.storage.local.get(['API'], function (result) {
    if (result.API) {
        apiInput.value = result.API;
    }
});

saveBtn.addEventListener("click", () => {
    if (apiInput.value && apiInput.value.trim() !== "") {
        chrome.storage.local.set({ API: apiInput.value.trim() }, function () {
            showSuccess();
        });
    } else {
        showError("Please enter a valid API Key");
    }
});

function showSuccess() {
    toastSuccess.classList.remove("d-hide");
    toastError.classList.add("d-hide");
    setTimeout(() => {
        toastSuccess.classList.add("d-hide");
    }, 2000);
}

function showError(msg) {
    const msgSpan = toastError.querySelector('.msg');
    if (msgSpan) msgSpan.textContent = msg;

    toastError.classList.remove("d-hide");
    toastSuccess.classList.add("d-hide");
    setTimeout(() => {
        toastError.classList.add("d-hide");
    }, 2000);
}