const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Apps might already be initialized by other functions in the same instance
if (!require('firebase-admin/app').getApps().length) {
    initializeApp();
}
const db = getFirestore();

/**
 * Firestore trigger that updates vote statistics when a new vote is created.
 */
exports.onVoteCreated = onDocumentCreated(
    {
        document: 'artifacts/{projectId}/public/data/votes/{voteId}',
        region: 'europe-west2'
    },
    async (event) => {
        try {
            const vote = event.data.data();
            const projectId = event.params.projectId;
            const voterId = vote.voterID;
            const dateKey = new Date().toISOString().split('T')[0];

            console.log(`Vote created: ${event.params.voteId}, type: ${vote.type}, by: ${voterId}`);

            const basePath = `artifacts/${projectId}/public/data`;
            const batch = db.batch();

            // 1. Global Totals (Existing Logic, slightly modified path ref)
            const globalStatsRef = db.doc(`${basePath}/stats/vote_totals`);
            batch.set(globalStatsRef, {
                totalVotes: FieldValue.increment(1),
                mohiVotes: vote.type === 'H' ? FieldValue.increment(1) : FieldValue.increment(0),
                moloVotes: vote.type === 'L' ? FieldValue.increment(1) : FieldValue.increment(0),
                lastUpdated: FieldValue.serverTimestamp()
            }, { merge: true });

            // 2. Global Counts (for parity with other stats)
            const globalCountsRef = db.doc(`${basePath}/stats/global_counts`);
            batch.set(globalCountsRef, {
                totalVotes: FieldValue.increment(1),
                lastUpdated: FieldValue.serverTimestamp()
            }, { merge: true });

            // 3. Daily Stats
            const dailyStatsRef = db.doc(`${basePath}/stats_daily/${dateKey}`);
            batch.set(dailyStatsRef, {
                newVotes: FieldValue.increment(1),
                date: dateKey,
                lastUpdated: FieldValue.serverTimestamp()
            }, { merge: true });

            // 4. User Vote Count
            if (voterId) {
                const userRef = db.doc(`${basePath}/users/${voterId}`);
                batch.set(userRef, {
                    voteCount: FieldValue.increment(1),
                    lastActive: FieldValue.serverTimestamp()
                }, { merge: true });
            }

            // Commit all updates
            await batch.commit();

            console.log(`Vote stats updated successfully for ${vote.type} vote`);
        } catch (error) {
            console.error('Error updating vote stats:', error);
        }
    }
);
