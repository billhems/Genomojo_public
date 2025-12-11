import React, { useState, useEffect } from 'react';
import { Settings, ArrowLeft } from 'lucide-react';
import { CategoryList } from './components/CategoryList';
import { SelectedItems } from './components/SelectedItems';
import { SelectionIndicator } from './components/SelectionIndicator';
import { useTraits } from './hooks/useTraits';
import { useFirebaseApp, doc, setDoc, getDoc, getCollectionPath } from '../../hooks/useFirebaseApp';
import { Button } from '../../components/Button';

export default function IdentityBuilder({ navigate }) {
    const { data, loading: traitsLoading, error } = useTraits();
    const { db, userId } = useFirebaseApp();
    const [selectedItems, setSelectedItems] = useState([]);
    const [loadingUser, setLoadingUser] = useState(true);

    const MAX_SELECTIONS = 5;

    // Load user's existing selections
    useEffect(() => {
        const fetchUserSelections = async () => {
            if (!db || !userId) {
                setLoadingUser(false);
                return;
            }

            try {
                const docRef = doc(db, getCollectionPath('demographics'), userId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    if (userData.identityTraits) {
                        setSelectedItems(userData.identityTraits);
                    }
                }
            } catch (err) {
                console.error("Error fetching user selections:", err);
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUserSelections();
    }, [db, userId]);

    // Save selections to Firestore whenever they change
    useEffect(() => {
        const saveSelections = async () => {
            if (!db || !userId || loadingUser) return;

            try {
                const docRef = doc(db, getCollectionPath('demographics'), userId);
                await setDoc(docRef, {
                    identityTraits: selectedItems,
                    lastUpdated: new Date().toISOString()
                }, { merge: true });
            } catch (err) {
                console.error("Error saving selections:", err);
            }
        };

        // Debounce save slightly to avoid thrashing
        const timeoutId = setTimeout(saveSelections, 500);
        return () => clearTimeout(timeoutId);
    }, [selectedItems, db, userId, loadingUser]);

    const handleToggleSelect = (item) => {
        const isCurrentlySelected = selectedItems.some(selected => selected.id === item.id);

        if (isCurrentlySelected) {
            // Deselect the item
            setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
        } else if (selectedItems.length < MAX_SELECTIONS) {
            // Select the item
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleRemove = (id) => {
        setSelectedItems(selectedItems.filter(item => item.id !== id));
    };

    const isSelected = (id) => {
        return selectedItems.some(item => item.id === id);
    };

    const canSelectMore = selectedItems.length < MAX_SELECTIONS;

    if (traitsLoading || loadingUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading traits...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Traits</h2>
                    <p className="text-gray-600 mb-4">We couldn't load the trait list. Please check your connection and try again.</p>
                    <Button onClick={() => window.location.reload()} color="primary">Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="px-4 py-4 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('about_you')}
                                className="p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-xl font-bold text-gray-900">Who are you today?</h1>
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm">Choose the 5 things that define you, or add your own</p>
                    <SelectionIndicator
                        current={selectedItems.length}
                        max={MAX_SELECTIONS}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="pb-32 max-w-2xl mx-auto">
                <CategoryList
                    data={data}
                    onToggleSelect={handleToggleSelect}
                    isSelected={isSelected}
                    canSelectMore={canSelectMore}
                />
            </div>

            {/* Selected Items Footer */}
            {selectedItems.length > 0 && (
                <SelectedItems
                    items={selectedItems}
                    onRemove={handleRemove}
                    onComplete={() => navigate('about_you')}
                />
            )}
        </div>
    );
}