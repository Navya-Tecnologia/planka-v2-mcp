import { AsyncLocalStorage } from "node:async_hooks";

export interface PlankaAuthContext {
  baseUrl?: string;
  email?: string;
  password?: string;
  token?: string;
  userId?: string;
  ignoreSsl?: boolean;
}

export const plankaContextStorage = new AsyncLocalStorage<PlankaAuthContext>();

/**
 * Returns the currently active Planka authentication context for the current async execution stack.
 */
export function getActivePlankaContext(): PlankaAuthContext | undefined {
  return plankaContextStorage.getStore();
}

/**
 * Executes a function within the specified Planka authentication context.
 */
export function runWithPlankaContext<T>(
  context: PlankaAuthContext,
  fn: () => T,
): T {
  return plankaContextStorage.run(context, fn);
}
