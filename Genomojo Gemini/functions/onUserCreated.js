const functions = require("firebase-functions/v1");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const db = getFirestore();

/**
 * Triggered when a new user is created in Firebase Auth.
 * Uses v1 SDK because v2 currently only supports blocking auth triggers.
 */
exports.onUserCreated = functions.region('europe-west2').auth.user().onCreate(async (user) => {
    try {
        // In v1, 'user' is passed directly as the first argument
        const userId = user.uid;
        const creationTime = user.metadata.creationTime || new Date().toISOString();
        const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Use a fixed project ID since triggers don't provide event.params.projectId for Auth events
        // In a real multi-tenant app, this would need configuration.
        // Assuming single project 'genomojo' or 'genomojo-uat' from context, but we need to store data in the 'artifacts' path.
        // We will default to 'genomojo' as the projectId placeholder if env var missing, but in standard FB functions process.env.GCLOUD_PROJECT is available.
        const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG?.projectId || 'genomojo';

        console.log(`User created: ${userId} in project ${projectId}`);

        const basePath = `artifacts/${projectId}/public/data`;

        const batch = db.batch();

        // 1. Create User Document
        const userRef = db.doc(`${basePath}/users/${userId}`);
        batch.set(userRef, {
            createdAt: creationTime,
            isAnonymous: user.providerData.length === 0, // True if no providers linked
            voteCount: 0,
            itemCount: 0,
            email: user.email || null,
            displayName: user.displayName || null
        }, { merge: true });

        // 2. Increment Global Total Users
        const globalStatsRef = db.doc(`${basePath}/stats/global_counts`);
        batch.set(globalStatsRef, {
            totalUsers: FieldValue.increment(1),
            lastUpdated: FieldValue.serverTimestamp()
        }, { merge: true });

        // 3. Increment Daily New Users
        const dailyStatsRef = db.doc(`${basePath}/stats_daily/${dateKey}`);
        batch.set(dailyStatsRef, {
            newUsers: FieldValue.increment(1),
            date: dateKey,
            lastUpdated: FieldValue.serverTimestamp()
        }, { merge: true });

        await batch.commit();
        console.log(`Stats updated for new user: ${userId}`);

    } catch (error) {
        console.error("Error in onUserCreated:", error);
    }
});
