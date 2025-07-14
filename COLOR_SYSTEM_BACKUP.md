# Color System Backup - Before Monochromatic Implementation

## Current Color Classes Found in Codebase

### Platform-Specific Colors

- TikTok: `bg-[#FF0050]`, `border-[#FF0050]`, `text-white`, `hover:bg-[#E6004C]`
- Instagram: `bg-[#E4405F]`, `border-[#E4405F]`, `text-white`, `hover:bg-[#D6336C]`

### Status Indicators

- Success/Active: `bg-green-500`, `text-green-600`, `border-green-600`, `text-green-600`
- New badges: `bg-green-500 text-white`
- Optimized badges: `border-green-600 text-green-600`

### UI Element Colors

- Verified badges: `text-blue-500`
- Website links: `text-[#00376b]`
- Muted text: `text-muted-foreground`, `text-[#737373]`
- Background elements: `bg-[#efefef]`, `hover:bg-[#e5e5e5]`
- Video overlays: `bg-black/60`, `bg-black/40`, `hover:bg-black/80`

### Current Tailwind Extended Colors

```typescript
colors: {
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },
  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))",
  },
  // ... other extended colors
}
```

## Files with Color Classes to Update

1. `/src/app/(main)/research/creator-spotlight/page.tsx`
2. `/src/app/(main)/research/creator-spotlight/_components/creator-detail-view.tsx`
3. `/src/app/(main)/research/creator-spotlight/_components/creator-grid.tsx`
4. `/src/components/ui/instagram-video-grid.tsx`
5. `/src/components/extract/social-header.tsx`

Date: $(date)
