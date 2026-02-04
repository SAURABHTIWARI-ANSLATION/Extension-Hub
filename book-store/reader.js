const params = new URLSearchParams(window.location.search);
const file = params.get("file");

const iframe = document.getElementById("pdf");

if (file) {
  iframe.src = file;
} else {
  iframe.srcdoc = "<h3 style='text-align:center'>No book found</h3>";
}
