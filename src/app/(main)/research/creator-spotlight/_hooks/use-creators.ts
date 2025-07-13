import { useState, useEffect } from 'react';

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
  mutualFollowers?: Array<{
    username: string;
    displayName: string;
  }>;
  lastProcessed?: string;
  videoCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface CreatorVideo {
  id: string;
  thumbnailUrl: string;
  duration?: number;
  likes?: number;
  views?: number;
  favorite?: boolean;
  title?: string;
  description?: string;
  collectionId?: string;
  addedAt?: string;
  platform: 'tiktok' | 'instagram';
}

export function useCreators() {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCreators = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/creators');
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Unauthorized access to creators API - using mock data');
          // Fallback to mock data for development
          const mockCreators: CreatorProfile[] = [
            {
              id: '1',
              username: 'tiktok_creator_1',
              displayName: 'TikTok Star',
              platform: 'tiktok',
              profileImageUrl: 'https://via.placeholder.com/150x150/FF0050/FFFFFF?text=TS',
              bio: 'Creating amazing TikTok content! 🎵',
              postsCount: 150,
              followersCount: 2500000,
              followingCount: 500,
              isVerified: true,
              videoCount: 45,
              lastProcessed: '2024-01-15T10:30:00Z',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-15T10:30:00Z'
            },
            {
              id: '2',
              username: 'instagram_creator_1',
              displayName: 'Instagram Influencer',
              platform: 'instagram',
              profileImageUrl: 'https://via.placeholder.com/150x150/E4405F/FFFFFF?text=II',
              bio: 'Lifestyle and fashion content 📸',
              postsCount: 320,
              followersCount: 1800000,
              followingCount: 1200,
              isVerified: true,
              videoCount: 28,
              lastProcessed: '2024-01-14T15:45:00Z',
              createdAt: '2024-01-02T00:00:00Z',
              updatedAt: '2024-01-14T15:45:00Z'
            },
            {
              id: '3',
              username: 'tiktok_creator_2',
              displayName: 'Comedy Creator',
              platform: 'tiktok',
              profileImageUrl: 'https://via.placeholder.com/150x150/FF0050/FFFFFF?text=CC',
              bio: 'Making people laugh one video at a time 😂',
              postsCount: 89,
              followersCount: 850000,
              followingCount: 200,
              isVerified: false,
              videoCount: 32,
              lastProcessed: '2024-01-13T09:20:00Z',
              createdAt: '2024-01-03T00:00:00Z',
              updatedAt: '2024-01-13T09:20:00Z'
            }
          ];
          setCreators(mockCreators);
          return;
        }
        throw new Error(`Failed to load creators: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCreators(data.creators);
      } else {
        console.error('Error loading creators:', data.error);
        // Fallback to empty array
        setCreators([]);
      }
    } catch (error) {
      console.error('Error loading creators:', error);
      // Fallback to empty array
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreators();
  }, []);

  return { creators, loading, loadCreators };
}

export function useCreatorVideos() {
  const [creatorVideos, setCreatorVideos] = useState<CreatorVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const loadCreatorVideos = async (creator: CreatorProfile) => {
    try {
      setLoadingVideos(true);
      
      // Call the process-creator API to get videos
      const response = await fetch('/api/process-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: creator.username,
          platform: creator.platform,
          videoCount: 20
        })
      });

      if (!response.ok) {
        if (response.status === 500) {
          console.warn('API server error - using mock videos');
          throw new Error('API_UNAVAILABLE');
        }
        throw new Error('Failed to load creator videos');
      }

      const data = await response.json();
      
      if (data.success && data.extractedVideos) {
        const videos: CreatorVideo[] = data.extractedVideos.map((video: Record<string, unknown>) => ({
          id: video.id,
          thumbnailUrl: (video.thumbnail_url as string) || 'https://via.placeholder.com/300x400',
          duration: video.duration,
          likes: video.likeCount,
          views: video.viewCount,
          title: video.title,
          description: video.description,
          platform: video.platform,
          addedAt: new Date().toISOString()
        }));
        
        setCreatorVideos(videos);
      }
    } catch (error) {
      console.error('Error loading creator videos:', error);
      
      // Check if it's an API unavailability error
      if (error instanceof Error && error.message === 'API_UNAVAILABLE') {
        console.log('Using mock videos due to API unavailability');
      }
      
      // Fallback to mock data
      const mockVideos: CreatorVideo[] = Array.from({ length: 12 }, (_, i) => ({
        id: `video_${i}`,
        thumbnailUrl: `https://via.placeholder.com/300x400/${creator.platform === 'tiktok' ? 'FF0050' : 'E4405F'}/FFFFFF?text=V${i + 1}`,
        duration: Math.floor(Math.random() * 60) + 15,
        likes: Math.floor(Math.random() * 100000) + 1000,
        views: Math.floor(Math.random() * 1000000) + 10000,
        title: `${creator.displayName} Video ${i + 1}`,
        description: `Amazing content from ${creator.displayName}`,
        platform: creator.platform,
        addedAt: new Date().toISOString()
      }));
      setCreatorVideos(mockVideos);
    } finally {
      setLoadingVideos(false);
    }
  };

  const clearVideos = () => {
    setCreatorVideos([]);
  };

  return { creatorVideos, loadingVideos, loadCreatorVideos, clearVideos };
} 