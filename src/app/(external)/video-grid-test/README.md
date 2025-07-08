# Video Grid Test Pages

This directory contains test pages for demonstrating video grid functionality with single video playback control.

## Pages

### 1. Basic Test (`/video-grid-test`)
- **URL**: `/video-grid-test`
- **Features**:
  - Uses existing `VideoEmbed` component
  - Leverages `VideoPlaybackProvider` context
  - 3x3 grid layout (9 videos max)
  - Single video playback control
  - Responsive design
  - Shows video metadata (title, platform, metrics, author)

### 2. Advanced Test (`/video-grid-test/advanced`)
- **URL**: `/video-grid-test/advanced`
- **Features**:
  - Player.js integration for enhanced iframe control
  - Direct iframe manipulation with postMessage
  - Custom play/pause buttons
  - Real-time playback status tracking
  - Fallback to postMessage if Player.js fails to load
  - Enhanced error handling and logging

## Key Features

### Single Video Playback
Both test pages ensure only one video can play at a time:

1. **Basic Test**: Uses the existing `VideoPlaybackProvider` context
2. **Advanced Test**: Uses Player.js API + postMessage fallback

### Video Loading
- Fetches videos from "All Videos" collection using `CollectionsRBACService`
- Handles loading states, errors, and empty states
- Limits display to 9 videos for testing purposes

### Responsive Design
- 3 columns on large screens (lg:grid-cols-3)
- 2 columns on medium screens (md:grid-cols-2)
- 1 column on small screens (grid-cols-1)
- Aspect ratio 9:16 for video containers

### Video Information Display
- Video title (with fallback)
- Platform (TikTok/Instagram)
- Engagement metrics (likes, views)
- Author information
- Play/pause controls

## Technical Implementation

### Basic Test
```tsx
// Uses existing components
<VideoPlaybackProvider>
  <VideoEmbed url={video.iframeUrl} />
</VideoPlaybackProvider>
```

### Advanced Test
```tsx
// Direct iframe control with Player.js
const player = new window.playerjs.Player(iframe);
player.on('play', () => stopAllVideos());
iframe.contentWindow.postMessage({ command: 'play' }, '*');
```

## Usage

1. Navigate to `/video-grid-test` for the basic implementation
2. Navigate to `/video-grid-test/advanced` for the Player.js implementation
3. Click on any video to start playback
4. Only one video will play at a time
5. Use navigation links to switch between tests

## Dependencies

- `@/contexts/auth-context` - User authentication
- `@/contexts/video-playback-context` - Video playback state management
- `@/lib/collections` - Video data fetching
- `@/components/video-embed` - Video embedding component
- Player.js (loaded dynamically in advanced test)

## Browser Compatibility

- **Basic Test**: Works with all modern browsers
- **Advanced Test**: Requires JavaScript and iframe support
- Player.js fallback ensures compatibility even if Player.js fails to load

## Testing Notes

- Both pages require user authentication
- Videos must be processed and stored in the database
- Bunny.net iframe URLs are required for proper playback
- Test with different screen sizes to verify responsive behavior 