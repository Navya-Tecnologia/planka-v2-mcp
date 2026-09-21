// Global variables to store user IDs
let adminUserId: string | null = null;

import { getUserIdByEmail, getUserIdByUsername } from "./utils.js";
import { getActivePlankaContext } from "./context.js";

/**
 * Gets the current user ID or admin user ID by looking up the user by email or username.
 * When running in a multi-tenant session context, resolves the current authenticated user's ID.
 */
export async function getAdminUserId(): Promise<string | null> {
    const context = getActivePlankaContext();
    if (context?.userId) {
        return context.userId;
    }
    if (context?.email) {
        try {
            const id = await getUserIdByEmail(context.email);
            if (id) {
                context.userId = id;
                return id;
            }
        } catch {
            // Fall through to fallback
        }
    }

    if (adminUserId) {
        return adminUserId;
    }

    try {
        // Check for direct admin ID (for backwards compatibility)
        const directAdminId = process.env.PLANKA_ADMIN_ID;
        if (directAdminId) {
            adminUserId = directAdminId;
            return adminUserId;
        }

        // Try to get the admin ID by email
        const adminEmail = process.env.PLANKA_ADMIN_EMAIL;
        if (adminEmail) {
            const id = await getUserIdByEmail(adminEmail);
            if (id) {
                adminUserId = id;
                return adminUserId;
            }
        }

        // Fallback to agent email
        const agentEmail = process.env.PLANKA_AGENT_EMAIL;
        if (agentEmail) {
            const id = await getUserIdByEmail(agentEmail);
            if (id) {
                adminUserId = id;
                return adminUserId;
            }
        }

        console.error(
            "Could not determine admin user ID. Please set PLANKA_ADMIN_ID, PLANKA_ADMIN_EMAIL, PLANKA_ADMIN_USERNAME, or PLANKA_AGENT_EMAIL.",
        );
        return null;
    } catch (error) {
        console.error("Failed to get admin user ID:", error);
        return null;
    }
}
