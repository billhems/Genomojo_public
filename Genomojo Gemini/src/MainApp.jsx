import React, { useState, useEffect } from 'react';
import { SoundProvider } from './context/SoundContext';

import { useFirebaseApp, doc, getCollectionPath, onSnapshot, getDoc } from './hooks/useFirebaseApp';
import { LandingScreen } from './screens/LandingScreen';
import { AboutYouScreen } from './screens/AboutYouScreen';
import { SubmitScreen } from './screens/SubmitScreen';
import { VoteScreen } from './screens/VoteScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AdminLoginScreen } from './admin/AdminLoginScreen';
import { AdminDashboard } from './admin/AdminDashboard';
import IdentityBuilder from './features/IdentityBuilder/IdentityBuilder';
import { LoginOverlay } from './components/LoginOverlay';
import { AuthModal } from './components/AuthModal';
import { EmailVerificationScreen } from './screens/EmailVerificationScreen';
import { LogOut, Home, Send, CheckCircle, UserCog, User, Fingerprint } from 'lucide-react';
import { Button } from './components/Button';
import { ErrorBoundary } from './components/ErrorBoundary';
import GenomoLogoPng from './content/Genologo.png';

const NavItem = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center p-2 text-xs transition duration-150 ${isActive ? 'text-mohi-600 dark:text-mohi-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-mohi-500'
            }`}
    >
        <Icon size={20} />
        <span className="mt-1 hidden sm:block">{label}</span>
    </button>
);

const MobileBottomNav = ({ currentPage, navigate }) => {
    // Only show general navigation items on mobile
    const navItems = [
        { page: 'landing', label: 'Home', icon: Home },
        { page: 'about_you', label: 'About You', icon: Fingerprint },
        { page: 'submit', label: 'Submit', icon: Send },
        { page: 'vote', label: 'Vote', icon: CheckCircle },
        { page: 'profile', label: 'Profile', icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-xl sm:hidden z-40">
            <div className="flex justify-around items-center h-16 max-w-xl mx-auto">
                {navItems.map(item => (
                    <NavItem
                        key={item.page}
                        icon={item.icon}
                        label={item.label}
                        isActive={currentPage === item.page}
                        onClick={() => navigate(item.page)}
                    />
                ))}
            </div>
        </div>
    );
};


const MainAppLayout = ({ children, navigate, currentPage }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-0">
        {/* Desktop Header */}
        <header className="hidden sm:flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md">
            <div className="flex items-center space-x-2">
                <img src={GenomoLogoPng} alt="Genomojo Logo" className="h-8" />
                <h1 className="text-2xl font-extrabold text-mohi-600 dark:text-mohi-400">Genomojo</h1>
            </div>
            <div className="flex items-center space-x-4">
                <NavItem icon={Home} label="Home" onClick={() => navigate('landing')} isActive={currentPage === 'landing'} />
                <NavItem icon={Fingerprint} label="About You" onClick={() => navigate('about_you')} isActive={currentPage === 'about_you'} />
                <NavItem icon={Send} label="Submit" onClick={() => navigate('submit')} isActive={currentPage === 'submit'} />
                <NavItem icon={CheckCircle} label="Vote" onClick={() => navigate('vote')} isActive={currentPage === 'vote'} />
                <NavItem icon={User} label="Profile" onClick={() => navigate('profile')} isActive={currentPage === 'profile'} />
            </div>
        </header>

        <main className="pt-4 sm:pt-8 pb-16 sm:pb-8">
            <ErrorBoundary>
                {children}
            </ErrorBoundary>
        </main>
    </div>
);

export const App = () => {
    console.log("MainApp.jsx: App component rendering");
    const { isAuthReady, isAdmin, signOut, db, userId, user } = useFirebaseApp();
    const [currentPage, setCurrentPage] = useState('landing');
    const [submitType, setSubmitType] = useState('H');
    const [hasVisitedDemographics, setHasVisitedDemographics] = useState(false); // Gating state

    // KAN-119: Login Before Landing
    const [loginBeforeLandingEnabled, setLoginBeforeLandingEnabled] = useState(false);
    const [showLoginOverlay, setShowLoginOverlay] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState('select');
    const [authModalTitle, setAuthModalTitle] = useState('');



    // ... (existing imports)

    // ... (inside App component)

    useEffect(() => {
        const path = window.location.pathname;
        if (path === '/admin') {
            setCurrentPage('admin_login');
        } else if (path === '/verify_email' || new URLSearchParams(window.location.search).get('mode') === 'verifyEmail') {
            // Handle both explicit path and query param detection (common in Firebase)
            setCurrentPage('verify_email');
        }
    }, []);

    // ... (inside renderContent)

    // 1. Listen to Feature Toggle
    useEffect(() => {
        if (!db) return;
        const configRef = doc(db, getCollectionPath('config'), 'features');
        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                setLoginBeforeLandingEnabled(docSnap.data().loginBeforeLanding || false);
            }
        });
        return () => unsubscribe();
    }, [db]);

    // Check for existing demographics to unlock features
    useEffect(() => {
        if (!db || !userId) return;

        // Skip check for local guest IDs (unauthenticated)
        if (userId.startsWith('guest_')) {
            return;
        }

        const checkDemographics = async () => {
            try {
                const docRef = doc(db, getCollectionPath('demographics'), userId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    console.log("MainApp: Found existing demographics for user, unlocking features.");
                    setHasVisitedDemographics(true);
                }
            } catch (e) {
                console.error("Error checking demographics:", e);
            }
        };
        checkDemographics();
    }, [db, userId]);

    // 2. Control Overlay Visibility
    useEffect(() => {
        console.log("MainApp: Effect Triggered. isAuthReady:", isAuthReady, "loginBeforeLandingEnabled:", loginBeforeLandingEnabled, "userId:", userId);

        // Wait for auth to be ready
        if (!isAuthReady) return;

        // If feature is disabled, ensure overlay is hidden
        if (!loginBeforeLandingEnabled) {
            console.log("MainApp: Feature disabled.");
            setShowLoginOverlay(false);
            return;
        }

        // Feature is ENABLED.

        // If user is fully logged in (not anonymous), hide overlay
        // Check if they have provider data OR an email
        if (user && ((user.providerData && user.providerData.length > 0) || user.email)) {
            setShowLoginOverlay(false);
            setAuthModalOpen(false); // Also close modal if open
            return;
        }

        // If user is anonymous (Guest) OR not logged in at all
        // Note: After linking an anonymous account, isAnonymous might still be true.
        // We check providerData AND email. If they have an email, they are not anonymous.
        const isEffectiveAnonymous = (user?.isAnonymous && !user.email && (!user.providerData || user.providerData.length === 0)) || !userId;

        const hasDismissed = sessionStorage.getItem('login_overlay_dismissed');

        // Show overlay if they are effectively anonymous AND haven't dismissed it
        if (isEffectiveAnonymous && !hasDismissed) {
            setShowLoginOverlay(true);
        } else {
            setShowLoginOverlay(false);
        }

    }, [isAuthReady, loginBeforeLandingEnabled, userId, user]);

    // Removed separate effect for user login to avoid conflicts

    const navigate = (page, type = 'H') => {
        setCurrentPage(page);
        if (page === 'submit') {
            setSubmitType(type);
        }
    };

    const renderContent = () => {
        if (!isAuthReady) {
            return <div className="text-center p-10 text-gray-500">Connecting to Firebase...</div>;
        }

        switch (currentPage) {
            case 'landing':
                return <LandingScreen
                    navigate={navigate}
                    hasVisitedDemographics={hasVisitedDemographics}
                    setHasVisitedDemographics={setHasVisitedDemographics}
                />;
            case 'about_you':
                return <AboutYouScreen
                    navigate={navigate}
                    setHasVisitedDemographics={setHasVisitedDemographics}
                />;
            case 'submit':
                return <SubmitScreen
                    navigate={navigate}
                    initialType={submitType}
                />;
            case 'vote':
                return <VoteScreen navigate={navigate} />;
            case 'profile':
                return <ProfileScreen navigate={navigate} />;
            case 'identity_builder':
                return <IdentityBuilder navigate={navigate} />;
            case 'admin_login':
                return <AdminLoginScreen navigate={navigate} />;
            case 'admin_dashboard':
                return <AdminDashboard navigate={navigate} />;
            case 'verify_email':
                return <EmailVerificationScreen navigate={navigate} />;
            default:
                return <LandingScreen navigate={navigate} />;
        }
    };

    return (
        <SoundProvider>
            <MainAppLayout navigate={navigate} currentPage={currentPage}>
                {renderContent()}
                <MobileBottomNav currentPage={currentPage} navigate={navigate} />

                {showLoginOverlay && (
                    <LoginOverlay
                        onLogin={() => {
                            setAuthModalTitle('Login');
                            setAuthModalMode('email_signin');
                            setAuthModalOpen(true);
                        }}
                        onSignup={() => {
                            setAuthModalTitle('Sign up for free');
                            setAuthModalMode('email_signup');
                            setAuthModalOpen(true);
                        }}
                        onGuest={() => {
                            sessionStorage.setItem('login_overlay_dismissed', 'true');
                            setShowLoginOverlay(false);
                        }}
                    />
                )}

                <AuthModal
                    isOpen={authModalOpen}
                    onClose={() => setAuthModalOpen(false)}
                    title={authModalTitle}
                    initialMode={authModalMode}
                    onSuccess={() => {
                        setShowLoginOverlay(false);
                        setAuthModalOpen(false);
                    }}
                />
            </MainAppLayout>
        </SoundProvider>
    );
};