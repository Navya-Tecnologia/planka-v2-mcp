/**
 * @fileoverview Task operations for the MCP Kanban server
 *
 * This module provides functions for interacting with tasks in the Planka Kanban board,
 * including creating, retrieving, updating, and deleting tasks, as well as batch operations.
 */

import { z } from "zod";
import { plankaRequest } from "../common/utils.js";
import { PlankaTaskSchema } from "../common/types.js";

// Schema definitions
/**
 * Schema for creating a new task
 * @property {string} cardId - The ID of the card to create the task in
 * @property {string} name - The name of the task
 * @property {number} [position] - The position of the task in the card (default: 65535)
 */
export const CreateTaskSchema = z.object({
    cardId: z.string().describe("Card ID"),
    name: z.string().describe("Task name"),
    position: z.number().optional().describe("Task position (default: 65535)"),
});

/**
 * Schema for batch creating multiple tasks
 * @property {Array<CreateTaskSchema>} tasks - Array of tasks to create
 */
export const BatchCreateTasksSchema = z.object({
    tasks: z.array(CreateTaskSchema).describe("Array of tasks to create"),
});

/**
 * Schema for retrieving tasks from a card
 * @property {string} cardId - The ID of the card to get tasks from
 */
export const GetTasksSchema = z.object({
    cardId: z.string().describe("Card ID"),
});

/**
 * Schema for retrieving a specific task
 * @property {string} id - The ID of the task to retrieve
 */
export const GetTaskSchema = z.object({
    id: z.string().describe("Task ID"),
});

/**
 * Schema for updating a task
 * @property {string} id - The ID of the task to update
 * @property {string} [name] - The new name for the task
 * @property {boolean} [isCompleted] - Whether the task is completed
 * @property {number} [position] - The new position for the task
 */
export const UpdateTaskSchema = z.object({
    id: z.string().describe("Task ID"),
    name: z.string().optional().describe("Task name"),
    isCompleted: z.boolean().optional().describe(
        "Whether the task is completed",
    ),
    position: z.number().optional().describe("Task position"),
});

/**
 * Schema for deleting a task
 * @property {string} id - The ID of the task to delete
 */
export const DeleteTaskSchema = z.object({
    id: z.string().describe("Task ID"),
});

// Type exports
/**
 * Type definition for task creation options
 */
export type CreateTaskOptions = z.infer<typeof CreateTaskSchema>;

/**
 * Type definition for batch task creation options
 */
export type BatchCreateTasksOptions = z.infer<typeof BatchCreateTasksSchema>;

/**
 * Type definition for task update options
 */
export type UpdateTaskOptions = z.infer<typeof UpdateTaskSchema>;

// Response schemas
const TasksResponseSchema = z.object({
    items: z.array(PlankaTaskSchema),
    included: z.record(z.any()).optional(),
});

const TaskResponseSchema = z.object({
    item: PlankaTaskSchema,
    included: z.record(z.any()).optional(),
});

// Function implementations
/**
 * Creates a new task in a card
 *
 * @param {CreateTaskOptions} options - Options for creating the task
 * @param {string} options.cardId - The ID of the card to create the task in
 * @param {string} options.name - The name of the task
 * @param {number} [options.position] - The position of the task in the card (default: 65535)
 * @returns {Promise<object>} The created task
 * @throws {Error} If the task creation fails
 */
export async function createTask(options: CreateTaskOptions) {
    try {
        const response = await plankaRequest(
            `/api/cards/${options.cardId}/tasks`,
            {
                method: "POST",
                body: {
                    name: options.name,
                    position: options.position,
                },
            },
        );
        const parsedResponse = TaskResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to create task: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Creates multiple tasks for cards in a single operation
 *
 * @param {BatchCreateTasksOptions} options - Options for batch creating tasks
 * @param {Array<CreateTaskOptions>} options.tasks - Array of tasks to create
 * @returns {Promise<{successes: Array<object>, failures: Array<TaskError>}>} Results of the batch operation
 * @throws {Error} If the batch operation fails completely
 */
export async function batchCreateTasks(options: BatchCreateTasksOptions) {
    try {
        const results: Array<any> = [];
        const errors: Array<any> = [];

        /**
         * Interface for task operation result
         * @property {boolean} success - Whether the operation was successful
         * @property {any} [result] - The result of the operation if successful
         * @property {object} [error] - The error if the operation failed
         * @property {string} error.message - The error message
         */
        interface TaskResult {
            success: boolean;
            result?: any;
            error?: { message: string };
        }

        /**
         * Interface for task operation error
         * @property {number} index - The index of the task in the original array
         * @property {CreateTaskOptions} task - The task that failed
         * @property {string} error - The error message
         */
        interface TaskError {
            index: number;
            task: CreateTaskOptions;
            error: string;
        }

        // Process each task in sequence
        for (let i = 0; i < options.tasks.length; i++) {
            const task = options.tasks[i];
            try {
                const result = await createTask(task);
                results.push({
                    success: true,
                    result,
                });
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : String(error);
                results.push({
                    success: false,
                    error: { message: errorMessage },
                });
                errors.push({
                    index: i,
                    task,
                    error: errorMessage,
                });
            }
        }

        return {
            results,
            successes: results.filter((r: TaskResult) => r.success).map(
                (r: TaskResult) => r.result,
            ),
            failures: errors as TaskError[],
        };
    } catch (error) {
        throw new Error(
            `Failed to batch create tasks: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Retrieves all tasks for a specific card
 *
 * @param {string} cardId - The ID of the card to get tasks from
 * @returns {Promise<Array<object>>} Array of tasks in the card
 */
export async function getTasks(cardId: string) {
    try {
        const response = await plankaRequest(`/api/cards/${cardId}/tasks`);
        const parsedResponse = TasksResponseSchema.parse(response);
        return parsedResponse.items;
    } catch (error) {
        // If there's an error, return an empty array
        return [];
    }
}

/**
 * Retrieves a specific task by ID
 *
 * @param {string} id - The ID of the task to retrieve
 * @returns {Promise<object>} The requested task
 */
export async function getTask(id: string) {
    const response = await plankaRequest(`/api/tasks/${id}`);
    const parsedResponse = TaskResponseSchema.parse(response);
    return parsedResponse.item;
}

/**
 * Updates a task's properties
 *
 * @param {string} id - The ID of the task to update
 * @param {Partial<Omit<CreateTaskOptions, "cardId">>} options - The properties to update
 * @returns {Promise<object>} The updated task
 */
export async function updateTask(
    id: string,
    options: Partial<Omit<CreateTaskOptions, "cardId">>,
) {
    const response = await plankaRequest(`/api/tasks/${id}`, {
        method: "PATCH",
        body: options,
    });
    const parsedResponse = TaskResponseSchema.parse(response);
    return parsedResponse.item;
}

/**
 * Deletes a task by ID
 *
 * @param {string} id - The ID of the task to delete
 * @returns {Promise<{success: boolean}>} Success indicator
 */
export async function deleteTask(id: string) {
    await plankaRequest(`/api/tasks/${id}`, {
        method: "DELETE",
    });
    return { success: true };
}
