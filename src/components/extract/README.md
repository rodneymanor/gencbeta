# VideoGridDisplay Component

A comprehensive, reusable video grid component that supports both Instagram-style and traditional layouts with full management capabilities.

## Features

- **Dual Display Modes**: Instagram-style (9:16 aspect ratio) and Traditional (16:9 aspect ratio) layouts
- **Management Mode**: Full CRUD operations with selection, deletion, and bulk actions
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Infinite Scrolling**: Built-in load more functionality with intersection observer
- **Custom Badges**: Support for custom badge rendering (e.g., "New" badges)
- **Accessibility**: Full keyboard navigation and ARIA labels
- **Performance**: Optimized with React.memo and useCallback hooks
- **TypeScript**: Fully typed with comprehensive interfaces

## Installation

The component is located in `src/components/extract/video-grid-display.tsx` and can be imported directly:

```tsx
import { VideoGridDisplay, type VideoGridVideo } from '@/components/extract/video-grid-display';
```

## Basic Usage

```tsx
import { VideoGridDisplay, type VideoGridVideo } from '@/components/extract/video-grid-display';

const videos: VideoGridVideo[] = [
  {
    id: '1',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    title: 'My Video',
    description: 'Video description',
    duration: 120,
    views: 1000,
    likes: 50,
    favorite: false,
  },
];

function MyComponent() {
  return (
    <VideoGridDisplay
      videos={videos}
      mode="instagram"
      onVideoClick={(video, index) => console.log('Video clicked:', video)}
    />
  );
}
```

## Props

### VideoGridDisplayProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `videos` | `VideoGridVideo[]` | `[]` | Array of video objects to display |
| `mode` | `'instagram' \| 'traditional'` | `'instagram'` | Display mode for the grid |
| `manageMode` | `boolean` | `false` | Enable management mode with selection/deletion |
| `selectedVideos` | `Set<string>` | `new Set()` | Set of selected video IDs (for manage mode) |
| `deletingVideos` | `Set<string>` | `new Set()` | Set of video IDs currently being deleted |
| `hasMoreVideos` | `boolean` | `false` | Whether there are more videos to load |
| `isLoadingMore` | `boolean` | `false` | Loading state for load more functionality |
| `onVideoClick` | `(video, index) => void` | - | Callback when a video is clicked |
| `onFavorite` | `(video, index) => void` | - | Callback when favorite button is clicked |
| `onToggleSelection` | `(videoId) => void` | - | Callback when video selection is toggled |
| `onDeleteVideo` | `(videoId) => void` | - | Callback when delete button is clicked |
| `onLoadMore` | `() => Promise<void>` | - | Callback for loading more videos |
| `renderBadge` | `(video, idx) => ReactNode` | - | Custom badge renderer function |
| `className` | `string` | - | Additional CSS classes |
| `emptyStateMessage` | `string` | `'No videos to display.'` | Message shown when no videos |

### VideoGridVideo Interface

```tsx
interface VideoGridVideo {
  id?: string;
  thumbnailUrl: string;
  duration?: number; // seconds
  likes?: number;
  views?: number;
  favorite?: boolean;
  title?: string;
  description?: string;
  collectionId?: string;
  addedAt?: string;
  isSelected?: boolean;
  isDeleting?: boolean;
}
```

## Display Modes

### Instagram Mode
- 9:16 aspect ratio thumbnails
- Compact grid layout (2-4 columns responsive)
- Hover effects with play button and metrics overlay
- Optimized for mobile viewing

### Traditional Mode
- 16:9 aspect ratio thumbnails
- Card-based layout with title, description, and metrics
- More detailed information display
- Better for desktop viewing

## Management Mode

When `manageMode` is enabled:

- Videos become selectable (click to select/deselect)
- Delete buttons appear on hover
- Selection indicators show selected state
- Bulk operations become available
- Video clicks toggle selection instead of opening

## Examples

### Basic Instagram Grid

```tsx
<VideoGridDisplay
  videos={videos}
  mode="instagram"
  onVideoClick={(video, index) => openLightbox(index)}
  onFavorite={(video, index) => toggleFavorite(video.id)}
/>
```

### Management Mode

```tsx
const [selectedVideos, setSelectedVideos] = useState(new Set());
const [deletingVideos, setDeletingVideos] = useState(new Set());

<VideoGridDisplay
  videos={videos}
  mode="traditional"
  manageMode={true}
  selectedVideos={selectedVideos}
  deletingVideos={deletingVideos}
  onToggleSelection={(videoId) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  }}
  onDeleteVideo={async (videoId) => {
    setDeletingVideos(prev => new Set([...prev, videoId]));
    await deleteVideo(videoId);
    setDeletingVideos(prev => {
      const newSet = new Set(prev);
      newSet.delete(videoId);
      return newSet;
    });
  }}
/>
```

### With Custom Badges

```tsx
const renderBadge = (video: VideoGridVideo) => {
  if (video.addedAt && Date.now() - new Date(video.addedAt).getTime() < 1000 * 60 * 60 * 24) {
    return <Badge className="bg-green-500 text-white">New</Badge>;
  }
  if (video.favorite) {
    return <Badge className="bg-yellow-500 text-white">⭐</Badge>;
  }
  return null;
};

<VideoGridDisplay
  videos={videos}
  renderBadge={renderBadge}
/>
```

### With Infinite Scrolling

```tsx
const [hasMoreVideos, setHasMoreVideos] = useState(true);
const [isLoadingMore, setIsLoadingMore] = useState(false);

const handleLoadMore = async () => {
  setIsLoadingMore(true);
  try {
    const newVideos = await fetchMoreVideos();
    setVideos(prev => [...prev, ...newVideos]);
    setHasMoreVideos(newVideos.length === 24); // Assuming 24 videos per page
  } finally {
    setIsLoadingMore(false);
  }
};

<VideoGridDisplay
  videos={videos}
  hasMoreVideos={hasMoreVideos}
  isLoadingMore={isLoadingMore}
  onLoadMore={handleLoadMore}
/>
```

## Migration from Existing Components

### From InstagramVideoGrid

Replace:
```tsx
import { InstagramVideoGrid } from '@/components/ui/instagram-video-grid';

<InstagramVideoGrid
  videos={videos}
  onVideoClick={handleClick}
  onFavorite={handleFavorite}
/>
```

With:
```tsx
import { VideoGridDisplay } from '@/components/extract/video-grid-display';

<VideoGridDisplay
  videos={videos}
  mode="instagram"
  onVideoClick={handleClick}
  onFavorite={handleFavorite}
/>
```

### From VideoGrid

Replace:
```tsx
import { VideoGrid } from './_components/video-grid';

<VideoGrid
  videos={videos}
  manageMode={manageMode}
  selectedVideos={selectedVideos}
  onToggleVideoSelection={handleToggle}
  onDeleteVideo={handleDelete}
/>
```

With:
```tsx
import { VideoGridDisplay } from '@/components/extract/video-grid-display';

<VideoGridDisplay
  videos={videos}
  mode="traditional"
  manageMode={manageMode}
  selectedVideos={selectedVideos}
  onToggleSelection={handleToggle}
  onDeleteVideo={handleDelete}
/>
```

## Performance Considerations

- The component uses `React.memo` and `useCallback` for optimal performance
- Duplicate video ID detection is built-in with console warnings
- Intersection observer is used for efficient infinite scrolling
- Images are optimized with Next.js Image component
- Loading states prevent unnecessary re-renders

## Accessibility

- Full keyboard navigation support
- ARIA labels for all interactive elements
- Focus management for selection and deletion
- Screen reader friendly with proper semantic markup
- High contrast mode support

## Browser Support

- Modern browsers with ES6+ support
- Intersection Observer API (polyfill recommended for older browsers)
- CSS Grid and Flexbox support required

## Storybook

The component includes comprehensive Storybook stories with:
- All display modes and states
- Interactive examples
- Responsive testing
- Accessibility testing
- Performance testing with large datasets

Run `npm run storybook` to view the interactive documentation.

## Contributing

When modifying this component:

1. Update the TypeScript interfaces if adding new props
2. Add corresponding Storybook stories for new features
3. Ensure accessibility compliance
4. Test performance with large datasets
5. Update this README with any new features or breaking changes 