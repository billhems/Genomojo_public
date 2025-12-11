import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/Button';
import { useFirebaseApp, collection, getCollectionPath, onSnapshot, query, where, updateDoc, doc, writeBatch, setDoc } from '../hooks/useFirebaseApp';
import { CheckCheck, X, EyeOff } from 'lucide-react';
import { StatsDashboard } from './StatsDashboard';

export const AdminDashboard = ({ navigate }) => {
    const { db, isAdmin, signOut, isAuthReady } = useFirebaseApp();
    const [flaggedItems, setFlaggedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = React.useRef(null);

    // Redirect if not admin, but only after auth is ready
    useEffect(() => {
        if (isAuthReady && !isAdmin) {
            navigate('admin_login');
        }
    }, [isAuthReady, isAdmin, navigate]);

    // Fetch flagged items
    useEffect(() => {
        if (!db || !isAdmin) return;

        const q = query(
            collection(db, getCollectionPath('mojo_items')),
            where('flaggedAsOffensive', '==', true)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setFlaggedItems(items);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching flagged items:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db, isAdmin]);

    // Update adjudication status
    const handleAdjudicate = useCallback(async (itemId, status) => {
        if (!db) return;
        const itemRef = doc(db, getCollectionPath('mojo_items'), itemId);
        try {
            await updateDoc(itemRef, {
                adjudicatedAsOffensive: status,
                flaggedAsOffensive: status === 'NOT_DIFFERENTLY' ? false : true // Remove flag if not different
            });
        } catch (error) {
            console.error("Error updating adjudication:", error);
            alert("Failed to update adjudication status. Check console.");
        }
    }, [db]);

    // --- Data Import Logic ---
    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file || !db) return;

        setIsImporting(true);
        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const dataLines = lines.slice(1); // Skip header

            console.log(`Found ${dataLines.length} traits to import.`);

            // Helper to convert RGB to Hex
            const rgbToHex = (r, g, b) => {
                const toHex = (c) => {
                    const hex = parseInt(c).toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                };
                return '#' + toHex(r) + toHex(g) + toHex(b);
            };

            const collectionPath = getCollectionPath('traits');

            let batch = writeBatch(db);
            let count = 0;
            let totalImported = 0;

            for (const line of dataLines) {
                // CSV: ID,ParentID,Name,IsSelectable,HasChildren,Color_R,Color_G,Color_B
                const parts = line.split(',').map(p => p.trim());
                if (parts.length < 8) continue;

                let [id, parentId, name, isSelectable, hasChildren, r, g, b] = parts;

                // Fix for malformed CSV lines (extra comma in top-level items)
                if (parts.length === 9 && !parentId && !name) {
                    name = parts[3];
                    isSelectable = parts[4];
                    hasChildren = parts[5];
                    r = parts[6];
                    g = parts[7];
                    b = parts[8];
                }

                if (!id) continue;

                const docRef = doc(db, collectionPath, id);
                batch.set(docRef, {
                    id,
                    parentId: parentId || null,
                    label: name,
                    isSelectable: isSelectable === 'TRUE',
                    hasChildren: hasChildren === 'TRUE',
                    color: rgbToHex(parseInt(r), parseInt(g), parseInt(b))
                });

                count++;
                totalImported++;

                if (count >= 450) {
                    await batch.commit();
                    batch = writeBatch(db);
                    count = 0;
                    console.log(`Committed batch. Total: ${totalImported}`);
                }
            }

            if (count > 0) {
                await batch.commit();
            }

            alert(`Successfully imported ${totalImported} traits!`);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input

        } catch (error) {
            console.error("Import failed:", error);
            alert("Import failed. Check console.");
        } finally {
            setIsImporting(false);
        }
    };

    const AdminItemCard = ({ item }) => {
        const isMoHi = item.type === 'H';
        const typeColor = isMoHi ? 'text-mohi-600' : 'text-molo-600';
        const typeLabel = isMoHi ? 'MoHi' : 'MoLo';

        let adjudicationStatus;
        if (item.adjudicatedAsOffensive === false) {
            adjudicationStatus = { label: 'Not Adjudicated', color: 'bg-yellow-100 text-yellow-800' };
        } else if (item.adjudicatedAsOffensive === 'HIDE') {
            adjudicationStatus = { label: 'Hidden from Users', color: 'bg-red-100 text-red-800' };
        } else if (item.adjudicatedAsOffensive === 'AGE_GATED') {
            adjudicationStatus = { label: 'Age-Gated', color: 'bg-orange-100 text-orange-800' };
        } else {
            adjudicationStatus = { label: 'Marked Not Offensive', color: 'bg-green-100 text-green-800' };
        }

        return (
            <div className="p-4 border rounded-xl shadow-sm bg-white dark:bg-gray-700 space-y-3">
                <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.description}
                    </p>
                    <span className={`${typeColor} font-bold text-sm`}>[{typeLabel}]</span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full ${adjudicationStatus.color}`}>
                        {adjudicationStatus.label}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        Submitted: {new Date(item.datetimeSubmitted).toLocaleDateString()}
                    </span>
                </div>

                <div className="pt-3 border-t dark:border-gray-600 flex flex-wrap gap-2">
                    <Button onClick={() => handleAdjudicate(item.id, 'NOT_DIFFERENTLY')} color="green" className="flex items-center text-xs px-2 py-1 bg-mohi-500 hover:bg-mohi-600 text-white">
                        <CheckCheck size={14} className="mr-1" /> Not Offensive
                    </Button>
                    <Button onClick={() => handleAdjudicate(item.id, 'AGE_GATED')} color="primary" className="flex items-center text-xs px-2 py-1">
                        Age-Gate (18+)
                    </Button>
                    <Button onClick={() => handleAdjudicate(item.id, 'HIDE')} color="red" className="flex items-center text-xs px-2 py-1 bg-molo-500 hover:bg-molo-600 text-white">
                        <EyeOff size={14} className="mr-1" /> Hide from All
                    </Button>
                </div>
            </div>
        );
    };

    // --- Feature Toggle Logic ---
    const [visualiseIdentityEnabled, setVisualiseIdentityEnabled] = useState(false);
    const [factorInsightEnabled, setFactorInsightEnabled] = useState(false);
    const [loginBeforeLandingEnabled, setLoginBeforeLandingEnabled] = useState(false);
    const [verifyEmailEnabled, setVerifyEmailEnabled] = useState(false);
    const [aboutYouRequiredEnabled, setAboutYouRequiredEnabled] = useState(true); // Default to true (enforced)

    useEffect(() => {
        if (!db) return;
        const configRef = doc(db, getCollectionPath('config'), 'features');
        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setVisualiseIdentityEnabled(data.visualiseIdentity || false);
                setFactorInsightEnabled(data.factorInsight || false);
                setLoginBeforeLandingEnabled(data.loginBeforeLanding || false);
                setVerifyEmailEnabled(data.verifyEmail || false);
                // Default to true if not present to maintain existing behavior
                setAboutYouRequiredEnabled(data.aboutYouRequired !== false);
            }
        }, (error) => {
            console.error("Error listening to feature toggles:", error);
        });
        return () => unsubscribe();
    }, [db]);

    const toggleVisualiseIdentity = async () => {
        if (!db) return;
        const configRef = doc(db, getCollectionPath('config'), 'features');
        try {
            // Use setDoc with merge: true to create if not exists
            await setDoc(configRef, {
                visualiseIdentity: !visualiseIdentityEnabled
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling feature:", error);
            alert("Failed to toggle feature.");
        }
    };

    const toggleFactorInsight = async () => {
        if (!db) return;
        const configRef = doc(db, getCollectionPath('config'), 'features');
        try {
            await setDoc(configRef, {
                factorInsight: !factorInsightEnabled
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling feature:", error);
            alert("Failed to toggle feature.");
        }
    };

    const toggleLoginBeforeLanding = async () => {
        if (!db) return;
        const configRef = doc(db, getCollectionPath('config'), 'features');
        try {
            await setDoc(configRef, {
                loginBeforeLanding: !loginBeforeLandingEnabled
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling feature:", error);
            alert("Failed to toggle feature.");
        }
    };

    const toggleVerifyEmail = async () => {
        if (!db) return;
        const configRef = doc(db, getCollectionPath('config'), 'features');
        try {
            await setDoc(configRef, {
                verifyEmail: !verifyEmailEnabled
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling feature:", error);
            alert("Failed to toggle feature.");
        }
    };

    const toggleAboutYouRequired = async () => {
        if (!db) return;
        const configRef = doc(db, getCollectionPath('config'), 'features');
        try {
            await setDoc(configRef, {
                aboutYouRequired: !aboutYouRequiredEnabled
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling feature:", error);
            alert("Failed to toggle feature.");
        }
    };

    if (isLoading || !isAuthReady) {
        return <div className="p-8 text-center">Loading Admin Dashboard...</div>;
    }

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
                    Mojo Admin Panel
                </h1>
                <Button onClick={signOut} color="red" className="flex items-center text-sm">
                    <X size={16} className="mr-1" /> Log Out
                </Button>
            </div>

            {/* --- Stats Dashboard --- */}
            <StatsDashboard />

            {/* --- Feature Toggles --- */}

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mt-4">
                <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Feature Toggles</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Visualise Identity (KAN-114)</p>
                        <p className="text-xs text-gray-500">Enable AI image generation on About You screen.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={visualiseIdentityEnabled}
                            onChange={toggleVisualiseIdentity}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Factor Insight (KAN-118)</p>
                        <p className="text-xs text-gray-500">Enable AI analysis on Submit screen.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={factorInsightEnabled}
                            onChange={toggleFactorInsight}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Login Before Landing (KAN-119)</p>
                        <p className="text-xs text-gray-500">Require login/signup overlay on first visit.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={loginBeforeLandingEnabled}
                            onChange={toggleLoginBeforeLanding}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Verify Email (KAN-93)</p>
                        <p className="text-xs text-gray-500">Require email verification for new signups.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={verifyEmailEnabled}
                            onChange={toggleVerifyEmail}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Enforce 'About You' First (KAN-135)</p>
                        <p className="text-xs text-gray-500">Require new users to visit 'About You' before exploring other features.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={aboutYouRequiredEnabled}
                            onChange={toggleAboutYouRequired}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            </div>


            {/* --- Data Management Section --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Data Management</h2>
                <div className="flex items-center gap-4">
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleImport}
                        disabled={isImporting}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100
                        "
                    />
                    {isImporting && <span className="text-sm text-indigo-600 animate-pulse">Importing...</span>}
                </div>
                <p className="text-xs text-gray-500 mt-2">Upload <code>traits.csv</code> to update identity traits.</p>
            </div>

            <p className="text-gray-700 dark:text-gray-300">
                Review items flagged by contributors as potentially offensive.
            </p>

            <h2 className="text-xl font-semibold mt-4">Flagged Items ({flaggedItems.length})</h2>

            <div className="space-y-4">
                {flaggedItems.length > 0 ? (
                    flaggedItems.map(item => <AdminItemCard key={item.id} item={item} />)
                ) : (
                    <p className="text-green-500 p-4 bg-green-50 rounded-xl">
                        No new items have been flagged for review. Great job!
                    </p>
                )}
            </div>
        </div >
    );
};