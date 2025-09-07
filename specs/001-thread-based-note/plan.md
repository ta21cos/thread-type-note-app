# Implementation Plan: Thread-Based Note-Taking Application

**Branch**: `001-thread-based-note` | **Date**: 2025-09-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-thread-based-note/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
A thread-based note-taking application that enables users to create interconnected notes with replies and mentions (@ID), similar to social media threads but designed for personal knowledge management. The application will support hierarchical note organization, cross-referencing through unique IDs, and markdown formatting.

## Technical Context
**Language/Version**: TypeScript 5.x / Bun runtime  
**Primary Dependencies**: Express.js for API, React 18 for UI, Drizzle ORM for database  
**Storage**: SQLite (embedded database, offline-first)  
**Testing**: Vitest for unit tests, Playwright for E2E tests  
**Target Platform**: Web application (browser-based)
**Project Type**: web - frontend + backend structure  
**Performance Goals**: <100ms response time for note operations, instant search results  
**Constraints**: Offline-capable, <50MB application size, local data storage  
**Scale/Scope**: Single-user application, unlimited notes, up to 1000 notes per thread
**Package Manager**: Bun (faster than npm/yarn/pnpm)
**ID System**: 6-character alphanumeric IDs for notes

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 3 (backend, frontend, shared)
- Using framework directly? Yes (Express, React without wrappers)
- Single data model? Yes (shared TypeScript interfaces)
- Avoiding patterns? No - Using Repository pattern (see Complexity Tracking)

**Architecture**:
- EVERY feature as library? No - pragmatic module structure instead
- Libraries listed: N/A - using service modules within projects
- CLI per library: N/A - single CLI for development tasks
- Library docs: Standard JSDoc/TSDoc format

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes
- Git commits show tests before implementation? Yes
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (SQLite, not mocks)
- Integration tests for: new libraries, contract changes, shared schemas? Yes
- FORBIDDEN: Implementation before test, skipping RED phase - Understood

**Observability**:
- Structured logging included? Yes (pino logger)
- Frontend logs → backend? Yes (unified stream)
- Error context sufficient? Yes

**Versioning**:
- Version number assigned? 0.1.0
- BUILD increments on every change? Yes
- Breaking changes handled? Yes (migration scripts)

## Project Structure

### Documentation (this feature)
```
specs/001-thread-based-note/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Selected: Option 2 - Web application structure

backend/
├── src/
│   ├── models/       # Drizzle ORM schemas
│   ├── services/     # Business logic with Repository pattern
│   └── api/          # Express routes
└── tests/
    ├── contract/     # OpenAPI contract tests
    ├── integration/  # Feature integration tests
    └── unit/         # Vitest unit tests

frontend/
├── src/
│   ├── components/   # React components
│   ├── pages/        # Page components
│   └── services/     # API client services
└── tests/
    ├── components/   # Component tests
    └── e2e/          # Playwright tests

shared/
├── types/           # Shared TypeScript interfaces
└── constants/       # Shared constants
```

**Structure Decision**: Option 2 - Web application (frontend + backend + shared)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Repository pattern | Clean separation between business logic and data access for testing | Direct Drizzle ORM calls in services would make unit testing require real DB |
| No library architecture | Simpler to maintain for single-developer project | Library-per-feature adds unnecessary complexity for a focused application |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*