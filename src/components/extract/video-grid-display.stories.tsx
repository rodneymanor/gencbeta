import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { VideoGridDisplay, type VideoGridVideo } from './video-grid-display';

const meta: Meta<typeof VideoGridDisplay> = {
  title: 'Extract/VideoGridDisplay',
  component: VideoGridDisplay,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A comprehensive video grid component that supports both Instagram-style and traditional layouts with full management capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: ['instagram', 'traditional'],
      description: 'Display mode for the video grid',
    },
    manageMode: {
      control: { type: 'boolean' },
      description: 'Enable management mode with selection and deletion capabilities',
    },
    hasMoreVideos: {
      control: { type: 'boolean' },
      description: 'Show load more button',
    },
    isLoadingMore: {
      control: { type: 'boolean' },
      description: 'Loading state for load more functionality',
    },
    emptyStateMessage: {
      control: { type: 'text' },
      description: 'Message to display when no videos are available',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VideoGridDisplay>;

// Sample video data
const sampleVideos: VideoGridVideo[] = [
  {
    id: '1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=600&fit=crop',
    title: 'Amazing Sunset Views',
    description: 'Breathtaking sunset captured from the mountains',
    duration: 125,
    views: 15420,
    likes: 892,
    favorite: true,
    collectionId: 'collection-1',
  },
  {
    id: '2',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
    title: 'Mountain Adventure',
    description: 'Exploring the highest peaks',
    duration: 89,
    views: 8920,
    likes: 456,
    favorite: false,
    collectionId: 'collection-1',
  },
  {
    id: '3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=600&fit=crop',
    title: 'Forest Walk',
    description: 'Peaceful walk through ancient forests',
    duration: 203,
    views: 23410,
    likes: 1234,
    favorite: true,
    collectionId: 'collection-2',
  },
  {
    id: '4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop',
    title: 'Ocean Waves',
    description: 'The calming sound of ocean waves',
    duration: 67,
    views: 5670,
    likes: 234,
    favorite: false,
    collectionId: 'collection-2',
  },
  {
    id: '5',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
    title: 'City Lights',
    description: 'Urban exploration at night',
    duration: 156,
    views: 18920,
    likes: 987,
    favorite: true,
    collectionId: 'collection-3',
  },
  {
    id: '6',
    thumbnailUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=600&fit=crop',
    title: 'Desert Sunrise',
    description: 'Morning light over sand dunes',
    duration: 98,
    views: 7890,
    likes: 345,
    favorite: false,
    collectionId: 'collection-3',
  },
];

// Interactive story with state management
const InteractiveTemplate: Story = {
  render: (args) => {
    const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
    const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
    const [videos, setVideos] = useState<VideoGridVideo[]>(sampleVideos);

    const handleToggleSelection = (videoId: string) => {
      setSelectedVideos(prev => {
        const newSet = new Set(prev);
        if (newSet.has(videoId)) {
          newSet.delete(videoId);
        } else {
          newSet.add(videoId);
        }
        return newSet;
      });
    };

    const handleDeleteVideo = async (videoId: string) => {
      setDeletingVideos(prev => new Set([...prev, videoId]));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVideos(prev => prev.filter(v => v.id !== videoId));
      setDeletingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    };

    const handleFavorite = (video: VideoGridVideo, index: number) => {
      setVideos(prev => prev.map((v, i) => 
        i === index ? { ...v, favorite: !v.favorite } : v
      ));
    };

    const handleVideoClick = (video: VideoGridVideo, index: number) => {
      console.log('Video clicked:', video, 'at index:', index);
    };

    const handleLoadMore = async () => {
      // Simulate loading more videos
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Loading more videos...');
    };

    const renderBadge = (video: VideoGridVideo) => {
      if (video.addedAt && Date.now() - new Date(video.addedAt).getTime() < 1000 * 60 * 60 * 24) {
        return <Badge className="bg-green-500 text-white">New</Badge>;
      }
      return null;
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Video Collection</h2>
          {args.manageMode && selectedVideos.size > 0 && (
            <Badge variant="secondary">
              {selectedVideos.size} selected
            </Badge>
          )}
        </div>
        
        <VideoGridDisplay
          {...args}
          videos={videos}
          selectedVideos={selectedVideos}
          deletingVideos={deletingVideos}
          onVideoClick={handleVideoClick}
          onFavorite={handleFavorite}
          onToggleSelection={handleToggleSelection}
          onDeleteVideo={handleDeleteVideo}
          onLoadMore={handleLoadMore}
          renderBadge={renderBadge}
        />
      </div>
    );
  },
};

export const InstagramMode: Story = {
  ...InteractiveTemplate,
  args: {
    mode: 'instagram',
    manageMode: false,
    hasMoreVideos: true,
    isLoadingMore: false,
  },
};

export const TraditionalMode: Story = {
  ...InteractiveTemplate,
  args: {
    mode: 'traditional',
    manageMode: false,
    hasMoreVideos: true,
    isLoadingMore: false,
  },
};

export const ManageModeInstagram: Story = {
  ...InteractiveTemplate,
  args: {
    mode: 'instagram',
    manageMode: true,
    hasMoreVideos: false,
    isLoadingMore: false,
  },
};

export const ManageModeTraditional: Story = {
  ...InteractiveTemplate,
  args: {
    mode: 'traditional',
    manageMode: true,
    hasMoreVideos: false,
    isLoadingMore: false,
  },
};

export const LoadingMore: Story = {
  ...InteractiveTemplate,
  args: {
    mode: 'instagram',
    manageMode: false,
    hasMoreVideos: true,
    isLoadingMore: true,
  },
};

export const EmptyState: Story = {
  render: (args) => (
    <VideoGridDisplay
      {...args}
      videos={[]}
      emptyStateMessage="No videos found in this collection. Add some videos to get started!"
    />
  ),
  args: {
    mode: 'instagram',
    manageMode: false,
  },
};

export const WithCustomBadges: Story = {
  ...InteractiveTemplate,
  args: {
    mode: 'instagram',
    manageMode: false,
    hasMoreVideos: true,
    isLoadingMore: false,
  },
  render: (args) => {
    const [videos, setVideos] = useState<VideoGridVideo[]>(
      sampleVideos.map((video, index) => ({
        ...video,
        addedAt: index < 2 ? new Date().toISOString() : undefined,
      }))
    );

    const renderBadge = (video: VideoGridVideo) => {
      if (video.addedAt && Date.now() - new Date(video.addedAt).getTime() < 1000 * 60 * 60 * 24) {
        return <Badge className="bg-green-500 text-white">New</Badge>;
      }
      if (video.favorite) {
        return <Badge className="bg-yellow-500 text-white">⭐</Badge>;
      }
      return null;
    };

    return (
      <VideoGridDisplay
        {...args}
        videos={videos}
        renderBadge={renderBadge}
      />
    );
  },
};

export const ResponsiveGrid: Story = {
  ...InteractiveTemplate,
  args: {
    mode: 'instagram',
    manageMode: false,
    hasMoreVideos: false,
    isLoadingMore: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const HighVolumeContent: Story = {
  ...InteractiveTemplate,
  args: {
    mode: 'instagram',
    manageMode: false,
    hasMoreVideos: true,
    isLoadingMore: false,
  },
  render: (args) => {
    const [videos] = useState<VideoGridVideo[]>(
      Array.from({ length: 20 }, (_, i) => ({
        id: `video-${i + 1}`,
        thumbnailUrl: `https://images.unsplash.com/photo-${1500000000000 + i}?w=400&h=600&fit=crop`,
        title: `Video ${i + 1}`,
        description: `This is video number ${i + 1} in the collection`,
        duration: Math.floor(Math.random() * 300) + 30,
        views: Math.floor(Math.random() * 50000) + 1000,
        likes: Math.floor(Math.random() * 2000) + 50,
        favorite: Math.random() > 0.7,
        collectionId: `collection-${Math.floor(i / 6) + 1}`,
      }))
    );

    return (
      <VideoGridDisplay
        {...args}
        videos={videos}
      />
    );
  },
}; 