"use client";

import React from "react";

import Image from "next/image";

import { ChevronDown, MoreHorizontal, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SocialHeaderProps {
  username: string;
  displayName?: string;
  profileImageUrl: string;
  bio?: string;
  website?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isVerified?: boolean;
  mutualFollowers?: Array<{
    username: string;
    displayName: string;
  }>;
  className?: string;
  onFollowClick?: () => void;
  onMoreClick?: () => void;
  priority?: boolean;
}

export function SocialHeader({
  username,
  displayName,
  profileImageUrl,
  bio,
  website,
  postsCount,
  followersCount,
  followingCount,
  isFollowing = false,
  isVerified = false,
  mutualFollowers = [],
  className,
  onFollowClick,
  onMoreClick,
  priority = false,
}: SocialHeaderProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <header className={cn("w-full bg-white font-sans text-sm leading-[18px] text-black", className)}>
      <div className="flex flex-col gap-8 p-6 md:flex-row">
        {/* Profile Image Section */}
        <div className="flex justify-center md:justify-start">
          <div className="relative">
            <a href={`/${username}/`} className="block h-[150px] w-[150px] overflow-hidden rounded-full bg-gray-50">
              <Image
                src={profileImageUrl}
                alt={`${username}'s profile picture`}
                width={150}
                height={150}
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
                priority={priority}
                draggable={false}
              />
            </a>
          </div>
        </div>

        {/* Content Section */}
        <div className="min-w-0 flex-1">
          {/* Header Info Section */}
          <div className="mb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Username and Verification */}
              <div className="flex items-center gap-2">
                <h2 className="text-2xl leading-tight font-medium break-words text-gray-900">{username}</h2>
                {isVerified && <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={onFollowClick}
                  className="min-w-[120px] bg-blue-500 text-base font-medium text-white hover:bg-blue-600"
                >
                  <span className="flex items-center gap-1">
                    {isFollowing ? "Following" : "Follow"}
                    {isFollowing && <ChevronDown className="h-4 w-4 rotate-180" />}
                  </span>
                </Button>

                <Button variant="ghost" size="icon" onClick={onMoreClick} className="p-2">
                  <MoreHorizontal className="h-5 w-5 text-gray-900" />
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-4">
            <ul className="flex gap-8 text-base leading-normal font-normal">
              <li>
                <span className="text-base font-normal text-gray-600">
                  <span className="text-base font-medium text-gray-900">{formatNumber(postsCount)}</span>
                  {" posts"}
                </span>
              </li>
              <li>
                <a
                  href={`/${username}/followers/`}
                  className="text-base font-normal text-gray-600 transition-colors hover:text-black"
                >
                  <span title={followersCount.toString()} className="text-base font-medium text-gray-900">
                    {formatNumber(followersCount)}
                  </span>
                  {" followers"}
                </a>
              </li>
              <li>
                <a
                  href={`/${username}/following/`}
                  className="text-base font-normal text-gray-600 transition-colors hover:text-black"
                >
                  <span className="text-base font-medium text-gray-900">{formatNumber(followingCount)}</span>
                  {" following"}
                </a>
              </li>
            </ul>
          </div>

          {/* Bio Section */}
          <div className="space-y-2">
            {/* Display Name */}
            <div className="text-base font-medium text-gray-900">{displayName || username}</div>

            {/* Bio Text */}
            <div className="text-base leading-normal font-normal whitespace-pre-line text-gray-600">
              {bio || "Reel creator"}
            </div>

            {/* Website Link */}
            {website && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">🌐</span>
                <a
                  href={website}
                  rel="me nofollow noopener noreferrer"
                  target="_blank"
                  className="truncate text-base font-medium text-blue-500 hover:underline"
                >
                  {website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}

            {/* Mutual Followers */}
            {mutualFollowers.length > 0 && (
              <a
                href={`/${username}/followers/mutualOnly`}
                className="block text-sm font-normal text-gray-400 transition-colors hover:text-black"
              >
                Followed by <span className="text-base font-medium text-gray-900">{mutualFollowers[0]?.username}</span>
                {mutualFollowers.length > 1 && (
                  <>
                    , <span className="text-base font-medium text-gray-900">{mutualFollowers[1]?.username}</span>
                    {mutualFollowers.length > 2 && ` + ${mutualFollowers.length - 2} more`}
                  </>
                )}
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
