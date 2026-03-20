# 📖 API Reference

This page provides technical documentation for the consolidated MCP tools available in Planka Kanban MCP (v2.x).

## Tool Architecture

All functionality is grouped into **Manager Tools**. Each tool accepts an `action` parameter to determine the operation.

---

## 📂 Project & Board Management
**Tool**: `mcp_kanban_project_board_manager`

| Action | Parameters | Description |
|--------|------------|-------------|
| `get_projects` | `page`, `perPage` | List all projects. |
| `get_project` | `id` | Get project details. |
| `create_project` | `name`, `description`, `type` | Create a new project. |
| `update_project` | `id`, `name`, `description`, `backgroundType`, `backgroundGradient` | Update project settings. |
| `delete_project` | `id` | Delete a project. |
| `get_boards` | `projectId` | List boards in a project. |
| `create_board` | `projectId`, `name`, `type` | Create a board. |
| `get_board` | `id` | Get board details. |
| `update_board` | `id`, `name`, `backgroundType`, etc. | Update board settings. |
| `delete_board` | `id` | Delete a board. |
| `get_board_summary` | `boardId`, `includeTaskDetails`, `includeComments` | Get comprehensive board summary including stats. |
| `get_project_summary` | `id` | Get summary for all boards in a project. |

---

## 📋 List Management
**Tool**: `mcp_kanban_list_manager`

- **Actions**: `get_all`, `create`, `update`, `delete`, `get_one`.
- **v2.x Features**: Supports `type` (active, closed, archive, trash) and `color`.

---

## 🗂️ Card Management
**Tool**: `mcp_kanban_card_manager`
- **Actions**: `get_all`, `create`, `get_one`, `update`, `move`, `duplicate`, `delete`.
- **v2.x Features**:
  - `create`: Defaults to `type: "project"`.
  - `update`: Now supports changing the **Card Type** (`project` or `story`).
  - `move`: Supports moving cards between boards.

---

## ⏱️ Card Stopwatch
**Tool**: `mcp_kanban_stopwatch`

- **Actions**: `start`, `stop`, `get`, `reset`.
- **Parameters**: `id` (Card ID).

---

## 📂 Task List Management (New in v2.x)
**Tool**: `mcp_kanban_task_list_manager`

- **Actions**: `get_all`, `create`, `get_one`, `update`, `delete`.
- **Parameters**: `cardId` (for list/create), `id` (for get/update/delete).

---

## ✅ Task Management
**Tool**: `mcp_kanban_task_manager`

| Action | Parameters | Description |
|--------|------------|-------------|
| `get_all` | `taskListId` or `cardId` | List tasks. `cardId` will return all tasks in the card. |
| `create` | `taskListId` or `cardId`, `name` | Create a task. |
| `batch_create` | `tasks` (array) | Create multiple tasks at once. |
| `update` | `id`, `name`, `isCompleted`, etc. | Update a task. |
| `complete_task` | `id` | Shortcut to mark a task as completed. |
| `delete` | `id` | Delete a task. |

---

## 💬 Comment Management
**Tool**: `mcp_kanban_comment_manager`

- **Actions**: `get_all`, `create`, `get_one`, `update`, `delete`.
- **Parameters**: `cardId` (list/create), `id` (get/update/delete), `text` (create/update).

---

## 🏷️ Label Management
**Tool**: `mcp_kanban_label_manager`

- **Actions**: `get_all`, `create`, `update`, `delete`, `add_to_card`, `remove_from_card`.
- **v2.0 Colors**: Supports 10+ standard Planka colors (e.g., `berry-red`, `sky-blue`).

---

## 👤 Card Membership (Assignment)
**Tool**: `mcp_kanban_card_membership_manager`
- **Actions**: `get_all`, `create`, `delete`, `get_users`.
- **Unified Resolution**: Supports resolving users by `id`, `email`, or `username` automatically.
- **Parameters**: `cardId`, `userId` (optional), `email` (optional), `username` (optional).

---

## 👥 Board Membership Management
**Tool**: `mcp_kanban_membership_manager`
- **Actions**: `get_all`, `create`, `get_one`, `update`, `delete`.
- **v2.0 Features**: Supports `viewer` role and `canComment` permission.