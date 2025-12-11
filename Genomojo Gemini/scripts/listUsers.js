import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// Check for service account key
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
  console.error('Please set it to the path of your service account key JSON file.');
  console.error('Example: export GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"');
  process.exit(1);
}

try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    initializeApp({
      credential: cert(serviceAccount)
    });

    const listAllUsers = async (nextPageToken) => {
      // List batch of users, 1000 at a time.
      try {
        const listUsersResult = await getAuth().listUsers(1000, nextPageToken);
        if (listUsersResult.users.length === 0) {
            console.log('No users found.');
            return;
        }

        listUsersResult.users.forEach((userRecord) => {
          console.log('--------------------------------------------------');
          console.log('User UID:', userRecord.uid);
          console.log('Email:', userRecord.email);
          console.log('Display Name:', userRecord.displayName);
          console.log('Provider IDs:', userRecord.providerData.map(p => p.providerId).join(', '));
          console.log('Created At:', userRecord.metadata.creationTime);
          console.log('Last Sign In:', userRecord.metadata.lastSignInTime);
        });

        if (listUsersResult.pageToken) {
          // List next batch of users.
          await listAllUsers(listUsersResult.pageToken);
        }
      } catch (error) {
        console.log('Error listing users:', error);
      }
    };

    console.log('Listing users...');
    // Start listing users from the beginning, 1000 at a time.
    listAllUsers();

} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    console.error('Make sure the service account key file exists and is valid.');
    process.exit(1);
}
