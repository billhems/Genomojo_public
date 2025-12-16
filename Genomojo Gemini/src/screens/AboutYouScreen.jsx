import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../components/Button';
import { InfoTooltip } from '../components/InfoTooltip';
import { useFirebaseApp, doc, setDoc, getDoc, getCollectionPath, onSnapshot } from '../hooks/useFirebaseApp';
import { generateCharacterImage, generateMovieConcept, generateMoviePoster } from '../api/gemini';
import { Sparkles, Image as ImageIcon, X, Plus, Clapperboard, Film } from 'lucide-react';
import { SelectionIndicator } from '../features/IdentityBuilder/components/SelectionIndicator';
import { SocialShareButtons } from '../components/SocialShareButtons';


export const AboutYouScreen = ({ navigate, setHasVisitedDemographics }) => {
    const { db, userId, user } = useFirebaseApp();
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [identityTraits, setIdentityTraits] = useState([]);
    const [customTraitInput, setCustomTraitInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Feature Toggle & Image Generation State
    const [visualiseIdentityEnabled, setVisualiseIdentityEnabled] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [hasGeneratedImage, setHasGeneratedImage] = useState(false);

    // Generation Status State: 'idle' | 'casting' | 'filming'
    const [generationStatus, setGenerationStatus] = useState('idle');

    const ages = Array.from({ length: 101 }, (_, i) => i + 5); // 5 to 105
    const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

    // Check Feature Toggle
    useEffect(() => {
        if (!db) return;
        const configRef = doc(db, getCollectionPath('config'), 'features');
        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                setVisualiseIdentityEnabled(docSnap.data().visualiseIdentity || false);
            }
        });
        return () => unsubscribe();
    }, [db]);

    // Fetch existing data
    useEffect(() => {
        const fetchData = async () => {
            if (db && userId) {
                // Guard: If userId is an Auth UID (not guest_), ensure we are actually authenticated
                if (!userId.startsWith('guest_') && !user) {
                    return;
                }

                // Skip fetch for local guest IDs (unauthenticated)
                if (userId.startsWith('guest_')) {
                    return;
                }

                try {
                    const docRef = doc(db, getCollectionPath('demographics'), userId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.age) setAge(data.age.toString());
                        if (data.gender) setGender(data.gender);
                        if (data.identityTraits) setIdentityTraits(data.identityTraits);

                        // Load generated image if exists
                        if (data.characterImageUrl) {
                            setGeneratedImage(data.characterImageUrl);
                            setHasGeneratedImage(true);
                        } else if (data.hasGeneratedImage) {
                            setHasGeneratedImage(true); // Limit reached but maybe image failed to save?
                        }
                    }
                } catch (error) {
                    console.error("Error fetching demographics:", error);
                }
            }
        };
        fetchData();
    }, [db, userId]);

    // Helper to compress image
    const compressImage = (base64Str, maxWidth = 800, quality = 0.7) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        });
    };

    const handleVisualise = async () => {
        if (generationStatus !== 'idle' || hasGeneratedImage) return;

        try {
            // Construct traits string
            const traitsString = identityTraits.map(t => t.label).join(', ');

            // --- STEP 1: CASTING (Text to JSON) ---
            setGenerationStatus('casting');

            // Artificial delay for UX (so user sees "Casting..." message)
            await new Promise(r => setTimeout(r, 800));

            const concept = await generateMovieConcept(
                age || 'Unknown',
                gender || 'Unknown',
                traitsString || 'No specific traits'
            );

            if (!concept) {
                throw new Error("Failed to generate movie concept.");
            }

            console.log("Movie Concept Generated:", concept);

            // --- STEP 2: FILMING (JSON to Image) ---
            setGenerationStatus('filming');

            const imageUrl = await generateMoviePoster(concept);

            if (imageUrl) {
                // Compress image before saving to avoid Firestore 1MB limit
                const compressedImage = await compressImage(imageUrl);

                setGeneratedImage(compressedImage);
                setHasGeneratedImage(true);

                // Save to Firestore
                if (db && userId) {
                    await setDoc(doc(db, getCollectionPath('demographics'), userId), {
                        characterImageUrl: compressedImage,
                        hasGeneratedImage: true,
                        // Ensure other fields are preserved/updated if they changed
                        age: age ? parseInt(age) : null,
                        gender: gender || null,
                        datetimeSubmitted: new Date().toISOString(), // Update form timestamp
                        lastVisualisedAt: new Date().toISOString() // New timestamp for visualisation cooldown
                    }, { merge: true });
                }
            } else {
                alert("Failed to generate poster image. Please try again.");
            }
        } catch (error) {
            console.error("Visualise error:", error);
            alert("An error occurred while generating the movie poster.");
        } finally {
            setGenerationStatus('idle');
        }
    };

    const handleAddCustomTrait = () => {
        if (!customTraitInput.trim()) return;
        if (identityTraits.length >= 5) return;

        const newTrait = {
            id: `custom_${Date.now()}`,
            label: customTraitInput.trim(),
            color: '#6366f1' // Indigo-500 default
        };

        setIdentityTraits([...identityTraits, newTrait]);
        setCustomTraitInput('');
    };

    const handleRemoveTrait = (id) => {
        setIdentityTraits(identityTraits.filter(t => t.id !== id));
    };

    const handleSubmit = useCallback(async () => {
        console.log("AboutYouScreen: handleSubmit called. userId:", userId);
        setIsSubmitting(true);
        try {
            if (db && userId) {
                await setDoc(doc(db, getCollectionPath('demographics'), userId), {
                    age: age ? parseInt(age) : null,
                    gender: gender || null,
                    identityTraits: identityTraits,
                    datetimeSubmitted: new Date().toISOString()
                }, { merge: true });
                console.log("AboutYouScreen: Data saved successfully.");
            } else {
                console.warn("AboutYouScreen: db or userId missing. db:", !!db, "userId:", userId);
            }
            if (setHasVisitedDemographics) {
                setHasVisitedDemographics(true);
            }
            return true;
        } catch (error) {
            console.error("Error submitting demographics:", error);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [db, userId, age, gender, identityTraits, setHasVisitedDemographics]);

    const handleSaveAndClose = async () => {
        const success = await handleSubmit();
        if (success) navigate('landing');
    };

    return (
        <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6">
            <h1 className="text-4xl font-extrabold text-mohi-600 dark:text-mohi-400 text-center">
                About You
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center">
                We use this data anonymously to help map the Human Mojome. Your MoHis, MoLos and Votes are tagged with the characteristics you provide here.
            </p>

            <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
                    <select
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                    >
                        <option value="">Select Age (Optional)</option>
                        {ages.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                    <select
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                    >
                        <option value="">Select Gender (Optional)</option>
                        {genders.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>

            </div>

            {/* Defining Characteristics Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your defining characteristics</h3>
                        <InfoTooltip
                            content={{
                                title: "Defining Characteristics",
                                text: "If you had to describe yourself using no more than 5 traits, what would they be? What are the things you think are important about your identity? Characteristics, hobbies, family situation, ethnicity, job: whatever you think best defines you."
                            }}
                            position="top"
                        />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Add up to five words or phrases that you think are the most important ways of describing you.
                    </p>
                    <div className="mt-3">
                        <Button
                            onClick={async () => {
                                console.log("AboutYouScreen: Who I Am Today clicked");
                                try {
                                    const success = await handleSubmit();
                                    if (success) {
                                        console.log("AboutYouScreen: Navigating to identity_builder");
                                        navigate('identity_builder');
                                    } else {
                                        alert("Save failed. Please try again.");
                                    }
                                } catch (e) {
                                    alert("Error in Navigation: " + e.message);
                                }
                            }}
                            disabled={isSubmitting}
                            color="custom"
                            className="w-full sm:w-auto bg-[#9F6952] hover:bg-[#894629] text-white text-sm py-2"
                        >
                            Who I Am Today
                        </Button>
                    </div>
                </div>

                <div className="mb-4">
                    <SelectionIndicator
                        current={identityTraits.length}
                        max={5}
                    />
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customTraitInput}
                        onChange={(e) => {
                            if (e.target.value.length <= 25) {
                                setCustomTraitInput(e.target.value);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleAddCustomTrait();
                            }
                        }}
                        placeholder="e.g. Creative"
                        disabled={identityTraits.length >= 5}
                        className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button
                        onClick={handleAddCustomTrait}
                        disabled={!customTraitInput.trim() || identityTraits.length >= 5}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Traits List */}
                <div className="flex flex-wrap gap-2 min-h-[2rem]">
                    {identityTraits.map(trait => (
                        <span
                            key={trait.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                            style={{ backgroundColor: trait.color ? `${trait.color}40` : undefined, color: trait.color || undefined }}
                        >
                            {trait.label}
                            <button
                                onClick={() => handleRemoveTrait(trait.id)}
                                className="ml-2 inline-flex items-center justify-center text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-white focus:outline-none"
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                    {identityTraits.length === 0 && (
                        <span className="text-sm text-gray-400 italic">No traits added yet.</span>
                    )}
                </div>
            </div>

            {/* Visualise Identity Card */}
            {visualiseIdentityEnabled && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl shadow-md border border-indigo-100 dark:border-gray-600">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 flex items-center">
                            <Sparkles className="mr-2" size={20} />
                            Visualise Your Identity
                        </h3>
                    </div>

                    {generatedImage ? (
                        <div className="space-y-4">
                            <div className="w-full max-w-xs mx-auto overflow-hidden rounded-lg shadow-lg border-4 border-white dark:border-gray-600">
                                <img src={generatedImage} alt="Character Card" className="w-full h-auto" />
                            </div>
                            <p className="text-center text-xs text-gray-500 italic">
                                Generated by Gemini (Nano Banana)
                            </p>
                            <div className="pt-2">
                                <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Share your identity card:
                                </p>
                                <SocialShareButtons
                                    shareMessage="Check out the movie poster for my life story! Created with The Human Mojo Project."
                                    imageUrl={generatedImage}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Create a unique movie poster starring YOU based on your traits.
                            </p>
                            <Button
                                onClick={handleVisualise}
                                disabled={generationStatus !== 'idle' || hasGeneratedImage || identityTraits.length < 5}
                                color="custom"
                                className={`w-full flex justify-center items-center py-3 ${identityTraits.length < 5 && !hasGeneratedImage ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                            >
                                {generationStatus === 'casting' ? (
                                    <>
                                        <Sparkles className="animate-spin mr-2" size={18} />
                                        Casting...
                                    </>
                                ) : generationStatus === 'filming' ? (
                                    <>
                                        <Film className="animate-pulse mr-2" size={18} />
                                        Filming...
                                    </>
                                ) : hasGeneratedImage ? (
                                    <>
                                        <ImageIcon className="mr-2" size={18} />
                                        Poster Generated
                                    </>
                                ) : identityTraits.length < 5 ? (
                                    <>
                                        <Sparkles className="mr-2" size={18} />
                                        Select 5 Traits to Visualise
                                    </>
                                ) : (
                                    <>
                                        <Clapperboard className="mr-2" size={18} />
                                        Generate Movie Poster
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )
            }

            <div className="flex flex-col sm:flex-row justify-end gap-2 relative z-10">
                <Button onClick={() => navigate('landing')} color="gray" className="sm:mr-auto">
                    Cancel
                </Button>
                <Button
                    onClick={async () => {
                        try {
                            await handleSaveAndClose();
                        } catch (e) {
                            alert("Error saving: " + e.message);
                        }
                    }}
                    disabled={isSubmitting}
                    color="custom"
                    className="bg-[#9F6952] hover:bg-[#894629] text-white"
                >
                    Save & Back
                </Button>


            </div>
        </div >
    );
};
