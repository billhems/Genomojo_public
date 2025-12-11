# Implementation Plan - Vote Process Refactor

## Goal
Streamline the voting experience by removing the success modal and displaying vote statistics directly on the screen. Implement efficient global vote counting.

## User Review Required
> [!IMPORTANT]
> **Data Schema Change**: We will start storing `type` ('H' or 'L') on the `votes` documents to allow for efficient querying/counting of MoHi vs MoLo votes. Existing votes will not have this field, so the counters might be inaccurate for old data unless we run a migration.

## Proposed Changes

### Frontend: Vote Screen
#### [MODIFY] [VoteScreen.jsx](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/screens/VoteScreen.jsx)
-   **Remove**: `VoteSuccessModal` component and usage.
-   **State**: Add `lastVote` state to hold data for the "Your Last Vote" card (item description, user score, distribution).
-   **Logic**:
    -   Update `handleVote`:
        -   Include `type` in the `addDoc` call for the vote.
        -   Fetch distribution for the *just voted* item.
        -   Update `lastVote` state.
        -   Call `fetchRandomItem` to load the next item immediately.
-   **UI**:
    -   Add "Your Last Vote" card below the Skip button.
    -   Add "All Your Votes" card (placeholder) below that.
    -   Add "All Voters" card below that, displaying live tickers.

### Backend: Vote Aggregation
#### [NEW] [functions/voteAggregator.js](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/functions/voteAggregator.js)
-   Create a script/function logic that:
    1.  Queries all votes (or uses a collection group query).
    2.  Counts votes where `type == 'H'` and `type == 'L'`.
    3.  Writes the totals to `stats/vote_totals` in Firestore.
-   *Note*: Since we cannot deploy Cloud Functions directly, we will provide this code for the user and potentially add a "Run Aggregation" button in the Admin Dashboard for testing.

### Data Access
#### [MODIFY] [hooks/useFirebaseApp.js](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/hooks/useFirebaseApp.js)
-   Ensure `onSnapshot` is available to subscribe to the `stats/vote_totals` document for real-time updates on the tickers.

## Verification Plan
### Manual Verification
1.  **Voting Flow**: Vote on an item. Verify the modal does *not* appear, the next item loads, and the "Your Last Vote" card updates with the correct info.
2.  **Data Integrity**: Verify the new vote document in Firestore has the `type` field.
3.  **Tickers**: Manually update the `stats/vote_totals` document in Firestore and verify the "All Voters" tickers update on the UI.
