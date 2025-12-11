import React, { useState, useEffect } from 'react';
import { useFirebaseApp, doc, getCollectionPath, onSnapshot, collection, query, where, orderBy, deleteDoc } from '../hooks/useFirebaseApp';
import { SocialShareButtons } from '../components/SocialShareButtons';
import { Button } from '../components/Button';
import { AuthModal } from '../components/AuthModal';
import { User, LogOut, ShieldCheck, Activity, MailWarning, Volume2, VolumeX, Trash2, Heart } from 'lucide-react';
import { MessageOverlay } from '../components/MessageOverlay';
import { useSound } from '../context/SoundContext';

export const ProfileScreen = ({ navigate }) => {
    const { user, userId, signOut, sendEmailVerification, refreshUser, db } = useFirebaseApp();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [verifyEmailEnabled, setVerifyEmailEnabled] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [savedMoHis, setSavedMoHis] = useState([]);
    const [messageOverlay, setMessageOverlay] = useState({ isOpen: false, title: '', message: '' });

    const isGuest = !user || user.isAnonymous;
    const { isMuted, toggleMute } = useSound();

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

    // Fetch Saved MoHis
    useEffect(() => {
        if (!db || !userId) return;

        const q = query(
            collection(db, getCollectionPath('saved_mohis')),
            where('userId', '==', userId),
            orderBy('datetimeSaved', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSavedMoHis(items);
        }, (error) => {
            console.error("Error fetching saved MoHis:", error);
        });

        return () => unsubscribe();
    }, [db, userId]);

    // Refresh user on mount to check verification status
    useEffect(() => {
        if (user && !user.emailVerified && refreshUser) {
            refreshUser();
        }
    }, [user, refreshUser]);

    const handleResendVerification = async () => {
        if (user) {
            try {
                await sendEmailVerification(user);
                setVerificationSent(true);
                setMessageOverlay({
                    isOpen: true,
                    title: 'Email Sent',
                    message: "Verification email sent! Please check your inbox to verify your account."
                });
            } catch (error) {
                console.error("Error sending verification:", error);
                setMessageOverlay({
                    isOpen: true,
                    title: 'Error',
                    message: "Failed to send verification email. Please try again later.",
                    buttonColor: "red"
                });
            }
        }
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshUser();
        } catch (error) {
            console.error("Error refreshing user:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDeleteMoHi = async (id) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, getCollectionPath('saved_mohis'), id));
        } catch (error) {
            console.error("Error deleting saved MoHi:", error);
            setMessageOverlay({
                isOpen: true,
                title: 'Error',
                message: "Failed to delete item.",
                buttonColor: "red"
            });
        }
    };

    const generateShareMessage = () => {
        if (savedMoHis.length === 0) return "";
        let msg = "These are some MoHis that might be worth trying out:\n\n";
        savedMoHis.forEach(item => {
            msg += `- ${item.description}\n`;
        });
        msg += "\nCheck out the Human Genome Project at genomojo.com";
        return msg;
    };

    return (
        <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6">
            <h1 className="text-4xl font-extrabold text-mohi-600 dark:text-mohi-400 text-center">Your Profile</h1>

            {/* Identity Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-4 mb-4">
                    <div className={`p-3 rounded-full ${isGuest ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-600'}`}>
                        <User size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {isGuest ? 'Guest User' : (user.displayName || user.email)}
                        </h2>
                        {import.meta.env.DEV && (
                            <p className="text-sm text-gray-500 font-mono">
                                ID: {userId ? userId.substring(0, 8) + '...' : 'Loading...'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Sound Settings */}
                <div className="mb-6 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${isMuted ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 text-indigo-600'}`}>
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Sound Effects</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isMuted ? 'Sounds are muted' : 'Play sounds on interactions'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={toggleMute}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!isMuted ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                        <span className="sr-only">Toggle sound</span>
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${!isMuted ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                    </button>
                </div>

                {/* Email Verification Banner */}
                {verifyEmailEnabled && !isGuest && !user.emailVerified && (
                    <div className="mb-4 bg-orange-50 border-l-4 border-orange-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <MailWarning className="h-5 w-5 text-orange-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-orange-700">
                                    Your email is not verified. Please check your inbox.
                                </p>
                                <div className="flex gap-4 mt-2">
                                    <button
                                        onClick={handleResendVerification}
                                        disabled={verificationSent}
                                        className="text-sm font-medium text-orange-700 hover:text-orange-600 underline disabled:opacity-50 disabled:no-underline"
                                    >
                                        {verificationSent ? "Email Sent" : "Resend Email"}
                                    </button>
                                    <button
                                        onClick={handleManualRefresh}
                                        disabled={isRefreshing}
                                        className="text-sm font-medium text-orange-700 hover:text-orange-600 underline disabled:opacity-50 disabled:no-underline"
                                    >
                                        {isRefreshing ? "Checking..." : "I've Verified It"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isGuest ? (
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Activity className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        You are currently using a temporary guest account.
                                        Sign up to save your Mojo permanently!
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsAuthModalOpen(true)}
                            color="primary"
                            className="w-full"
                        >
                            Sign Up to Save Progress
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ShieldCheck className="h-5 w-5 text-green-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-700">
                                        Your account is linked and secure.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => {
                                signOut();
                                navigate('landing');
                            }}
                            color="gray"
                            className="w-full flex justify-center items-center"
                        >
                            <LogOut size={16} className="mr-2" /> Sign Out
                        </Button>
                    </div>
                )}
            </div>

            {/* My Saved MoHis Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2 mb-4">
                    <Heart size={20} className="text-pink-500" fill="currentColor" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Saved MoHis</h2>
                </div>

                {savedMoHis.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-600">
                        <p>You haven't saved any MoHis yet.</p>
                        <p className="text-sm mt-1">Tap the heart icon when voting on MoHis to save them here.</p>
                    </div>
                ) : (
                    <>
                        <ul className="space-y-3 mb-6">
                            {savedMoHis.map((item) => (
                                <li key={item.id} className="flex justify-between items-start p-3 bg-indigo-50 dark:bg-gray-700 rounded-lg group">
                                    <span className="text-gray-800 dark:text-gray-200 text-sm">{item.description}</span>
                                    <button
                                        onClick={() => handleDeleteMoHi(item.id)}
                                        className="text-gray-400 hover:text-red-500 ml-3 p-1 rounded-full hover:bg-white dark:hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Remove from list"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 text-center">Share your list:</p>
                            <SocialShareButtons
                                shareMessage={generateShareMessage()}
                                shareUrl="https://genomojo.com"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Stats Placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700 opacity-50">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">My Stats</h3>
                <p className="text-gray-500 text-center py-8">
                    Detailed stats coming soon...
                </p>
            </div>

            <Button onClick={() => navigate('landing')} color="gray" className="w-full">
                Back to Home
            </Button>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
            <MessageOverlay
                isOpen={messageOverlay.isOpen}
                onClose={() => setMessageOverlay({ ...messageOverlay, isOpen: false })}
                title={messageOverlay.title}
                message={messageOverlay.message}
                buttonColor={messageOverlay.buttonColor}
            />
        </div>
    );
};
