# MCP Kanban

A Model Context Protocol (MCP) server for interacting with Planka Kanban boards through AI assistants like Claude.

## Overview

MCP Kanban is a specialized middleware designed to facilitate interaction between Large Language Models (LLMs) and [Planka](https://planka.app/), a Kanban board application. It serves as an intermediary layer that provides LLMs with a simplified and enhanced API to interact with Planka's task management system.

### Key Features

- **LLM-Optimized API**: Higher-level functions that combine related operations and add context awareness
- **Task-Oriented Development**: Structured workflow support (Backlog → In Progress → Testing → Done)
- **Context Retention**: Maintains state between interactions, allowing LLMs to pick up where they left off
- **Comprehensive Management**: Full access to projects, boards, lists, cards, tasks, comments, and labels

## Quick Start

### Prerequisites

- Docker installed on your system
- Git (to clone this repository)

### Installation

1. Clone this repository:
```bash
git clone https://github.com/bradrisse/kanban-mcp.git
cd kanban-mcp
```

2. Build and start the services:
```bash
# Build the TypeScript code and create a Docker image
npm run build-docker

# Start only the Planka containers (kanban and postgres)
npm run up
```

3. Access the Planka Kanban board:
   - Default URL: http://localhost:3333
   - Default credentials: 
     - Email: demo@demo.demo
     - Password: demo

4. Configure Cursor to use the MCP server:
   - In Cursor, go to Settings > Features > MCP
   - Add a new MCP server with the following configuration:
   ```json
   {
     "mcpServers": {
       "kanban": {
         "command": "docker",
         "args": [
           "run", "-i", "--rm",
           "-e", "PLANKA_BASE_URL=http://host.docker.internal:3333",
           "-e", "PLANKA_AGENT_EMAIL=claude-kanban-mcp@cursor.com",
           "-e", "PLANKA_AGENT_PASSWORD=supersupersecre",
           "mcp-kanban:latest"
         ]
       }
     }
   }
   ```

## Documentation

For detailed documentation, please visit our [Wiki](https://github.com/bradrisse/kanban-mcp/wiki):

- [Installation Guide](https://github.com/bradrisse/kanban-mcp/wiki/Installation-Guide) - Detailed setup instructions
- [Usage Guide](https://github.com/bradrisse/kanban-mcp/wiki/Usage-Guide) - How to use Kanban MCP with Claude
- [Capabilities and Strategies](https://github.com/bradrisse/kanban-mcp/wiki/Capabilities-and-Strategies) - MCP server capabilities and LLM interaction strategies
- [API Reference](https://github.com/bradrisse/kanban-mcp/wiki/API-Reference) - Detailed documentation of all MCP commands
- [Developer Guide](https://github.com/bradrisse/kanban-mcp/wiki/Developer-Guide) - Information for contributors
- [Troubleshooting](https://github.com/bradrisse/kanban-mcp/wiki/Troubleshooting) - Solutions to common issues

## LLM Interaction Strategies

MCP Kanban supports several workflow strategies for LLM-human collaboration:

1. **LLM-Driven Development with Human Review**: LLMs implement tasks while humans review and provide feedback
2. **Human-Driven Development with LLM Support**: Humans implement while LLMs provide analysis and recommendations
3. **Collaborative Grooming and Planning**: Humans and LLMs work together to plan and organize tasks

For more details on these strategies, see the [Capabilities and Strategies](https://github.com/bradrisse/kanban-mcp/wiki/Capabilities-and-Strategies) wiki page.

## Available npm Scripts

- `npm run build`: Build the TypeScript code
- `npm run build-docker`: Build the TypeScript code and create a Docker image
- `npm run up`: Start the Planka containers (kanban and postgres)
- `npm run down`: Stop all containers
- `npm run restart`: Restart the Planka containers

## License

MIT

## Support

If you need help with Kanban MCP:

1. Check the [Troubleshooting](https://github.com/bradrisse/kanban-mcp/wiki/Troubleshooting) page
2. Search the [GitHub issues](https://github.com/bradrisse/kanban-mcp/issues)
3. Open a new issue if you can't find a solution 