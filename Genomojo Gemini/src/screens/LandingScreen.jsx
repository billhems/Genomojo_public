import React, { useState, useCallback } from 'react';
import { Button } from '../components/Button';
import { Mail, SmileIcon, FrownIcon } from 'lucide-react';
import { useFirebaseApp, addDoc, collection, getCollectionPath, doc, onSnapshot } from '../hooks/useFirebaseApp';

const NavItem = ({ icon: Icon, title, description, color, onClick, disabled }) => {
    // Map generic colors to specific theme colors using arbitrary values
    const colorMap = {
        green: 'bg-[#6C8B33] hover:bg-[#5A752A] text-white', // mohi-500
        red: 'bg-[#EB4832] hover:bg-[#C93D2B] text-white'   // molo-500
    };

    const buttonClass = colorMap[color] || '';

    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            color="custom"
            className={`flex flex-col items-center justify-center p-4 text-center w-full h-32 transition-transform active:scale-95 ${buttonClass}`}
        >
            <div className="flex items-center space-x-2 mb-2">
                <Icon size={24} />
                <span className="text-xl font-bold">{title}</span>
            </div>
            <p className="text-sm opacity-90 leading-tight">{description}</p>
            {disabled && <p className="text-xs text-yellow-300 mt-1">Visit 'About You' first</p>}
        </Button>
    );
};



const EmailSubscription = () => {
    const { db } = useFirebaseApp();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(''); // '', 'submitting', 'success', 'error'

    const handleSubscribe = useCallback(async () => {
        if (!email || status === 'submitting') return;
        setStatus('submitting');
        try {
            await addDoc(collection(db, getCollectionPath('email_list')), {
                email: email,
                datetimeSubmitted: new Date().toISOString()
            });
            setStatus('success');
            setEmail('');
        } catch (error) {
            console.error("Subscription failed:", error);
            setStatus('error');
        } finally {
            setTimeout(() => setStatus(''), 5000);
        }
    }, [db, email, status]);

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl mt-8">
            <h4 className="text-lg font-bold flex items-center mb-3">
                <Mail className="w-5 h-5 mr-2" /> Stay in Touch
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Provide your email if you'd like updates on the Human Mojo Project. This is *not* linked to your submissions or votes.
            </p>
            <div className="flex space-x-2">
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-grow p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-white text-sm"
                    disabled={status === 'submitting' || status === 'success'}
                />
                <Button
                    onClick={handleSubscribe}
                    disabled={!email || status === 'submitting'}
                    color="primary"
                >
                    {status === 'submitting' ? '...' : status === 'success' ? 'Subscribed!' : 'Subscribe'}
                </Button>
            </div>
            {status === 'error' && <p className="text-red-500 text-xs mt-2">Subscription failed. Please try again.</p>}
        </div>
    );
}

export const LandingScreen = ({ navigate, hasVisitedDemographics, setHasVisitedDemographics }) => {
    const { resetGuestId, user, db } = useFirebaseApp();
    const [aboutYouRequired, setAboutYouRequired] = useState(true);

    // Fetch feature toggle
    React.useEffect(() => {
        if (!db) return;
        const configRef = doc(db, getCollectionPath('config'), 'features');
        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                // Default to true if undefined to maintain existing behavior
                setAboutYouRequired(docSnap.data().aboutYouRequired !== false);
            }
        });
        return () => unsubscribe();
    }, [db]);

    const isActionDisabled = aboutYouRequired && !hasVisitedDemographics;

    return (
        <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6">
            <h1 className="text-4xl font-extrabold text-mohi-600 dark:text-mohi-400 text-center">
                The Human Mojo Project
            </h1>

            <p className="text-gray-700 dark:text-gray-300 text-lg text-center">
                Phase One aims to map all the factors which influence people’s well-being, mental health, personal energy, and resilience: their Mojo. Contribute your voice below!
            </p>

            {/* Desktop: Embedded Video */}
            <div className="hidden md:block aspect-video bg-gray-200 rounded-xl overflow-hidden shadow-lg">
                {/* Embedded YouTube video placeholder */}
                <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/hNdXTYXAFKg?controls=0" // Official Human Mojo Video
                    title="Human Mojo Project Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                ></iframe>
            </div>

            {/* Mobile: Link to Video */}
            <div className="block md:hidden bg-gray-100 dark:bg-gray-800 rounded-xl p-6 text-center shadow-md border border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 mb-4 font-medium">
                    Watch our introduction video on YouTube
                </p>
                <a
                    href="https://www.youtube.com/watch?v=hNdXTYXAFKg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#FF0000] hover:bg-[#CC0000] transition-colors shadow-sm"
                >
                    Find out more
                </a>
            </div>

            {/* CTAs */}
            <div className="space-y-4">
                <Button
                    onClick={() => {
                        // Only reset guest ID if the user is NOT already signed in (i.e. is anonymous)
                        // This prevents logging out a newly registered user who hasn't visited demographics yet.
                        if (!hasVisitedDemographics && (!user || user.isAnonymous)) {
                            resetGuestId();
                        }
                        navigate('about_you');
                    }}
                    color="custom"
                    className="w-full h-12 bg-[#9F6952] hover:bg-[#894629] text-white"
                >
                    About You
                </Button>

                <div className="grid grid-cols-2 gap-3">
                    <NavItem
                        icon={SmileIcon} title="Add a MoHi" color="green"
                        description="Submit a positive factor that boosts your Mojo."
                        onClick={() => navigate('submit', 'H')}
                        disabled={isActionDisabled}
                    />
                    <NavItem
                        icon={FrownIcon} title="Add a MoLo" color="red"
                        description="Submit a negative factor that drains your Mojo."
                        onClick={() => navigate('submit', 'L')}
                        disabled={isActionDisabled}
                    />
                </div>

                <Button
                    color="custom"
                    onClick={() => navigate('vote')}
                    disabled={isActionDisabled}
                    className="w-full h-12 bg-[#9F6952] hover:bg-[#894629] text-white"
                >
                    Vote on Submissions
                </Button>
            </div>

            <EmailSubscription />
        </div>
    );
};