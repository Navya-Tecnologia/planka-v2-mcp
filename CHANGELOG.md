# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.5] - 2026-09-21

### Added
- **HTTP SSE Network Transport**: Implemented native Node.js HTTP Server-Sent Events transport (`SSEServerTransport`) in `transport/httpServer.ts`, exposing `/sse`, `/messages`, and `/health` endpoints with full CORS support.
- **Dual Transport Mode**: Supported switching between default `stdio` and `sse` via CLI flags (`--transport sse`, `--port`, `--host`) or environment variables (`MCP_TRANSPORT=sse`, `PORT=3000`).
- **Optional Bearer Token Authentication**: Added `MCP_API_KEY` verification via `Authorization: Bearer <key>` header and `?token=`/`?apiKey=` query parameters for secure remote SSE deployments.
- **Docker Modernization & GHCR Publishing**: Modernized `Dockerfile` with multi-stage build, non-root user, and SSE defaults (`EXPOSE 3000`). Automated container image publication to GitHub Container Registry (`ghcr.io/navya-tecnologia/planka-v2-mcp`) in `publish.yml`.
- **Workflow Action Tool**: Registered `workflow_action` in `mcp_kanban_card_manager`, enabling LLMs to transition cards through standard Kanban states (`start_working`, `mark_completed`, `move_to_testing`, `move_to_done`) with optional comments and task completions.
- **Unit Test Suite**: Created isolated unit tests with Jest (`tests/unit/utils.test.ts`, `tests/unit/card-details.test.ts`, and `tests/unit/sse-server.test.ts`) covering ID sanitization, URL building, error mappings, card detail resolution, CLI parsing, auth validation, and SSE endpoints (30 tests total).
- **CI Test Verification**: Added automated test step (`npm test`) in `.github/workflows/publish.yml` to prevent broken releases from being published to NPM or GitHub Releases.

### Changed
- **Performance Optimization in `getCardDetails`**: Replaced the exhaustive O(N×M×K) scanning across all projects, boards, and lists with direct O(1) resolution via `card.boardId` or `getList(card.listId)`.
- **Parallel Network Requests**: Parallelized default list and label generation in `createBoard` using `Promise.all` (reducing board creation latency). Parallelized batch task creation in `createCardWithTasks`.
- **User Resolution Pagination**: Added `page=1&perPage=100` pagination parameters to `getUserIdByEmail` and `getUserIdByUsername` to ensure users in larger instances are resolved reliably.
- **Schema & Code Cleanup**: Reused `PlankaUserSchema` and `PlankaCardMembershipSchema` to avoid duplicate schema definitions. Removed obsolete `@ts-ignore` comments and unused imports.

### Fixed
- **Security & Path Traversal**: Enforced `sanitizeId` validation across all endpoint routes (`cards`, `boards`, `lists`, `tasks`, `taskLists`, `comments`, `labels`, `memberships`, `users`).
- **Token Auto-Refresh**: Added automatic token renewal and single retry on `401 Unauthorized` responses in `plankaRequest` to prevent disconnection during long-running MCP sessions.
- **Error Handling**: Standardized error handling in list operations (`updateList`, `deleteList`) with informative contextual errors.

---

## [1.3.4] - 2026-09-17

### Added
- Automated GitHub Actions release pipeline (`.github/workflows/publish.yml`) for publishing to NPM and creating GitHub Releases on tag push.

---

## [1.3.3] - 2026-09-17

### Security
- Security hardening across dependencies and path validation.

---

## [1.3.2] - 2026-09-16

### Fixed
- Relaxed `UserSchema` fields to prevent validation errors when users have missing email or name fields.

---

## [1.3.1] - 2026-09-15

### Changed
- Maintenance update and build artifact refresh.

---

## [1.3.0] - 2026-09-14

### Added
- Added `get_project_summary` tool to aggregate board summaries, card counts, and statistics within a project.

---

## [1.2.5] - 2026-09-10

### Fixed
- Fixed `get_board_summary` crash by safely handling labels when endpoint is not supported in Planka v2.
