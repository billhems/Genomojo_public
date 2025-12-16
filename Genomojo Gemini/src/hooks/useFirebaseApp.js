import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    linkWithPopup,
    EmailAuthProvider,
    linkWithCredential,
    createUserWithEmailAndPassword,
    signInWithPopup,
    connectAuthEmulator,
    sendEmailVerification,
    applyActionCode,
    sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, addDoc, onSnapshot, collection, query, where, updateDoc, getDocs, getDoc, orderBy, limit, startAfter, writeBatch, deleteDoc, deleteField } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { v4 as uuidv4 } from 'uuid';


const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Global Firebase instances
let app, authInstance, dbInstance, storageInstance, analyticsInstance;
let isSigningIn = false;

const getCollectionPath = (collectionName) => {
    // Note: When running locally, you must provide your project's App ID in firebaseConfig for this to work correctly.
    const appId = firebaseConfig.projectId || 'default-app-id';
    return `artifacts/${appId}/public/data/${collectionName}`;
};

// Initialize Firebase and Authentication
if (!app) {
    try {
        console.log("Initializing Firebase with Project ID:", firebaseConfig.projectId);
        app = initializeApp(firebaseConfig);
        authInstance = getAuth(app);
        dbInstance = getFirestore(app);
        storageInstance = getStorage(app);

        // Only initialize analytics if measurement ID is present
        if (firebaseConfig.measurementId) {
            analyticsInstance = getAnalytics(app);
        } else {
            console.warn("Firebase Analytics not initialized: VITE_FIREBASE_MEASUREMENT_ID is missing.");
        }

        // Connect to emulators in development
        // Connect to emulators in development
        // Connect to emulators in development OR if running locally (e.g. via firebase hosting emulator)
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if ((import.meta.env.DEV || isLocal) && import.meta.env.VITE_USE_EMULATORS === 'true') {
            // Use window.location.hostname to support both localhost and LAN IPs (for mobile testing)
            const emulatorHost = window.location.hostname;

            connectAuthEmulator(authInstance, `http://${emulatorHost}:9099`, { disableWarnings: true });

            // Revert to localhost + long polling (historical "safe mode" for macOS)
            connectFirestoreEmulator(dbInstance, emulatorHost, 8090, { experimentalForceLongPolling: true });

            connectStorageEmulator(storageInstance, emulatorHost, 9199);
            console.log(`🔧 Connected to Firebase emulators at ${emulatorHost}`);
        }
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
}

export const useFirebaseApp = () => {
    const [userId, setUserId] = useState(null);
    const [user, setUser] = useState(null); // Full user object
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (authInstance) {
            const unsubscribe = onAuthStateChanged(authInstance, async (currentUser) => {
                if (currentUser) {
                    setUserId(currentUser.uid);
                    setUser(currentUser);

                    // Check for admin custom claim (server-side set)
                    const tokenResult = await currentUser.getIdTokenResult();
                    setIsAdmin(!!tokenResult.claims.admin);
                } else {
                    // No user is signed in.

                    // Prevent multiple simultaneous sign-in attempts (Auth Thrashing)
                    if (isSigningIn) return;

                    // Attempt to sign in anonymously to maintain "Guest" status in Firebase
                    // This ensures we have a UID for database operations if needed.
                    try {
                        isSigningIn = true;
                        await signInAnonymously(authInstance);
                        isSigningIn = false;
                        // The onAuthStateChanged will fire again with the new anon user
                        return;
                    } catch (e) {
                        console.error("Anonymous sign in failed:", e);
                        isSigningIn = false;
                    }

                    // Fallback: Use Guest ID if auth fails completely
                    let guestId = localStorage.getItem('genomojo_guest_id');
                    if (!guestId) {
                        guestId = 'guest_' + uuidv4();
                        localStorage.setItem('genomojo_guest_id', guestId);
                    }
                    setUserId(guestId);
                    setUser(null);
                    setIsAdmin(false);
                }
                setIsAuthReady(true);
            });
            return () => unsubscribe();
        }
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(authInstance, email, password);

            // Force refresh
            await userCredential.user.reload();
            const refreshedUser = authInstance.currentUser;
            setUser(refreshedUser);

            return { success: true, user: refreshedUser };
        } catch (error) {
            console.error("Login failed:", error);
            return { success: false, error: error.message };
        }
    }, []);

    const loginAdmin = useCallback(async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
            // Check custom claims instead of hardcoded UID
            const tokenResult = await userCredential.user.getIdTokenResult();
            if (tokenResult.claims.admin) {
                return true;
            }
            // If not admin, sign them out immediately
            await signOut(authInstance);
            return false;
        } catch (error) {
            console.error("Admin login failed:", error);
            return false;
        }
    }, []);

    const linkAccountWithGoogle = useCallback(async () => {
        try {
            const provider = new GoogleAuthProvider();
            let result;
            if (authInstance.currentUser) {
                // Link existing anonymous user
                result = await linkWithPopup(authInstance.currentUser, provider);
            } else {
                // Sign in / Sign up new user
                result = await signInWithPopup(authInstance, provider);
            }

            // Force refresh
            await result.user.reload();
            const refreshedUser = authInstance.currentUser;
            setUser(refreshedUser);

            return { success: true, user: refreshedUser };
        } catch (error) {
            console.error("Error linking/signing in with Google:", error);
            return { success: false, error: error.message };
        }
    }, []);

    const linkAccountWithEmail = useCallback(async (email, password) => {
        try {
            let result;
            if (authInstance.currentUser && authInstance.currentUser.isAnonymous) {
                // Link existing anonymous user
                const credential = EmailAuthProvider.credential(email, password);
                result = await linkWithCredential(authInstance.currentUser, credential);
            } else {
                // Create new user (Sign Up)
                result = await createUserWithEmailAndPassword(authInstance, email, password);
            }

            // Force refresh of user object to update isAnonymous status
            await result.user.reload();
            const refreshedUser = authInstance.currentUser;
            console.log("useFirebaseApp: User reloaded. isAnonymous:", refreshedUser?.isAnonymous, "uid:", refreshedUser?.uid);
            setUser(refreshedUser); // Force new object reference

            return { success: true, user: refreshedUser };
        } catch (error) {
            console.error("Error linking/creating account with Email:", error);
            return { success: false, error: error.message };
        }
    }, []);

    const resetGuestId = useCallback(async () => {
        const newGuestId = 'guest_' + uuidv4();
        localStorage.setItem('genomojo_guest_id', newGuestId);

        // Sign out of Firebase to force fallback to Guest ID
        if (authInstance) {
            try {
                await signOut(authInstance);
            } catch (error) {
                console.error("Error signing out for guest reset:", error);
            }
        }

        setUserId(newGuestId);
        setUser(null);
        setIsAdmin(false);
        console.log("Guest ID reset to:", newGuestId);
    }, []);

    const refreshUser = useCallback(async () => {
        if (authInstance.currentUser) {
            try {
                await authInstance.currentUser.reload();
                const refreshedUser = authInstance.currentUser;
                setUser(refreshedUser);
                return refreshedUser;
            } catch (error) {
                console.error("Error refreshing user:", error);
                throw error;
            }
        }
    }, []);

    return {
        db: dbInstance,
        auth: authInstance,
        storage: storageInstance,
        analytics: analyticsInstance,
        userId,
        user,
        isAdmin,
        isAuthReady,
        login,
        loginAdmin,
        linkAccountWithGoogle,
        linkAccountWithEmail,
        resetGuestId,
        linkAccountWithEmail,
        resetGuestId,
        signOut: () => signOut(authInstance),
        sendEmailVerification: (user) => sendEmailVerification(user),
        applyActionCode: (code) => applyActionCode(authInstance, code),
        refreshUser,
        sendPasswordResetEmail: (email) => sendPasswordResetEmail(authInstance, email)
    };
};

// Export Firebase utility functions
export { getCollectionPath, collection, doc, addDoc, setDoc, updateDoc, onSnapshot, query, where, getDocs, getDoc, orderBy, limit, startAfter, writeBatch, deleteDoc, deleteField };