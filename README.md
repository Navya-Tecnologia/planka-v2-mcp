# 📋 Planka Kanban MCP Server (v2.x)

[![npm version](https://img.shields.io/npm/v/@navyatec/planka-v2-mcp.svg?color=blue)](https://www.npmjs.com/package/@navyatec/planka-v2-mcp)
[![CI Tests and Build](https://github.com/Navya-Tecnologia/planka-v2-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Navya-Tecnologia/planka-v2-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io-blue.svg)](https://github.com/Navya-Tecnologia/planka-v2-mcp/pkgs/container/planka-v2-mcp)

A production-ready [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that enables AI coding assistants and autonomous agents (such as **Claude**, **Cursor**, and **Antigravity**) to interact seamlessly with **Planka v2.x** kanban boards.

Supports both **Local CLI (Stdio)** and **Remote HTTP Server-Sent Events (SSE)** with **Multi-Tenant User Isolation**.

---

## ✨ Key Features

- **🌐 Dual Transport Architecture**: Run locally via `stdio` (for desktop apps like Cursor and Claude Desktop) or as a high-performance HTTP service via `sse` (for web, cloud agents, and centralized microservices).
- **👥 Multi-Tenant Per-Call Credentials**: In HTTP SSE mode, each user can pass their own Planka credentials upon connecting. Actions, cards, comments, and task completions are attributed to each respective user in Planka.
- **📂 Task List Hierarchy (Planka v2.x)**: Native support for Task Lists as parent containers inside cards.
- **⚡ Automated Card Workflows**: Built-in `workflow_action` on `mcp_kanban_card_manager` allowing single-call state transitions (`start_working`, `mark_completed`, `move_to_testing`, `move_to_done`) with automatic comments and task resolution.
- **⏱️ Time Tracking (Stopwatch)**: Start, stop, reset, and query card stopwatches directly recorded in Planka.
- **👤 Smart Membership Resolution**: Assign users by `email` or `username` without looking up their internal user ID beforehand.
- **🗂️ Consolidated Manager Tools**: Tools are grouped into logical managers to respect LLM tool limits (Cursor's 40-tool ceiling) while exposing complete API functionality.
- **🐳 Docker & GHCR Ready**: Containerized multi-stage image published automatically to GitHub Container Registry (`ghcr.io`).
- **🛡️ Enterprise Security**: Path traversal protection, SSRF guards, ID sanitization, transparent token renewal on 401, and optional Bearer token gateway security (`MCP_API_KEY`).

---

## 🛠️ MCP Tools Overview

All operations are grouped into **8 consolidated Manager Tools**:

| Tool Name | Key Actions | Description |
|---|---|---|
| `mcp_kanban_project_board_manager` | `get_projects`, `create_project`, `get_boards`, `create_board`, `get_board_summary`, `get_project_summary` | Manage projects and boards with aggregated stats. |
| `mcp_kanban_card_manager` | `get_all`, `create`, `update`, `move`, `duplicate`, `delete`, `workflow_action` | Manage cards and automate workflow status progressions. |
| `mcp_kanban_stopwatch` | `start`, `stop`, `get`, `reset` | Track and log work time on cards. |
| `mcp_kanban_task_list_manager` | `get_all`, `create`, `get_one`, `update`, `delete` | Manage Planka v2.0 Task List containers inside cards. |
| `mcp_kanban_task_manager` | `get_all`, `create`, `batch_create`, `update`, `complete_task`, `delete` | Manage checklists and tasks within task lists. |
| `mcp_kanban_comment_manager` | `get_all`, `create`, `update`, `delete` | Post audit comments and discussions on cards. |
| `mcp_kanban_label_manager` | `get_all`, `create`, `update`, `delete`, `add_to_card`, `remove_from_card` | Manage boards' label taxonomies with 10+ standard Planka colors. |
| `mcp_kanban_card_membership_manager` | `get_all`, `create`, `delete`, `get_users` | Assign and unassign members with email/username auto-resolution. |

---

## 🚀 Getting Started

### 1. Prerequisites
- A running **Planka v2.x** instance accessible over network.
- A user account or service bot account in Planka.

---

### 2. Local Mode: Stdio (Cursor, Claude Desktop, Antigravity)

In local mode, the MCP server connects via standard input/output (`stdio`).

#### Configuration with `npx` (Recommended)
Add the server definition to your client's config file (e.g., `claude_desktop_config.json` or Cursor Settings):

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
        "PLANKA_IGNORE_SSL": "false"
      }
    }
  }
}
```

#### Local Source Setup
```json
{
  "mcpServers": {
    "planka-mcp": {
      "command": "node",
      "args": ["/path/to/kanban-mcp/dist/index.js"],
      "env": {
        "PLANKA_BASE_URL": "https://your-planka-instance.com",
        "PLANKA_AGENT_EMAIL": "agent@yourdomain.com",
        "PLANKA_AGENT_PASSWORD": "your-secure-password"
      }
    }
  }
}
```

---

### 3. Remote Mode: HTTP Server-Sent Events (SSE)

Run the server as a centralized HTTP daemon to serve remote agents, cloud platforms, or multiple concurrent developers.

#### Launching the SSE Server
```bash
# Start directly via npx
npx -y @navyatec/planka-v2-mcp --transport sse --port 3000

# Or using environment variables
export MCP_TRANSPORT=sse
export PORT=3000
export MCP_API_KEY=my-secret-gateway-key # (Optional) Requires Bearer token to access MCP
node dist/index.js
```

#### 👥 Multi-Tenant Per-Call Credentials
When running in SSE mode, you **do not** need to store user credentials in the server's `.env`. Instead, each client sends their own credentials during the SSE connection handshake.

**Option A: Via HTTP Headers (`GET /sse`)**
```http
GET /sse HTTP/1.1
Host: your-mcp-server:3000
X-Planka-Email: developer@yourdomain.com
X-Planka-Password: secretPassword
X-Planka-Base-Url: https://planka.yourdomain.com
```
*(Supports standard `Authorization: Basic <base64(email:password)>` as well).*

**Option B: Via URL Query Parameters (`GET /sse`)**
*(Ideal for browser clients and standard EventSource)*
```text
http://your-mcp-server:3000/sse?email=developer@yourdomain.com&password=secretPassword&baseUrl=https://planka.yourdomain.com
```

#### Endpoints
- `GET /sse`: Establishes the persistent SSE stream and initializes user session.
- `POST /messages?sessionId=...`: Receives client JSON-RPC tool calls.
- `GET /health`: Healthcheck endpoint (`200 OK`).

---

### 4. Running with Docker & GHCR

The container image is published to **GitHub Container Registry (GHCR)**:

```bash
# Multi-user mode (credentials supplied dynamically by connecting clients)
docker run -d -p 3000:3000 \
  -e PLANKA_BASE_URL="http://your-planka-instance:3333" \
  -e MCP_API_KEY="optional-gateway-bearer-token" \
  ghcr.io/navya-tecnologia/planka-v2-mcp:latest

# Or single-user mode (fallback credentials in container)
docker run -d -p 3000:3000 \
  -e PLANKA_BASE_URL="http://your-planka-instance:3333" \
  -e PLANKA_AGENT_EMAIL="bot@yourdomain.com" \
  -e PLANKA_AGENT_PASSWORD="botPassword" \
  ghcr.io/navya-tecnologia/planka-v2-mcp:latest
```

---

## 💬 Example AI Prompts

Once configured, you can command your AI assistant in natural language:

- *"Show me a summary of all projects and boards."*
- *"Groom the Backlog board and break down the top card into tasks."*
- *"Move card 'Implement OAuth' to 'In Progress' and add a comment that work has started."*
- *"Create a 'Database' Task List in the 'Migration' card and add 3 checklist items."*
- *"Start the stopwatch on card 'Refactor API client'."*
- *"Assign @sarah.connor to card 'Security Audit'."*

---

## 📖 Wiki & Documentation

- **[API Reference](./wiki/API-Reference.md)**: Detailed schema and actions for each tool.
- **[Developer Guide](./wiki/Developer-Guide.md)**: Architecture, local setup, and contribution guidelines.
- **[Capabilities & Strategies](./wiki/Capabilities-and-Strategies.md)**: Design rationale and Cursor optimization patterns.
- **[Usage Guide](./wiki/Usage-Guide.md)**: Practical workflows and scenario walkthroughs.
- **[Installation Guide](./wiki/Installation-Guide.md)**: Step-by-step setup on various platforms.

---

## 🏗️ Development & Testing

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run unit tests (offline in-memory suite with 37 tests)
npm test

# Run quality checks (build + test)
npm run qc

# Run integration tests (requires running Planka server)
npm run test:integration
```

### 🚀 Automated Releases
Releases are automated using **GitHub Actions**. Pushing a semantic git tag (e.g. `v1.4.0`) triggers:
1. Automated unit test suite and compilation.
2. NPM package publication ([`@navyatec/planka-v2-mcp`](https://www.npmjs.com/package/@navyatec/planka-v2-mcp)).
3. Multi-stage Docker image build and push to [GitHub Container Registry (GHCR)](https://github.com/Navya-Tecnologia/planka-v2-mcp/pkgs/container/planka-v2-mcp).
4. GitHub Release creation with release notes and production tarball attached.

---

## 📄 License
This project is licensed under the [MIT License](./LICENSE).

*Developed and maintained by [NAVYA TECNOLOGÍA 2024, S.L.](https://www.navyatec.es)*
*(Original project by Brad Risse)*