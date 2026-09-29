import http from "node:http";
import { URL } from "node:url";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VERSION } from "../common/version.js";
import {
  PlankaAuthContext,
  runWithPlankaContext,
} from "../common/context.js";
import { authenticatePlankaUser, isValidBaseUrl } from "../common/utils.js";

export { isValidBaseUrl };

export interface HttpServerOptions {
  port?: number;
  host?: string;
  serverFactory: (context?: PlankaAuthContext) => McpServer;
  apiKey?: string;
}

export interface ActiveSession {
  transport: SSEServerTransport | StreamableHTTPServerTransport;
  server: McpServer;
  context: PlankaAuthContext;
}

function safeCompare(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkAuth(
  req: http.IncomingMessage,
  expectedApiKey?: string,
  parsedUrl?: URL,
): boolean {
  if (!expectedApiKey) return true;

  // Check Authorization header: Bearer <key>
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer" && safeCompare(parts[1], expectedApiKey)) {
      return true;
    }
  }

  // Check query parameters: token or apiKey (convenient for SSE EventSource clients)
  if (parsedUrl) {
    const token = parsedUrl.searchParams.get("token") || parsedUrl.searchParams.get("apiKey");
    if (token && safeCompare(token, expectedApiKey)) {
      return true;
    }
  }

  return false;
}

export interface ExtractCredentialsOptions {
  allowEnvFallback?: boolean;
}

export function extractPlankaCredentials(
  req: http.IncomingMessage,
  parsedUrl: URL,
  options?: ExtractCredentialsOptions,
): PlankaAuthContext | null {
  const allowEnvFallback = options?.allowEnvFallback ?? true;
  let email: string | undefined;
  let password: string | undefined;
  let token: string | undefined;
  let baseUrl: string | undefined;
  let ignoreSsl: boolean | undefined;

  // 1. Custom HTTP Headers
  const headerEmail =
    req.headers["x-planka-email"] || req.headers["x-planka-username"];
  if (typeof headerEmail === "string" && headerEmail.trim()) {
    email = headerEmail.trim();
  }

  const headerPassword = req.headers["x-planka-password"];
  if (typeof headerPassword === "string" && headerPassword) {
    password = headerPassword;
  }

  const headerToken = req.headers["x-planka-token"];
  if (typeof headerToken === "string" && headerToken.trim()) {
    token = headerToken.trim();
  }

  const headerBaseUrl = req.headers["x-planka-base-url"];
  if (typeof headerBaseUrl === "string" && headerBaseUrl.trim() && isValidBaseUrl(headerBaseUrl.trim())) {
    baseUrl = headerBaseUrl.trim();
  }

  const headerIgnoreSsl = req.headers["x-planka-ignore-ssl"];
  if (typeof headerIgnoreSsl === "string") {
    ignoreSsl = headerIgnoreSsl === "true";
  }

  // 2. HTTP Basic Auth: Authorization: Basic <base64(email:password)>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith("basic ")) {
    try {
      const credentials = Buffer.from(authHeader.slice(6).trim(), "base64").toString("utf-8");
      const colonIndex = credentials.indexOf(":");
      if (colonIndex > 0) {
        email = credentials.substring(0, colonIndex);
        password = credentials.substring(colonIndex + 1);
      }
    } catch {
      // Ignore base64 decoding errors
    }
  }

  // 3. Query parameters (essential for browser EventSource and simple URL configurations)
  const qEmail =
    parsedUrl.searchParams.get("email") ||
    parsedUrl.searchParams.get("plankaEmail") ||
    parsedUrl.searchParams.get("username");
  if (qEmail && qEmail.trim()) {
    email = qEmail.trim();
  }

  const qPassword =
    parsedUrl.searchParams.get("password") ||
    parsedUrl.searchParams.get("plankaPassword");
  if (qPassword) {
    password = qPassword;
  }

  const qToken =
    parsedUrl.searchParams.get("plankaToken") ||
    parsedUrl.searchParams.get("jwt");
  if (qToken && qToken.trim()) {
    token = qToken.trim();
  }

  const qBaseUrl =
    parsedUrl.searchParams.get("baseUrl") ||
    parsedUrl.searchParams.get("plankaBaseUrl");
  if (qBaseUrl && qBaseUrl.trim() && isValidBaseUrl(qBaseUrl.trim())) {
    baseUrl = qBaseUrl.trim();
  }

  const qIgnoreSsl =
    parsedUrl.searchParams.get("ignoreSsl") ||
    parsedUrl.searchParams.get("plankaIgnoreSsl");
  if (qIgnoreSsl !== null) {
    ignoreSsl = qIgnoreSsl === "true";
  }

  // 4. Fallback to process.env if explicitly permitted (e.g. valid gateway API key or single-tenant stdio)
  if (allowEnvFallback) {
    if (!email && process.env.PLANKA_AGENT_EMAIL) {
      email = process.env.PLANKA_AGENT_EMAIL;
    }
    if (!password && process.env.PLANKA_AGENT_PASSWORD) {
      password = process.env.PLANKA_AGENT_PASSWORD;
    }
    if (!baseUrl && process.env.PLANKA_BASE_URL) {
      baseUrl = process.env.PLANKA_BASE_URL;
    }
  }

  // If neither credentials nor token are available, return null
  if (!email && !token) {
    return null;
  }

  return {
    email,
    password,
    token,
    baseUrl: baseUrl || "http://localhost:3000",
    ignoreSsl,
  };
}

export function setCorsHeaders(res: http.ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Mcp-Session-Id, mcp-session-id, Last-Event-ID, Mcp-Protocol-Version, X-Requested-With, X-Planka-Email, X-Planka-Password, X-Planka-Token, X-Planka-Base-Url, X-Planka-Ignore-Ssl",
  );
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Mcp-Session-Id, mcp-session-id, Mcp-Protocol-Version, Content-Type",
  );
}

const SENSITIVE_PARAM_NAMES = new Set([
  "password",
  "plankapassword",
  "token",
  "plankatoken",
  "apikey",
  "api_key",
  "jwt",
  "secret",
  "authorization",
  "auth",
  "access_token",
]);

export function sanitizeUrlForLogging(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl, "http://localhost");
    if (parsed.password) {
      parsed.password = "******";
    }
    for (const [key] of parsed.searchParams) {
      if (SENSITIVE_PARAM_NAMES.has(key.toLowerCase())) {
        parsed.searchParams.set(key, "******");
      }
    }
    return parsed.pathname + parsed.search;
  } catch {
    return rawUrl.split("?")[0];
  }
}

export function createHttpServer(options: HttpServerOptions): {
  server: http.Server;
  sessions: Map<string, ActiveSession>;
} {
  const sessions = new Map<string, ActiveSession>();
  const apiKey = options.apiKey || process.env.MCP_API_KEY;

  const server = http.createServer(async (req, res) => {
    try {
      setCorsHeaders(res);

      // Normalize Accept header to prevent 406 Not Acceptable from StreamableHTTPServerTransport
      const currentAccept = req.headers["accept"] || "";
      if (
        !currentAccept ||
        currentAccept.includes("*/*") ||
        !currentAccept.includes("text/event-stream") ||
        !currentAccept.includes("application/json")
      ) {
        req.headers["accept"] = "application/json, text/event-stream";
      }

      console.log(`[HTTP ${req.method}] ${sanitizeUrlForLogging(req.url || "/")} (Accept: ${req.headers["accept"]})`);

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      const hostHeader = req.headers.host || "localhost";
      const parsedUrl = new URL(req.url || "/", `http://${hostHeader}`);
      const pathname = parsedUrl.pathname;

      // 1. Healthcheck / Info endpoint
      if (req.method === "GET" && (pathname === "/health" || pathname === "/")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ok",
            server: "planka-mcp-server",
            version: VERSION,
            transport: "sse",
            activeSessions: sessions.size,
          }),
        );
        return;
      }

      // 2. Gateway API Key Authentication check (MCP_API_KEY)
      if (!checkAuth(req, apiKey, parsedUrl)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Unauthorized",
            message: "Missing or invalid MCP authorization credentials",
          }),
        );
        return;
      }

      const rawSessionHeader =
        (req.headers["mcp-session-id"] as string) ||
        (req.headers["mcp-session-id".toLowerCase()] as string);
      const headerSessionId = typeof rawSessionHeader === "string" ? rawSessionHeader.trim() : undefined;
      const querySessionId = parsedUrl.searchParams.get("sessionId")?.trim();
      const existingSessionId = (headerSessionId && headerSessionId.length > 0)
        ? headerSessionId
        : (querySessionId && querySessionId.length > 0)
          ? querySessionId
          : undefined;

      // 3. Existing Session Handling (Works for POST /messages, POST/GET /sse, POST/GET /mcp, POST/GET /)
      if (existingSessionId && sessions.has(existingSessionId)) {
        const session = sessions.get(existingSessionId)!;
        await runWithPlankaContext(session.context, async () => {
          if (session.transport instanceof StreamableHTTPServerTransport) {
            await session.transport.handleRequest(req, res);
          } else if (session.transport instanceof SSEServerTransport) {
            if (req.method === "POST") {
              await session.transport.handlePostMessage(req, res);
            } else {
              res.writeHead(405, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Method Not Allowed" }));
            }
          }
        });
        return;
      }

      // If existingSessionId was provided but not found in sessions:
      if (existingSessionId && !sessions.has(existingSessionId)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32001,
              message: `Session not found: ${existingSessionId}`,
            },
            id: null,
          }),
        );
        return;
      }

      const isGatewayAuthenticated = Boolean(apiKey && checkAuth(req, apiKey, parsedUrl));
      const allowEnvFallback = Boolean(
        isGatewayAuthenticated ||
        process.env.ALLOW_ANONYMOUS_ENV_FALLBACK === "true"
      );

      // 4. Legacy SSE Connection Handshake (GET /sse)
      if (req.method === "GET" && pathname === "/sse") {
        const plankaContext = extractPlankaCredentials(req, parsedUrl, { allowEnvFallback });
        if (!plankaContext) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "MissingCredentials",
              message: allowEnvFallback
                ? "Planka credentials required. Provide them via headers (X-Planka-Email, X-Planka-Password) or query parameters (?email=...&password=...)."
                : "Planka credentials required. Anonymous access cannot use default server environment credentials. Provide them via headers (X-Planka-Email, X-Planka-Password), query parameters, or configure MCP_API_KEY.",
            }),
          );
          return;
        }

        try {
          await authenticatePlankaUser(plankaContext);
        } catch (authError: unknown) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "InvalidCredentials",
              message:
                authError instanceof Error
                  ? authError.message
                  : String(authError),
            }),
          );
          return;
        }

        const transport = new SSEServerTransport("/messages", res);
        const mcpServerInstance = options.serverFactory(plankaContext);
        const sessionId = transport.sessionId;

        sessions.set(sessionId, {
          transport,
          server: mcpServerInstance,
          context: plankaContext,
        });

        transport.onclose = () => {
          sessions.delete(sessionId);
        };

        await runWithPlankaContext(plankaContext, async () => {
          await mcpServerInstance.connect(transport);
        });
        return;
      }

      // 5. Legacy SSE POST without sessionId: /messages
      if (req.method === "POST" && pathname === "/messages") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Bad Request",
            message: "Missing sessionId parameter in URL query or Mcp-Session-Id header",
          }),
        );
        return;
      }

      // 6. Streamable HTTP Handshake (POST to /sse, /mcp, or /)
      if (
        req.method === "POST" &&
        (pathname === "/sse" || pathname === "/mcp" || pathname === "/")
      ) {
        const plankaContext = extractPlankaCredentials(req, parsedUrl, { allowEnvFallback });
        if (!plankaContext) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "MissingCredentials",
              message: allowEnvFallback
                ? "Planka credentials required. Provide them via headers or query parameters."
                : "Planka credentials required. Anonymous access cannot use default server environment credentials. Provide them via headers, query parameters, or configure MCP_API_KEY.",
            }),
          );
          return;
        }

        try {
          await authenticatePlankaUser(plankaContext);
        } catch (authError: unknown) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "InvalidCredentials",
              message:
                authError instanceof Error
                  ? authError.message
                  : String(authError),
            }),
          );
          return;
        }

        let mcpServerInstance: McpServer;
        const streamableTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            sessions.set(newSessionId, {
              transport: streamableTransport,
              server: mcpServerInstance,
              context: plankaContext,
            });
          },
        });

        streamableTransport.onclose = () => {
          const sid = streamableTransport.sessionId;
          if (sid) sessions.delete(sid);
        };

        mcpServerInstance = options.serverFactory(plankaContext);
        await mcpServerInstance.connect(streamableTransport);

        await runWithPlankaContext(plankaContext, async () => {
          await streamableTransport.handleRequest(req, res);
        });
        return;
      }

      // 6. Fallback 404
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Not Found",
          message: `Endpoint ${pathname} does not exist`,
        }),
      );
    } catch (error: unknown) {
      console.error("HTTP SSE Server error:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Internal Server Error",
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    }
  });

  return { server, sessions };
}

export function startHttpSseServer(options: HttpServerOptions): Promise<{
  server: http.Server;
  sessions: Map<string, ActiveSession>;
  port: number;
  host: string;
}> {
  const port = options.port ?? (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);
  const host = options.host ?? process.env.HOST ?? "0.0.0.0";
  const { server, sessions } = createHttpServer(options);

  return new Promise((resolve, reject) => {
    server.on("error", (err) => {
      reject(err);
    });

    server.listen(port, host, () => {
      console.log(`🚀 Kanban MCP Server running in SSE mode on http://${host}:${port}`);
      console.log(`   - SSE Stream Endpoint: GET http://${host}:${port}/sse`);
      console.log(`   - Message Endpoint:   POST http://${host}:${port}/messages?sessionId=...`);
      console.log(`   - Healthcheck:        GET http://${host}:${port}/health`);
      console.log(`   - Multi-tenant auth:  Pass Planka credentials via Headers or Query params`);
      if (options.apiKey || process.env.MCP_API_KEY) {
        console.log(`   - Gateway Auth:       Bearer token protected (MCP_API_KEY)`);
      } else {
        console.log(`   - Gateway Auth:       None (Public / Direct access)`);
      }
      resolve({ server, sessions, port, host });
    });
  });
}
