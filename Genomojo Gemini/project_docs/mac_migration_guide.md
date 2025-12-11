# Mac Migration Guide for Genomojo

Welcome to macOS! Follow these steps to get your environment set up and the project running.

## 1. System Prerequisites

### Install Homebrew
Homebrew is the standard package manager for Mac. Open the **Terminal** app and run:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
*Follow the on-screen instructions to add brew to your PATH.*

### Install Node.js & Git
We will use Homebrew to install these.
```bash
brew install git node
```
*Verify installation:*
```bash
node -v  # Should be v20 or higher
npm -v
git --version
```

### Install VS Code
Download and install from [code.visualstudio.com](https://code.visualstudio.com/).

## 2. Get the Code

### Option A: Clone from GitHub (Recommended)
If you pushed your code to GitHub as per the workflow guide:
1.  Open Terminal.
2.  Navigate to where you want the code (e.g., `Documents`):
    ```bash
    cd Documents
    ```
3.  Clone the repo:
    ```bash
    git clone https://github.com/<YOUR-USERNAME>/genomojo-gemini.git
    cd genomojo-gemini
    ```

### Option B: Copy Files
If you haven't pushed to GitHub yet:
1.  Copy the entire project folder from your Windows machine to your Mac.
2.  **Delete** the `node_modules` folder in the root AND inside `functions/`. (Dependencies must be re-installed for Mac).

## 3. Project Setup

### Install Dependencies
Run this in the project root:
```bash
npm install
```

### Install Function Dependencies
```bash
cd functions
npm install
cd ..
```

### Recreate Environment Variables
Since `.env` files are ignored by Git, you need to recreate them.
1.  Create a new file named `.env` in the project root.
2.  Copy the contents from your Windows `.env` (or `.env.example`).
    *   *Tip: You can view the old file contents on your Windows machine.*

## 4. Firebase Setup

### Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Login
```bash
firebase login
```
*This will open a browser window. Log in with `admin@genomojo.com` (or your Google account).*

### Select Project
Ensure you are using the correct project:
```bash
firebase use --add
# Select 'genomojo' from the list
```

## 5. Verification

### Run the App
```bash
npm run dev
```
*   Open `http://localhost:5173` in your browser.
*   Test the **Vote Screen** and **Identity Builder** to ensure everything works.

### Test Cloud Functions (Optional)
To test deployment (only if you are ready to deploy):
```bash
firebase deploy --only functions
```

## Troubleshooting
*   **Permission Errors**: If you get `EACCES` errors with npm, try using `sudo` or (better) install Node via `nvm` (Node Version Manager).
*   **Port in Use**: If port 5173 is taken, Vite will automatically try the next one (5174).
