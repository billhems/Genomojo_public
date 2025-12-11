# GitHub & Jira Workflow Guide

This guide outlines the steps to baseline your current code, set up a GitHub repository, and establish a professional development workflow integrated with Jira.

## Phase 1: Baseline Current Code

Your project is already a Git repository, but you have uncommitted changes (including the new `functions` folder and `VoteScreen` refactor). We need to commit these to establish your baseline.

1.  **Open your terminal** in VS Code.
2.  **Stage all changes**:
    ```bash
    git add .
    ```
3.  **Commit the baseline**:
    ```bash
    git commit -m "Baseline: Complete Vote Process Refactor and Identity Builder fixes"
    ```

## Phase 2: Set up GitHub Repository

1.  **Create a new Repository on GitHub**:
    *   Go to [github.com/new](https://github.com/new).
    *   Name it `genomojo-gemini` (or your preferred name).
    *   **Do not** initialize with README, .gitignore, or License (you already have these).
    *   Click **Create repository**.

2.  **Link Local Repo to GitHub**:
    *   Copy the URL of your new repo (e.g., `https://github.com/username/genomojo-gemini.git`).
    *   Run the following commands in your terminal:
    ```bash
    git branch -M main
    git remote add origin <YOUR_REPO_URL>
    git push -u origin main
    ```

## Phase 3: Jira Integration

1.  **Create a Jira Project**:
    *   Create a "Kanban" or "Scrum" project in Jira named "Genomojo" (Key: `GEN` or `MOJO`).

2.  **Link GitHub to Jira** (Recommended):
    *   In Jira, go to **Apps** > **Explore more apps** > Search for "GitHub for Jira".
    *   Install and follow instructions to connect your GitHub organization/repo.
    *   *Benefit*: Jira tickets will automatically update when you include the ticket ID in branch names or commit messages.

## Phase 4: Feature Branch Workflow

For every new feature or bug fix, follow this cycle:

### 1. Start in Jira
*   Create a ticket (e.g., `GEN-101: Add User Profile`).
*   Move it to "In Progress".

### 2. Create a Branch
*   **Always** branch from `main` (or `develop` if you use it).
*   **Naming Convention**: `feature/<JIRA-ID>-<short-description>`
    ```bash
    git checkout main
    git pull origin main  # Ensure you have latest code
    git checkout -b feature/GEN-101-user-profile
    ```

### 3. Code & Commit
*   Make your changes.
*   Commit often. Include the Jira ID in the message.
    ```bash
    git add .
    git commit -m "GEN-101: Implement user profile layout"
    ```

### 4. Push & Pull Request (PR)
*   Push your branch to GitHub:
    ```bash
    git push -u origin feature/GEN-101-user-profile
    ```
*   Go to GitHub and click **Compare & pull request**.
*   **Title**: `GEN-101: Add User Profile`
*   **Description**: Briefly explain changes and verification steps.
*   Click **Create Pull Request**.

### 5. Review & Merge
*   Review your code (or ask a teammate).
*   Once approved, click **Merge pull request** > **Confirm merge**.
*   Delete the branch after merging.

### 6. Sync Local
*   Switch back to main and pull the new changes:
    ```bash
    git checkout main
    git pull origin main
    ```

## Automating with Antigravity (Me)

I can handle most of the **Git** operations for you. Here is the division of labor:

### What I CAN Automate (Just ask me!)
*   **Branching**: "Start working on ticket KAN-123." -> I will create `feature/KAN-123-...`.
*   **Committing**: I will automatically stage files and commit with the Jira ID in the message (e.g., `KAN-123: Update logic`).
*   **Pushing**: "Push my changes." -> I will push the branch to GitHub.
*   **Syncing**: "Get the latest code." -> I will switch to `main` and pull updates.

### What YOU Must Do
*   **Jira**: Create the tickets and move them on the board.
*   **GitHub**: Create the Pull Request (PR) and Merge it. (I cannot access the GitHub website).
*   **Review**: You are the final approver of the code in the PR.
