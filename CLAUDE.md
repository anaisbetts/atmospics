# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Atmospics - Social Media Archive & Display

A Next.js application that extracts, caches, and displays content from Bluesky with image rehosting and archival capabilities.

## Build & Test Commands

- Development server: `bun dev` (uses Turbopack)
- Build: `bun next-build` 
- Run tests: `bun test` (Jest)
- Lint: `bun lint` (Biome)
- Fix linting: `bun f` (Biome with auto-fix)
- Storybook: `bun storybook`
- **Code validity check**: Run `bun f` and `bun next-build` to verify code correctness

## Architecture Overview

### Core Functionality
The application operates around a content manifest system that aggregates social media posts with associated metadata, images, and comments. Content flows through these main stages:

1. **Content Extraction** (`src/lib/bluesky.ts`): Fetches posts from Bluesky using AT Protocol
2. **Image Caching** (`src/lib/image-cache.ts`): Rehosts external images to Vercel Blob storage
3. **Content Management** (`src/lib/uploader.ts`): Manages content manifests with hash-based change detection
4. **Display** (`src/components/image-grid.tsx`): Renders content in a responsive grid

### Key Components

- **BlueskyFeedBuilder**: Extracts posts, images, and comments from Bluesky profiles using AT Protocol
- **ImageCache**: Handles rehosting of external images to Vercel Blob with conflict resolution
- **ContentManifest**: Central data structure containing posts with hashed content for change detection
- **ImageCacheProvider**: React context for managing image cache state across components

### Data Flow

Content manifests use SHA-256 hashing at multiple levels (posts, comments, manifests) to enable efficient change detection and merging. The system supports both live Bluesky content and archived Instagram imports through a unified Post interface.

### Environment Requirements

- `BSKY_USER` and `BSKY_PASS`: Bluesky authentication credentials
- `BSKY_TARGET`: Target Bluesky handle to extract content from
- Vercel Blob storage for image hosting

## Code Style

- TypeScript with strict typing throughout
- Biome for linting and formatting (minimal rules, focused on correctness)
- 2-space indentation, single quotes, semicolons as needed
- React 19 with Next.js App Router
- RxJS for reactive patterns where needed
