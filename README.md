# 📋 Planka Kanban MCP (v2.x)

A specialized Model Context Protocol (MCP) server that enables LLMs (like Claude in Cursor) to interact with **Planka v2.x** kanban boards.

> [!IMPORTANT]
> This MCP server is designed specifically for **Planka v2.x**. It allows an AI agent to manage projects, boards, cards, and the new **Task List** hierarchy on an existing Planka instance.

## ✨ Key Features (Planka v2.x)

- **📂 Task List Management**: Full support for the new Task List entity introduced in Planka v2.0.
- **✅ Granular Task Tracking**: Create and complete tasks within specific Task Lists inside cards.
- **⏱️ Persistent Time Tracking**: Start and stop stopwatches on cards; time is tracked directly in Planka.
- **🗂️ Consolidated Managers**: Grouped tools (Card Manager, Project Manager, etc.) to optimize LLM interaction and stay under tool limits.
- **🏷️ Advanced Labeling**: Full support for v2.x color palettes and label assignment.

## 🚀 Quick Start (Connect to your Planka v2.x)

### 1. Prerequisites
- A functional **Planka v2.x** instance reachable via network.
- An agent user created in Planka with the necessary permissions.

### 2. Configure Your Client (Cursor/Claude/Antigravity)
The easiest way is using **npx**. Add the following to your MCP configuration:

```json
{
  "mcpServers": {
    "planka-mcp": {
      "command": "npx",
      "args": ["-y", "@navyatec/planka-v2-mcp@latest"],
      "env": {
        "PLANKA_BASE_URL": "https://your-planka-instance.com",
        "PLANKA_AGENT_EMAIL": "agent@yourdomain.com",
        "PLANKA_AGENT_PASSWORD": "your-secure-password",
        "PLANKA_IGNORE_SSL": "true"
      }
    }
  }
}
```

#### Alternative: Local Setup
If you have the code locally, pointing to the built file:
```json
{
  "mcpServers": {
    "planka-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/kanban-mcp/dist/index.js"],
      "env": { ... }
    }
  }
}
```

### 3. Usage
Ask Claude:
- "Groom the Backlog board and break down the top card into tasks."
- "Start tracking time for the UI Implementation card."
- "Create a new 'Database' Task List in the migration card."

## 📖 Documentation

- **[Installation Guide](wiki/Installation-Guide)**: Detailed setup for the MCP server.
- **[API Reference](wiki/API-Reference)**: List of available consolidated manager tools.
- **[Usage Guide](wiki/Usage-Guide)**: How to interact with the board via LLM.
- **[Developer Guide](wiki/Developer-Guide)**: Architecture and how to extend the MCP.

## 🏗️ Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run quality checks
npm run qc
```

---
*This project focuses exclusively on the MCP interface. For Planka server setup, refer to the [official Planka documentation](https://docs.planka.app).*