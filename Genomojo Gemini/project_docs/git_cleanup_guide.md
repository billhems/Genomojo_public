# Git Cleanup Guide

If you accidentally committed files to GitHub that shouldn't be there (e.g., config files, large assets, or temporary folders), follow these steps to remove them.

## Scenario 1: Remove File from Repo AND Local (Delete Completely)
Use this if you want the file gone forever (e.g., a large backup zip or a temporary test file).

1.  **Delete the file(s)**:
    ```bash
    git rm -r <path-to-file-or-folder>
    # Example: git rm -r ../Backups/
    ```
2.  **Commit the change**:
    ```bash
    git commit -m "Remove accidental files"
    ```
3.  **Push to GitHub**:
    ```bash
    git push origin main
    ```

## Scenario 2: Remove from Repo ONLY (Keep Local)
Use this if you want to keep the file on your computer but stop tracking it in Git (e.g., `.env`, `firebase.json` if it contains secrets, or local config).

1.  **Remove from Git cache**:
    ```bash
    git rm -r --cached <path-to-file-or-folder>
    # Example: git rm --cached .env
    ```
2.  **Update .gitignore**:
    Add the file path to your `.gitignore` file so it doesn't get added again.
    ```bash
    # Open .gitignore and add the file name on a new line
    echo "<filename>" >> .gitignore
    ```
3.  **Commit the change**:
    ```bash
    git commit -m "Stop tracking <filename>"
    ```
4.  **Push to GitHub**:
    ```bash
    git push origin main
    ```

## Common Cleanup Commands

*   **Check what's being tracked**: `git ls-files`
*   **Check status**: `git status`
*   **Undo last commit (keep changes)**: `git reset --soft HEAD~1`
