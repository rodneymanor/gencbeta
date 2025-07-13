'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SocialHeader } from '@/components/extract/social-header';
import { VideoGridDisplay } from '@/components/extract/video-grid-display';
import { AddCreatorDialog } from './_components/add-creator-dialog';
import { cn } from '@/lib/utils';

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

export default function CreatorSpotlightPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCreatorId = searchParams.get('creator');

  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);
  const [creatorVideos, setCreatorVideos] = useState<CreatorVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'tiktok' | 'instagram'>('all');

  // Load creators on mount
  useEffect(() => {
    loadCreators();
  }, []);

  // Handle creator selection from URL
  useEffect(() => {
    if (selectedCreatorId && creators.length > 0) {
      const creator = creators.find(c => c.id === selectedCreatorId);
      if (creator) {
        setSelectedCreator(creator);
        loadCreatorVideos(creator);
      }
    }
  }, [selectedCreatorId, creators]);

  const loadCreators = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/creators');
      
      if (!response.ok) {
        throw new Error('Failed to load creators');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCreators(data.creators);
      } else {
        console.error('Error loading creators:', data.error);
      }
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  };

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
        throw new Error('Failed to load creator videos');
      }

      const data = await response.json();
      
      if (data.success && data.extractedVideos) {
        const videos: CreatorVideo[] = data.extractedVideos.map((video: Record<string, unknown>) => ({
          id: video.id,
          thumbnailUrl: (video.thumbnail_url as string) ?? 'https://via.placeholder.com/300x400',
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

  const handleCreatorClick = (creator: CreatorProfile) => {
    setSelectedCreator(creator);
    router.push(`/creator-spotlight?creator=${creator.id}`);
    loadCreatorVideos(creator);
  };

  const handleBackToGrid = () => {
    setSelectedCreator(null);
    setCreatorVideos([]);
    router.push('/creator-spotlight');
  };

  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || creator.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  if (selectedCreator) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBackToGrid}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Creators
        </Button>

        {/* Creator Profile */}
        <SocialHeader
          username={selectedCreator.username}
          displayName={selectedCreator.displayName}
          profileImageUrl={selectedCreator.profileImageUrl}
          bio={selectedCreator.bio}
          website={selectedCreator.website}
          postsCount={selectedCreator.postsCount}
          followersCount={selectedCreator.followersCount}
          followingCount={selectedCreator.followingCount}
          isVerified={selectedCreator.isVerified}
          mutualFollowers={selectedCreator.mutualFollowers}
          onFollowClick={() => console.log('Follow clicked')}
          onMoreClick={() => console.log('More clicked')}
          className="border rounded-lg"
        />

        {/* Videos Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Videos</h2>
            <Badge variant="outline" className="capitalize">
              {selectedCreator.platform}
            </Badge>
          </div>
          
          {loadingVideos ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="aspect-[9/16] w-full" />
              ))}
            </div>
          ) : (
            <VideoGridDisplay
              videos={creatorVideos}
              mode="instagram"
              onVideoClick={(video, index) => console.log('Video clicked:', video, index)}
              onFavorite={(video, index) => console.log('Favorite clicked:', video, index)}
              emptyStateMessage="No videos found for this creator."
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Creator Spotlight</h1>
            <p className="text-muted-foreground">
              Discover and analyze top creators from TikTok and Instagram
            </p>
          </div>
          <AddCreatorDialog onCreatorAdded={loadCreators}>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Creator
            </Button>
          </AddCreatorDialog>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={platformFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlatformFilter('all')}
            >
              All
            </Button>
            <Button
              variant={platformFilter === 'tiktok' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlatformFilter('tiktok')}
              className="bg-[#FF0050] hover:bg-[#E6004C] text-white"
            >
              TikTok
            </Button>
            <Button
              variant={platformFilter === 'instagram' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlatformFilter('instagram')}
              className="bg-[#E4405F] hover:bg-[#D6336C] text-white"
            >
              Instagram
            </Button>
          </div>
        </div>
      </div>

      {/* Creators Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => (
            <Card
              key={creator.id}
              className="overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
              onClick={() => handleCreatorClick(creator)}
            >
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                                             <Image
                         src={creator.profileImageUrl}
                         alt={creator.displayName ?? creator.username}
                         width={64}
                         height={64}
                         className="h-16 w-16 rounded-full object-cover"
                       />
                      <Badge
                        variant="outline"
                        className={cn(
                          "absolute -bottom-1 -right-1 text-xs capitalize",
                          creator.platform === 'tiktok' && "bg-[#FF0050] text-white border-[#FF0050]",
                          creator.platform === 'instagram' && "bg-[#E4405F] text-white border-[#E4405F]"
                        )}
                      >
                        {creator.platform}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                                                 <h3 className="font-semibold truncate">
                           {creator.displayName ?? creator.username}
                         </h3>
                        {creator.isVerified && (
                          <Badge variant="outline" className="text-xs">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        @{creator.username}
                      </p>
                    </div>
                  </div>
                  
                  {creator.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {creator.bio}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {creator.followersCount >= 1000000 
                            ? `${(creator.followersCount / 1000000).toFixed(1)}M`
                            : creator.followersCount >= 1000
                            ? `${(creator.followersCount / 1000).toFixed(1)}K`
                            : creator.followersCount
                          } followers
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                                           <Badge variant="secondary" className="text-xs">
                       {creator.videoCount ?? 0} videos
                     </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredCreators.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || platformFilter !== 'all' 
              ? 'No creators found matching your criteria.'
              : 'No creators available yet.'
            }
          </p>
        </div>
      )}
    </div>
  );
} 