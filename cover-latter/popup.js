const out = document.getElementById("output");

document.getElementById("generate").onclick = () => {
  const data = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    company: document.getElementById("company").value.trim(),
    address: document.getElementById("address").value.trim(),
    manager: document.getElementById("manager").value.trim(),
    job: document.getElementById("job").value.trim(),
    subject: document.getElementById("subject").value.trim(),
    experience: document.getElementById("experience").value.trim(),
    skills: document.getElementById("skills").value.trim()
  };

  if (!data.name || !data.job) {
    alert("Name and Job Title are required");
    return;
  }

  const letter = `
${data.name}
${data.phone}
${data.email}

${data.address}

Dear ${data.manager || "Hiring Manager"},

Subject: ${data.subject || "Job Application for " + data.job}

I am writing to apply for the ${data.job} position at ${data.company}.
With ${data.experience}, I have developed strong skills in ${data.skills}.

I am confident my abilities align well with your needs and I would welcome the opportunity to contribute to your team.

Sincerely,
${data.name}
  `;

  out.textContent = letter;
  chrome.storage.local.set({ lastLetter: letter });
};

document.getElementById("copy").onclick = () => {
  navigator.clipboard.writeText(out.textContent);
};

document.getElementById("download").onclick = () => {
  const blob = new Blob([out.textContent], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cover_letter.txt";
  a.click();
};

document.getElementById("reset").onclick = () => {
  document.querySelectorAll("input, textarea").forEach(e => e.value = "");
  out.textContent = "";
};

window.onload = () => {
  chrome.storage.local.get("lastLetter", d => {
    if (d.lastLetter) out.textContent = d.lastLetter;
  });
};
