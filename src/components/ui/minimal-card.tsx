"use client";

import { cn } from "@/lib/utils";

interface MinimalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spacing?: "default" | "tight" | "loose";
}

export function MinimalCard({ 
  children, 
  className, 
  spacing = "default",
  ...props 
}: MinimalCardProps) {
  const spacingClasses = {
    tight: "py-4",
    default: "py-6", 
    loose: "py-8"
  };

  return (
    <div
      className={cn(
        "minimal-card",
        spacingClasses[spacing],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface MinimalCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MinimalCardHeader({ children, className, ...props }: MinimalCardHeaderProps) {
  return (
    <div
      className={cn("element-spacing", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface MinimalCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function MinimalCardTitle({ 
  children, 
  className, 
  level = 2,
  ...props 
}: MinimalCardTitleProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        level === 1 && "text-2xl",
        level === 2 && "text-xl", 
        level === 3 && "text-lg",
        level === 4 && "text-base",
        level === 5 && "text-sm",
        level === 6 && "text-xs",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

interface MinimalCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MinimalCardContent({ children, className, ...props }: MinimalCardContentProps) {
  return (
    <div
      className={cn("text-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
} 