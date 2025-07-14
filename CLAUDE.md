# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development Server:**

- `npm run dev` - Start Next.js development server
- `npm run build` - Build production version
- `npm run start` - Start production server

**Code Quality:**

- `npm run lint` - Run ESLint (must pass before commits)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted

**Documentation:**

- `npm run storybook` - Start Storybook component documentation
- `npm run build-storybook` - Build Storybook for production

## Architecture Overview

### Core Application Structure

This is a Next.js 15 App Router application built as a content creation platform for social media. The app helps users download videos, transcribe content, generate scripts, and manage social media collections.

**Key Technologies:**

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Firebase (Auth & Firestore)
- Shadcn UI components
- React Query (TanStack Query)

### Service-Based Architecture

The codebase follows a clean service-based architecture with core functionality organized into services:

**Core Services (`src/core/`):**

- `video/` - Video downloading, transcription, analysis, metadata extraction
- `script/` - Script generation with multiple engines (speed, educational, voice)
- `social/` - Social media profile fetching and management
- `auth/` - Authentication and RBAC
- `billing/` - Credits and usage tracking
- `content/` - Content processing and validation

### Authentication & Authorization

- Firebase Authentication with custom user profiles
- Role-based access control (RBAC) with roles: creator, coach, super_admin
- API key authentication for external integrations
- Cached authentication state for performance

### Key Features

1. **Video Processing Pipeline:** Download → Transcribe → Analyze → Generate Scripts
2. **Collections Management:** Organize videos by topics/themes
3. **Script Generation:** Multiple engines for different content types
4. **AI Voice Integration:** Custom voice processing and generation
5. **Social Profile Analysis:** Extract insights from social media profiles

## File Organization

**Colocation Pattern:**

- Routes live with their specific components in `src/app/(main)/`
- Shared UI components in `src/components/ui/`
- Business logic in service files (`src/core/`, `src/lib/`)
- Contexts for global state management (`src/contexts/`)

**API Routes:**

- Follow RESTful patterns
- Use service layer for business logic
- Consistent error handling and authentication
- Located in `src/app/api/`

## Development Guidelines

### Code Quality Rules

- Use camelCase for variables/functions, PascalCase for components
- Organize imports: external → internal → relative
- Use single quotes for strings, trailing commas in objects/arrays
- Always use `const` for non-reassigned variables

### Authentication Patterns

- All protected routes require authentication middleware
- API routes use either Firebase Auth tokens or API keys
- User profile data is cached for performance
- Role checks use the RBAC service

### Error Handling

- Consistent error response format across APIs
- Client-side error boundaries for UI resilience
- Proper logging for debugging (avoid console.log in production)

### Database Patterns

- Firebase Firestore with Admin SDK for server operations
- Client-side Firebase SDK only for authentication
- Structured collections: users, videos, collections, scripts, voices
- Use transactions for related updates

## Important Implementation Notes

### Video Processing

Video downloads and transcription are handled by dedicated services. The platform supports Instagram, TikTok, YouTube, and other social platforms. All video processing uses proper rate limiting and error handling.

### Script Generation

The script generation system uses multiple AI engines depending on content type. Each engine is modular and can be extended independently.

### Credits System

The application has a credits-based usage system. Always check credit balance before expensive operations and track usage properly.

### Firebase Configuration

The app uses both client-side and server-side Firebase configurations. Server operations use Firebase Admin SDK with service account credentials.
