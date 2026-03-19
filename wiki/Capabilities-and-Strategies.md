# 🧠 MCP Server Capabilities and LLM Interaction Strategies

This guide focuses on the capabilities of the MCP Kanban server specifically and how Large Language Models (LLMs) can effectively interact with it to manage Planka v2.x kanban boards.

## 🛠️ MCP Server Capabilities

The MCP Kanban server serves as an intermediary layer that provides LLMs with a simplified, consolidated, and enhanced API to interact with Planka's task management system.

### 🔄 Core MCP Server Functions

1. **🧩 Consolidated Manager Tools**: Operations are grouped into "Managers" (e.g., `mcp_kanban_card_manager`). This significantly reduces the tool count, ensuring compatibility with Cursor's 40-tool limit.
2. **📂 Task List Hierarchy (v2.0)**: The server handles the new Planka v2.0 hierarchy where tasks are nested within Task Lists.
3. **🔝 Higher-Level Operations**: Provides functions like `batch_create` for tasks and `duplicate` for cards to abstract complexity.
4. **💾 State Persistence**: Maintains state and stopwatches across different chat sessions.
5. **🔐 Authentication Management**: Handles OIDC-compliant authentication and token rotation.

### 🌟 Key Capabilities for LLMs

The MCP Server enables LLMs to:
1. **📋 Access Kanban Data**: Projects, boards, lists, cards, task lists, tasks, comments, and labels.
2. **📂 Manage Task Lists**: Create and organize containers for tasks within cards.
3. **✅ Track Tasks**: Create and complete tasks with precise placement in Task Lists.
4. **🔄 Manage Workflow**: Move cards between lists and even across different boards.
5. **⏱️ Monitor Time**: Accurate time tracking with persistent stopwatches.

## 🤖 LLM Interaction Strategies

### 🔄 Task-Oriented Development Workflow (Updated for v2.0)

1. **🔍 Identify Next Card**: Check the Backlog board.
2. **▶️ Start Work**: Move card to "In Progress" and start the stopwatch.
3. **📂 Organize Tasks**: Create a Task List (e.g., "Development Tasks") using `mcp_kanban_task_list_manager`.
4. **🛠️ Implement Tasks**: Add specific tasks to the Task List.
5. **📝 Document Progress**: Add comments as tasks are completed.
6. **⏹️ Finish**: Stop the stopwatch and move the card to "Ready for Review".

### 🧠 Collaborative Grooming and Planning

In v2.0, the LLM can assist in more granular planning:
- **Project Structure**: Suggest whether boards should be private or shared.
- **Task Organization**: Break down complex cards into multiple Task Lists (e.g., "Frontend", "Backend", "Testing").
- **Time Analysis**: Use stopwatch data to provide more accurate estimates for future similar cards.

## ⏱️ Time Tracking Capabilities

The `mcp_kanban_stopwatch` tool tracks "Active Time" on a card.

1. **Persistent**: If the LLM session ends, the stopwatch remains in its state (started or stopped) in Planka.
2. **Cumulative**: Total time is stored and can be retrieved using the `get` action.

## 🏆 Key Advantages for LLMs

- **Tool Efficiency**: By using consolidated managers, the LLM has more "slots" available for other workspace tools.
- **Context Retention**: The board state is the "source of truth", allowing the LLM to resume work without needing the full history of previous chats.
- **Clear Hierarchy**: The Task List addition in v2.0 provides a better way for LLMs to organize sub-tasks without cluttering the card description.

For tool-specific details, see the [API Reference](./API-Reference.md).