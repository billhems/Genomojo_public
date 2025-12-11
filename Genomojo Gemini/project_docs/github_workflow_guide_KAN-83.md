# GitHub Workflow Guide for KAN-83

Here is a step-by-step guide to manage your changes for the KAN-83 task using GitHub.

## 1. Create Feature Branch
I have already created the branch for you:
```bash
git checkout -b feature/KAN-83-about-you-screen
```

## 2. Implement Changes
(I will perform these steps)
- Create `src/screens/AboutYouScreen.jsx`
- Modify `src/MainApp.jsx`
- Modify `src/screens/LandingScreen.jsx`

## 3. Commit Changes
After implementation and verification, commit the changes:
```bash
git add .
git commit -m "feat(KAN-83): refactor About You modal to standalone screen"
```

## 4. Push to GitHub
Push the new branch to the remote repository:
```bash
git push -u origin feature/KAN-83-about-you-screen
```

## 5. Create Pull Request
1.  Go to the [GitHub repository](https://github.com/billhems/Genomojo_G).
2.  You should see a banner "Compare & pull request" for the new branch. Click it.
3.  Fill in the PR description (you can use the Implementation Plan as a template).
4.  Request review from team members if applicable.
5.  Merge the PR once approved.
