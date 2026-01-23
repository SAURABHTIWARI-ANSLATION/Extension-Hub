# Contributing Guidelines & Git Cheat Sheet 🚀

To maintain a clean and conflict-free repo, **ALL** contributors (Ritik, Aryan, Raman, etc.) must follow this guide.

## ⚠️ GOLDEN RULES
1.  **NEVER delete `.gitignore`**.
2.  **NEVER push directly to `main`**. Only Saurabh can merge to `main`.
3.  **ALWAYS pull before you start working**.

---

## 🧑‍� Member-Specific Workflow (Copy Your Commands)

Select your name below and use the exact commands provided.

### 👤 For Ritik (`Ritik_Extension`)

**1. Start Day:**
```bash
git checkout main
git pull origin main
```

**2. Create New Task:**
```bash
# syntax: git checkout -b Ritik_Extension/<feature-name>
git checkout -b Ritik_Extension/new-feature
```

**3. Save & Push:**
```bash
git add .
git commit -m "Your message here"
# SYNC WITH MAIN BEFORE PUSHING:
git checkout main
git pull origin main
git checkout Ritik_Extension/new-feature
git merge main
# PUSH:
git push origin Ritik_Extension/new-feature
```

---

### 👤 For Aryan (`Aryan-Tay`)

**1. Start Day:**
```bash
git checkout main
git pull origin main
```

**2. Create New Task:**
```bash
# syntax: git checkout -b Aryan-Tay/<feature-name>
git checkout -b Aryan-Tay/new-feature
```

**3. Save & Push:**
```bash
git add .
git commit -m "Your message here"
# SYNC WITH MAIN BEFORE PUSHING:
git checkout main
git pull origin main
git checkout Aryan-Tay/new-feature
git merge main
# PUSH:
git push origin Aryan-Tay/new-feature
```

---

### 👤 For Raman (`raman-ans`)

**1. Start Day:**
```bash
git checkout main
git pull origin main
```

**2. Create New Task:**
```bash
# syntax: git checkout -b raman-ans/<feature-name>
git checkout -b raman-ans/new-feature
```

**3. Save & Push:**
```bash
git add .
git commit -m "Your message here"
# SYNC WITH MAIN BEFORE PUSHING:
git checkout main
git pull origin main
git checkout raman-ans/new-feature
bbrgit # PUSH:
git push origin raman-ans/new-feature
```

---

## 🛑 Common Fixes

### "I deleted .gitignore by mistake!"
```bash
git checkout main -- .gitignore
```

### "Merge Conflicts!"
1.  Accept the "Incoming Change" (usually main) or "Current Change" (yours) in VS Code.
2.  `git add .`
3.  `git commit`
`