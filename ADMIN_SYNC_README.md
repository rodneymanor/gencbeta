# Admin Creator Sync API

This API allows administrators to perform background syncing of creator profile data to fill in missing information and update existing profiles.

## Setup

1. Add your admin key to `.env.local`:

```bash
ADMIN_SYNC_KEY=your-super-secret-admin-key-here
```

## API Endpoint

**POST** `/api/admin/sync-creators`

### Request Body

```json
{
  "adminKey": "your-admin-key",
  "creatorIds": ["optional-creator-id-1", "optional-creator-id-2"], // Optional: specific creators to sync
  "syncVideos": false // Optional: whether to fetch new videos (default: false)
}
```

### Examples

#### Sync all creators (profile data only)

```bash
curl -X POST http://localhost:3000/api/admin/sync-creators \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "your-admin-key"
  }'
```

#### Sync specific creators with new videos

```bash
curl -X POST http://localhost:3000/api/admin/sync-creators \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "your-admin-key",
    "creatorIds": ["2hz8cIzPLYjcZN6NqPbi", "another-creator-id"],
    "syncVideos": true
  }'
```

### Response

```json
{
  "success": true,
  "syncedCreators": 5,
  "errors": [
    {
      "creatorId": "some-id",
      "username": "problematic-user",
      "error": "Profile is private"
    }
  ],
  "message": "Successfully synced 5 creators with 1 errors"
}
```

## What Gets Synced

The sync process updates the following profile data:

- ✅ **Display name and full name**
- ✅ **Profile image URL (high resolution)**
- ✅ **Bio/caption text**
- ✅ **Follower count**
- ✅ **Following count**
- ✅ **Post count**
- ✅ **Verification status**
- ✅ **Privacy status**
- ✅ **External website URL**
- ✅ **Business category**
- ✅ **Last synced timestamp**
- ✅ **New videos** (if `syncVideos: true`)

## Rate Limiting

The sync includes automatic rate limiting:

- 2-second delay between each creator
- Respects existing RapidAPI rate limits
- Uses the same request queue system as regular creator processing

## Error Handling

- Individual creator failures don't stop the entire sync
- Detailed error reporting per creator
- Continues processing even if some profiles fail
- Logs all activity for debugging

## Security

- Requires admin key authentication
- Should only be used by administrators
- Keep the admin key secure and never expose it in client code

## Use Cases

1. **Fill Missing Data**: Sync existing creators to fill in missing follower counts, bios, etc.
2. **Update Profiles**: Refresh profile data that may have changed since initial creation
3. **Bulk Operations**: Update multiple creators at once
4. **Historical Sync**: Add missing videos to existing creators
