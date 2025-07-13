import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { VideoInsightsTabs } from './video-insights-tabs';

const meta: Meta<typeof VideoInsightsTabs> = {
  title: 'Research/VideoInsightsTabs',
  component: VideoInsightsTabs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    copiedField: {
      control: { type: 'select' },
      options: [null, 'Hook', 'Bridge', 'Golden Nugget', 'WTA', 'Transcript'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockVideoData = {
  id: '1',
  url: 'https://www.tiktok.com/@user/video/123456789',
  title: 'Amazing TikTok Video',
  author: 'TikTokUser',
  thumbnailUrl: 'https://via.placeholder.com/300x400',
  transcript: 'This is a sample transcript of the video content. It contains the full text of what was said in the video, including all the important points and key messages that were communicated to the audience.',
  components: {
    hook: 'This is an attention-grabbing hook that draws viewers in immediately.',
    bridge: 'This bridge connects the hook to the main content smoothly.',
    nugget: 'This is the golden nugget - the most valuable piece of information or insight.',
    wta: 'This is the call to action - what viewers should do next.',
  },
  contentMetadata: {
    platform: 'TikTok',
    author: 'TikTokUser',
    description: 'A sample video description that explains what the content is about.',
    source: 'original',
    hashtags: ['#viral', '#trending', '#content', '#socialmedia'],
  },
  visualContext: 'The video shows a person speaking directly to the camera in a well-lit environment with engaging visuals in the background.',
  insights: {
    likes: 15420,
    comments: 892,
    shares: 1234,
    views: 125000,
    saves: 567,
    engagementRate: 8.5,
  },
  addedAt: '2024-01-15T10:30:00Z',
  platform: 'tiktok',
};

export const Default: Story = {
  args: {
    video: mockVideoData,
    copiedField: null,
    onCopyToClipboard: (text: string, fieldName: string) => {
      console.log(`Copied ${fieldName}:`, text);
    },
  },
};

export const WithCopiedField: Story = {
  args: {
    video: mockVideoData,
    copiedField: 'Hook',
    onCopyToClipboard: (text: string, fieldName: string) => {
      console.log(`Copied ${fieldName}:`, text);
    },
  },
};

export const HighEngagement: Story = {
  args: {
    video: {
      ...mockVideoData,
      insights: {
        likes: 250000,
        comments: 15000,
        shares: 5000,
        views: 2000000,
        saves: 25000,
        engagementRate: 12.5,
      },
    },
    copiedField: null,
    onCopyToClipboard: (text: string, fieldName: string) => {
      console.log(`Copied ${fieldName}:`, text);
    },
  },
};

export const InstagramVideo: Story = {
  args: {
    video: {
      ...mockVideoData,
      platform: 'instagram',
      contentMetadata: {
        ...mockVideoData.contentMetadata,
        platform: 'Instagram',
      },
    },
    copiedField: null,
    onCopyToClipboard: (text: string, fieldName: string) => {
      console.log(`Copied ${fieldName}:`, text);
    },
  },
}; 