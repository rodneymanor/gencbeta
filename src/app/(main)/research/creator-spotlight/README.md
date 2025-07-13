# Creator Spotlight

A comprehensive feature for discovering and analyzing creators from TikTok and Instagram. The Creator Spotlight page provides a grid view of creator profiles and detailed views with their videos, enabling content analysis and insights.

## Features

### 🎯 Core Functionality
- **Creator Grid View**: Browse creators in a responsive card layout
- **Creator Detail View**: View individual creator profiles with their videos
- **Search & Filter**: Find creators by name or filter by platform
- **Add New Creators**: Seamlessly add creators from TikTok or Instagram
- **Video Analysis**: View and analyze creator videos using the VideoGridDisplay component

### 🔍 Creator Discovery
- **Platform Support**: TikTok and Instagram creators
- **Profile Information**: Display names, bios, follower counts, verification status
- **Video Counts**: Show number of videos available for each creator
- **Last Processed**: Track when creator data was last updated

### 📊 Video Analysis
- **Instagram-style Grid**: Vertical video thumbnails with engagement metrics
- **Video Details**: Duration, likes, views, titles, and descriptions
- **Interactive Features**: Click to view, favorite videos, and more
- **Responsive Design**: Optimized for desktop and mobile viewing

## Components

### Main Page (`page.tsx`)
The main Creator Spotlight page that handles:
- Creator grid display
- Search and filtering
- Navigation between grid and detail views
- Integration with API endpoints

### Add Creator Dialog (`_components/add-creator-dialog.tsx`)
A comprehensive dialog for adding new creators:
- Platform selection (TikTok/Instagram)
- Username input with validation
- Optional profile information
- Real-time preview
- Error handling and success feedback

## API Integration

### `/api/creators` (GET)
Fetches all available creators:
```typescript
interface CreatorProfile {
  id: string;
  username: string;
  displayName?: string;
  platform: 'tiktok' | 'instagram';
  profileImageUrl: string;
  bio?: string;
  website?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isVerified?: boolean;
  videoCount?: number;
  lastProcessed?: string;
  createdAt: string;
  updatedAt: string;
}
```

### `/api/creators` (POST)
Adds a new creator to the spotlight:
```typescript
interface AddCreatorRequest {
  username: string;
  platform: 'tiktok' | 'instagram';
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
  website?: string;
}
```

### Integration with Existing APIs
- **`/api/process-creator`**: Extracts creator profile and video data
- **`/api/process-creator/download-all`**: Downloads and transcribes videos
- **`/api/video/download`**: Downloads individual videos
- **`/api/video/transcribe`**: Transcribes video content

## Usage

### Basic Navigation
1. **Grid View**: Browse creators in a card layout
2. **Search**: Use the search bar to find specific creators
3. **Filter**: Filter by platform (All, TikTok, Instagram)
4. **Detail View**: Click on a creator card to view their profile and videos

### Adding a Creator
1. Click the "Add Creator" button
2. Select platform (TikTok or Instagram)
3. Enter the creator's username (without @ symbol)
4. Optionally add display name, profile image, bio, and website
5. Review the preview and submit
6. The system will automatically:
   - Process the creator's profile
   - Extract their videos
   - Download and transcribe content
   - Add them to the spotlight

### Creator Detail View
- **Profile Header**: Uses the SocialHeader component for consistent styling
- **Video Grid**: Uses the VideoGridDisplay component in Instagram mode
- **Back Navigation**: Return to the creator grid
- **Video Interaction**: Click videos for detailed analysis

## Styling & Design

### Platform Branding
- **TikTok**: `#FF0050` (Pink/Red)
- **Instagram**: `#E4405F` (Pink/Red variant)

### Responsive Design
- **Desktop**: 3-column grid layout
- **Tablet**: 2-column grid layout  
- **Mobile**: Single column layout
- **Video Grid**: Responsive Instagram-style layout

### Component Integration
- **SocialHeader**: Left-justified creator profiles
- **VideoGridDisplay**: Instagram mode for video thumbnails
- **Shadcn UI**: Consistent design system components
- **Tailwind CSS**: Utility-first styling approach

## State Management

### Local State
- `creators`: Array of creator profiles
- `selectedCreator`: Currently viewed creator
- `creatorVideos`: Videos for the selected creator
- `loading`: Loading states for different operations
- `searchTerm`: Current search query
- `platformFilter`: Current platform filter

### URL State
- `creator` parameter: Tracks selected creator for deep linking
- Browser navigation: Back/forward button support

## Error Handling

### API Errors
- Network failures with fallback to mock data
- Invalid creator usernames
- Private or empty profiles
- Rate limiting and API quotas

### User Feedback
- Loading states with skeleton placeholders
- Error messages with actionable guidance
- Success confirmations
- Empty state messaging

## Performance Considerations

### Lazy Loading
- Videos load only when viewing creator details
- Skeleton placeholders during loading
- Progressive image loading

### Caching
- Creator profiles cached in local state
- Video data cached per creator
- API responses cached where appropriate

### Optimization
- Debounced search input
- Efficient filtering and sorting
- Minimal re-renders with proper React patterns

## Accessibility

### Keyboard Navigation
- Tab navigation through all interactive elements
- Enter/Space key support for buttons
- Escape key to close dialogs

### Screen Reader Support
- Proper ARIA labels and descriptions
- Semantic HTML structure
- Alt text for images and videos

### Focus Management
- Focus trapping in dialogs
- Focus restoration after dialog close
- Visible focus indicators

## Future Enhancements

### Planned Features
- **Creator Analytics**: Engagement metrics and trends
- **Video Collections**: Group videos by themes or campaigns
- **Export Functionality**: Download creator data and insights
- **Collaboration Tools**: Share creators with team members
- **Advanced Filtering**: Filter by follower count, engagement rate, etc.

### Technical Improvements
- **Database Integration**: Replace mock data with persistent storage
- **Real-time Updates**: Live creator data updates
- **Batch Processing**: Process multiple creators simultaneously
- **Advanced Search**: Full-text search across creator content

## Development

### File Structure
```
src/app/(main)/creator-spotlight/
├── page.tsx                    # Main page component
├── _components/
│   └── add-creator-dialog.tsx  # Add creator dialog
├── creator-spotlight.stories.tsx # Storybook stories
└── README.md                   # This documentation
```

### Dependencies
- `@/components/extract/social-header`: Creator profile display
- `@/components/extract/video-grid-display`: Video grid component
- `@/components/ui/*`: Shadcn UI components
- `@/lib/utils`: Utility functions

### Testing
- Storybook stories for component testing
- Mock API responses for development
- Error boundary testing
- Responsive design testing

## Integration Notes

### Authentication
- Uses API key authentication for server endpoints
- Client-side authentication for user-specific features
- Role-based access control for admin features

### API Keys Required
- `RAPIDAPI_KEY`: For TikTok and Instagram data extraction
- `INTERNAL_API_KEY`: For server-to-server communication
- `NEXT_PUBLIC_APP_URL`: For API endpoint URLs

### Environment Variables
```env
RAPIDAPI_KEY=your_rapidapi_key_here
INTERNAL_API_KEY=your_internal_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

This Creator Spotlight feature provides a comprehensive solution for discovering, analyzing, and managing creator content from major social media platforms, with a focus on user experience and performance. 