# 🛠️ Installation Guide (MCP Only)

This guide walks you through the process of installing and configuring the **Kanban MCP** server to connect to an existing **Planka v2.x** instance.

## 📋 Prerequisites

- 🟢 [Node.js](https://nodejs.org/) (version 18 or above) and npm.
- A functional **Planka v2.x** instance reachable via network.
- Credentials for a Planka agent user (Email and Password).

## 📥 Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/Navya-Tecnologia/planka-v2-mcp.git
cd kanban-mcp
```

### 2. Install Dependencies and Build
```bash
npm install
npm run build
```

### 3. Configure Cursor (Connect to Planka v2.x)

In Cursor, go to `Cursor Settings` > `Features` > `MCP` and add a new MCP Server:
- **Name**: `Kanban MCP`
- **Type**: `stdio`
- **Command**:
  ```bash
  node /absolute/path/to/kanban-mcp/dist/index.js
  ```
- **Environment Variables**:
  - `PLANKA_BASE_URL`: `http://your-planka-instance:3333`
  - `PLANKA_AGENT_EMAIL`: `agent@yourdomain.com`
  - `PLANKA_AGENT_PASSWORD`: `your-secure-password`

## 🔐 Planka Setup Requirements

The MCP requires an agent user in your Planka instance:
1. **Create User**: In your Planka instance, create a dedicated user for the MCP (e.g., `Kanban Agent`).
2. **Project Access**: Add the agent user to the project(s) you want it to manage as a **Manager**.
3. **Task Lists**: Since Planka v2.x uses Task Lists, the MCP will automatically create a default "Tasks" list if one doesn't exist when creating tasks via `cardId`.

## ✅ Verifying the Setup

1. Restart the MCP server in Cursor.
2. Ask Claude: "List my projects in Planka."
3. Claude should respond with the projects available to the agent.

---
*For Planka v2.0 server installation, please refer to the [official Planka documentation](https://docs.planka.app).*