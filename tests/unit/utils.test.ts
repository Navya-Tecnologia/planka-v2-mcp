import { describe, expect, it } from "@jest/globals";
import { sanitizeId, buildUrl } from "../../common/utils.js";
import {
  createPlankaError,
  PlankaAuthenticationError,
  PlankaPermissionError,
  PlankaResourceNotFoundError,
  PlankaConflictError,
  PlankaValidationError,
  PlankaRateLimitError,
  PlankaError,
} from "../../common/errors.js";

describe("common/utils: sanitizeId", () => {
  it("should accept valid alphanumeric IDs and UUIDs", () => {
    expect(sanitizeId("12345")).toBe("12345");
    expect(sanitizeId("abc-def-123")).toBe("abc-def-123");
    expect(sanitizeId("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "550e8400-e29b-41d4-a716-446655440000"
    );
  });

  it("should trim leading and trailing spaces", () => {
    expect(sanitizeId("  card-123  ")).toBe("card-123");
  });

  it("should reject path traversal sequences (..)", () => {
    expect(() => sanitizeId("../admin")).toThrow("Security violation");
    expect(() => sanitizeId("..")).toThrow("Security violation");
    expect(() => sanitizeId("card/../../users")).toThrow("Security violation");
  });

  it("should reject forward and back slashes", () => {
    expect(() => sanitizeId("cards/123")).toThrow("Security violation");
    expect(() => sanitizeId("cards\\123")).toThrow("Security violation");
  });

  it("should reject empty strings or invalid types", () => {
    expect(() => sanitizeId("")).toThrow("Invalid ID parameter provided");
    expect(() => sanitizeId(null as any)).toThrow("Invalid ID parameter provided");
    expect(() => sanitizeId(undefined as any)).toThrow("Invalid ID parameter provided");
  });
});

describe("common/utils: buildUrl", () => {
  it("should append defined query parameters", () => {
    const url = buildUrl("http://localhost:3000/api/users", {
      page: 1,
      perPage: 50,
    });
    expect(url).toBe("http://localhost:3000/api/users?page=1&perPage=50");
  });

  it("should ignore undefined parameters", () => {
    const url = buildUrl("http://localhost:3000/api/users", {
      page: 2,
      perPage: undefined,
    });
    expect(url).toBe("http://localhost:3000/api/users?page=2");
  });
});

describe("common/errors: createPlankaError", () => {
  it("should map 401 to PlankaAuthenticationError", () => {
    const err = createPlankaError(401, { message: "Invalid credentials" });
    expect(err).toBeInstanceOf(PlankaAuthenticationError);
    expect(err.status).toBe(401);
  });

  it("should map 403 to PlankaPermissionError", () => {
    const err = createPlankaError(403, { message: "Forbidden" });
    expect(err).toBeInstanceOf(PlankaPermissionError);
    expect(err.status).toBe(403);
  });

  it("should map 404 to PlankaResourceNotFoundError", () => {
    const err = createPlankaError(404, { message: "Card not found" });
    expect(err).toBeInstanceOf(PlankaResourceNotFoundError);
    expect(err.status).toBe(404);
  });

  it("should map 409 to PlankaConflictError", () => {
    const err = createPlankaError(409, { message: "Conflict" });
    expect(err).toBeInstanceOf(PlankaConflictError);
    expect(err.status).toBe(409);
  });

  it("should map 422 to PlankaValidationError", () => {
    const err = createPlankaError(422, { message: "Invalid schema" });
    expect(err).toBeInstanceOf(PlankaValidationError);
    expect(err.status).toBe(422);
  });

  it("should map 429 to PlankaRateLimitError", () => {
    const err = createPlankaError(429, { message: "Too many requests" });
    expect(err).toBeInstanceOf(PlankaRateLimitError);
    expect(err.status).toBe(429);
  });

  it("should map unknown status to generic PlankaError", () => {
    const err = createPlankaError(500, { message: "Server error" });
    expect(err).toBeInstanceOf(PlankaError);
    expect(err.status).toBe(500);
  });
});
