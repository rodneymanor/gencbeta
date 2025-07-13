'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AvatarPlaceholder } from './avatar-placeholder';

interface SafeImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackUsername?: string;
  fallbackPlatform?: 'tiktok' | 'instagram';
  priority?: boolean;
}

export function SafeImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackUsername,
  fallbackPlatform = 'tiktok',
  priority = false
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If we have an error or no valid src, show placeholder
  if (hasError || !src || src === '') {
    if (fallbackUsername) {
      return (
        <AvatarPlaceholder
          username={fallbackUsername}
          platform={fallbackPlatform}
          size={width}
          className={className}
        />
      );
    }
    
    // Generic fallback
    return (
      <div 
        className={`bg-muted flex items-center justify-center rounded-full ${className}`}
        style={{ width, height }}
      >
        <span className="text-muted-foreground text-sm">?</span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'object-cover transition-opacity duration-200',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        priority={priority}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
      )}
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
} 