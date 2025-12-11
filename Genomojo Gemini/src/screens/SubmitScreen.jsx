import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Sparkles, Send, RefreshCw, Share2, CornerDownLeft, Facebook, Twitter, Linkedin, MessageCircle, Link } from 'lucide-react';
import { MessageOverlay } from '../components/MessageOverlay';
import { SocialShareButtons } from '../components/SocialShareButtons';
import { useFirebaseApp, addDoc, collection, getCollectionPath, doc, onSnapshot } from '../hooks/useFirebaseApp';
import { getFactorInsight } from '../api/gemini';
import DOMPurify from 'dompurify';
import { useSound } from '../context/SoundContext';

// --- Modals ---

const SubmissionSuccessModal = ({ isOpen, onClose, navigate, type }) => {
    const shareMessage = `I just contributed to the Human Mojo Project! Help map the factors that influence well-being by voting on submissions or adding your own: #HumanMojo #Wellbeing`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Submission Successful!">
            <div className="text-center">
                <p className="text-lg mb-4 text-green-600 dark:text-green-400 font-bold">
                    Thanks for contributing to the Human Mojo Project!
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Your {type === 'H' ? 'MoHi' : 'MoLo'} has been added for others to vote on. Help us grow the map by sharing!
                </p>

                <div className="mb-8">
                    <SocialShareButtons shareMessage={shareMessage} />
                </div>

                <Button onClick={() => navigate('landing')} color="gray" className="w-full flex justify-center items-center">
                    <CornerDownLeft size={18} className="mr-2" /> Done
                </Button>
            </div >
        </Modal >
    );
};

// --- Main Screen ---

export const SubmitScreen = ({ navigate, initialType = 'H' }) => {
    const { db, userId } = useFirebaseApp();
    const { playSound } = useSound();
    const [type, setType] = useState(initialType);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [insight, setInsight] = useState(null);
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [factorInsightEnabled, setFactorInsightEnabled] = useState(false);

    const maxChars = 100;
    const isMoHi = type === 'H';
    const accentColor = isMoHi ? 'mohi' : 'molo';

    // Static lookup for Tailwind classes using arbitrary values
    const themeClasses = {
        mohi: {
            title: 'text-[#6C8B33] dark:text-[#87A05A]', // mohi-500, mohi-400
            button: 'green',
            switchButton: 'red',
            border: 'border-[#6C8B33]', // mohi-500
            focusRing: 'focus:ring-[#6C8B33]', // mohi-500
            insightBorder: 'border-[#6C8B33]', // mohi-500
            insightBg: 'bg-[#DAE0CE]', // mohi-100
            insightText: 'text-[#3E501D] dark:text-[#87A05A]', // Darker green for text
            submitButton: 'bg-[#6C8B33] hover:bg-[#5A752A] text-white' // mohi-500
        },
        molo: {
            title: 'text-[#EB4832] dark:text-[#ED6B59]', // molo-500, molo-400
            button: 'red',
            switchButton: 'green',
            border: 'border-[#EB4832]', // molo-500
            focusRing: 'focus:ring-[#EB4832]', // molo-500
            insightBorder: 'border-[#EB4832]', // molo-500
            insightBg: 'bg-[#F3D2CE]', // molo-100
            insightText: 'text-[#8B2B1E] dark:text-[#ED6B59]', // Darker red for text
            submitButton: 'bg-[#EB4832] hover:bg-[#C93D2B] text-white' // molo-500
        }
    };

    // LLM Insight Generation
    const generateInsight = useCallback(async () => {
        if (!description || description.length < 5 || isInsightLoading) return;
        setIsInsightLoading(true);
        setInsight(null);

        const result = await getFactorInsight(description, isMoHi);
        setInsight(result);
        setIsInsightLoading(false);
    }, [description, isMoHi, isInsightLoading]);

    // Submission Handler
    const handleSubmit = useCallback(async () => {
        if (!description || description.length > maxChars || isSubmitting) return;
        setIsSubmitting(true);
        try {
            // Sanitize input to prevent XSS attacks
            const sanitizedDescription = DOMPurify.sanitize(description.trim(), {
                ALLOWED_TAGS: [], // Strip all HTML tags
                ALLOWED_ATTR: [] // Strip all attributes
            });
            await addDoc(collection(db, getCollectionPath('mojo_items')), {
                description: sanitizedDescription,
                type: type,
                linkToDemographicID: userId,
                flaggedAsOffensive: false,
                adjudicatedAsOffensive: false,
                datetimeSubmitted: new Date().toISOString(),
            });
            // Reset state and show success
            setDescription('');
            setInsight(null);
            playSound('submit');
            setIsSuccessModalOpen(true);
        } catch (error) {
            console.error("Error submitting item:", error);
            alert("Submission failed. Check your console and Firebase Security Rules.");
        } finally {
            setIsSubmitting(false);
        }
    }, [db, userId, description, type, isSubmitting]);

    useEffect(() => {
        // Reset insight when type changes
        setInsight(null);
    }, [type]);

    // Handle initial type change when navigating
    useEffect(() => {
        setType(initialType);
    }, [initialType]);

    // Check Feature Toggle
    useEffect(() => {
        if (!db) return;
        const configRef = doc(db, getCollectionPath('config'), 'features');
        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                setFactorInsightEnabled(docSnap.data().factorInsight || false);
            }
        });
        return () => unsubscribe();
    }, [db]);

    const title = isMoHi ? "Add a MoHi (Positive Factor)" : "Add a MoLo (Negative Factor)";

    return (
        <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6">
            <h1 className={`text-4xl font-extrabold ${themeClasses[accentColor].title} text-center`}>
                {title}
            </h1>

            <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-xl shadow-inner">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    What impacts your Mojo? Something you do, something that happens, something you think, something you feel... (Max 100 characters)
                </p>
                <Button
                    onClick={() => setType(isMoHi ? 'L' : 'H')}
                    color={isMoHi ? 'red' : 'green'}
                    className="flex items-center text-xs ml-4"
                >
                    <RefreshCw size={14} className="mr-1" />
                    Switch to {isMoHi ? 'MoLo' : 'MoHi'}
                </Button>
            </div>

            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={maxChars}
                rows="3"
                placeholder={`e.g., ${isMoHi ? 'Daily gratitude journaling' : 'Running out of coffee'}`}
                className={`w-full p-4 border-2 ${themeClasses[accentColor].border} rounded-xl shadow-lg focus:outline-none focus:ring-2 ${themeClasses[accentColor].focusRing} dark:bg-gray-800 dark:text-white`}
            />
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span className={description.length > maxChars ? 'text-red-500 font-bold' : ''}>
                    {description.length}/{maxChars}
                </span>

                {factorInsightEnabled && (
                    <Button
                        onClick={generateInsight}
                        disabled={description.length < 5 || isInsightLoading}
                        color="gray"
                        className="text-xs px-3 py-1 flex items-center"
                    >
                        <Sparkles size={16} className="mr-1" />
                        {isInsightLoading ? 'Analyzing...' : 'Get Factor Insight'}
                    </Button>
                )}
            </div>

            {insight && (
                <div className={`p-4 border-l-4 ${themeClasses[accentColor].insightBorder} ${themeClasses[accentColor].insightBg} dark:bg-gray-700 rounded-xl`}>
                    <p className={`font-bold ${themeClasses[accentColor].insightText} mb-1`}>
                        Category: {insight.category}
                    </p>
                    <p className="text-gray-800 dark:text-gray-200 text-sm italic">
                        "{insight.reflection}"
                    </p>
                </div>
            )}

            <Button
                onClick={handleSubmit}
                disabled={!description || description.length === 0 || description.length > maxChars || isSubmitting}
                color="custom"
                className={`w-full text-lg flex justify-center items-center mt-6 ${themeClasses[accentColor].submitButton}`}
            >
                <Send size={20} className="mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Factor'}
            </Button>

            <Button
                onClick={() => navigate('landing')}
                color="gray"
                className="w-full text-lg flex justify-center items-center mt-2"
            >
                Cancel
            </Button>

            <SubmissionSuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                navigate={navigate}
                type={type}
            />
        </div>
    );
};