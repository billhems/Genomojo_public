import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useFirebaseApp, doc, getCollectionPath, onSnapshot } from '../hooks/useFirebaseApp';
import { Mail, Chrome } from 'lucide-react';
import { MessageOverlay } from './MessageOverlay';

export const AuthModal = ({ isOpen, onClose, title, initialMode = 'select', onSuccess }) => {
    const { linkAccountWithGoogle, linkAccountWithEmail, login, sendEmailVerification, sendPasswordResetEmail, db } = useFirebaseApp();
    const [mode, setMode] = useState(initialMode); // 'select', 'email_signup', 'email_signin', 'forgot_password'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifyEmailEnabled, setVerifyEmailEnabled] = useState(false);
    const [messageOverlay, setMessageOverlay] = useState({ isOpen: false, title: '', message: '' });

    // ... (useEffect for feature toggle remains same)

    // ... (handleGoogleLink, handleEmailLink, handleEmailSignIn remain same)

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!email) {
            setError("Please enter your email address.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            await sendPasswordResetEmail(email);
            setLoading(false);
            setMessageOverlay({
                isOpen: true,
                title: 'Reset Link Sent',
                message: "Check your email for a link to reset your password.",
                buttonColor: "green"
            });
            setMode('email_signin');
        } catch (err) {
            console.error("Error sending password reset email:", err);
            setLoading(false);
            setError(err.message || "Failed to send reset email. Please try again.");
        }
    };

    // Fetch feature toggle
    useEffect(() => {
        if (!db) return;
        const configRef = doc(db, getCollectionPath('config'), 'features');
        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                setVerifyEmailEnabled(docSnap.data().verifyEmail || false);
            }
        });
        return () => unsubscribe();
    }, [db]);

    const handleGoogleLink = async () => {
        setLoading(true);
        setError('');
        const result = await linkAccountWithGoogle();
        setLoading(false);
        if (result.success) {
            onSuccess?.();
            onClose();
        } else {
            setError(result.error);
        }
    };

    const handleEmailLink = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const result = await linkAccountWithEmail(email, password);

        if (result.success) {
            if (verifyEmailEnabled) {
                try {
                    await sendEmailVerification(result.user);
                    // Show success overlay instead of alert
                    setMessageOverlay({
                        isOpen: true,
                        title: 'Verification Email Sent',
                        message: "Please check your inbox to verify your account.",
                        buttonColor: "green"
                    });
                    // Don't close the modal immediately so they see the overlay? 
                    // MessageOverlay is a separate modal, so we can close this one OR keep it open.
                    // If we close this one, the MessageOverlay might unmount if it's a child of this component?
                    // No, AuthModal is likely mounted by a parent.
                    // But if AuthModal is closed by parent (onClose), then MessageOverlay (child of AuthModal) will unmount.
                    // So we must NOT call onClose() immediately if we want to show the overlay.
                    // We should wait for the overlay to be closed.
                    return;
                } catch (err) {
                    console.error("Error sending verification email:", err);
                    setMessageOverlay({
                        isOpen: true,
                        title: 'Verification Failed',
                        message: "Account created, but failed to send verification email. You can resend it from your profile.",
                        buttonColor: "red"
                    });
                    return;
                }
            }
            setLoading(false);
            onSuccess?.();
            onClose();
        } else {
            setLoading(false);
            setError(result.error);
        }
    };

    const handleEmailSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const result = await login(email, password);
        setLoading(false);
        if (result.success) {
            onSuccess?.();
            onClose();
        } else {
            setError(result.error);
        }
    };

    const resetForm = () => {
        setMode(initialMode);
        setError('');
        setEmail('');
        setPassword('');
    };

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
        }
    }, [isOpen, initialMode]);

    const handleOverlayClose = () => {
        setMessageOverlay({ ...messageOverlay, isOpen: false });
        onSuccess?.();
        onClose();
    };



    // RE-WRITING TO FIX SCOPE ISSUE
    // I need to update the destructuring at the top of the component first.

    return (
        <>
            <Modal isOpen={isOpen} onClose={() => { resetForm(); onClose(); }} title={title || (mode === 'email_signin' ? "Sign In" : mode === 'forgot_password' ? "Reset Password" : "Save Your Progress")}>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {mode === 'email_signin'
                        ? "Welcome back! Sign in to access your account."
                        : "Sign up to save your votes and submissions permanently, so you can access them on any device."}
                </p>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {mode === 'select' && (
                    <div className="space-y-3">
                        <Button
                            onClick={handleGoogleLink}
                            disabled={loading}
                            color="custom"
                            className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex justify-center items-center"
                        >
                            <Chrome size={20} className="mr-2 text-blue-500" />
                            Continue with Google
                        </Button>

                        <Button
                            onClick={() => setMode('email_signup')}
                            disabled={loading}
                            color="custom"
                            className="w-full bg-gray-800 text-white hover:bg-gray-900 flex justify-center items-center"
                        >
                            <Mail size={20} className="mr-2" />
                            Sign up with Email
                        </Button>

                        <div className="text-center pt-4">
                            <p className="text-sm text-gray-500">
                                Already have an account?{' '}
                                <button
                                    onClick={() => setMode('email_signin')}
                                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                                >
                                    Sign In
                                </button>
                            </p>
                        </div>
                    </div>
                )}

                {(mode === 'email_signup' || mode === 'email_signin') && (
                    <form onSubmit={mode === 'email_signup' ? handleEmailLink : handleEmailSignIn} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                            />
                            {mode === 'email_signin' && (
                                <div className="text-right mt-1">
                                    <button
                                        type="button"
                                        onClick={() => { setError(''); setMode('forgot_password'); }}
                                        className="text-xs text-indigo-600 hover:text-indigo-500"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <button
                                type="button"
                                onClick={() => setMode('select')}
                                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                Back
                            </button>
                            <Button type="submit" disabled={loading} color="primary">
                                {loading ? (mode === 'email_signup' ? 'Linking...' : 'Signing In...') : (mode === 'email_signup' ? 'Sign Up' : 'Sign In')}
                            </Button>
                        </div>
                    </form>
                )}

                {mode === 'forgot_password' && (
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <button
                                type="button"
                                onClick={() => { setError(''); setMode('email_signin'); }}
                                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                Back to Sign In
                            </button>
                            <Button type="submit" disabled={loading} color="primary">
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
            <MessageOverlay
                isOpen={messageOverlay.isOpen}
                onClose={handleOverlayClose}
                title={messageOverlay.title}
                message={messageOverlay.message}
                buttonColor={messageOverlay.buttonColor}
            />
        </>
    );
};
