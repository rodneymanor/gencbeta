'use client';

import React, { useState } from 'react';
import { SocialHeader, type SocialHeaderProps } from './social-header';

// Example usage of the SocialHeader component
export function SocialHeaderExample() {
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(0);

  // Sample profiles
  const profiles: SocialHeaderProps[] = [
    {
      username: 'aronsogi',
      displayName: 'ARON SŌGI | Video Strategist',
      profileImageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150&h=150&fit=crop',
      bio: '📈 Build a Personal Brand that drives business growth\n📲 14 Years Film Industry Experience\n🎬 Apple, Dark Knight Rises, ...',
      website: 'https://form.fillout.com/t/ra7kMzjoBbus',
      postsCount: 110,
      followersCount: 46130,
      followingCount: 978,
      isFollowing: false,
      isVerified: false,
      mutualFollowers: [
        { username: 'theclarkgary', displayName: 'Clark Gary' },
        { username: 'itstylergermain', displayName: 'Tyler Germain' },
        { username: 'johndoe', displayName: 'John Doe' },
        { username: 'janedoe', displayName: 'Jane Doe' },
      ],
    },
    {
      username: 'celebrity',
      displayName: 'Celebrity Name',
      profileImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop',
      bio: 'Official account of a verified celebrity with millions of followers.',
      postsCount: 1250,
      followersCount: 2500000,
      followingCount: 150,
      isFollowing: true,
      isVerified: true,
    },
    {
      username: 'business',
      displayName: 'Business Account',
      profileImageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=150&h=150&fit=crop',
      bio: 'Professional business account with website link and long description that demonstrates text wrapping capabilities.',
      website: 'https://example.com',
      postsCount: 89,
      followersCount: 15420,
      followingCount: 234,
      isFollowing: false,
      isVerified: true,
    },
  ];

  const currentProfileData = profiles[currentProfile];

  const handleFollowClick = () => {
    setIsFollowing(!isFollowing);
    console.log(`${isFollowing ? 'Unfollowed' : 'Followed'}: ${currentProfileData.username}`);
  };

  const handleMoreClick = () => {
    console.log('More options clicked for:', currentProfileData.username);
  };

  const handleProfileChange = (index: number) => {
    setCurrentProfile(index);
    setIsFollowing(profiles[index].isFollowing || false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Social Header Example</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Profile:</span>
          <select
            value={currentProfile}
            onChange={(e) => handleProfileChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            {profiles.map((profile, index) => (
              <option key={index} value={index}>
                {profile.username}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <SocialHeader
          {...currentProfileData}
          isFollowing={isFollowing}
          onFollowClick={handleFollowClick}
          onMoreClick={handleMoreClick}
        />
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Usage Instructions:</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Switch between different profile types using the dropdown</li>
          <li>• Click Follow/Following button to toggle follow state</li>
          <li>• Click More options (three dots) for additional actions</li>
          <li>• Click on follower/following counts to navigate</li>
          <li>• Click on website link to visit external site</li>
        </ul>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-blue-900">Component Features:</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>✅ Fully responsive design with Tailwind CSS</li>
          <li>✅ TypeScript support with comprehensive props interface</li>
          <li>✅ Number formatting (K, M for large numbers)</li>
          <li>✅ Verification badge support</li>
          <li>✅ Follow/Unfollow state management</li>
          <li>✅ Mutual followers display</li>
          <li>✅ Website link with icon</li>
          <li>✅ Interactive buttons with hover states</li>
          <li>✅ Proper accessibility attributes</li>
        </ul>
      </div>
    </div>
  );
} 