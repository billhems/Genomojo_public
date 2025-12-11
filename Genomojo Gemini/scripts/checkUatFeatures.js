import admin from 'firebase-admin';

admin.initializeApp({
    projectId: 'genomojo-uat'
});

const db = admin.firestore();

async function listCollections() {
    try {
        const collections = await db.listCollections();
        console.log("Root collections:", collections.map(c => c.id));

        // Check specific path
        const docPath = 'artifacts/genomojo-uat/public/data/config/features';
        console.log("Checking path:", docPath);
        const doc = await db.doc(docPath).get();
        if (doc.exists) {
            console.log("Features config:", doc.data());
        } else {
            console.log("Features config document does NOT exist.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

listCollections();
