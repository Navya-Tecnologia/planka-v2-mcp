import { z } from "zod";
import { getCard } from "../operations/cards.js";
import { getTasks } from "../operations/tasks.js";
import { getComments } from "../operations/comments.js";
import { getLabels } from "../operations/labels.js";
import { getList } from "../operations/lists.js";

/**
 * Zod schema for the getCardDetails function parameters
 * @property {string} cardId - The ID of the card to get details for
 */
export const getCardDetailsSchema = z.object({
    cardId: z.string().describe("The ID of the card to get details for"),
});

/**
 * Type definition for getCardDetails parameters
 */
export type GetCardDetailsParams = z.infer<typeof getCardDetailsSchema>;

/**
 * Retrieves comprehensive details about a card including tasks, comments, labels, and analysis
 *
 * This function aggregates data from multiple sources to provide a complete view of a card,
 * including its tasks, comments, and labels. It also calculates task completion percentage
 * and performs analysis on the card's status.
 *
 * @param {GetCardDetailsParams} params - Parameters for retrieving card details
 * @param {string} params.cardId - The ID of the card to get details for
 * @returns {Promise<object>} Comprehensive card details including tasks, comments, labels, and analysis
 * @throws {Error} If the card is not found or if the board ID cannot be determined
 */
export async function getCardDetails(params: GetCardDetailsParams) {
    const { cardId } = params;

    try {
        // Get the card details
        const card = await getCard(cardId);

        if (!card) {
            throw new Error(`Card with ID ${cardId} not found`);
        }

        // Get tasks for the card
        const tasks = await getTasks(card.id);

        // Get comments for the card
        const comments = await getComments(card.id);

        // Find the board ID: check card.boardId first, then query the card's list directly (O(1))
        let boardId: string | null = (card as any).boardId || null;

        if (!boardId && card.listId) {
            try {
                const list = await getList(card.listId);
                if (list?.boardId) {
                    boardId = list.boardId;
                }
            } catch {
                boardId = null;
            }
        }

        const labels = boardId ? await getLabels(boardId) : [];

        // Filter to just the labels assigned to this card
        // Note: We need to get the labelIds from the card's data
        // This might require additional API calls or data structure knowledge
        // For now, we'll return all labels for the board

        // Calculate task completion percentage
        const completedTasks = tasks.filter((task: any) =>
            task.isCompleted
        ).length;
        const totalTasks = tasks.length;
        const completionPercentage = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        // Sort comments by date (newest first)
        const sortedComments = comments.sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Check if the most recent comment is likely from a human (not the LLM)
        // This is a heuristic and might need adjustment
        const hasRecentHumanFeedback = sortedComments.length > 0 &&
            !sortedComments[0].text.includes("Implemented feature") &&
            !sortedComments[0].text.includes("Awaiting human review");

        return {
            card,
            taskItems: tasks,
            taskStats: {
                total: totalTasks,
                completed: completedTasks,
                completionPercentage,
            },
            comments: sortedComments,
            labels,
            analysis: {
                hasRecentHumanFeedback,
                isComplete: completionPercentage === 100,
                needsAttention: hasRecentHumanFeedback || completedTasks === 0,
            },
        };
    } catch (error) {
        console.error("Error in getCardDetails:", error);
        throw error;
    }
}
