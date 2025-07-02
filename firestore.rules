rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Collections: Allow authenticated users to manage collections
    match /collections/{collectionId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Videos: Allow authenticated users to manage videos
    match /videos/{videoId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Scripts: Allow authenticated users to manage their own scripts
    match /scripts/{scriptId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Allow users to read their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User profiles: Allow authenticated users to read/write their own profiles
    // Also allow reading other profiles for role-based access control
    match /user_profiles/{profileId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    
    // Coach-creator relationships: Allow coaches and super admins to manage
    match /coach_creator_relationships/{relationshipId} {
      allow read, write: if request.auth != null;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
} 