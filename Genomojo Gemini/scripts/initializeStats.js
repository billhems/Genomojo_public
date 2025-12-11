import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator
connectFirestoreEmulator(db, 'localhost', 8088);

async function initializeStats() {
    try {
        const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'genomojo';
        const statsRef = doc(db, 'artifacts', projectId, 'public', 'data', 'stats', 'vote_totals');

        await setDoc(statsRef, {
            totalVotes: 0,
            mohiVotes: 0,
            moloVotes: 0,
            lastUpdated: new Date().toISOString()
        });

        console.log('✅ Stats collection initialized successfully!');
        console.log('Path: artifacts/' + projectId + '/public/data/stats/vote_totals');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing stats:', error);
        process.exit(1);
    }
}

initializeStats();
