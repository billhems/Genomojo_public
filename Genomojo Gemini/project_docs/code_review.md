# Code Review - Genomojo Gemini Application

## Executive Summary

This code review identifies **critical security vulnerabilities**, **performance issues**, and **memory leak risks** in the Genomojo Gemini application. The most urgent issues require immediate attention to protect user data and ensure application stability.

---

## 🚨 CRITICAL SECURITY ISSUES

### 1. **Exposed Firebase Credentials** (SEVERITY: CRITICAL)
**File**: [`useFirebaseApp.js:7-15`](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/hooks/useFirebaseApp.js#L7-L15)

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBRuMT6-gMG7UnPvIAKKRx7fBbxhxXM9Dc",
    authDomain: "genomojo.firebaseapp.com",
    projectId: "genomojo",
    // ... other credentials
};
```

**Problem**: Firebase configuration with API keys is hardcoded in client-side code.

**Risk**: While Firebase API keys are meant to be public, the **Admin UID is also exposed** (line 18), which combined with weak security rules could allow unauthorized access.

**Recommendation**:
- Move sensitive configuration to environment variables (`.env` files)
- **NEVER** expose admin UIDs in client code
- Implement proper Firebase Security Rules
- Use Firebase App Check to prevent API abuse

---

### 2. **Hardcoded Admin UID** (SEVERITY: CRITICAL)
**File**: [`useFirebaseApp.js:18`](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/hooks/useFirebaseApp.js#L18)

```javascript
const ADMIN_UID = "PqKOX5yVc6X00D0KsHqalPKVgY93";
```

**Problem**: Admin user ID is hardcoded and publicly visible.

**Risk**: Attackers can identify the admin account and target it specifically.

**Recommendation**:
- Use Firebase Custom Claims for role-based access control
- Implement server-side admin verification
- Remove UID from client code entirely

---

### 3. **Client-Side Admin Authorization** (SEVERITY: HIGH)
**File**: [`useFirebaseApp.js:54`](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/hooks/useFirebaseApp.js#L54)

```javascript
setIsAdmin(user.uid === ADMIN_UID);
```

**Problem**: Admin status is determined client-side and can be manipulated.

**Risk**: Malicious users could bypass admin checks by modifying client code.

**Recommendation**:
- Use Firebase Custom Claims set server-side
- Verify admin status in Firebase Security Rules
- Never trust client-side authorization

---

### 4. **Insufficient Input Validation** (SEVERITY: MEDIUM)
**File**: [`SubmitScreen.jsx:165-172`](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/screens/SubmitScreen.jsx#L165-L172)

**Problem**: Only length validation on user input, no sanitization or content filtering.

**Risk**: XSS attacks, injection attacks, inappropriate content submission.

**Recommendation**:
- Implement content sanitization (DOMPurify)
- Add profanity filtering
- Validate input on both client and server (Firebase Functions)

---

## ⚠️ MEMORY LEAKS & PERFORMANCE ISSUES

### 5. **Missing Cleanup in ThreeScene** (SEVERITY: HIGH)
**File**: [`ThreeScene.jsx:36-132`](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/features/IdentityBuilder/ThreeScene.jsx#L36-L132)

**Problem**: Three.js objects (geometries, materials, textures) are not properly disposed.

**Memory Leak Risk**:
```javascript
// Line 140-143: Materials are disposed, but textures are not
while (groupRef.current.children.length > 0) {
    const child = groupRef.current.children[0];
    groupRef.current.remove(child);
    if (child.material) child.material.dispose(); // ❌ Texture not disposed
}
```

**Impact**: Memory leaks on every data update, especially problematic with frequent trait changes.

**Recommendation**:
```javascript
// Proper cleanup
if (child.material) {
    if (child.material.map) child.material.map.dispose(); // Dispose texture
    child.material.dispose();
}
if (child.geometry) child.geometry.dispose();
```

---

### 6. **Infinite Re-render Risk in VoteScreen** (SEVERITY: MEDIUM)
**File**: [`VoteScreen.jsx:159-163`](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/screens/VoteScreen.jsx#L159-L163)

**Problem**: `fetchRandomItem` is in useEffect dependency array but is recreated on every render.

```javascript
useEffect(() => {
    if (isAuthReady && userId) {
        fetchRandomItem();
    }
}, [isAuthReady, userId, fetchRandomItem]); // ❌ fetchRandomItem changes every render
```

**Risk**: Potential infinite loop if `fetchRandomItem` dependencies change.

**Recommendation**:
```javascript
// Remove fetchRandomItem from dependencies or use useCallback properly
}, [isAuthReady, userId]); // ✅ Only depend on stable values
```

---

### 7. **Excessive Firestore Reads** (SEVERITY: MEDIUM)
**File**: [`VoteScreen.jsx:99-134`](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/screens/VoteScreen.jsx#L99-L134)

**Problem**: Fetches 50 items on every vote, then filters client-side.

```javascript
const itemsQuery = query(itemsRef, orderBy('datetimeSubmitted', 'desc'), limit(50));
```

**Cost Impact**: Unnecessary Firestore reads = higher billing costs.

**Recommendation**:
- Use compound queries to filter server-side
- Implement pagination
- Cache previously fetched items
- Consider using `where('linkToDemographicID', '!=', userId)` (requires composite index)

---

### 8. **Unoptimized Re-renders in MainApp** (SEVERITY: LOW)
**File**: [`MainApp.jsx:67-123`](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/MainApp.jsx#L67-L123)

**Problem**: Entire app re-renders on every navigation change.

**Recommendation**:
- Use `React.memo()` for screen components
- Implement route-based code splitting with `React.lazy()`
- Memoize navigation function

---

## 🔧 BEST PRACTICES VIOLATIONS

### 9. **Global Firebase Instances** (SEVERITY: MEDIUM)
**File**: [`useFirebaseApp.js:21-42`](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/hooks/useFirebaseApp.js#L21-L42)

**Problem**: Firebase instances are global variables, not properly managed.

```javascript
let app, authInstance, dbInstance; // ❌ Global mutable state

if (!app) {
    try {
        app = initializeApp(firebaseConfig);
        // ...
    }
}
```

**Issues**:
- Violates React best practices
- Difficult to test
- Can cause issues with hot module replacement
- Not SSR-friendly

**Recommendation**:
- Use React Context or singleton pattern properly
- Initialize in a separate module
- Make instances immutable

---

### 10. **Deprecated `document.execCommand`** (SEVERITY: LOW)
**File**: [`SubmitScreen.jsx:16`](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/screens/SubmitScreen.jsx#L16)

```javascript
document.execCommand('copy', false, shareMessage); // ❌ Deprecated API
```

**Recommendation**:
```javascript
// Use modern Clipboard API
navigator.clipboard.writeText(shareMessage)
    .then(() => alert("Copied!"))
    .catch(err => console.error(err));
```

---

### 11. **Missing Error Boundaries** (SEVERITY: MEDIUM)

**Problem**: No error boundaries to catch React errors.

**Risk**: Single component error crashes entire app.

**Recommendation**:
- Implement Error Boundary components
- Add error logging (Sentry, LogRocket)
- Provide fallback UI

---

### 12. **Inconsistent State Management** (SEVERITY: LOW)

**Problem**: Mix of local state, props drilling, and no global state management.

**Files**: Multiple components pass `navigate` function through props.

**Recommendation**:
- Implement React Router for navigation
- Use Context API or Zustand for global state
- Reduce props drilling

---

## 🎯 PERFORMANCE OPTIMIZATIONS

### 13. **Missing Memoization in VoteScreen**
**File**: [`VoteScreen.jsx:82-97`](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/screens/VoteScreen.jsx#L82-L97)

**Recommendation**:
```javascript
const themeClasses = useMemo(() => ({
    mohi: { /* ... */ },
    molo: { /* ... */ }
}), []); // ✅ Memoize static object
```

---

### 14. **Inefficient Array Operations**
**File**: [`VoteScreen.jsx:109-110`](file:///c:/Users/billh/OneDrive/Documents/Genomojo/Code/Genomojo%20Gemini/src/screens/VoteScreen.jsx#L109-L110)

```javascript
const allItems = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
const validItems = allItems.filter(item => item.linkToDemographicID !== userId && !item.flaggedAsOffensive);
```

**Recommendation**:
```javascript
// Combine map and filter
const validItems = itemsSnapshot.docs
    .filter(doc => {
        const data = doc.data();
        return data.linkToDemographicID !== userId && !data.flaggedAsOffensive;
    })
    .map(doc => ({ id: doc.id, ...doc.data() }));
```

---

### 15. **No Code Splitting**

**Problem**: All code loads on initial page load.

**Recommendation**:
```javascript
// Lazy load screens
const VoteScreen = React.lazy(() => import('./screens/VoteScreen'));
const SubmitScreen = React.lazy(() => import('./screens/SubmitScreen'));
```

---

## 📊 ADDITIONAL CONCERNS

### 16. **Console Logs in Production** (SEVERITY: LOW)
**Files**: Multiple files contain `console.log()` statements.

**Recommendation**: Remove or use environment-based logging.

---

### 17. **Missing TypeScript** (SEVERITY: LOW)

**Problem**: No type safety, prone to runtime errors.

**Recommendation**: Migrate to TypeScript for better developer experience and fewer bugs.

---

### 18. **No Loading States for Firestore Operations**

**Problem**: Users don't see feedback during async operations.

**Recommendation**: Add loading indicators for all Firestore operations.

---

## 🎯 PRIORITY ACTION ITEMS

### Immediate (This Week)
1. ✅ Move Firebase config to environment variables
2. ✅ Remove hardcoded Admin UID
3. ✅ Implement proper admin authorization with Custom Claims
4. ✅ Fix ThreeScene memory leaks

### Short Term (This Month)
5. ✅ Add input sanitization
6. ✅ Optimize Firestore queries
7. ✅ Implement Error Boundaries
8. ✅ Add proper cleanup in all useEffect hooks

### Long Term (Next Quarter)
9. ✅ Migrate to TypeScript
10. ✅ Implement React Router
11. ✅ Add code splitting
12. ✅ Set up monitoring (Sentry, Analytics)

---

## 📈 ESTIMATED IMPACT

| Issue | Severity | Effort | Impact |
|-------|----------|--------|--------|
| Exposed credentials | Critical | Low | High |
| Admin UID exposure | Critical | Low | High |
| Memory leaks | High | Medium | High |
| Firestore optimization | Medium | Medium | Medium |
| Error boundaries | Medium | Low | Medium |

---

## 🔍 TESTING RECOMMENDATIONS

1. **Security Testing**: Penetration testing for admin access
2. **Performance Testing**: Load testing with 1000+ concurrent users
3. **Memory Profiling**: Use Chrome DevTools to track memory leaks
4. **Accessibility Testing**: WCAG 2.1 compliance
5. **Unit Testing**: Add Jest/React Testing Library tests

---

## 📚 RESOURCES

- [Firebase Security Rules Best Practices](https://firebase.google.com/docs/rules/basics)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Three.js Memory Management](https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
