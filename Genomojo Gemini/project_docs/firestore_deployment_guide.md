# Deploying Firestore Security Rules and Indexes

## Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged in to Firebase (`firebase login`)
- Firebase project initialized (`firebase init` - already done)

## Step-by-Step Deployment

### 1. Test Rules Locally (Optional but Recommended)

Install Firebase Emulator Suite:
```bash
firebase init emulators
# Select Firestore
```

Start emulators:
```bash
firebase emulators:start
```

Update your app to use emulators (in development):
```javascript
// src/hooks/useFirebaseApp.js
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(dbInstance, 'localhost', 8080);
}
```

Run your app and test voting/submission flows.

### 2. Deploy Security Rules

Deploy rules to production:
```bash
firebase deploy --only firestore:rules
```

Expected output:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/genomojo/overview
```

### 3. Deploy Indexes

Deploy indexes to production:
```bash
firebase deploy --only firestore:indexes
```

**Note**: Index creation can take several minutes. Monitor progress in Firebase Console:
https://console.firebase.google.com/project/genomojo/firestore/indexes

### 4. Verify Deployment

#### Check Rules in Firebase Console
1. Go to Firebase Console → Firestore Database → Rules
2. Verify the deployed rules match `firestore.rules`

#### Check Indexes
1. Go to Firebase Console → Firestore Database → Indexes
2. Wait for all indexes to show status: "Enabled" (not "Building")

#### Test in Production
1. Open app in incognito
2. Try to vote (should work)
3. Open browser dev tools console
4. Try to manually write invalid data:
```javascript
// Should fail with permission denied
db.collection('artifacts/genomojo/public/data/mojo_items').add({
  description: "hack",
  linkToDemographicID: "someone-else"
});
```

## Troubleshooting

### Issue: "Permission Denied" for Valid Operations

**Cause**: Rules might be too restrictive or auth state not properly set

**Fix**: 
1. Check browser console for auth status
2. Verify user is signed in (anonymous or authenticated)
3. Check rule conditions match your data structure

### Issue: "Index Required" Error

**Cause**: Missing or still-building index

**Fix**:
1. Check Firebase Console → Firestore → Indexes
2. Wait for indexes to finish building
3. If error persists, check `firestore.indexes.json` matches console

### Issue: Rules Deployment Failed

**Cause**: Syntax error in rules file

**Fix**:
```bash
# Check rules syntax
firebase firestore:rules:check firestore.rules

# If errors, fix and redeploy
firebase deploy --only firestore:rules
```

## Rollback Instructions

If deployment causes critical issues:

1. **Quick Fix**: Deploy permissive rules temporarily
```bash
# Create temporary-rules.txt:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

# Deploy
firebase deploy --only firestore:rules --config temporary-rules.txt
```

2. **Proper Fix**: 
   - Identify the issue
   - Fix `firestore.rules`
   - Redeploy

## Post-Deployment Checklist

- [ ] Rules deployed successfully
- [ ] Indexes show "Enabled" status in Firebase Console
- [ ] Anonymous user can vote
- [ ] Authenticated user can submit items
- [ ] User cannot manipulate other users' data
- [ ] Stats are read-only for clients
- [ ] Admin can delete items (test in admin console)

## Monitoring

After deployment, monitor for:
- Spike in permission denied errors (Firebase Console → Firestore → Usage)
- Failed queries due to missing indexes
- Changes in read/write costs

Set up Firebase Performance Monitoring alerts for unusual patterns.
