# User Identity and Authentication Strategy

## 1. Current State Analysis

### Identity Management
Currently, user identity is managed in `src/hooks/useFirebaseApp.js` with a hybrid approach:
1.  **Firebase Anonymous Auth**: The app attempts to sign in anonymously (`signInAnonymously`) on load. If successful, `userId` is the Firebase Auth UID.
2.  **Guest ID Fallback**: If Firebase Auth fails or is not ready, a random string (`guest_...`) is generated and stored in `localStorage`. This serves as the `userId`.

### Data Linking
All user-generated content is linked to this `userId`:

*   **Submissions (`mojo_items`)**:
    *   Stored in `artifacts/{project}/public/data/mojo_items`.
    *   Field `linkToDemographicID` stores the `userId`.
*   **Votes (`votes`)**:
    *   Stored in `artifacts/{project}/public/data/votes`.
    *   Field `voterID` stores the `userId`.
*   **Demographics (`demographics`)**:
    *   Stored in `artifacts/{project}/public/data/demographics/{userId}`.
    *   The document ID itself is the `userId`.
*   **User Traits (`user_traits`)**:
    *   Stored in `artifacts/{project}/public/data/user_traits`.
    *   Field `createdBy` stores the `userId`.

### Limitations
*   **Persistence**: If a user clears their browser cache (localStorage) or uses a different device, they lose access to their data (Guest ID).
*   **Anonymous Auth**: While Firebase Anonymous accounts persist on the same device/browser until signed out, they are not cross-device.
*   **No Recovery**: There is no way for a user to "log in" to recover their previous session if the local data is lost.

## 2. Proposed Strategy: Optional Authentication

To support "My Votes" and "My Submissions" across devices and sessions, we will implement an optional "Sign Up / Log In" flow.

### A. Authentication Flow
1.  **UI Entry Point**: Add a "Profile" or "Sign In" icon/button in the header or navigation menu.
2.  **Auth Options**: Support Email/Password and/or Google Sign-In.
3.  **Account Linking (The "Happy Path")**:
    *   When an anonymous user chooses to "Sign Up", use Firebase's **Account Linking** (`linkWithCredential`).
    *   **Benefit**: This converts the existing Anonymous Auth UID into a Permanent Auth UID. **No data migration is needed** because the `userId` remains the same.
4.  **Fresh Login (The "Migration Path")**:
    *   If a user logs in with an existing account (e.g., on a new device), they will have a *different* UID than their current local anonymous/guest ID.
    *   We need a strategy to handle the "orphan" data created in the current anonymous session before they logged in.

### B. Data Migration Strategy
When a user logs in and their UID changes (e.g., Guest ID -> Firebase UID, or Anon UID A -> Existing Account UID B), we should offer to **merge** or **claim** the local data.

**Scenario**: User has been voting as `Guest_123`. They log in as `User_ABC`.
**Action**:
1.  Detect that `previousUserId` (`Guest_123`) is different from `newUserId` (`User_ABC`).
2.  Prompt user: "Do you want to add your recent activity to your account?"
3.  If yes, perform a **Batch Update**:
    *   Query `mojo_items` where `linkToDemographicID == Guest_123` -> Update to `User_ABC`.
    *   Query `votes` where `voterID == Guest_123` -> Update to `User_ABC`.
    *   Query `user_traits` where `createdBy == Guest_123` -> Update to `User_ABC`.
    *   Read `demographics/Guest_123` -> Merge into `demographics/User_ABC`.

*Note: For high volumes of data, this should be done via a Cloud Function. For the current scale, a client-side batch update is acceptable.*

### C. "My Votes" and "My Submissions" Features
Once a stable `userId` is established (either anonymous or authenticated), we can implement these views:

1.  **My Submissions**:
    *   Query `mojo_items` where `linkToDemographicID == userId`.
    *   Display list of items submitted by the user.
2.  **My Votes**:
    *   Query `votes` where `voterID == userId`.
    *   Fetch the corresponding `mojo_items` for each vote.
    *   Display the item and the score the user gave.

## 3. Implementation Steps (High Level)

1.  **Enable Auth Providers**: Enable Email/Password and Google Auth in Firebase Console.
2.  **Create Auth Component**: Build a `LoginModal` or `AuthScreen` that handles:
    *   Sign Up (Link Anonymous -> Permanent).
    *   Sign In (Existing account).
    *   Sign Out.
3.  **Update `useFirebaseApp`**: Expose methods for `linkAccount`, `signIn`, `logOut`.
4.  **Implement Migration Logic**: Create a utility function `migrateUserData(oldId, newId)` to handle the data ownership transfer.
5.  **Build UI**:
    *   Add "My Profile" section.
    *   Create "My Votes" and "My Submissions" cards/screens.

## 4. Security Rules Update
Ensure Firestore Security Rules allow:
*   Users to read/write their own data (`request.auth.uid == resource.data.userId`).
*   Users to read public data.
*   The migration logic (updating `userId` on documents) might require special care in rules to allow a user to "claim" data if they can prove ownership of the session (which is implicit if they are doing it from the client side before switching tokens, but tricky after).
    *   *Simplification*: Allow `create` if authenticated. Allow `update` if `resource.data.userId == request.auth.uid`.
    *   *Migration*: Might need a Cloud Function to bypass rules if we strictly lock down `update`.

## 5. Recommendation
Start with **Account Linking**. It is the seamless way to upgrade users without moving data. Only implement the complex "Migration Path" if cross-device history merging is a critical requirement immediately.
