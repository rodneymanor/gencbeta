import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { SocialHeader, type SocialHeaderProps } from "./social-header";

const meta: Meta<typeof SocialHeader> = {
  title: "Extract/SocialHeader",
  component: SocialHeader,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A comprehensive social media profile header component that mimics Instagram's profile layout with full functionality.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    username: {
      control: { type: "text" },
      description: "The username/handle of the profile",
    },
    displayName: {
      control: { type: "text" },
      description: "The display name (optional, falls back to username)",
    },
    profileImageUrl: {
      control: { type: "text" },
      description: "URL of the profile image",
    },
    bio: {
      control: { type: "text" },
      description: "Bio text for the profile",
    },
    website: {
      control: { type: "text" },
      description: "Website URL (optional)",
    },
    postsCount: {
      control: { type: "number" },
      description: "Number of posts",
    },
    followersCount: {
      control: { type: "number" },
      description: "Number of followers",
    },
    followingCount: {
      control: { type: "number" },
      description: "Number of accounts being followed",
    },
    isFollowing: {
      control: { type: "boolean" },
      description: "Whether the current user is following this profile",
    },
    isVerified: {
      control: { type: "boolean" },
      description: "Whether the profile is verified",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SocialHeader>;

const sampleMutualFollowers = [
  { username: "theclarkgary", displayName: "Clark Gary" },
  { username: "itstylergermain", displayName: "Tyler Germain" },
  { username: "johndoe", displayName: "John Doe" },
  { username: "janedoe", displayName: "Jane Doe" },
];

// Interactive story with state management
const InteractiveTemplate: Story = {
  render: (args) => {
    const [isFollowing, setIsFollowing] = useState(args.isFollowing || false);

    const handleFollowClick = () => {
      setIsFollowing(!isFollowing);
      console.log("Follow/Unfollow clicked");
    };

    const handleMoreClick = () => {
      console.log("More options clicked");
    };

    return (
      <div className="mx-auto max-w-4xl">
        <SocialHeader
          {...args}
          isFollowing={isFollowing}
          onFollowClick={handleFollowClick}
          onMoreClick={handleMoreClick}
        />
      </div>
    );
  },
};

export const Default: Story = {
  ...InteractiveTemplate,
  args: {
    username: "aronsogi",
    displayName: "ARON SŌGI | Video Strategist",
    profileImageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150&h=150&fit=crop",
    bio: "📈 Build a Personal Brand that drives business growth\n📲 14 Years Film Industry Experience\n🎬 Apple, Dark Knight Rises, ...",
    website: "https://form.fillout.com/t/ra7kMzjoBbus",
    postsCount: 110,
    followersCount: 46130,
    followingCount: 978,
    isFollowing: false,
    isVerified: false,
    mutualFollowers: sampleMutualFollowers,
  },
};

export const VerifiedProfile: Story = {
  ...InteractiveTemplate,
  args: {
    username: "celebrity",
    displayName: "Celebrity Name",
    profileImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop",
    bio: "Official account of a verified celebrity with millions of followers.",
    postsCount: 1250,
    followersCount: 2500000,
    followingCount: 150,
    isFollowing: true,
    isVerified: true,
  },
};

export const Following: Story = {
  ...InteractiveTemplate,
  args: {
    username: "friend",
    displayName: "My Friend",
    profileImageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=150&h=150&fit=crop",
    bio: "Personal friend with mutual connections.",
    postsCount: 45,
    followersCount: 320,
    followingCount: 280,
    isFollowing: true,
    isVerified: false,
    mutualFollowers: sampleMutualFollowers.slice(0, 2),
  },
};

export const MinimalProfile: Story = {
  ...InteractiveTemplate,
  args: {
    username: "minimalist",
    profileImageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&h=150&fit=crop",
    postsCount: 5,
    followersCount: 12,
    followingCount: 8,
    isFollowing: false,
    isVerified: false,
  },
};

export const WithWebsite: Story = {
  ...InteractiveTemplate,
  args: {
    username: "business",
    displayName: "Business Account",
    profileImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop",
    bio: "Professional business account with website link.",
    website: "https://example.com",
    postsCount: 89,
    followersCount: 15420,
    followingCount: 234,
    isFollowing: false,
    isVerified: true,
  },
};

export const LongBio: Story = {
  ...InteractiveTemplate,
  args: {
    username: "longbio",
    displayName: "Long Bio Example",
    profileImageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=150&h=150&fit=crop",
    bio: "This is a very long bio that demonstrates how the component handles lengthy text content. It includes multiple lines and should show proper text wrapping and overflow handling. The bio contains emojis 🎉 and various formatting to test the component's text rendering capabilities.",
    website: "https://verylongwebsiteurl.com/very-long-path",
    postsCount: 567,
    followersCount: 89012,
    followingCount: 1234,
    isFollowing: false,
    isVerified: false,
  },
};

export const HighNumbers: Story = {
  ...InteractiveTemplate,
  args: {
    username: "influencer",
    displayName: "Mega Influencer",
    profileImageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150&h=150&fit=crop",
    bio: "Mega influencer with millions of followers.",
    postsCount: 15420,
    followersCount: 2500000,
    followingCount: 1500,
    isFollowing: false,
    isVerified: true,
  },
};

export const NoHighlights: Story = {
  ...InteractiveTemplate,
  args: {
    username: "nohighlights",
    displayName: "No Highlights Profile",
    profileImageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&h=150&fit=crop",
    bio: "Profile without any highlights.",
    postsCount: 23,
    followersCount: 156,
    followingCount: 89,
    isFollowing: false,
    isVerified: false,
  },
};

export const ManyMutualFollowers: Story = {
  ...InteractiveTemplate,
  args: {
    username: "mutual",
    displayName: "Many Mutual Followers",
    profileImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop",
    bio: "Profile with many mutual followers.",
    postsCount: 67,
    followersCount: 890,
    followingCount: 234,
    isFollowing: false,
    isVerified: false,
    mutualFollowers: [
      { username: "user1", displayName: "User One" },
      { username: "user2", displayName: "User Two" },
      { username: "user3", displayName: "User Three" },
      { username: "user4", displayName: "User Four" },
      { username: "user5", displayName: "User Five" },
      { username: "user6", displayName: "User Six" },
      { username: "user7", displayName: "User Seven" },
      { username: "user8", displayName: "User Eight" },
    ],
  },
};

export const Responsive: Story = {
  ...InteractiveTemplate,
  args: {
    username: "responsive",
    displayName: "Responsive Test",
    profileImageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=150&h=150&fit=crop",
    bio: "Testing responsive behavior on different screen sizes.",
    postsCount: 123,
    followersCount: 4567,
    followingCount: 890,
    isFollowing: false,
    isVerified: false,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
