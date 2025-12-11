# Identity Builder Refactor

- [x] Explore codebase and Firebase setup <!-- id: 0 -->
- [x] Move Import Logic to Admin Dashboard <!-- id: 6 -->
    - [x] Add file selector and import logic to `AdminDashboard.jsx`
    - [x] Remove import logic from `IdentityBuilder.jsx`
- [x] Implement "Add New Trait" <!-- id: 4 -->
    - [x] Create Modal UI using `src/components/Modal.jsx`
    - [x] Implement `handleAddTrait` to save to `user_traits`
    - [x] Update `useEffect` to fetch `user_traits`
    - [x] Allow immediate selection
- [x] Refine UI/UX for Trait Interactions <!-- id: 7 -->
    - [x] Fix `ThreeScene.jsx` to prevent selection after long-press
    - [x] Add visual feedback for 5-trait limit in `IdentityBuilder.jsx`
    - [x] Refine hover effects (scale & color) <!-- id: 8 -->
- [x] **Code Review & Security**
    - [x] Perform comprehensive code review
    - [x] Create security implementation plan
    - [x] Implement Environment Variables
    - [x] Implement Admin Authorization (Custom Claims)
    - [x] Implement Input Sanitization (Manual)
    - [x] Fix Memory Leaks in ThreeScene
    - [x] Add Error Boundaries
- [x] Verify changes <!-- id: 5 -->

## Recent Fixes
- [x] Fix site crash caused by `IdentityBuilder.jsx` edits.
- [x] Fix syntax errors and missing code in `SubmitScreen.jsx`

## New Features
- [x] Add Cancel button to `SubmitScreen.jsx`
- [x] Backend: Vote Aggregation
    - [x] Create `functions/voteAggregator.js`
    - [x] Create `functions/index.js` & `package.json`
    - [x] Deploy Cloud Function (User Action)
- [x] Frontend: Vote Screen Refactor
    - [x] Remove `VoteSuccessModal`
    - [x] Add "Your Last Vote" card
    - [x] Add "All Your Votes" placeholder
    - [x] Add "All Voters" card
    - [x] Implement `lastVote` state
    - [x] Implement `onSnapshot` for stats" card (tickers).

## Workflow Setup
- [/] **Establish GitHub & Jira Workflow**
    - [x] Check current Git status
    - [x] Create `github_workflow_guide.md`
    - [ ] Baseline current code (User Action)
    - [ ] **Git Cleanup**
        - [x] Check .gitignore
        - [x] Create `git_cleanup_guide.md`

## Migration
- [x] **Mac Migration**
    - [x] Create `mac_migration_guide.md`
