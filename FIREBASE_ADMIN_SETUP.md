# Firebase Admin SDK Setup

To enable API endpoints to work with Firestore, you need to configure Firebase Admin SDK credentials.

## Step 1: Get Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Click on **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file

## Step 2: Extract Required Values

From the downloaded JSON file, you need these values:
- `project_id`
- `private_key` 
- `client_email`

## Step 3: Add to Environment Variables

Add these to your `.env.local` file:

```bash
# Firebase Admin SDK (for API endpoints)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"

# Your existing Firebase config should already have:
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
```

## Important Notes:

1. **Private Key Format**: The private key must include the `\n` characters as literal text in the environment variable
2. **Security**: Never commit these credentials to version control
3. **Testing**: After adding these variables, restart your development server

## Verification

After setup, your API endpoints should work:

```bash
# Test collections endpoint
curl -X GET "http://localhost:3001/api/collections?userId=YOUR_USER_ID" \
  -H "x-api-key: YOUR_API_KEY"

# Test list collections endpoint  
curl -X GET "http://localhost:3001/api/list-collections" \
  -H "x-api-key: YOUR_API_KEY"
```

If you see "Firebase Admin SDK not configured" errors, check that all environment variables are set correctly. 