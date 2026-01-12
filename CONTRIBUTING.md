# Contributing Guidelines

## ⚠️ CRITICAL RULE: NO DIRECT PUSHES TO MAIN

**To maintain the stability of this project, the following rules are strictly enforced for all collaborators (Ritik, Aryan, etc.):**

1.  **Stop! Do NOT push directly to the `main` branch.**
    - Direct pushes to `main` are reserved **ONLY** for the Repository Administrator (Saurabh).
    - Any direct push by a collaborator will be considered a breach of protocol.

2.  **Use the Pull Request Workflow:**
    - **Step 1:** Create a new branch for your feature or fix.
      ```bash
      git checkout -b feature/my-new-feature
      ```
    - **Step 2:** Commit your changes to your new branch.
    - **Step 3:** Push your branch to GitHub.
      ```bash
      git push origin feature/my-new-feature
      ```
    - **Step 4:** Go to GitHub and open a **Pull Request (PR)** targeting `main`.
    - **Step 5:** Assign **Saurabh** as the reviewer.

3.  **Branch Structure & Naming:**
    - **`main`**: The primary, stable branch. (Protected).
    - **`saurabh-tiwari`**: A contributor branch (treated like any other feature branch).
    - **`Aryan-Tay` / `Ritik_Extension`**: Contributor branches.
    - **New Branches**: Please use descriptive names (e.g., `feature/dark-mode`, `fix/login-bug`).

4.  **Approval Required:**
    - Do not merge your own PR.
    - Wait for the Admin (Saurabh) to review and approve the changes.
    - Once approved, the Admin or the Author may merge, as per specific instruction in the PR.

**Thank you for keeping the code clean and safe!**
