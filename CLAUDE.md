# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thread-based note-taking application for personal knowledge management. Users can create interconnected notes with replies and mentions (@ID), similar to social media threads.

## Active Technologies

- **TypeScript 5.x** / Bun runtime
- **React 18** - Frontend UI framework  
- **Hono** - Ultra-fast backend web framework
- **SQLite** - Embedded database (offline-first)
- **Drizzle ORM** - Type-safe database access
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **Bun** - Package manager and runtime

## Project Structure

```
backend/
├── src/
│   ├── models/       # Data models and database schemas
│   ├── services/     # Business logic
│   └── api/          # Hono routes and middleware
└── tests/

frontend/
├── src/
│   ├── components/   # React components
│   ├── pages/        # Page components
│   └── services/     # API clients
└── tests/

shared/
├── types/           # TypeScript interfaces
└── constants/       # Shared constants

specs/               # Feature specifications
scripts/             # Development scripts
```

## Commands

```bash
# Development
bun install          # Install dependencies
bun run dev          # Start development server
bun run build        # Build for production

# Testing
bun test            # Run unit tests with Vitest
bun run test:e2e    # Run E2E tests with Playwright
bun run test:load   # Run load tests

# Database
bun run db:setup    # Initialize SQLite database
bun run db:migrate  # Run Drizzle migrations
bun run db:seed     # Seed test data

# Code Quality
bun run lint        # Run ESLint
bun run typecheck   # Run TypeScript checks
bun run format      # Format with Prettier
```

## Key Features

### Core Functionality
- Create markdown notes with unique IDs
- Reply to notes creating threaded conversations
- Mention other notes using @ID syntax
- Search notes by content or mentions
- Edit and delete notes with cascade deletion

### UI Layout
- Split view: note list (left) + thread view (right)
- Infinite scroll for note lists
- Chronological ordering (oldest to newest)
- Real-time updates via WebSocket

### Data Model
- **Note**: id, content, parentId, timestamps, depth
- **Mention**: fromNoteId, toNoteId, position
- **SearchIndex**: Full-text search support

## API Endpoints

```
GET    /api/notes              # List root notes
POST   /api/notes              # Create note
GET    /api/notes/:id          # Get note with thread
PUT    /api/notes/:id          # Update note
DELETE /api/notes/:id          # Delete note (cascade)
GET    /api/notes/search       # Search notes
GET    /api/notes/:id/mentions # Get mentions
```

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Functional components with hooks
- Async/await over promises
- Descriptive variable names
- Comment complex logic only

### Testing Requirements
- TDD: Write tests first
- Test files next to source files
- Mock external dependencies
- E2E tests for user flows
- Maintain >80% coverage

### Git Workflow
- Feature branches: `NNN-feature-name`
- Conventional commits
- PR required for main
- Run tests before commit

## Recent Changes

- **001-thread-based-note**: Initial implementation with TypeScript, React, Hono, and SQLite

## Performance Targets

- Note operations: <100ms
- Search results: <150ms
- Page load: <1s
- Support 1000+ notes
- Smooth scrolling

## Security Considerations

- Content sanitization with DOMPurify
- CSP headers enabled
- Input validation on all endpoints
- SQL injection prevention
- XSS protection in markdown rendering

---
*Last updated: 2025-09-07*