# 📝 Usage Guide

This guide explains how to use the Kanban MCP tools with Claude in Cursor to manage your Planka v2.0 kanban board.

## 🛠️ Available Consolidated Managers

The Kanban MCP provides several consolidated managers that Claude can use to interact with your Planka board. Each manager supports multiple actions via the `action` parameter.

### 📂 Project & Board Management
**Tool**: `mcp_kanban_project_board_manager`
- **Actions**: `get_projects`, `get_project`, `get_boards`, `create_board`, `get_board`, `update_board`, `delete_board`.
- **New in v2.x**: Support for `private` or `shared` project types and advanced background styles.

### 📋 List Management
**Tool**: `mcp_kanban_list_manager`
- **Actions**: `get_all`, `create`, `update`, `delete`, `get_one`.
- **New in v2.x**: Support for list types (`active`, `closed`, `archive`, `trash`) and colors.

### 🗂️ Card Management
**Tool**: `mcp_kanban_card_manager`
- **Actions**: `get_all`, `create`, `get_one`, `update`, `move`, `duplicate`, `delete`.
- **Note**: Cards in v2.x support `isClosed` status and enhanced positioning.

### ⏱️ Time Tracking
**Tool**: `mcp_kanban_stopwatch`
- **Actions**: `start`, `stop`, `get`, `reset`.
- **Note**: Stopwatches are attached directly to cards and persist across sessions.

### 📂 Task List Management (New in v2.x)
**Tool**: `mcp_kanban_task_list_manager`
- **Actions**: `get_all`, `create`, `get_one`, `update`, `delete`.
- **Purpose**: Manage parent containers for tasks inside a card.

### ✅ Task Management
**Tool**: `mcp_kanban_task_manager`
- **Actions**: `get_all`, `create`, `batch_create`, `get_one`, `update`, `delete`, `complete_task`.
- **Note**: Tasks now live inside Task Lists. You can use `taskListId` for precise placement, or `cardId` to use the default list.

### 💬 Comment Management
**Tool**: `mcp_kanban_comment_manager`
- **Actions**: `get_all`, `create`, `get_one`, `update`, `delete`.

### 🏷️ Label Management
**Tool**: `mcp_kanban_label_manager`
- **Actions**: `get_all`, `create`, `update`, `delete`, `add_to_card`, `remove_from_card`.

## 🤔 Using Kanban MCP with Claude

### 🔄 Basic Workflow

1. **Ask Claude to perform a task**: "Claude, create a new card for the login feature in the 'To Do' list."
2. **Claude identifies the manager**: It will use `mcp_kanban_card_manager` with the `create` action.
3. **Claude handles the hierarchy**: If you ask to add a task, Claude will first check for a Task List using `mcp_kanban_task_list_manager`.

### 💡 Example Interactions (Planka v2.x)

#### Managing Task Lists and Tasks
```
You: Add a "Frontend Tasks" list to the "Login Feature" card and add a task "Create UI".
Claude: [Creates Task List "Frontend Tasks", then creates the task inside it using its ID]
```

#### Moving Cards between Boards
```
You: Move the "Bug #123" card to the "Hotfixes" board in the same project.
Claude: [Uses mcp_kanban_card_manager with action: "move" and specifies the new boardId]
```

#### Time Tracking
```
You: Start tracking time for the "Database Migration" card.
Claude: [Starts the stopwatch and confirms]
```

## 🚀 Advanced Deployment Tips

- **Base URL**: Ensure `PLANKA_BASE_URL` does NOT end with `/api`.
- **Authentication**: Use `PLANKA_AGENT_EMAIL` and `PLANKA_AGENT_PASSWORD`. The server handles token rotation automatically.

For troubleshooting, see the [Troubleshooting](./Troubleshooting.md) page.