# 🛠️ Installation Guide

This guide will walk you through the process of installing and configuring Kanban MCP.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- 🐳 [Docker](https://www.docker.com/get-started) for running Planka and the MCP server
- 🔄 [Git](https://git-scm.com/downloads) for cloning the repository
- 🟢 [Node.js](https://nodejs.org/) (version 18 or above) and npm for development

## 📥 Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/bradrisse/kanban-mcp.git
cd kanban-mcp
```

### 2. Configure Environment Variables

The default configuration is in the `.env` file. You can modify any values as needed:

```
PLANKA_PORT=3333
BASE_URL=http://localhost:3333
TRUST_PROXY=1
SECRET_KEY=secretkey

# Admin User
PLANKA_ADMIN_EMAIL=demo@demo.demo
PLANKA_ADMIN_PASSWORD=demo
PLANKA_ADMIN_NAME=Demo User
PLANKA_ADMIN_USERNAME=demo

# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=planka

# MCP-Kanban Configuration
MCP_KANBAN_PORT=3008
PLANKA_BASE_URL=http://planka:${PLANKA_PORT}
PLANKA_AGENT_EMAIL=${PLANKA_ADMIN_EMAIL}
PLANKA_AGENT_PASSWORD=${PLANKA_ADMIN_PASSWORD}
```

### 3. Build and Start the Services

Build the MCP Kanban server and start Planka:

```bash
# Build the TypeScript code and create a Docker image
npm run build-docker

# Start the Planka containers (kanban and postgres)
npm run up
```

### 4. Access the Planka Kanban Board

Once the containers are running, you can access the Planka board at:

```
http://localhost:3333
```

Use the default credentials to log in:
- Email: demo@demo.demo
- Password: demo

## 🔍 Detailed Planka Setup

After starting the Planka Docker containers, you need to perform several additional setup steps:

### 1. Initial Login and Project Creation

1. Access the Planka web interface at http://localhost:3333
2. Log in with the admin credentials
3. Create a new project:
   - Click the "+" button
   - Enter a project name (e.g., "My Project")
   - Click "Create"

### 2. Creating the Agent User

The MCP Kanban server needs a dedicated user account to interact with Planka:

1. While logged in as admin, click on users icon in the top right
2. Click the "Add user" button
3. Fill in the agent user details:
   - Name: `Kanban Agent` (or any descriptive name)
   - Username: `kanban-agent` (or any unique username)
   - Email: `claude-kanban-mcp@cursor.com` (or your preferred agent email)
   - Password: `supersupersecre` (or a secure password)
4. Click "Add" to create the agent user
5. Make note of the agent's username, email, and password as you'll need them for MCP configuration

### 3. Adding the Agent User to Your Project

The agent user needs access to your project to manage cards and tasks:

1. Go back to your project board
2. Click on the project name in the top-left corner
3. Click on the "Managers" tab
4. Click the add user icon
5. Search for the agent user by username or email
6. Select the agent user

## ⚙️ Configuring LLM Access

### Using Cursor

To use the MCP Kanban server with Cursor, you need to add it as an MCP server in Cursor's settings:

1. In Cursor, go to `Cursor Settings` > `Features` > `MCP` and click on the `+ Add New MCP Server` button.
2. Fill out the form:
   - Name: Enter a nickname for the server (e.g., "Kanban MCP")
   - Type: Select "stdio" as the transport
   - Command: Enter the command to run the Docker container:
     ```
     docker run -i --rm -e PLANKA_BASE_URL=http://host.docker.internal:3333 -e PLANKA_AGENT_EMAIL=claude-kanban-mcp@cursor.com -e PLANKA_AGENT_PASSWORD=supersupersecre mcp-kanban:latest
     ```
3. Click "Add" to save the MCP server configuration.

### Project-specific MCP Configuration

Alternatively, you can configure the MCP server for a specific project using `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "kanban": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "PLANKA_BASE_URL=http://host.docker.internal:3333",
        "-e",
        "PLANKA_AGENT_EMAIL=claude-kanban-mcp@cursor.com",
        "-e",
        "PLANKA_AGENT_PASSWORD=supersupersecre",
        "mcp-kanban:latest"
      ]
    }
  }
}
```

### ⚠️ Important Configuration Notes

When configuring the Docker command:

1. 🔗 Use `host.docker.internal` instead of `localhost` to access the host from within the container
   - This is critical for Docker containers to reach services on your host machine
   - `localhost` within the container refers to the container itself, not your host machine

2. 🔑 Explicitly set environment variables with their full values in Docker args
   - Don't use variable references like `${VARIABLE}`
   - Always provide the complete values directly

3. 🔒 Ensure both email and password environment variables are correctly set
   - Authentication requires both credentials to be properly configured
   - Check for typos in both the email and password

4. 📋 Use the correct port in `PLANKA_BASE_URL` (matching your .env file)
   - Default is usually 3333, but confirm in your configuration

5. 🏷️ Use the correct image tag (typically `latest` or matching your package.json version)

## 📜 Configuring Rules for LLMs

To help LLMs understand how to use the MCP Kanban server effectively, create a `.cursorrules` file in your project root by copying the rules from the provided `EXAMPLE_RULE.md` file.

## ✅ Verifying the Setup

To verify that the MCP Kanban server can connect to Planka with the agent credentials:

1. Restart MCP to apply the MCP configuration changes
2. Open a new chat with Claude in Cursor
3. Ask Claude to list the available projects using the MCP Kanban tools
4. Claude should be able to retrieve and display your project information

## ❓ Troubleshooting

If you encounter issues during installation, please refer to the [Troubleshooting](Troubleshooting) page. 