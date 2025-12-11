const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

/**
 * Scheduled function to aggregate votes.
 * Ideally runs every 30 seconds or 1 minute.
 */
exports.aggregateVotes = async (event) => {
    try {
        console.log("Starting vote aggregation...");

        // 1. Fetch all votes (or use a more efficient method like distributed counters for massive scale)
        // For now, reading all votes is acceptable for the current scale.
        // In a production app with millions of votes, use distributed counters or increment on write.

        // We need to count votes for MoHi (type 'H') and MoLo (type 'L').
        // However, the 'type' field might not be on the vote document itself in the legacy data.
        // We might need to join with mojo_items or rely on the new 'type' field being added to votes.

        // STRATEGY:
        // We will query the 'votes' collection.
        // We assume new votes have the 'type' field.
        // For old votes without 'type', we might miss them in the specific counts unless we look up the item.
        // For efficiency in this scheduled job, we will ONLY count votes that have the 'type' field 
        // OR we accept that this is a "forward looking" stat.

        // Let's try to do it right: Fetch all votes, and if type is missing, fetch the item? 
        // No, that's too many reads.
        // Let's assume we only count votes with 'type' populated, or we do a one-time migration.
        // For this implementation, we will query based on the 'type' field on the vote.

        const votesRef = db.collection('artifacts').doc(process.env.GCLOUD_PROJECT).collection('public').doc('data').collection('votes');

        // Count MoHi votes
        const mohiSnapshot = await votesRef.where('type', '==', 'H').count().get();
        const mohiCount = mohiSnapshot.data().count;

        // Count MoLo votes
        const moloSnapshot = await votesRef.where('type', '==', 'L').count().get();
        const moloCount = moloSnapshot.data().count;

        // Total votes (all votes, including potentially those without type if we just want a raw total)
        const totalSnapshot = await votesRef.count().get();
        const totalCount = totalSnapshot.data().count;

        console.log(`Aggregation complete. MoHi: ${mohiCount}, MoLo: ${moloCount}, Total: ${totalCount}`);

        // 2. Write to cache
        const statsRef = db.collection('artifacts').doc(process.env.GCLOUD_PROJECT).collection('public').doc('data').collection('stats').doc('vote_totals');

        await statsRef.set({
            mohiVotes: mohiCount,
            moloVotes: moloCount,
            totalVotes: totalCount,
            lastUpdated: new Date().toISOString()
        });

        console.log("Stats updated successfully.");

    } catch (error) {
        console.error("Error aggregating votes:", error);
    }
};

// To run this locally for testing (if you have admin credentials set up):
// node functions/voteAggregator.js
if (require.main === module) {
    exports.aggregateVotes();
}
