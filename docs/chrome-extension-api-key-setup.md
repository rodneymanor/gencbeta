# Chrome Extension API Key Setup Guide

This guide will walk you through generating an API key for your Chrome extension to integrate with the Video Collection API.

## Overview

The API key allows your Chrome extension to:
- **Add videos** to your collections from any website
- **List all collections** to choose where to save videos
- **Retrieve collection information** and video counts

## Step-by-Step Instructions

### 1. Access Your Dashboard

1. **Open your browser** and navigate to your dashboard
2. **Log in** to your account if you haven't already
3. You should see the main dashboard with navigation in the sidebar

### 2. Navigate to Settings

1. **Look for the sidebar** on the left side of your dashboard
2. **Click on "Settings"** in the navigation menu
   - You'll find this in the main navigation section
   - The icon looks like a gear ⚙️

### 3. Find API Key Management

1. **Scroll down** on the Settings page until you see the **"API Key Management"** section
2. This section has:
   - A key icon 🔑
   - Title: "API Key Management"
   - Description: "Generate and manage API keys for Chrome extension integration"

### 4. Generate Your API Key

#### If you don't have an API key yet:

1. You'll see a **"No API Key"** status with a key icon
2. **Click the "Generate API Key" button**
   - The button shows a key icon and says "Generate API Key"
3. **Wait for generation** - the button will show "Generating..." with a spinning icon
4. **Copy your API key immediately** when it appears:
   - A green alert box will appear with your new API key
   - **⚠️ IMPORTANT**: This key will only be shown once!
   - Click the **copy button** (📋) next to the key
   - Store the key securely (password manager, secure notes, etc.)
5. **Click "Dismiss"** once you've copied the key

#### If you already have an active API key:

1. You'll see **"Active API Key"** status with:
   - Key ID (partial identifier)
   - Creation date
   - Last used date
   - Request count
   - Violations count
2. **To generate a new key**:
   - First **click "Revoke API Key"** (red button with trash icon)
   - Confirm the revocation when prompted
   - Then follow the steps above to generate a new key

### 5. API Key Information

Your API key provides access with these limits:
- **Rate Limit**: Requests per minute (typically 60)
- **Violation Threshold**: Maximum violations before lockout (typically 3)
- **Lockout Duration**: Time locked out after violations (typically 1 hour)

## Using Your API Key in Chrome Extension

### Base URL
```
https://gencbeta-57yb9m9q1-rodneymanors-projects.vercel.app
```

### Available Endpoints

#### 1. List All Collections
```javascript
// GET /api/collections
const response = await fetch(`${BASE_URL}/api/collections`, {
  headers: {
    'x-api-key': 'your-api-key-here'
  }
});
```

#### 2. Add Video to Collection
```javascript
// POST /api/add-video-to-collection
const response = await fetch(`${BASE_URL}/api/add-video-to-collection`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key-here'
  },
  body: JSON.stringify({
    videoUrl: 'https://example.com/video.mp4',
    collectionId: 'your-collection-id',
    title: 'Optional video title'
  })
});
```

### Chrome Extension Example

```javascript
// Background script or content script
class VideoCollectionAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://gencbeta-57yb9m9q1-rodneymanors-projects.vercel.app';
  }

  async getCollections() {
    try {
      const response = await fetch(`${this.baseUrl}/api/collections`, {
        headers: {
          'x-api-key': this.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      throw error;
    }
  }

  async addVideo(videoUrl, collectionId, title = null) {
    try {
      const response = await fetch(`${this.baseUrl}/api/add-video-to-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          videoUrl,
          collectionId,
          title
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to add video:', error);
      throw error;
    }
  }
}

// Usage
const api = new VideoCollectionAPI('your-api-key-here');

// Get collections for dropdown
const collections = await api.getCollections();

// Add current page video
const result = await api.addVideo(
  window.location.href, 
  'selected-collection-id',
  document.title
);
```

## Security Best Practices

### ✅ DO:
- **Store API key securely** in Chrome extension storage
- **Use HTTPS** for all API requests (already configured)
- **Handle errors gracefully** with user-friendly messages
- **Validate video URLs** before sending to API
- **Check rate limits** and implement retry logic

### ❌ DON'T:
- **Never expose API key** in public repositories
- **Don't hardcode API key** in extension source code
- **Don't ignore error responses** from the API
- **Don't spam requests** - respect rate limits

### Chrome Extension Storage Example:
```javascript
// Store API key securely
chrome.storage.sync.set({ apiKey: 'your-api-key' });

// Retrieve API key
const { apiKey } = await chrome.storage.sync.get('apiKey');
```

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**
   - Check if API key is correct
   - Ensure key hasn't been revoked
   - Verify header format: `x-api-key: your-key`

2. **429 Rate Limited**
   - You've exceeded the rate limit
   - Wait before making more requests
   - Check if key is locked out

3. **400 Bad Request**
   - Missing required fields (videoUrl, collectionId)
   - Invalid URL format
   - Check request body structure

4. **404 Not Found**
   - Collection ID doesn't exist
   - User doesn't have access to collection

### Getting Help:

1. **Check the browser console** for detailed error messages
2. **Verify API key status** in Settings → API Key Management
3. **Test with a simple cURL request** first
4. **Check rate limit status** in the settings panel

## API Key Management

### Monitoring Usage:
- View **request count** in settings
- Check **last used** date
- Monitor **violations** count

### Security Actions:
- **Revoke immediately** if compromised
- **Generate new key** periodically for security
- **Monitor unusual activity** in request counts

### Lockout Recovery:
- If locked out due to violations, wait for lockout period to expire
- Check lockout status in settings
- Reduce request frequency to avoid future lockouts

---

**Need more help?** Check the full [API Documentation](../API_DOCUMENTATION.md) for detailed endpoint specifications and examples. 