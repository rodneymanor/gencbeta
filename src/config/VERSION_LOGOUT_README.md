# Version-Based Logout System

This system forces all users to log out when you deploy a new version of the application.

## How it works

1. The system checks the stored app version in localStorage against the current app version
2. If they don't match (meaning a new version was deployed), it:
   - Clears all authentication caches
   - Signs out the current user
   - Clears localStorage and sessionStorage
   - Forces a page reload

## How to force logout on deployment

1. Open `/src/config/app-version.ts`
2. Update the `APP_VERSION` constant
3. Deploy your changes

### Example:

```typescript
// Before deployment
export const APP_VERSION = "1.0.0-20250122";

// After deployment (users will be forced to log out)
export const APP_VERSION = "1.0.1-20250123";
```

## Version format recommendation

Use the format: `MAJOR.MINOR.PATCH-YYYYMMDD`

- `MAJOR.MINOR.PATCH`: Your semantic version
- `YYYYMMDD`: Deployment date

This makes it easy to track when deployments happened and ensures uniqueness.

## Testing locally

To test the logout behavior:
1. Log in to your application
2. Open browser DevTools > Application > Local Storage
3. Find the key `app_deployed_version` and change its value
4. Refresh the page - you should be logged out

## Notes

- This only affects users who visit the app after deployment
- Users who don't visit won't be logged out until they return
- The version check happens on app initialization, not during active use