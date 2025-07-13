import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarPlaceholderProps {
  username: string;
  platform?: 'tiktok' | 'instagram';
  size?: number;
  className?: string;
}

export function AvatarPlaceholder({ 
  username, 
  platform = 'tiktok', 
  size = 64, 
  className 
}: AvatarPlaceholderProps) {
  const initials = username.charAt(0).toUpperCase();
  const colors = {
    tiktok: {
      bg: '#FF0050',
      text: '#FFFFFF'
    },
    instagram: {
      bg: '#E4405F', 
      text: '#FFFFFF'
    }
  };

  const color = colors[platform];

  return (
    <div 
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white',
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color.bg,
        fontSize: `${size * 0.4}px`
      }}
    >
      {initials}
    </div>
  );
} 