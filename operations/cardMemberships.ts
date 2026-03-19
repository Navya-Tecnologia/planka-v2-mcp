/**
 * @fileoverview Card membership operations for the MCP Kanban server
 */

import { z } from "zod";
import { plankaRequest } from "../common/utils.js";

// Schema definitions
export const CreateCardMembershipSchema = z.object({
  cardId: z.string().describe("Card ID"),
  userId: z.string().describe("User ID"),
});

export const DeleteCardMembershipSchema = z.object({
  cardId: z.string().describe("Card ID"),
  userId: z.string().describe("User ID"),
});

// Response schema
const CardMembershipSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  userId: z.string(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

const CardMembershipResponseSchema = z.object({
  item: CardMembershipSchema,
});

const CardMembershipsResponseSchema = z.array(CardMembershipSchema);

/**
 * Retrieves all memberships for a specific card
 */
export async function getCardMemberships(cardId: string) {
  try {
    const response = await plankaRequest(`/api/cards/${cardId}/card-memberships`);
    // Note: Some Planka versions return an object with items, others return an array.
    // Let's handle both.
    if (Array.isArray(response)) {
      return CardMembershipsResponseSchema.parse(response);
    }
    const { items } = response as { items: any[] };
    return CardMembershipsResponseSchema.parse(items);
  } catch (error) {
    throw new Error(`Failed to get card memberships for ${cardId}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Adds a user to a card
 */
export async function createCardMembership(cardId: string, userId: string) {
  try {
    const response = await plankaRequest(`/api/cards/${cardId}/card-memberships`, {
      method: "POST",
      body: { userId },
    });
    const parsedResponse = CardMembershipResponseSchema.parse(response);
    return parsedResponse.item;
  } catch (error) {
    throw new Error(`Failed to assign user ${userId} to card ${cardId}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Removes a user from a card
 */
export async function deleteCardMembership(cardId: string, userId: string) {
  try {
    await plankaRequest(`/api/cards/${cardId}/card-memberships/userId:${userId}`, {
      method: "DELETE",
    });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to unassign user ${userId} from card ${cardId}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
