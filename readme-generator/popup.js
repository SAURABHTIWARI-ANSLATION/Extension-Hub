const body = document.body,
      input = document.getElementById("projectInput"),
      gen = document.getElementById("generateBtn"),
      pre = document.getElementById("previewArea"),
      copy = document.getElementById("copyBtn"),
      down = document.getElementById("downloadBtn"),
      tpl = document.getElementById("templateSelect");

let out = "";

// Load saved settings
chrome.storage.sync.get(["theme", "template", "visited"], d => {
    if (d.template) tpl.value = d.template;
});

// Enable Generate button when enough text
input.oninput = () => {
    const valid = input.value.trim().length >= 30;
    gen.disabled = !valid;
    gen.classList.toggle("active", valid);
};

// Generate README
gen.onclick = () => {
    out = makeReadme(input.value, tpl.value);
    pre.textContent = out;

    copy.disabled = down.disabled = false;
    copy.classList.add("active");
    down.classList.add("active");
};

// Copy button
copy.onclick = async () => {
    await navigator.clipboard.writeText(out);
    flash(copy, "Copied ✓");
};

// Download README.md
down.onclick = () => {
    const blob = new Blob([out], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "README.md";
    a.click();
    flash(down, "Saved ✓");
};

// Save template change
tpl.onchange = () => chrome.storage.sync.set({ template: tpl.value });

// Build README
function makeReadme(text, mode) {
    const title = text.split("\n")[0] || "Project Title";
    const desc = text.split("\n").slice(0, 3).join(" ");
    const features = text
        .split("\n")
        .filter(x => x.match(/^[-*•]/))
        .map(x => "- " + x.replace(/^[-*•]/, "").trim())
        .join("\n");

    if (mode === "minimal")
        return "# " + title + "\n\n" + desc + "\n\n" + features;

    return (
        "# " + title +
        "\n\n## Description\n" + desc +
        "\n\n## Features\n" + (features || "- Feature one") +
        "\n\n## License\nMIT"
    );
}

// Button flash animation
function flash(btn, text) {
    const old = btn.textContent;
    btn.textContent = text;
    setTimeout(() => (btn.textContent = old), 1200);
}

/*  
-----------------------------------------------------
      CLEAR BUTTON — FULLY FIXED & WORKING NOW
-----------------------------------------------------
*/

document.addEventListener("DOMContentLoaded", () => {
    const clearBtn = document.getElementById("clearBtn");

    if (clearBtn) {
        clearBtn.onclick = () => {
            input.value = "";
            pre.textContent = "Paste a project description to begin…";

            gen.disabled = true;
            gen.classList.remove("active");

            copy.disabled = true;
            copy.classList.remove("active");

            down.disabled = true;
            down.classList.remove("active");
        };
    }
});
