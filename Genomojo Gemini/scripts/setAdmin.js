import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
// This will automatically connect to emulators if FIREBASE_AUTH_EMULATOR_HOST is set
const projectId = process.env.FIREBASE_PROJECT_ID || 'genomojo';
process.env.GCLOUD_PROJECT = projectId;
initializeApp({
    projectId: projectId
});

const email = process.argv[2];

if (!email) {
    console.error('Please provide an email address as an argument.');
    console.error('Usage: node scripts/setAdmin.js <email>');
    process.exit(1);
}

const setAdminClaim = async (email) => {
    try {
        const user = await getAuth().getUserByEmail(email);
        await getAuth().setCustomUserClaims(user.uid, { admin: true });
        console.log(`Successfully set admin claim for user: ${email} (UID: ${user.uid})`);
        console.log('NOTE: The user may need to sign out and sign back in for the claim to take effect.');
    } catch (error) {
        console.error('Error setting admin claim:', error);
        process.exit(1);
    }
};

setAdminClaim(email);
