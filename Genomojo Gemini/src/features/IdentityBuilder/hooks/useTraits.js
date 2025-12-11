import { useState, useEffect } from 'react';
import { useFirebaseApp, collection, getDocs, getCollectionPath } from '../../../hooks/useFirebaseApp';
import { flatToHierarchical } from '../utils/hierarchyUtils';

export const useTraits = () => {
    const { db } = useFirebaseApp();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTraits = async () => {
            if (!db) return;
            setLoading(true);
            try {
                // Fetch all traits from the public traits collection
                // Use helper to get correct path based on project ID (genomojo or genomojo-uat)
                const traitsRef = collection(db, getCollectionPath('traits'));
                const snapshot = await getDocs(traitsRef);

                const flatItems = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // If no data found, check if we should fallback or if path is different
                if (flatItems.length === 0) {
                    console.warn("No traits found in Firestore.");
                }

                const hierarchicalData = flatToHierarchical(flatItems);
                setData(hierarchicalData);
            } catch (err) {
                console.error("Error fetching traits:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTraits();
    }, [db]);

    return { data, loading, error };
};
