# Admin User Setup Guide

## Overview
This application uses Firebase Custom Claims for admin authorization. This is more secure than hardcoded UIDs and allows for proper server-side verification.

## Prerequisites
- Firebase Admin SDK installed
- Node.js environment for running admin scripts
- Admin access to your Firebase project

## Setup Steps

### Option 1: Using Firebase Cloud Functions (Recommended)

1. **Create a Cloud Function** to set admin claims:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Verify the caller is already an admin or use a secret key
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set admin claims');
  }

  const { uid } = data;
  
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    return { message: `Success! ${uid} is now an admin.` };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

2. **Deploy the function**:
```bash
firebase deploy --only functions
```

3. **Call the function** from your app or Firebase Console.

### Option 2: Using a Local Admin Script

1. **Create a script** (e.g., `set-admin.js`):

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = 'USER_UID_HERE'; // Replace with actual user UID

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`Success! ${uid} is now an admin.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting custom claims:', error);
    process.exit(1);
  });
```

2. **Run the script**:
```bash
node set-admin.js
```

### Option 3: Using Firebase Console (Manual)

Unfortunately, Firebase Console doesn't have a UI for setting custom claims. You must use one of the above methods.

## Verifying Admin Status

After setting the custom claim, the user must:
1. Sign out and sign back in
2. The app will automatically detect the `admin` custom claim
3. Admin features will be enabled

## Security Rules

Update your Firestore Security Rules to verify admin status server-side:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check admin
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    
    // Example: Only admins can write to certain collections
    match /admin_only_collection/{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

## Troubleshooting

### Admin claim not working
- Ensure the user signs out and back in after claim is set
- Check browser console for token refresh
- Verify the claim was set correctly using Firebase Admin SDK

### Permission denied errors
- Verify Firebase Security Rules are updated
- Check that the user's ID token contains the admin claim
- Use `user.getIdTokenResult()` to inspect claims

## Important Notes

> [!WARNING]
> - Never set admin claims client-side
> - Always verify admin status in Security Rules
> - Regularly audit admin users
> - Use environment-specific admin accounts (dev, staging, prod)

## Current Admin User

The current admin user UID is: `PqKOX5yVc6X00D0KsHqalPKVgY93`

To set this user as admin, run:
```javascript
admin.auth().setCustomUserClaims('PqKOX5yVc6X00D0KsHqalPKVgY93', { admin: true });
```
