import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { InfoTooltip } from '../components/InfoTooltip';
import { tooltipContent } from '../content/tooltips';
import { ThumbsUp, ThumbsDown, AlertTriangle, Info, Activity, Heart } from 'lucide-react';
import { MessageOverlay } from '../components/MessageOverlay';
import { useFirebaseApp, collection, getDocs, query, where, orderBy, limit, startAfter, addDoc, getCollectionPath, doc, onSnapshot } from '../hooks/useFirebaseApp';
import { useSound } from '../context/SoundContext';

// --- Modals ---

const ReportModal = ({ isOpen, onClose, onSubmit }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Report Content">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
                Is this content offensive, abusive, or spam?
            </p>
            <div className="flex space-x-3 justify-end">
                <Button onClick={onClose} color="gray">Cancel</Button>
                <Button onClick={onSubmit} color="red">Yes, Report</Button>
            </div>
        </Modal>
    );
};

const SavedSuccessModal = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Saved to My MoHis">
            <div className="text-center space-y-4">
                <div className="flex justify-center text-pink-500">
                    <Heart size={48} fill="currentColor" />
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                    This MoHi is now saved in a list on your profile page. You can email or share it with anybody who you think would find it useful.
                </p>
                <Button onClick={onClose} color="primary" className="w-full">
                    OK
                </Button>
            </div>
        </Modal>
    );
};

// --- Components ---

const DistributionBars = ({ distribution, userVote, totalVotes }) => {
    return (
        <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((score) => {
                const count = distribution[score] || 0;
                const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                const isUserVote = userVote === score;

                // Color based on score
                let barColor = 'bg-gray-300';
                if (score <= 2) barColor = 'bg-[#EB4832]'; // molo-500
                if (score === 3) barColor = 'bg-yellow-400';
                if (score >= 4) barColor = 'bg-[#6C8B33]'; // mohi-500

                return (
                    <div key={score} className="flex items-center text-xs sm:text-sm">
                        <span className={`w-4 font-bold ${isUserVote ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
                            {score}
                        </span>
                        <div className="flex-grow h-3 bg-gray-100 rounded-full overflow-hidden mx-2">
                            <div
                                className={`h-full ${barColor} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                        <span className="w-8 text-right text-gray-500">{count}</span>
                    </div>
                );
            })}
        </div>
    );
};

// --- Main Screen ---

export const VoteScreen = ({ navigate }) => {
    const { db, userId, isAuthReady } = useFirebaseApp();
    const { playSound } = useSound();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [messageOverlay, setMessageOverlay] = useState({ isOpen: false, title: '', message: '' });

    // New State for Refactor
    const [lastVote, setLastVote] = useState(null); // { item, userScore, distribution }
    const [globalStats, setGlobalStats] = useState({ mohiVotes: 0, moloVotes: 0, totalVotes: 0 });

    // Pagination state
    const [itemPool, setItemPool] = useState([]); // Cached items for random selection
    const [lastVisible, setLastVisible] = useState(null); // Cursor for pagination
    const [hasMore, setHasMore] = useState(true); // More items available to fetch

    // Static lookup for Tailwind classes using arbitrary values
    const themeClasses = {
        mohi: {
            cardBg: 'bg-[#DAE0CE]', // mohi-100
            cardBorder: 'border-[#6C8B33]', // mohi-500
            textColor: 'text-[#3E501D] dark:text-[#87A05A]',
            iconColor: 'text-[#6C8B33]', // mohi-500
            badge: 'bg-[#6C8B33] text-white' // mohi-500
        },
        molo: {
            cardBg: 'bg-[#F3D2CE]', // molo-100
            cardBorder: 'border-[#EB4832]', // molo-500
            textColor: 'text-[#8B2B1E] dark:text-[#ED6B59]',
            iconColor: 'text-[#EB4832]', // molo-500
            badge: 'bg-[#EB4832] text-white' // molo-500
        }
    };

    // History state to track what user has already seen/acted on
    const [history, setHistory] = useState({ votes: new Set(), skips: new Set() });

    // Subscribe to Global Stats
    useEffect(() => {
        if (!db) return;
        const statsRef = doc(db, getCollectionPath('stats'), 'vote_totals');
        const unsubscribe = onSnapshot(statsRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                setGlobalStats(docSnapshot.data());
            }
        }, (error) => {
            console.error("Error fetching stats:", error);
        });
        return () => unsubscribe();
    }, [db]);

    // Fetch User History (Votes & Skips)
    useEffect(() => {
        if (!db || !userId) return;

        const fetchHistory = async () => {
            try {
                // Fetch Votes
                const votesQ = query(collection(db, getCollectionPath('votes')), where('voterID', '==', userId));
                const votesSnap = await getDocs(votesQ);
                const votedIds = new Set(votesSnap.docs.map(d => d.data().itemID));

                // Fetch Skips
                const skipsQ = query(collection(db, getCollectionPath('skips')), where('userId', '==', userId));
                const skipsSnap = await getDocs(skipsQ);
                const skippedIds = new Set(skipsSnap.docs.map(d => d.data().itemId));

                setHistory({ votes: votedIds, skips: skippedIds });
            } catch (error) {
                console.error("Error fetching user history:", error);
            }
        };
        fetchHistory();
    }, [db, userId]);

    // Fetch items with pagination and server-side filtering
    const fetchMoreItems = useCallback(async () => {
        if (!db || !userId || !hasMore) return;

        try {
            const itemsRef = collection(db, getCollectionPath('mojo_items'));

            // Build query with server-side filtering for flaggedAsOffensive
            let itemsQuery = query(
                itemsRef,
                where('flaggedAsOffensive', '==', false),
                orderBy('datetimeSubmitted', 'desc'),
                limit(20) // Reduced from 50 to 20
            );

            // Add cursor if we have a last visible document
            if (lastVisible) {
                itemsQuery = query(itemsQuery, startAfter(lastVisible));
            }

            const itemsSnapshot = await getDocs(itemsQuery);

            if (itemsSnapshot.empty) {
                setHasMore(false);
                return;
            }

            // Store last document for pagination
            setLastVisible(itemsSnapshot.docs[itemsSnapshot.docs.length - 1]);

            // Filter out user's own items (client-side for small batch)
            const newItems = itemsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(item => item.linkToDemographicID !== userId);

            // Prevent duplicates in pool
            setItemPool(prev => {
                const existingIds = new Set(prev.map(i => i.id));
                const uniqueNewItems = newItems.filter(i => !existingIds.has(i.id));
                return [...prev, ...uniqueNewItems];
            });

            // If we got fewer items than requested, we've reached the end
            if (itemsSnapshot.docs.length < 20) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    }, [db, userId, lastVisible, hasMore]);

    const fetchRandomItem = useCallback(async (currentItemId = null) => {
        if (!db || !userId) return;
        setLoading(true);

        try {
            // If pool is low and we can fetch more, do so
            if (itemPool.length < 5 && hasMore) {
                await fetchMoreItems();
            }

            // Filter out current item AND items in history (votes/skips)
            // Note: We also remove items from pool on vote/skip, but this is a safety check
            const availableItems = itemPool.filter(i =>
                i.id !== currentItemId &&
                !history.votes.has(i.id) &&
                !history.skips.has(i.id)
            );

            if (availableItems.length > 0) {
                // Pick random from pool
                const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                setItem(randomItem);
                setIsSaved(false); // Reset saved state for new item
            } else if (hasMore) {
                // Pool empty (after filtering) but more items exist, fetch them
                await fetchMoreItems();
                // Retry logic would go here, but for simplicity we'll just wait for next render or user interaction
                // Ideally we'd recurse or have a better pool manager, but this prevents infinite loops if all items are voted on.
                // Let's try one immediate retry if pool was exhausted by filtering
                if (itemPool.length > 0) {
                    // Re-filter newly fetched items
                    const retryItems = itemPool.filter(i =>
                        i.id !== currentItemId &&
                        !history.votes.has(i.id) &&
                        !history.skips.has(i.id)
                    );
                    if (retryItems.length > 0) {
                        setItem(retryItems[Math.floor(Math.random() * retryItems.length)]);
                    } else {
                        setItem(null);
                    }
                } else {
                    setItem(null);
                }
            } else {
                setItem(null);
            }
        } catch (error) {
            console.error("Error fetching item:", error);
        } finally {
            setLoading(false);
        }
    }, [db, userId, itemPool, hasMore, fetchMoreItems, history]);

    useEffect(() => {
        if (isAuthReady && userId) {
            fetchRandomItem();
        }
    }, [isAuthReady, userId, fetchRandomItem]);

    const handleVote = async (score) => {
        if (!item || !userId) return;

        playSound('vote');

        const currentItem = item; // Capture current item before switching
        const voteType = currentItem.type;

        // Optimistically remove from pool to prevent re-selection
        setItemPool(prev => prev.filter(i => i.id !== currentItem.id));

        try {
            // 1. Record Vote
            await addDoc(collection(db, getCollectionPath('votes')), {
                itemID: currentItem.id,
                voterID: userId,
                score: score,
                type: voteType,
                datetimeVote: new Date().toISOString()
            });

            // Update local history
            setHistory(prev => ({
                ...prev,
                votes: new Set(prev.votes).add(currentItem.id)
            }));

            // 2. Fetch updated distribution for "Last Vote" card
            const votesRef = collection(db, getCollectionPath('votes'));
            const q = query(votesRef, where('itemID', '==', currentItem.id));
            const snapshot = await getDocs(q);

            const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            snapshot.forEach(doc => {
                const s = Number(doc.data().score);
                if (dist[s] !== undefined) dist[s]++;
            });

            // 3. Update Last Vote State
            setLastVote({
                item: currentItem,
                userScore: score,
                distribution: dist
            });

            // 4. Load Next Item Immediately
            fetchRandomItem(currentItem.id);

        } catch (error) {
            console.error("Error casting vote:", error);
            alert("Vote failed. Please try again.");
        }
    };

    const handleSaveMoHi = async () => {
        if (!item || !userId) return;

        try {
            await addDoc(collection(db, getCollectionPath('saved_mohis')), {
                userId: userId,
                mohiId: item.id,
                description: item.description,
                datetimeSaved: new Date().toISOString()
            });
            setIsSaved(true);
            setIsSavedModalOpen(true);
        } catch (error) {
            console.error("Error saving MoHi:", error);
            setMessageOverlay({
                isOpen: true,
                title: 'Error',
                message: "Failed to save MoHi. Please try again.",
                buttonColor: "red"
            });
        }
    };

    const handleReport = async () => {
        if (!item) return;
        try {
            setIsReportModalOpen(false);
            setMessageOverlay({
                isOpen: true,
                title: 'Report Received',
                message: "Thanks for flagging, we'll take a look..."
            });
            fetchRandomItem(item.id);
        } catch (error) {
            console.error("Error reporting:", error);
        }
    };

    const handleSkip = async () => {
        if (!item || !userId) return;

        playSound('skip');

        const currentItem = item;

        // Optimistically remove from pool
        setItemPool(prev => prev.filter(i => i.id !== currentItem.id));

        try {
            // Record skip in Firestore
            await addDoc(collection(db, getCollectionPath('skips')), {
                userId: userId,
                itemId: currentItem.id,
                datetime: new Date().toISOString()
            });

            // Update local history
            setHistory(prev => ({
                ...prev,
                skips: new Set(prev.skips).add(currentItem.id)
            }));

            fetchRandomItem(currentItem.id);
        } catch (error) {
            console.error("Error skipping item:", error);
            // Even if save fails, skip locally
            fetchRandomItem(currentItem.id);
        }
    };

    if (loading && !item) return <div className="p-10 text-center">Loading next item...</div>;

    if (!item && !loading) return (
        <div className="p-10 text-center space-y-4">
            <h2 className="text-xl font-bold">No Items Found</h2>
            <p>There are no items available to vote on right now.</p>
            <Button onClick={() => navigate('landing')} color="primary">Back to Home</Button>
        </div>
    );

    const isMoHi = item?.type === 'H';
    const accentColor = isMoHi ? 'mohi' : 'molo';

    return (
        <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
                    <h1 className="text-4xl font-extrabold text-mohi-600 dark:text-mohi-400">Vote</h1>
                    <InfoTooltip content={tooltipContent.voteScreen.pageInfo} position="bottom-start" />
                </div>
            </div>

            {/* --- Active Voting Card --- */}
            {item && (
                <>
                    <div className={`p-6 rounded-2xl border-2 shadow-lg ${themeClasses[accentColor].cardBg} ${themeClasses[accentColor].cardBorder} relative overflow-hidden transition-all duration-300`}>
                        <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold uppercase tracking-wide ${themeClasses[accentColor].badge}`}>
                            {isMoHi ? 'MoHi' : 'MoLo'}
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className={`mt-1 ${themeClasses[accentColor].iconColor}`}>
                                {isMoHi ? <ThumbsUp size={32} /> : <ThumbsDown size={32} />}
                            </div>
                            <div className="flex-grow">
                                <p className={`text-xl font-medium ${themeClasses[accentColor].textColor}`}>
                                    "{item.description}"
                                </p>
                            </div>

                            {/* Action Icons Column */}
                            <div className="flex flex-col space-y-4 pt-1 items-center">
                                {isMoHi && (
                                    <button
                                        onClick={handleSaveMoHi}
                                        disabled={isSaved}
                                        className={`${isSaved ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'} transition-colors`}
                                        title={isSaved ? "Saved" : "Save this MoHi"}
                                    >
                                        <Heart size={24} fill={isSaved ? "currentColor" : "none"} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                    title="Report Content"
                                >
                                    <AlertTriangle size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
                        How much does this impact your Mojo? Skip if this one isn't relevant to you
                    </p>

                    {/* Voting Buttons */}
                    <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((score) => {
                            let btnColorClass = '';
                            if (isMoHi) {
                                switch (score) {
                                    case 1: btnColorClass = 'bg-[#E6F4EA] hover:bg-[#CEEAD6] text-green-800'; break;
                                    case 2: btnColorClass = 'bg-[#C6E5D9] hover:bg-[#A3D3BF] text-green-900'; break;
                                    case 3: btnColorClass = 'bg-[#8FC9A3] hover:bg-[#76B98C] text-white'; break;
                                    case 4: btnColorClass = 'bg-[#58A76E] hover:bg-[#468C5A] text-white'; break;
                                    case 5: btnColorClass = 'bg-[#2E7D42] hover:bg-[#246334] text-white'; break;
                                    default: btnColorClass = 'bg-gray-200';
                                }
                            } else {
                                switch (score) {
                                    case 1: btnColorClass = 'bg-[#FCE8E6] hover:bg-[#FAD1CD] text-red-800'; break;
                                    case 2: btnColorClass = 'bg-[#F5C2BE] hover:bg-[#F09F99] text-red-900'; break;
                                    case 3: btnColorClass = 'bg-[#E67C73] hover:bg-[#D95C50] text-white'; break;
                                    case 4: btnColorClass = 'bg-[#D93025] hover:bg-[#B3261E] text-white'; break;
                                    case 5: btnColorClass = 'bg-[#A50E0E] hover:bg-[#820B0B] text-white'; break;
                                    default: btnColorClass = 'bg-gray-200';
                                }
                            }

                            return (
                                <Button
                                    key={score}
                                    onClick={() => handleVote(score)}
                                    color="custom"
                                    className={`h-14 text-xl font-bold flex items-center justify-center transition-transform active:scale-95 ${btnColorClass}`}
                                >
                                    {score}
                                </Button>
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 px-2">
                        <span>Low Impact</span>
                        <span>High Impact</span>
                    </div>

                    <div className="space-y-3 mt-4">
                        <div className="relative">
                            <Button onClick={handleSkip} color="gray" className="w-full">
                                Skip - not for me
                            </Button>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <InfoTooltip content={tooltipContent.voteScreen.skipButton} position="left" />
                            </div>
                        </div>
                        <Button onClick={() => navigate('landing')} color="gray" className="w-full bg-transparent border border-gray-300 text-gray-500 hover:bg-gray-50">
                            Back to Menu
                        </Button>
                    </div>
                </>
            )}

            <hr className="border-gray-200 dark:border-gray-700 my-8" />

            {/* --- Your Last Vote Card --- */}
            {lastVote && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-3">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">How Your Last Vote Compares To Others</h3>
                        <InfoTooltip content={tooltipContent.voteScreen.lastVoteCard} size={16} position="bottom-end" />
                    </div>
                    <div className="mb-3">
                        <p className="text-md font-medium text-gray-800 dark:text-gray-200 italic">"{lastVote.item.description}"</p>
                    </div>
                    <DistributionBars
                        distribution={lastVote.distribution}
                        userVote={lastVote.userScore}
                        totalVotes={Object.values(lastVote.distribution).reduce((a, b) => a + b, 0)}
                    />
                </div>
            )}

            {/* --- All Your Votes Card (Placeholder) --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2 mb-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">All Your Votes</h3>
                    <InfoTooltip content={tooltipContent.voteScreen.userVotesCard} size={16} position="bottom" />
                </div>
                <div className="text-center py-4 text-gray-400">
                    <Activity size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Vote history coming soon...</p>
                </div>
            </div>

            {/* --- All Voters Card --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2 mb-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">All Voters</h3>
                    <InfoTooltip content={tooltipContent.voteScreen.globalVotesCard} size={16} position="bottom-start" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-[#DAE0CE] rounded-lg">
                        <p className="text-xs font-bold text-[#3E501D] uppercase mb-1">MoHi Votes</p>
                        <p className="text-2xl font-black text-[#6C8B33]">
                            {globalStats.mohiVotes.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center p-3 bg-[#F3D2CE] rounded-lg">
                        <p className="text-xs font-bold text-[#8B2B1E] uppercase mb-1">MoLo Votes</p>
                        <p className="text-2xl font-black text-[#EB4832]">
                            {globalStats.moloVotes.toLocaleString()}
                        </p>
                    </div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">
                    Total Votes: {globalStats.totalVotes.toLocaleString()}
                </p>
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleReport}
            />
            <SavedSuccessModal
                isOpen={isSavedModalOpen}
                onClose={() => setIsSavedModalOpen(false)}
            />
            <MessageOverlay
                isOpen={messageOverlay.isOpen}
                onClose={() => setMessageOverlay({ ...messageOverlay, isOpen: false })}
                title={messageOverlay.title}
                message={messageOverlay.message}
            />
        </div>
    );
};