const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// ---- CONFIGURATION ----
// IMPORTANT: Make sure you have your Firebase Admin SDK service account key JSON file
// and you've set the GOOGLE_APPLICATION_CREDENTIALS environment variable.
// See: https://firebase.google.com/docs/admin/setup#initialize-sdk
const SERVICE_ACCOUNT_PATH = './path/to/your/serviceAccountKey.json';
// -----------------------

// Initialize Firebase Admin SDK
try {
  // If you have the GOOGLE_APPLICATION_CREDENTIALS env var set, you can just do:
  admin.initializeApp({
    // credential: admin.credential.applicationDefault()
  });
  // If not, use the service account file path:
  // const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  // admin.initializeApp({
  //   credential: admin.credential.cert(serviceAccount)
  // });
} catch (error) {
  console.error(
    '🔴 Firebase Admin SDK initialization failed. ' +
    'Please ensure your service account credentials are set up correctly. ' +
    'You can either set the GOOGLE_APPLICATION_CREDENTIALS environment variable ' +
    'or update the SERVICE_ACCOUNT_PATH in this script.'
  );
  process.exit(1);
}


const db = getFirestore();
const videosCollectionRef = db.collection('videos');
const BATCH_SIZE = 400; // Firestore batch writes are limited to 500 operations

/**
 * Helper function to build the Bunny Stream thumbnail URL from a video document.
 * This logic is duplicated from the frontend helper functions.
 * @param {object} videoData - The data from the Firestore video document.
 * @returns {string|null} The generated thumbnail URL or null if it cannot be derived.
 */
const getThumbnailUrl = (videoData) => {
  // Priority 1: Use the existing thumbnailUrl if it already looks like the new format.
  if (videoData.thumbnailUrl && videoData.thumbnailUrl.endsWith('/thumbnail.jpg')) {
    // Already seems correct, no need to update
    return videoData.thumbnailUrl;
  }

  // Priority 2: Try to derive from directUrl (preferred)
  if (videoData.directUrl && videoData.directUrl.includes('.b-cdn.net')) {
    try {
      const url = new URL(videoData.directUrl);
      const host = url.host; // e.g. vz-8416c36e-556.b-cdn.net
      const parts = url.pathname.split('/').filter(Boolean); // [guid, ...]
      if (parts.length > 0) {
        const guid = parts[0];
        return `https://${host}/${guid}/thumbnail.jpg`;
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }

  // Priority 3: Fallback to derive from iframeUrl
  if (videoData.iframeUrl && videoData.iframeUrl.includes('iframe.mediadelivery.net')) {
    try {
      const url = new URL(videoData.iframeUrl);
      const parts = url.pathname.split('/').filter(Boolean); // [embed, libraryId, guid]
      if (parts.length === 3) {
        const libraryId = parts[1];
        const guid = parts[2];
        return `https://vz-${libraryId}.b-cdn.net/${guid}/thumbnail.jpg`;
      }
    } catch (error) {
        // Ignore parsing errors
    }
  }

  // Final fallback: Use the old `thumbnailUrl` if it's a valid URL but not the new format.
  // This might be from TikTok/Instagram and is better than nothing.
  if (videoData.thumbnailUrl && (videoData.thumbnailUrl.startsWith('http://') || videoData.thumbnailUrl.startsWith('https://'))) {
      return videoData.thumbnailUrl;
  }

  return null; // No suitable URL found
};


/**
 * Fetches all videos and updates their thumbnail URLs in batches.
 */
async function updateAllThumbnails() {
  console.log('🚀 Starting thumbnail update process...');
  const snapshot = await videosCollectionRef.get();

  if (snapshot.empty) {
    console.log('✅ No videos found. Exiting.');
    return;
  }

  console.log(`🔍 Found ${snapshot.size} total videos to check.`);

  let batch = db.batch();
  let updatesInBatch = 0;
  let totalUpdates = 0;

  for (const doc of snapshot.docs) {
    const videoData = doc.data();
    const currentThumbnail = videoData.thumbnailUrl;
    const newThumbnail = getThumbnailUrl(videoData);

    // Check if an update is needed
    if (newThumbnail && newThumbnail !== currentThumbnail) {
      console.log(`  - Updating video ${doc.id}:`);
      console.log(`    FROM: ${currentThumbnail}`);
      console.log(`    TO:   ${newThumbnail}`);
      batch.update(doc.ref, { thumbnailUrl: newThumbnail });
      updatesInBatch++;
      totalUpdates++;
    }

    // Commit the batch when it's full
    if (updatesInBatch === BATCH_SIZE) {
      console.log(`\n📦 Committing a batch of ${updatesInBatch} updates...`);
      await batch.commit();
      console.log('✅ Batch committed successfully.');
      // Start a new batch
      batch = db.batch();
      updatesInBatch = 0;
    }
  }

  // Commit any remaining updates in the last batch
  if (updatesInBatch > 0) {
    console.log(`\n📦 Committing the final batch of ${updatesInBatch} updates...`);
    await batch.commit();
    console.log('✅ Final batch committed successfully.');
  }

  console.log('\n-----------------------------------------');
  console.log('🎉 Thumbnail update process complete!');
  console.log(`   Total videos checked: ${snapshot.size}`);
  console.log(`   Total videos updated: ${totalUpdates}`);
  console.log('-----------------------------------------');
}

updateAllThumbnails().catch((error) => {
  console.error('🔴 An unexpected error occurred:', error);
  process.exit(1);
}); 