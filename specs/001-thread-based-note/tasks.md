# Tasks: Thread-Based Note-Taking Application

**Input**: Design documents from `/specs/001-thread-based-note/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript, Bun, Hono, React, SQLite, Drizzle ORM
   → Structure: backend/, frontend/, shared/
2. Load design documents:
   → data-model.md: Note, Mention, SearchIndex entities
   → contracts/api.yaml: 7 REST endpoints
   → quickstart.md: 10 test scenarios
3. Generate tasks by category
4. Apply TDD rules - tests before implementation
5. Number tasks sequentially
6. Mark parallel tasks [P]
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Project Setup
- [ ] T001 Create project structure with backend/, frontend/, shared/ directories
- [ ] T002 Initialize backend with Bun, TypeScript, Hono, Drizzle ORM
- [ ] T003 Initialize frontend with Bun, TypeScript, React 18, Vite
- [ ] T004 [P] Configure ESLint and Prettier for TypeScript
- [ ] T005 [P] Setup Vitest configuration in backend/vitest.config.ts
- [ ] T006 [P] Setup Playwright configuration in frontend/playwright.config.ts
- [ ] T007 Create shared TypeScript interfaces in shared/types/index.ts

## Phase 3.2: Database Setup
- [ ] T008 Create Drizzle schema for Note entity in backend/src/models/note.schema.ts
- [ ] T009 Create Drizzle schema for Mention entity in backend/src/models/mention.schema.ts
- [ ] T010 Create Drizzle schema for SearchIndex in backend/src/models/search.schema.ts
- [ ] T011 Setup Drizzle config and SQLite connection in backend/src/db/index.ts
- [ ] T012 Create database migration files with Drizzle Kit
- [ ] T013 Create seed script for test data in backend/src/db/seed.ts

## Phase 3.3: Contract Tests (TDD - MUST FAIL FIRST) ⚠️
**CRITICAL: Write these tests BEFORE implementation. They MUST fail initially.**

- [ ] T014 [P] Contract test GET /api/notes in backend/tests/contract/notes.get.test.ts
- [ ] T015 [P] Contract test POST /api/notes in backend/tests/contract/notes.post.test.ts
- [ ] T016 [P] Contract test GET /api/notes/:id in backend/tests/contract/notes.id.get.test.ts
- [ ] T017 [P] Contract test PUT /api/notes/:id in backend/tests/contract/notes.id.put.test.ts
- [ ] T018 [P] Contract test DELETE /api/notes/:id in backend/tests/contract/notes.id.delete.test.ts
- [ ] T019 [P] Contract test GET /api/notes/search in backend/tests/contract/notes.search.test.ts
- [ ] T020 [P] Contract test GET /api/notes/:id/mentions in backend/tests/contract/notes.mentions.test.ts

## Phase 3.4: Integration Tests (TDD - MUST FAIL FIRST) ⚠️
- [ ] T021 [P] Integration test: Create first note scenario in backend/tests/integration/create-note.test.ts
- [ ] T022 [P] Integration test: Reply to note (thread) in backend/tests/integration/thread-reply.test.ts
- [ ] T023 [P] Integration test: Mention another note in backend/tests/integration/mention-note.test.ts
- [ ] T024 [P] Integration test: Search by content in backend/tests/integration/search-content.test.ts
- [ ] T025 [P] Integration test: Navigate thread hierarchy in backend/tests/integration/thread-navigation.test.ts
- [ ] T026 [P] Integration test: Edit existing note in backend/tests/integration/edit-note.test.ts
- [ ] T027 [P] Integration test: Delete note with cascade in backend/tests/integration/delete-cascade.test.ts
- [ ] T028 [P] Integration test: Prevent circular references (DFS validation) in backend/tests/integration/circular-refs.test.ts
- [ ] T028.5 [P] Integration test: Enforce 1000 character limit in backend/tests/integration/char-limit.test.ts
- [ ] T028.6 [P] Integration test: Performance validation (<200ms) in backend/tests/integration/performance.test.ts

## Phase 3.5: Repository Layer Implementation
- [ ] T029 [P] Create NoteRepository in backend/src/repositories/note.repository.ts
- [ ] T030 [P] Create MentionRepository in backend/src/repositories/mention.repository.ts
- [ ] T031 [P] Create SearchRepository in backend/src/repositories/search.repository.ts
- [ ] T032 Implement ID generation (6-char) in backend/src/utils/id-generator.ts
- [ ] T033 Implement mention parser (@ID syntax) in backend/src/utils/mention-parser.ts

## Phase 3.6: Service Layer Implementation
- [ ] T034 Create NoteService with CRUD and 1000 char validation in backend/src/services/note.service.ts
- [ ] T035 Create ThreadService for hierarchy management in backend/src/services/thread.service.ts
- [ ] T036 Create MentionService with circular reference detection (DFS) in backend/src/services/mention.service.ts
- [ ] T037 Create SearchService with FTS5 full-text search in backend/src/services/search.service.ts
- [ ] T038 Implement cascade delete logic in backend/src/services/delete.service.ts

## Phase 3.7: API Implementation (Make Tests Pass)
- [ ] T038.5 Create Hono app instance and router setup in backend/src/api/app.ts
- [ ] T039 Implement GET /api/notes endpoint in backend/src/api/routes/notes.ts
- [ ] T040 Implement POST /api/notes endpoint in backend/src/api/routes/notes.ts
- [ ] T041 Implement GET /api/notes/:id endpoint in backend/src/api/routes/notes.ts
- [ ] T042 Implement PUT /api/notes/:id endpoint in backend/src/api/routes/notes.ts
- [ ] T043 Implement DELETE /api/notes/:id endpoint in backend/src/api/routes/notes.ts
- [ ] T044 Implement GET /api/notes/search endpoint in backend/src/api/routes/search.ts
- [ ] T045 Implement GET /api/notes/:id/mentions endpoint in backend/src/api/routes/mentions.ts
- [ ] T046 Add Hono middleware for error handling in backend/src/api/middleware/error.ts
- [ ] T047 Add validation middleware with Zod in backend/src/api/middleware/validation.ts

## Phase 3.8: Frontend Components
- [ ] T048 [P] Create NoteList component in frontend/src/components/NoteList.tsx
- [ ] T049 [P] Create NoteEditor component in frontend/src/components/NoteEditor.tsx
- [ ] T050 [P] Create ThreadView component in frontend/src/components/ThreadView.tsx
- [ ] T051 [P] Create MentionInput component in frontend/src/components/MentionInput.tsx
- [ ] T052 [P] Create SearchBar component in frontend/src/components/SearchBar.tsx
- [ ] T053 Create SplitView layout in frontend/src/layouts/SplitView.tsx

## Phase 3.9: Frontend Services
- [ ] T054 [P] Create API client service in frontend/src/services/api.client.ts
- [ ] T055 [P] Create NoteService for API calls in frontend/src/services/note.service.ts
- [ ] T056 [P] Create WebSocket service for real-time in frontend/src/services/websocket.service.ts
- [ ] T057 Create state management with Zustand in frontend/src/store/notes.store.ts

## Phase 3.10: Frontend Pages & Routing
- [ ] T058 Create main App component in frontend/src/App.tsx
- [ ] T059 Setup React Router in frontend/src/router/index.tsx
- [ ] T060 Create NotesPage with split view in frontend/src/pages/NotesPage.tsx
- [ ] T061 Implement infinite scroll in frontend/src/hooks/useInfiniteScroll.ts
- [ ] T062 Implement virtual scrolling with react-window in frontend/src/hooks/useVirtualScroll.ts

## Phase 3.11: Real-time & Performance
- [ ] T063 Add WebSocket server with Hono's WebSocket adapter in backend/src/websocket/server.ts
- [ ] T064 Implement real-time note updates in backend/src/websocket/handlers.ts
- [ ] T065 Add debounced search in frontend/src/hooks/useDebounce.ts
- [ ] T066 Implement lazy loading for threads in frontend/src/hooks/useLazyLoad.ts
- [ ] T067 Add caching layer with LRU cache in backend/src/cache/lru.cache.ts

## Phase 3.12: Security & Observability
- [ ] T068 Add DOMPurify for markdown sanitization in frontend/src/utils/sanitizer.ts
- [ ] T069 Setup CSP headers in backend/src/api/middleware/security.ts
- [ ] T070 Add pino logger configuration in backend/src/utils/logger.ts
- [ ] T071 Implement frontend → backend log streaming in frontend/src/services/logger.service.ts
- [ ] T072 Add request/response logging middleware in backend/src/api/middleware/logging.ts

## Phase 3.13: E2E Tests
- [ ] T073 [P] E2E test: Complete user flow in frontend/tests/e2e/user-flow.spec.ts
- [ ] T074 [P] E2E test: Thread creation and navigation in frontend/tests/e2e/thread.spec.ts
- [ ] T075 [P] E2E test: Mention functionality in frontend/tests/e2e/mentions.spec.ts
- [ ] T076 [P] E2E test: Search functionality in frontend/tests/e2e/search.spec.ts

## Phase 3.14: Polish & Documentation
- [ ] T077 [P] Add unit tests for ID generator in backend/tests/unit/id-generator.test.ts
- [ ] T078 [P] Add unit tests for mention parser in backend/tests/unit/mention-parser.test.ts
- [ ] T079 [P] Add unit tests for React components in frontend/tests/components/
- [ ] T080 Performance testing (<100ms operations) in backend/tests/performance/
- [ ] T081 Load testing (1000+ notes) in backend/tests/load/
- [ ] T082 Update API documentation in docs/api.md
- [ ] T083 Create user guide in docs/user-guide.md
- [ ] T084 Run quickstart.md validation scenarios

## Dependencies
- Setup (T001-T007) → Everything else
- Database (T008-T013) → Repository layer (T029-T033)
- Contract tests (T014-T020) before API implementation (T039-T047)
- Integration tests (T021-T028) before service implementation (T034-T038)
- Repository layer → Service layer → API implementation
- Backend API complete → Frontend development
- All implementation → E2E tests → Polish

## Parallel Execution Examples
```bash
# Phase 3.3 - Run all contract tests in parallel:
bun test backend/tests/contract/*.test.ts

# Phase 3.4 - Run all integration tests in parallel:
bun test backend/tests/integration/*.test.ts

# Phase 3.5 - Repository implementations (different files):
Task: "Create NoteRepository"
Task: "Create MentionRepository"
Task: "Create SearchRepository"

# Phase 3.8 - Frontend components (independent):
Task: "Create NoteList component"
Task: "Create NoteEditor component"
Task: "Create ThreadView component"
```

## Notes
- Total tasks: 87 (updated to include clarification-driven tasks)
- Parallel tasks: 46 (marked with [P])
- Strict TDD: Tests in phases 3.3-3.4 MUST fail before implementation
- Clarifications enforced: 1000 char limit, circular ref prevention, <200ms performance
- Commit after each task completion
- Run tests continuously during development

## Validation Checklist
- ✅ All 7 API endpoints have contract tests (T014-T020)
- ✅ All 3 entities have models (T008-T010)
- ✅ All quickstart scenarios have tests (T021-T028.6, T073-T076)
- ✅ Clarification requirements covered (1000 chars: T028.5, circular refs: T028, <200ms: T028.6)
- ✅ Tests come before implementation (Phase 3.3-3.4 before 3.5-3.7)
- ✅ Parallel tasks work on different files
- ✅ Each task specifies exact file path

---
*Generated from: plan.md, data-model.md, contracts/api.yaml, quickstart.md*