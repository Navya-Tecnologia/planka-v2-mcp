import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { z } from "zod";

// Import Planka operations
import * as projects from "./operations/projects.js";
import * as boards from "./operations/boards.js";
import * as lists from "./operations/lists.js";
import * as cards from "./operations/cards.js";
import * as labels from "./operations/labels.js";
import * as tasks from "./operations/tasks.js";
import * as comments from "./operations/comments.js";
import * as boardMemberships from "./operations/boardMemberships.js";

// Import custom tools
import {
  createCardWithTasks,
  createCardWithTasksSchema,
  getBoardSummary,
  getBoardSummarySchema,
  getCardDetails,
  getCardDetailsSchema,
} from "./tools/index.js";

import { VERSION } from "./common/version.js";

const server = new McpServer(
  {
    name: "planka-mcp-server",
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Planka operations
server.tool(
  "get_projects",
  "Get all projects from Planka with pagination support",
  {
    page: z.number().describe("The page number to retrieve (1-indexed)"),
    perPage: z.number().describe("The number of projects to retrieve per page"),
  },
  async (args) => {
    const result = await projects.getProjects(args.page, args.perPage);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "get_project",
  "Get a specific project by ID",
  {
    id: z.string().describe("The ID of the project to retrieve"),
  },
  async (args) => {
    const result = await projects.getProject(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "get_boards",
  "Get all boards for a specific project",
  {
    projectId: z.string().describe("The ID of the project to get boards for"),
  },
  async (args) => {
    const result = await boards.getBoards(args.projectId);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "create_board",
  "Create a new board in a project",
  {
    projectId: z.string().describe(
      "The ID of the project to create the board in",
    ),
    name: z.string().describe("The name of the new board"),
    position: z.number().describe("The position of the board in the project"),
  },
  async (args) => {
    const result = await boards.createBoard(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "get_board",
  "Get a specific board by ID",
  {
    id: z.string().describe("The ID of the board to retrieve"),
  },
  async (args) => {
    const result = await boards.getBoard(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "update_board",
  "Update a board's properties",
  {
    id: z.string().describe("The ID of the board to update"),
    name: z.string().describe("The new name for the board"),
    type: z.string().describe("The type of the board"),
    position: z.number().describe("The new position for the board"),
  },
  async (args) => {
    const { id, ...options } = args;
    const result = await boards.updateBoard(id, options);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "delete_board",
  "Delete a board by ID",
  {
    id: z.string().describe("The ID of the board to delete"),
  },
  async (args) => {
    const result = await boards.deleteBoard(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

// Lists operations
server.tool(
  "get_lists",
  "Get all lists for a specific board",
  {
    boardId: z.string().describe("The ID of the board to get lists for"),
  },
  async (args) => {
    const result = await lists.getLists(args.boardId);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "create_list",
  "Create a new list in a board",
  {
    boardId: z.string().describe("The ID of the board to create the list in"),
    name: z.string().describe("The name of the new list"),
    position: z.number().describe("The position of the list in the board"),
  },
  async (args) => {
    const result = await lists.createList(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "update_list",
  "Update a list's properties",
  {
    id: z.string().describe("The ID of the list to update"),
    name: z.string().describe("The new name for the list"),
    position: z.number().describe("The new position for the list"),
  },
  async (args) => {
    const { id, ...options } = args;
    const result = await lists.updateList(id, options);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "delete_list",
  "Delete a list by ID",
  {
    id: z.string().describe("The ID of the list to delete"),
  },
  async (args) => {
    const result = await lists.deleteList(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "get_list",
  "Get a specific list by ID",
  {
    id: z.string().describe("The ID of the list to retrieve"),
  },
  async (args) => {
    const result = await lists.getList(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

// Cards operations
server.tool(
  "get_cards",
  "Get all cards for a specific list",
  {
    listId: z.string().describe("The ID of the list to get cards for"),
  },
  async (args) => {
    const result = await cards.getCards(args.listId);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "create_card",
  "Create a new card in a list",
  {
    listId: z.string().describe("The ID of the list to create the card in"),
    name: z.string().describe("The name of the new card"),
    description: z.string().describe("The description of the card"),
    position: z.number().describe("The position of the card in the list"),
  },
  async (args) => {
    const result = await cards.createCard(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "get_card",
  "Get a specific card by ID",
  {
    id: z.string().describe("The ID of the card to retrieve"),
  },
  async (args) => {
    const result = await cards.getCard(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "update_card",
  "Update a card's properties",
  {
    id: z.string().describe("The ID of the card to update"),
    name: z.string().describe("The new name for the card"),
    description: z.string().describe("The new description for the card"),
    position: z.number().describe("The new position for the card"),
    dueDate: z.string().optional().describe(
      "The due date for the card (ISO format)",
    ),
    isCompleted: z.boolean().describe("Whether the card is completed"),
  },
  async (args) => {
    const { id, ...options } = args;
    const result = await cards.updateCard(id, options);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "move_card",
  "Move a card to a different list or position",
  {
    id: z.string().describe("The ID of the card to move"),
    listId: z.string().describe("The ID of the list to move the card to"),
    boardId: z.string().optional().describe(
      "The ID of the board (if moving between boards)",
    ),
    projectId: z.string().optional().describe(
      "The ID of the project (if moving between projects)",
    ),
    position: z.number().describe("The position in the target list"),
  },
  async (args) => {
    const result = await cards.moveCard(
      args.id,
      args.listId,
      args.position,
      args.boardId,
      args.projectId,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "duplicate_card",
  "Duplicate a card in a list",
  {
    id: z.string().describe("The ID of the card to duplicate"),
    position: z.number().describe("The position for the duplicated card"),
  },
  async (args) => {
    const result = await cards.duplicateCard(args.id, args.position);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "delete_card",
  "Delete a card by ID",
  {
    id: z.string().describe("The ID of the card to delete"),
  },
  async (args) => {
    const result = await cards.deleteCard(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

// Card Stopwatch tools
server.tool(
  "start_card_stopwatch",
  "Start the stopwatch for a card to track time spent",
  {
    id: z.string().describe("The ID of the card to start the stopwatch for"),
  },
  async (args) => {
    const result = await cards.startCardStopwatch(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "stop_card_stopwatch",
  "Stop the stopwatch for a card",
  {
    id: z.string().describe("The ID of the card to stop the stopwatch for"),
  },
  async (args) => {
    const result = await cards.stopCardStopwatch(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "get_card_stopwatch",
  "Get the current stopwatch time for a card",
  {
    id: z.string().describe("The ID of the card to get the stopwatch time for"),
  },
  async (args) => {
    const result = await cards.getCardStopwatch(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "reset_card_stopwatch",
  "Reset the stopwatch for a card",
  {
    id: z.string().describe("The ID of the card to reset the stopwatch for"),
  },
  async (args) => {
    const result = await cards.resetCardStopwatch(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

// Labels operations
server.tool(
  "get_labels",
  "Get all labels for a specific board",
  {
    boardId: z.string().describe("The ID of the board to get labels for"),
  },
  async (args) => {
    const result = await labels.getLabels(args.boardId);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "create_label",
  "Create a new label for a board",
  {
    boardId: z.string().describe("The ID of the board to create the label in"),
    name: z.string().describe("The name of the new label"),
    color: z.enum(labels.VALID_LABEL_COLORS).describe("The color of the label"),
    position: z.number().describe("The position of the label in the board"),
  },
  async (args) => {
    const result = await labels.createLabel(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "update_label",
  "Update a label's properties",
  {
    id: z.string().describe("The ID of the label to update"),
    name: z.string().describe("The new name for the label"),
    color: z.enum(labels.VALID_LABEL_COLORS).describe(
      "The new color for the label",
    ),
    position: z.number().describe("The new position for the label"),
  },
  async (args) => {
    const { id, ...options } = args;
    const result = await labels.updateLabel(id, options);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "delete_label",
  "Delete a label by ID",
  {
    id: z.string().describe("The ID of the label to delete"),
  },
  async (args) => {
    const result = await labels.deleteLabel(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "add_label_to_card",
  "Add a label to a card",
  {
    cardId: z.string().describe("The ID of the card to add the label to"),
    labelId: z.string().describe("The ID of the label to add to the card"),
  },
  async (args) => {
    const result = await labels.addLabelToCard(args.cardId, args.labelId);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "remove_label_from_card",
  "Remove a label from a card",
  {
    cardId: z.string().describe("The ID of the card to remove the label from"),
    labelId: z.string().describe("The ID of the label to remove from the card"),
  },
  async (args) => {
    const result = await labels.removeLabelFromCard(args.cardId, args.labelId);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

// Tasks operations
server.tool(
  "get_tasks",
  "Get all tasks for a specific card",
  {
    cardId: z.string().describe("The ID of the card to get tasks for"),
  },
  async (args) => {
    const result = await tasks.getTasks(args.cardId);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "create_task",
  "Create a new task for a card",
  {
    cardId: z.string().describe("The ID of the card to create the task in"),
    name: z.string().describe("The name of the new task"),
    position: z.number().describe("The position of the task in the card"),
  },
  async (args) => {
    const result = await tasks.createTask(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "batch_create_tasks",
  "Create multiple tasks for cards in a single operation",
  {
    tasks: z.array(
      z.object({
        cardId: z.string().describe("The ID of the card to create the task in"),
        name: z.string().describe("The name of the new task"),
        position: z.number().optional().describe(
          "The position of the task in the card (optional)",
        ),
      }),
    ).describe("Array of tasks to create"),
  },
  async (args) => {
    const result = await tasks.batchCreateTasks(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "get_task",
  "Get a specific task by ID",
  {
    id: z.string().describe("The ID of the task to retrieve"),
  },
  async (args) => {
    const result = await tasks.getTask(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "update_task",
  "Update a task's properties",
  {
    id: z.string().describe("The ID of the task to update"),
    name: z.string().describe("The new name for the task"),
    isCompleted: z.boolean().describe("Whether the task is completed"),
    position: z.number().describe("The new position for the task"),
  },
  async (args) => {
    const { id, ...options } = args;
    const result = await tasks.updateTask(id, options);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "delete_task",
  "Delete a task by ID",
  {
    id: z.string().describe("The ID of the task to delete"),
  },
  async (args) => {
    const result = await tasks.deleteTask(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

// Comments operations
server.tool(
  "get_comments",
  "Get all comments for a specific card",
  {
    cardId: z.string().describe("The ID of the card to get comments for"),
  },
  async (args) => {
    const result = await comments.getComments(args.cardId);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "create_comment",
  "Create a new comment on a card",
  {
    cardId: z.string().describe("The ID of the card to create the comment on"),
    text: z.string().describe("The text content of the comment"),
  },
  async (args) => {
    const result = await comments.createComment(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "get_comment",
  "Get a specific comment by ID",
  {
    id: z.string().describe("The ID of the comment to retrieve"),
  },
  async (args) => {
    const result = await comments.getComment(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "update_comment",
  "Update a comment's properties",
  {
    id: z.string().describe("The ID of the comment to update"),
    text: z.string().describe("The new text content for the comment"),
  },
  async (args) => {
    const { id, ...options } = args;
    const result = await comments.updateComment(id, options);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "delete_comment",
  "Delete a comment by ID",
  {
    id: z.string().describe("The ID of the comment to delete"),
  },
  async (args) => {
    const result = await comments.deleteComment(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

// Board Memberships operations
server.tool(
  "get_board_memberships",
  "Get all memberships for a specific board",
  {
    boardId: z.string().describe("The ID of the board to get memberships for"),
  },
  async (args) => {
    const result = await boardMemberships.getBoardMemberships(args.boardId);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "create_board_membership",
  "Add a user to a board with specified permissions",
  {
    boardId: z.string().describe("The ID of the board to add the user to"),
    userId: z.string().describe("The ID of the user to add to the board"),
    role: z.enum(["editor", "viewer"]).describe(
      "The role of the user on the board (editor or viewer)",
    ),
  },
  async (args) => {
    const result = await boardMemberships.createBoardMembership(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "get_board_membership",
  "Get details about a specific board membership",
  {
    id: z.string().describe("The ID of the board membership to retrieve"),
  },
  async (args) => {
    const result = await boardMemberships.getBoardMembership(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "update_board_membership",
  "Update a user's permissions on a board",
  {
    id: z.string().describe("The ID of the board membership to update"),
    role: z.enum(["editor", "viewer"]).describe(
      "The new role for the user (editor or viewer)",
    ),
    canComment: z.boolean().describe("Whether the user can comment on cards"),
  },
  async (args) => {
    const { id, ...options } = args;
    const result = await boardMemberships.updateBoardMembership(id, options);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.tool(
  "delete_board_membership",
  "Remove a user from a board",
  {
    id: z.string().describe("The ID of the board membership to delete"),
  },
  async (args) => {
    const result = await boardMemberships.deleteBoardMembership(args.id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

// New combined tools that reduce API calls
server.tool(
  "get_board_summary",
  "Get a comprehensive summary of a board including lists, cards, tasks, and statistics in a single call",
  {
    boardId: z.string().describe("The ID of the board to get a summary for"),
    includeTaskDetails: z.boolean().optional().default(false).describe(
      "Whether to include detailed task information for each card",
    ),
    includeComments: z.boolean().optional().default(false).describe(
      "Whether to include comments for each card",
    ),
  },
  async (args) => {
    try {
      const result = await getBoardSummary(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (error) {
      console.error("Error in get_board_summary:", error);
      throw error;
    }
  },
);

server.tool(
  "get_card_details",
  "Get detailed information about a card including tasks, comments, labels, and analysis in a single call",
  {
    cardId: z.string().describe("The ID of the card to get details for"),
  },
  async (args) => {
    try {
      const result = await getCardDetails(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (error) {
      console.error("Error in get_card_details:", error);
      throw error;
    }
  },
);

server.tool(
  "create_card_with_tasks",
  "Create a new card with tasks, description, and optional comment in a single call",
  {
    listId: z.string().describe("The ID of the list to create the card in"),
    name: z.string().describe("The name of the card"),
    description: z.string().optional().describe("The description of the card"),
    tasks: z.array(z.string()).optional().describe(
      "Array of task descriptions to create",
    ),
    comment: z.string().optional().describe(
      "Optional comment to add to the card",
    ),
    position: z.number().optional().describe(
      "Optional position for the card in the list",
    ),
  },
  async (args) => {
    try {
      const result = await createCardWithTasks(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (error) {
      console.error("Error in create_card_with_tasks:", error);
      throw error;
    }
  },
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
