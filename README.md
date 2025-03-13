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

## Quick Start

The setup process involves two main components:
1. Planka Kanban board (with PostgreSQL database)
2. MCP Kanban server

### Prerequisites

- Docker installed on your system
- Git (to clone this repository)
- Node.js and npm (for development)

### Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/bradrisse/mcp-kanban.git
   cd mcp-kanban
   ```

2. Configure environment variables (optional):
   - The default configuration is in the `.env` file
   - Modify any values as needed (ports, credentials, etc.)

3. Build the MCP Kanban server and start Planka:
   ```bash
   # Build the TypeScript code and create a Docker image
   npm run build-docker
   
   # Start only the Planka containers (kanban and postgres)
   npm run up
   ```

4. Access the Planka Kanban board:
   - Default URL: http://localhost:3333 (or the port specified in your .env file)

### Default Credentials

- **Planka Admin User**:
  - Email: demo@demo.demo
  - Password: demo
  - Name: Demo User

### Environment Variables

You can customize the setup by modifying the `.env` file:

#### Planka Configuration
- `PLANKA_PORT`: Port for the Planka web interface (default: 3333)
- `BASE_URL`: Public URL for Planka (default: http://localhost:3333)
- `TRUST_PROXY`: Whether to trust proxy headers (default: 1)
- `SECRET_KEY`: Secret key for session encryption (default: secretkey)

#### Admin User
- `PLANKA_ADMIN_EMAIL`: Email for the admin user (default: demo@demo.demo)
- `PLANKA_ADMIN_PASSWORD`: Password for the admin user (default: demo)
- `PLANKA_ADMIN_NAME`: Name for the admin user (default: Demo User)
- `PLANKA_ADMIN_USERNAME`: Username for the admin user (default: demo)

#### PostgreSQL Configuration
- `POSTGRES_USER`: PostgreSQL username (default: postgres)
- `POSTGRES_PASSWORD`: PostgreSQL password (default: postgres)
- `POSTGRES_DB`: PostgreSQL database name (default: planka)

#### MCP-Kanban Configuration
- `MCP_KANBAN_PORT`: Port for the MCP Kanban server (default: 3008)
- `PLANKA_BASE_URL`: URL for the Planka API (default: http://planka:${PLANKA_PORT})
- `PLANKA_AGENT_EMAIL`: Email for the Planka agent (default: same as admin)
- `PLANKA_AGENT_PASSWORD`: Password for the Planka agent (default: same as admin)

## Detailed Planka Setup Guide

After starting the Planka Docker containers, you need to perform several additional setup steps to ensure the MCP Kanban server can interact with your Planka board properly.

### 1. Initial Login and Project Creation

1. Access the Planka web interface at http://localhost:3333 (or your configured port)
2. Log in with the admin credentials:
   - Email: `demo@demo.demo` (or your configured admin email)
   - Password: `demo` (or your configured admin password)
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
5. **Important**: Make note of the agent's username, email, and password as you'll need them for MCP configuration

### 3. Adding the Agent User to Your Project

The agent user needs access to your project to manage cards and tasks:

1. Go back to your project board
2. Click on the project name in the top-left corner
4. Click on the "Managers" tab
5. Click the add user icon
6. Search for the agent user by username or email
7. Select the agent user

### 4. Updating MCP Configuration

Now that you have created the agent user, update your MCP configuration to use the agent credentials:

1. Edit your `.cursor/mcp.json` file to include the correct agent credentials:

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
        "PLANKA_ADMIN_EMAIL=demo@demo.demo",
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

Make sure to:
- Use the correct Planka port in `PLANKA_BASE_URL` (matching your `.env` file)
- Use the admin email used in .env or whatever was created
- Use the agent email and password you created in step 2
- Use `host.docker.internal` instead of `localhost` to access the host from within the container

### 6. Testing the MCP Connection

To verify that the MCP Kanban server can connect to Planka with the agent credentials:

1. Restart MCP to apply the MCP configuration changes by enabling or disabling then enabling
2. Open a new chat with Claude in Cursor
3. Ask Claude to list the available projects using the MCP Kanban tools
4. Claude should be able to retrieve and display your project information

The MCP Kanban server is now set up to help Claude interact with your Planka board, following the task-oriented development workflow described in the `.cursorrules` file.

## Running the MCP Server with Cursor

To use the MCP Kanban server with Cursor, you need to add it as an MCP server in Cursor's settings:

1. First, build the MCP Kanban server:
   ```bash
   npm run build-docker
   ```

2. In Cursor, go to `Cursor Settings` > `Features` > `MCP` and click on the `+ Add New MCP Server` button.

3. Fill out the form:
   - **Name**: Enter a nickname for the server (e.g., "Kanban MCP")
   - **Type**: Select "stdio" as the transport
   - **Command**: Enter the command to run the Docker container:
     ```
     docker run -i --rm -e PLANKA_BASE_URL=http://host.docker.internal:3333 -e PLANKA_AGENT_EMAIL=claude-kanban-mcp@cursor.com -e PLANKA_AGENT_PASSWORD=supersupersecre mcp-kanban:latest
     ```
     
     Note: The system will automatically look up the admin user ID using the `PLANKA_ADMIN_EMAIL` or `PLANKA_ADMIN_USERNAME` environment variables defined in your `.env` file.

4. Click "Add" to save the MCP server configuration.

5. The server should appear in the list of MCP servers. You may need to press the refresh button in the top right corner of the MCP server entry to populate the tool list.

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

Note: The system will automatically look up the admin user ID using the `PLANKA_ADMIN_EMAIL` or `PLANKA_ADMIN_USERNAME` environment variables that are defined in your `.env` file.

### Configuring Rules for LLMs

To help LLMs understand how to use the MCP Kanban server effectively, create a `.cursorrules` file in your project root by copying the rules from the provided `EXAMPLE_RULE.md` file:

The rules in `EXAMPLE_RULE.md` include guidelines for:
- Checking the board state before starting work
- Following the Kanban workflow (Backlog → In Progress → Testing → Done)
- Completing tasks sequentially within cards
- Documenting progress with comments
- Handling testing and feedback

These rules guide the LLM in using the MCP Kanban tools according to the task-oriented development methodology.

### Important Configuration Notes

When configuring the Docker command:

1. Use the correct port in `PLANKA_BASE_URL` (matching your .env file)
2. Use `host.docker.internal` instead of `localhost` to access the host from within the container
3. Provide the correct admin credentials
4. Use the correct image tag (typically `latest` or matching your package.json version)

## Available npm Scripts

- `npm run build`: Build the TypeScript code
- `npm run build-docker`: Build the TypeScript code and create a Docker image
- `npm run up`: Start the Planka containers (kanban and postgres)
- `npm run down`: Stop all containers
- `npm run restart`: Restart the Planka containers
- `npm run inspector`: Run the MCP Inspector for local development
- `npm run inspector:demo`: Run the MCP Inspector with demo credentials

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
   SERVER_PORT=3008 PLANKA_BASE_URL=http://localhost:3333 PLANKA_AGENT_EMAIL=demo@demo.demo PLANKA_AGENT_PASSWORD=demo node dist/index.js
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

## Development Methodology

This project includes a guide for implementing a task-oriented Kanban development approach. This methodology is designed to help teams effectively use Kanban boards for structured software development, with or without LLM assistance.

## License

MIT

## Developer Workflows with MCP Kanban

The MCP Kanban server enables powerful collaboration patterns between developers and LLMs. This section outlines several effective workflows that leverage the strengths of both human developers and AI assistants.

### LLM-Driven Development with Human Review

In this workflow, the LLM handles most of the implementation work while humans focus on review and direction:

1. **Human**: Creates high-level cards in the Backlog with basic requirements
2. **LLM**: 
   - Grooms the cards by breaking them down into specific tasks
   - Moves cards to In Progress and implements the tasks
   - Documents progress with detailed comments
   - Moves completed cards to Testing
3. **Human**: 
   - Reviews the implementation in Testing
   - Provides feedback as comments
   - Approves or requests changes
4. **LLM**: 
   - Addresses feedback by moving cards back to In Progress if needed
   - Implements requested changes
   - Moves cards to Done when approved

**Benefits**: Maximizes developer productivity by offloading implementation details to the LLM while maintaining human oversight for quality control.

### Human-Driven Development with LLM Support

In this workflow, humans handle the core implementation while the LLM provides support:

1. **LLM**: 
   - Grooms the Backlog by analyzing requirements and breaking them into tasks
   - Provides technical recommendations and implementation approaches
2. **Human**: 
   - Selects cards to work on and moves them to In Progress
   - Implements the tasks
   - Moves completed cards to Testing
3. **LLM**: 
   - Reviews the implementation
   - Provides feedback on code quality, potential issues, and improvements
   - Documents the review as comments
4. **Human**: 
   - Addresses feedback
   - Moves cards to Done when complete

**Benefits**: Leverages the LLM's ability to analyze requirements and review code while keeping humans in control of the implementation.

### Collaborative Grooming and Planning

In this workflow, humans and LLMs collaborate on planning and organizing work:

1. **Human**: Creates basic card ideas in the Backlog
2. **LLM**: 
   - Analyzes the codebase to provide context
   - Breaks down cards into specific tasks
   - Identifies dependencies and potential challenges
   - Suggests implementation approaches
3. **Human**: 
   - Reviews and refines the groomed cards
   - Prioritizes the Backlog
   - Assigns cards to team members or the LLM
4. **Both**: Implement cards according to their assigned responsibilities

**Benefits**: Improves planning quality by combining human domain knowledge with the LLM's ability to analyze the codebase and identify implementation details.

### Context Retention Across Sessions

One of the key advantages of using MCP Kanban with LLMs is context retention across different chat sessions:

1. **Card State**: The LLM can retrieve the current state of any card, including its description, tasks, comments, and history
2. **Work Continuity**: Even if a developer starts a new chat session, the LLM can pick up exactly where it left off by checking the Kanban board
3. **Knowledge Transfer**: New team members can quickly get up to speed by having the LLM explain the current state of the project based on the Kanban board
4. **Documentation**: The Kanban board serves as living documentation of the project's progress and decisions

### Task-Focused Development

The MCP Kanban system helps keep both humans and LLMs focused on specific tasks:

1. **Clear Priorities**: The Kanban board makes it clear which tasks are highest priority
2. **Structured Workflow**: The board enforces a consistent process from Backlog to Done
3. **Progress Tracking**: Time tracking and task completion provide visibility into progress
4. **Reduced Context Switching**: By focusing on one card at a time, both humans and LLMs can maintain focus and productivity

### Implementation Guidelines

To get the most out of these workflows:

1. **Be Specific in Card Creation**: Provide clear requirements and context when creating cards
2. **Use Labels Effectively**: Apply labels to indicate priority, type, and status
3. **Document Decisions**: Use comments to document important decisions and rationales
4. **Break Down Work**: Create small, focused cards rather than large, complex ones
5. **Provide Feedback**: Give specific, actionable feedback when reviewing LLM work
6. **Maintain the Board**: Regularly groom the Backlog and move cards through the workflow

By following these guidelines and selecting the workflow that best fits your team's needs, you can effectively leverage the MCP Kanban system to enhance collaboration between human developers and LLMs.
