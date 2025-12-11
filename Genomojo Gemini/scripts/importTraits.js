import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// When running with emulators, we don't need credentials if we set the project ID
// and the FIRESTORE_EMULATOR_HOST env var is present.
// Allow overriding project ID via env var (e.g. for UAT)
const projectId = process.env.FIREBASE_PROJECT_ID || "genomojo";
process.env.GCLOUD_PROJECT = projectId;

if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.warn("⚠️  FIRESTORE_EMULATOR_HOST not set. This script is intended for local emulator seeding.");
    console.warn("    If you intend to run against production, you must provide service account credentials.");
}

const app = initializeApp({
    projectId: projectId
});

const db = getFirestore(app);

const CSV_PATH = path.join(__dirname, '../src/features/IdentityBuilder/traits.csv');
const COLLECTION_PATH = `artifacts/${projectId}/public/data/traits`;

// Helper to convert RGB to Hex
const rgbToHex = (r, g, b) => {
    const toHex = (c) => {
        const hex = parseInt(c).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
};

// Helper to parse CSV line
const parseLine = (line) => {
    const parts = line.split(',');
    return parts.map(p => p.trim());
};

const deleteCollection = async (db, collectionPath, batchSize) => {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
};

const deleteQueryBatch = async (db, query, resolve) => {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
};

const importData = async () => {
    try {
        console.log(`Targeting project: ${projectId}`);

        // 1. Clear existing data
        console.log(`Clearing existing traits from ${COLLECTION_PATH}...`);
        await deleteCollection(db, COLLECTION_PATH, 450);
        console.log('Collection cleared.');

        console.log(`Reading CSV from ${CSV_PATH}...`);
        const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        // Skip header
        const dataLines = lines.slice(1);

        console.log(`Found ${dataLines.length} traits to import.`);

        const batchSize = 450;
        let batches = [];
        let currentBatch = db.batch();
        let operationCount = 0;

        for (const line of dataLines) {
            let parts = parseLine(line);

            // Handle malformed root items with extra comma (9 parts instead of 8)
            // Example: 1,,,Self,FALSE,TRUE,100,149,237
            if (parts.length === 9 && parts[1] === '' && parts[2] === '') {
                // Remove the empty extra column (index 2)
                parts.splice(2, 1);
            }

            const [id, parentId, name, isSelectable, hasChildren, r, g, b] = parts;

            if (!id) continue;

            const docRef = db.doc(`${COLLECTION_PATH}/${id}`);

            const traitData = {
                id,
                parentId: parentId || null,
                label: name,
                isSelectable: isSelectable === 'TRUE',
                hasChildren: hasChildren === 'TRUE',
                color: rgbToHex(r, g, b)
            };

            currentBatch.set(docRef, traitData);
            operationCount++;

            if (operationCount >= batchSize) {
                batches.push(currentBatch.commit());
                currentBatch = db.batch();
                operationCount = 0;
            }
        }

        if (operationCount > 0) {
            batches.push(currentBatch.commit());
        }

        console.log(`Committing ${batches.length} batches...`);
        await Promise.all(batches);
        console.log('Import completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
};

importData();
