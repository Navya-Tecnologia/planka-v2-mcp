import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import http from "node:http";
import { URL } from "node:url";
import {
  getActivePlankaContext,
  runWithPlankaContext,
  PlankaAuthContext,
} from "../../common/context.js";
import { extractPlankaCredentials } from "../../transport/httpServer.js";
import { getAuthToken } from "../../common/utils.js";
import { getAdminUserId } from "../../common/setup.js";

describe("Multi-tenant Planka Credential Extraction", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PLANKA_AGENT_EMAIL;
    delete process.env.PLANKA_AGENT_PASSWORD;
    delete process.env.PLANKA_BASE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should extract credentials from custom HTTP headers", () => {
    const mockReq = {
      headers: {
        "x-planka-email": "alice@company.com",
        "x-planka-password": "alice-password",
        "x-planka-base-url": "https://planka.company.com",
      },
    } as unknown as http.IncomingMessage;

    const url = new URL("http://localhost:3000/sse");
    const creds = extractPlankaCredentials(mockReq, url);

    expect(creds).not.toBeNull();
    expect(creds?.email).toBe("alice@company.com");
    expect(creds?.password).toBe("alice-password");
    expect(creds?.baseUrl).toBe("https://planka.company.com");
  });

  it("should extract credentials from HTTP Basic Auth header", () => {
    const base64Auth = Buffer.from("bob@company.com:bob-secret").toString("base64");
    const mockReq = {
      headers: {
        authorization: `Basic ${base64Auth}`,
      },
    } as unknown as http.IncomingMessage;

    const url = new URL("http://localhost:3000/sse");
    const creds = extractPlankaCredentials(mockReq, url);

    expect(creds).not.toBeNull();
    expect(creds?.email).toBe("bob@company.com");
    expect(creds?.password).toBe("bob-secret");
  });

  it("should extract credentials from URL query parameters", () => {
    const mockReq = { headers: {} } as unknown as http.IncomingMessage;
    const url = new URL(
      "http://localhost:3000/sse?email=carol@company.com&password=carol-pass&baseUrl=https://myplanka.io",
    );
    const creds = extractPlankaCredentials(mockReq, url);

    expect(creds).not.toBeNull();
    expect(creds?.email).toBe("carol@company.com");
    expect(creds?.password).toBe("carol-pass");
    expect(creds?.baseUrl).toBe("https://myplanka.io");
  });

  it("should extract pre-existing JWT token from query parameters", () => {
    const mockReq = { headers: {} } as unknown as http.IncomingMessage;
    const url = new URL("http://localhost:3000/sse?plankaToken=eyJhbGciOi...");
    const creds = extractPlankaCredentials(mockReq, url);

    expect(creds).not.toBeNull();
    expect(creds?.token).toBe("eyJhbGciOi...");
  });

  it("should fall back to environment variables when request has no credentials", () => {
    process.env.PLANKA_AGENT_EMAIL = "env-agent@company.com";
    process.env.PLANKA_AGENT_PASSWORD = "env-password";
    process.env.PLANKA_BASE_URL = "http://localhost:3333";

    const mockReq = { headers: {} } as unknown as http.IncomingMessage;
    const url = new URL("http://localhost:3000/sse");
    const creds = extractPlankaCredentials(mockReq, url);

    expect(creds).not.toBeNull();
    expect(creds?.email).toBe("env-agent@company.com");
    expect(creds?.password).toBe("env-password");
    expect(creds?.baseUrl).toBe("http://localhost:3333");
  });

  it("should return null when neither request nor env contains credentials", () => {
    const mockReq = { headers: {} } as unknown as http.IncomingMessage;
    const url = new URL("http://localhost:3000/sse");
    const creds = extractPlankaCredentials(mockReq, url);

    expect(creds).toBeNull();
  });
});

describe("Multi-tenant Session Isolation with AsyncLocalStorage", () => {
  it("should isolate user context and tokens across concurrent async executions", async () => {
    const userAlice: PlankaAuthContext = {
      email: "alice@company.com",
      password: "pass",
      token: "jwt-token-alice",
      userId: "user-id-alice",
    };

    const userBob: PlankaAuthContext = {
      email: "bob@company.com",
      password: "pass",
      token: "jwt-token-bob",
      userId: "user-id-bob",
    };

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Simulate concurrent tool calls for Alice and Bob
    const taskAlice = runWithPlankaContext(userAlice, async () => {
      expect(getActivePlankaContext()?.email).toBe("alice@company.com");
      await sleep(20);
      const token = await getAuthToken();
      expect(token).toBe("jwt-token-alice");
      const adminId = await getAdminUserId();
      expect(adminId).toBe("user-id-alice");
      return token;
    });

    const taskBob = runWithPlankaContext(userBob, async () => {
      expect(getActivePlankaContext()?.email).toBe("bob@company.com");
      await sleep(10);
      const token = await getAuthToken();
      expect(token).toBe("jwt-token-bob");
      const adminId = await getAdminUserId();
      expect(adminId).toBe("user-id-bob");
      return token;
    });

    const [resAlice, resBob] = await Promise.all([taskAlice, taskBob]);

    expect(resAlice).toBe("jwt-token-alice");
    expect(resBob).toBe("jwt-token-bob");
  });
});
