# Security Implementation Plan

## Overview
Implement critical security fixes to protect user data and prevent vulnerabilities.

## User Preferences
> [!NOTE]
> User is OK with profanities (community moderation handles this). Focus on preventing injection attacks only.

---

## 1. Environment Variables [COMPLETED]

### Files to Create
#### [NEW] [.env](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/.env)
```env
VITE_FIREBASE_API_KEY=AIzaSyBRuMT6-gMG7UnPvIAKKRx7fBbxhxXM9Dc
VITE_FIREBASE_AUTH_DOMAIN=genomojo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=genomojo
VITE_FIREBASE_STORAGE_BUCKET=genomojo.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=276966382378
VITE_FIREBASE_APP_ID=1:276966382378:web:cee6945ef286bfa2fd1c53
VITE_FIREBASE_MEASUREMENT_ID=G-163ELD6TJ2
```

#### [NEW] [.env.example](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/.env.example)
Template file for other developers.

### Files to Modify
#### [MODIFY] [useFirebaseApp.js](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/hooks/useFirebaseApp.js)
- Replace hardcoded config with `import.meta.env.VITE_*`
- Remove `ADMIN_UID` constant entirely

#### [MODIFY] [.gitignore](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/.gitignore)
- Add `.env` to prevent committing secrets

---

## 2. Admin Authorization with Custom Claims [COMPLETED]

### Server-Side Setup (Manual)
> [!IMPORTANT]
> This requires Firebase Admin SDK and cannot be done client-side. You'll need to:
> 1. Create a Firebase Cloud Function or use Firebase Admin SDK locally
> 2. Set custom claim: `admin.auth().setCustomUserClaims(uid, { admin: true })`

### Files to Modify
#### [MODIFY] [useFirebaseApp.js](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/hooks/useFirebaseApp.js)
- Update `onAuthStateChanged` to read custom claims
- Remove UID comparison logic

#### [NEW] [ADMIN_SETUP.md](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/ADMIN_SETUP.md)
Documentation for setting up admin users.

---

## 3. Input Sanitization [COMPLETED]

### Dependencies
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

### Files to Modify
#### [MODIFY] [SubmitScreen.jsx](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/screens/SubmitScreen.jsx)
- Import DOMPurify
- Sanitize `description` before submission
- Prevent XSS attacks

#### [MODIFY] [IdentityBuilder.jsx](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/features/IdentityBuilder/IdentityBuilder.jsx)
- Sanitize custom trait names

---

## 4. Memory Leak Fixes [COMPLETED]

#### [MODIFY] [ThreeScene.jsx](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/features/IdentityBuilder/ThreeScene.jsx)
- Dispose textures in cleanup (line 140-143)
- Dispose geometries
- Add proper cleanup in useEffect return

---

## 5. Additional Fixes [COMPLETED]

#### [MODIFY] [SubmitScreen.jsx](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/screens/SubmitScreen.jsx)
- Replace `document.execCommand` with Clipboard API

#### [NEW] [ErrorBoundary.jsx](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/components/ErrorBoundary.jsx)
- Create error boundary component

---

## Verification Plan

### Security Testing
1. Verify `.env` is not committed to git
2. Test admin access with and without custom claims
3. Test XSS prevention with malicious input
4. Verify no memory leaks with Chrome DevTools

### Manual Steps
1. Set up Firebase Custom Claims for admin user
2. Test clipboard functionality in modern browsers
3. Trigger error boundary with intentional error
