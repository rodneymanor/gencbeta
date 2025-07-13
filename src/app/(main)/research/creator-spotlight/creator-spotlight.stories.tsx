import type { Meta, StoryObj } from '@storybook/nextjs';
import CreatorSpotlightPage from './page';

const meta: Meta<typeof CreatorSpotlightPage> = {
  title: 'Pages/Creator Spotlight',
  component: CreatorSpotlightPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A comprehensive page for discovering and analyzing creators from TikTok and Instagram. Features a grid view of creator profiles and detailed views with their videos.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // No props for this page component
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'The default Creator Spotlight page showing a grid of creator profiles with search and filter functionality.',
      },
    },
  },
};

export const Loading: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Creator Spotlight page in loading state with skeleton placeholders.',
      },
    },
  },
  play: async () => {
    // Simulate loading state by mocking the API
    global.fetch = jest.fn(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, creators: [] })
        }), 2000)
      )
    ) as jest.Mock;
  },
};

export const EmptyState: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Creator Spotlight page when no creators are available.',
      },
    },
  },
  play: async () => {
    // Mock empty creators list
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, creators: [] })
      })
    ) as jest.Mock;
  },
};

export const WithCreators: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Creator Spotlight page populated with sample creators from TikTok and Instagram.',
      },
    },
  },
  play: async () => {
    // Mock creators data
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          creators: [
            {
              id: '1',
              username: 'tiktok_creator_1',
              displayName: 'TikTok Star',
              platform: 'tiktok',
              profileImageUrl: 'https://via.placeholder.com/150x150/FF0050/FFFFFF?text=T',
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
              profileImageUrl: 'https://via.placeholder.com/150x150/E4405F/FFFFFF?text=I',
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
              profileImageUrl: 'https://via.placeholder.com/150x150/FF0050/FFFFFF?text=C',
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
          ]
        })
      })
    ) as jest.Mock;
  },
};

export const CreatorDetailView: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Detailed view of a specific creator showing their profile and videos.',
      },
    },
  },
  play: async () => {
    // Mock URL with creator parameter
    URLSearchParams.prototype.get = jest.fn((key) => {
      if (key === 'creator') return '1';
      return null;
    });

    // Mock creators data
    global.fetch = jest.fn((url) => {
      if (url === '/api/creators') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            creators: [
              {
                id: '1',
                username: 'tiktok_creator_1',
                displayName: 'TikTok Star',
                platform: 'tiktok',
                profileImageUrl: 'https://via.placeholder.com/150x150/FF0050/FFFFFF?text=T',
                bio: 'Creating amazing TikTok content! 🎵',
                postsCount: 150,
                followersCount: 2500000,
                followingCount: 500,
                isVerified: true,
                videoCount: 45,
                lastProcessed: '2024-01-15T10:30:00Z',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-15T10:30:00Z'
              }
            ]
          })
        });
      }
      if (url === '/api/process-creator') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            extractedVideos: Array.from({ length: 12 }, (_, i) => ({
              id: `video_${i}`,
              thumbnail_url: `https://via.placeholder.com/300x400/FF0050/FFFFFF?text=V${i + 1}`,
              duration: Math.floor(Math.random() * 60) + 15,
              likeCount: Math.floor(Math.random() * 100000) + 1000,
              viewCount: Math.floor(Math.random() * 1000000) + 10000,
              title: `TikTok Video ${i + 1}`,
              description: `Amazing content from TikTok Star`,
              platform: 'tiktok'
            }))
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    }) as jest.Mock;
  },
}; 