const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const db = getFirestore();

/**
 * Triggered when a new Mojo Item (MoHi/MoLo) is created.
 * 1. Increments global `totalItems`.
 * 2. Increments daily `newMohis` or `newMolos`.
 * 3. Increments per-user `itemCount`.
 */
exports.onMojoItemCreated = onDocumentCreated(
    {
        document: 'artifacts/{projectId}/public/data/mojo_items/{itemId}',
        region: 'europe-west2'
    },
    async (event) => {
        try {
            const item = event.data.data();
            const projectId = event.params.projectId;
            const itemType = item.type; // 'H' or 'L'
            const creatorId = item.linkToDemographicID; // Field holding the UID
            const dateKey = new Date().toISOString().split('T')[0];

            if (!creatorId) {
                console.warn(`Mojo Item ${event.params.itemId} created without linkToDemographicID.`);
            }

            console.log(`Mojo Item created: ${event.params.itemId} (${itemType}) by ${creatorId}`);

            const basePath = `artifacts/${projectId}/public/data`;
            const batch = db.batch();

            // 1. Increment Global Total Items
            const globalStatsRef = db.doc(`${basePath}/stats/global_counts`);
            batch.set(globalStatsRef, {
                totalItems: FieldValue.increment(1),
                lastUpdated: FieldValue.serverTimestamp()
            }, { merge: true });

            // 2. Increment Daily Stats
            const dailyStatsRef = db.doc(`${basePath}/stats_daily/${dateKey}`);
            const updatePayload = {
                itemCount: FieldValue.increment(1), // Total items for the day
                date: dateKey,
                lastUpdated: FieldValue.serverTimestamp()
            };

            if (itemType === 'H') {
                updatePayload.newMohis = FieldValue.increment(1);
            } else if (itemType === 'L') {
                updatePayload.newMolos = FieldValue.increment(1);
            }

            batch.set(dailyStatsRef, updatePayload, { merge: true });

            // 3. Increment User Item Count
            if (creatorId) {
                const userRef = db.doc(`${basePath}/users/${creatorId}`);
                // Use set with merge in case user doc doesn't exist yet (though onUserCreated should have run)
                batch.set(userRef, {
                    itemCount: FieldValue.increment(1),
                    lastActive: FieldValue.serverTimestamp()
                }, { merge: true });
            }

            await batch.commit();
            console.log(`Stats updated for item ${event.params.itemId}`);

        } catch (error) {
            console.error("Error in onMojoItemCreated:", error);
        }
    }
);
