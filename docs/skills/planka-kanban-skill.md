# Planka Kanban Operations Skill (Public & Open Source)

## 1. Overview & General Principles

This skill defines best-practice operational workflows, task hierarchies, and checklist patterns for managing Kanban boards with Planka v2.x.
Every MCP client (Claude Desktop, Cursor, Antigravity, Cline, etc.) interacting with this Planka MCP server should follow these guidelines.

### Core Disciplines
1. **Resolve Names to IDs Before Writing:** Users provide human-readable names (project names, board names, list names, card titles, and usernames). Always use lookup tools (e.g., `mcp_kanban_project_board_manager`, `mcp_kanban_list_manager`) to resolve the exact internal IDs before calling mutating tools.
2. **Prevent Duplicate Cards:** Always scan the target board or list for existing cards with matching titles or ticket IDs before creating a new card. If an active card already exists, update or comment on it rather than creating duplicates.
3. **Verify After Writing:** Always verify write operations by fetching the updated card or checklist details (`card_manager get_details`).
4. **Hierarchical Task Structure:** Planka v2 follows a strict hierarchy:
   `Project -> Board -> List -> Card -> TaskList (Checklist container) -> Task (Checklist item)`.
   Checklists must always belong to a `TaskList` within a `Card`.

---

## 2. Card Creation & Lifecycle

### A. Creating Structured Cards
1. **Determine Destination:** Identify the target Project, Board, and List. If not specified, look up available boards and default to the triage or incoming list (e.g., `Backlog`, `To Do`, or `No iniciada`).
2. **Title Conventions:** Keep titles clear, concise, and prefixed by issue/ticket identifiers when available:
   - Feature: `[FEAT] <Short summary>`
   - Bug/Fix: `[BUG] <Short summary>`
   - General Task: `<Topic> - <Action requested>`
3. **Checklists:** Create a `TaskList` (`mcp_kanban_task_list_manager`) and add step-by-step actionable tasks (`mcp_kanban_task_manager`) so work can be checked off incrementally.
4. **Assignment:** Assign users via `mcp_kanban_card_membership_manager` when assignees are specified.

### B. Moving & Progressing Cards
- Move cards across workflow lists (e.g., `To Do` -> `In Progress` -> `Review` -> `Done`).
- When all checklist items are completed, confirm with the user or move the card to the completed list.

---

## 3. Predefined Checklist Templates

### Software Feature / Enhancement
1. `Clarify specifications and requirements`
2. `Implement core functionality and unit tests`
3. `Perform code review and lint verification`
4. `Conduct manual or integration testing`
5. `Deploy to staging / production environment`
6. `Update documentation and close task`

### Bug Fix / Incident Resolution
1. `Reproduce issue and verify logs/errors`
2. `Identify root cause in codebase or configuration`
3. `Implement regression test and code fix`
4. `Verify fix in local or test environment`
5. `Deploy patch and verify resolution`

### General Task / Standard Operation
1. `Review initial prerequisites and materials`
2. `Execute operational steps`
3. `Verify output and quality standards`
4. `Document outcome and notify stakeholders`
