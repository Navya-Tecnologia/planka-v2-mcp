# MCP Kanban

A Model Context Protocol (MCP) server for interacting with Planka Kanban boards.

## What is MCP Kanban?

MCP Kanban is a specialized middleware designed to facilitate interaction between Large Language Models (LLMs) and Planka, a Kanban board application. It serves as an intermediary layer that provides LLMs with a simplified and enhanced API to interact with Planka's task management system.

### Purpose

The primary purpose of the MCP Server is to enable LLMs to:

1. **Access Kanban Data**: Retrieve projects, boards, lists, cards, tasks, comments, and labels from Planka
2. **Manage Workflow**: Move cards between lists (Backlog → In Progress → Testing → Done)
3. **Track Tasks**: Create, update, and complete tasks within cards
4. **Communicate Progress**: Add comments and labels to cards to document progress and status
5. **Follow Task-Oriented Development**: Support a structured approach to software development using Kanban methodology

### How It Works

The MCP Server wraps the Planka API with specialized functions that are optimized for LLM interaction. Rather than requiring the LLM to make multiple low-level API calls, the MCP Server provides higher-level functions that combine related operations and add context awareness.

This enables LLMs to:
- Identify the next card to work on from the Backlog
- Move it to In Progress
- Implement the required tasks one by one
- Add comments to document progress
- Move the card to Testing when complete
- Process human feedback from Testing
- Either address feedback or move the card to Done

This structured approach ensures that the LLM can effectively manage software development tasks while maintaining clear communication with human team members through the Kanban board.

## Quick Start with Docker Compose

The easiest way to get started is using Docker Compose, which will set up:
1. Planka Kanban board
2. PostgreSQL database
3. MCP Kanban server

### Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone this repository)

### Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/bradrisse/mcp-kanban.git
   cd mcp-kanban
   ```

2. Configure environment variables (optional):
   - The default configuration is in the `.env` file
   - Modify any values as needed (ports, credentials, etc.)

3. Start the services:
   ```bash
   docker-compose up -d
   ```

4. Access the services:
   - Planka Kanban board: http://localhost:3000
   - MCP Kanban server: http://localhost:3008

### Default Credentials

- **Planka Admin User**:
  - Email: demo@demo.demo
  - Password: demo
  - Name: Demo User

### Environment Variables

You can customize the setup by modifying the `.env` file:

#### Planka Configuration
- `PLANKA_PORT`: Port for the Planka web interface (default: 3000)
- `BASE_URL`: Public URL for Planka (default: http://localhost:3000)
- `TRUST_PROXY`: Whether to trust proxy headers (default: 1)
- `SECRET_KEY`: Secret key for session encryption (default: secretkey)

#### Admin User
- `ADMIN_EMAIL`: Email for the admin user (default: demo@demo.demo)
- `ADMIN_PASSWORD`: Password for the admin user (default: demo)
- `ADMIN_NAME`: Name for the admin user (default: Demo User)

#### PostgreSQL Configuration
- `POSTGRES_USER`: PostgreSQL username (default: postgres)
- `POSTGRES_PASSWORD`: PostgreSQL password (default: postgres)
- `POSTGRES_DB`: PostgreSQL database name (default: planka)

#### MCP-Kanban Configuration
- `MCP_KANBAN_PORT`: Port for the MCP Kanban server (default: 3008)
- `PLANKA_BASE_URL`: URL for the Planka API (default: http://planka:3000)
- `PLANKA_AGENT_EMAIL`: Email for the Planka agent (default: same as admin)
- `PLANKA_AGENT_PASSWORD`: Password for the Planka agent (default: same as admin)

## Development

### Running Locally

To run the services locally without Docker:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Start the MCP server:
   ```bash
   SERVER_PORT=3008 PLANKA_BASE_URL=http://localhost:3000 PLANKA_AGENT_EMAIL=demo@demo.demo PLANKA_AGENT_PASSWORD=demo node dist/index.js
   ```

### Using the Inspector

For development and testing, you can use the MCP Inspector:

```bash
npm run inspector:demo
```

## Docker Notes

When using Docker, keep these points in mind:

1. Use `host.docker.internal` instead of `localhost` to access host services
2. Environment variables must be explicitly set in the Docker command args with values
3. The MCP server needs to be rebuilt after TypeScript changes
4. For attachments, mount a volume to `/app/attachments` in your Docker container

## Running Planka

This project includes a Dockerfile for running Planka, the Kanban board application that MCP Kanban interacts with.

### Using the Planka Dockerfile

To build and run Planka using the provided Dockerfile:

```bash
# Build the Planka Docker image
npm run planka:build

# Run the Planka container
npm run planka:run
```

This will start Planka on port 3000. You can then access it at http://localhost:3000.

Default credentials:
- Email: demo@demo.demo
- Password: demo

To stop the Planka container:

```bash
npm run planka:stop
```

## Development Methodology

This project includes a guide for implementing a task-oriented Kanban development approach. This methodology is designed to help teams effectively use Kanban boards for structured software development, with or without LLM assistance.

See [KANBAN_DEVELOPMENT_GUIDE.md](./KANBAN_DEVELOPMENT_GUIDE.md) for detailed instructions on implementing this approach in your development workflow.

## License

MIT
