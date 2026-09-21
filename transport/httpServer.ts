import http from "node:http";
import { URL } from "node:url";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VERSION } from "../common/version.js";
import {
  PlankaAuthContext,
  runWithPlankaContext,
} from "../common/context.js";
import { authenticatePlankaUser } from "../common/utils.js";

export interface HttpServerOptions {
  port?: number;
  host?: string;
  serverFactory: (context?: PlankaAuthContext) => McpServer;
  apiKey?: string;
}

export interface ActiveSession {
  transport: SSEServerTransport;
  server: McpServer;
  context: PlankaAuthContext;
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
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer" && parts[1] === expectedApiKey) {
      return true;
    }
  }

  // Check query parameters: token or apiKey (convenient for SSE EventSource clients)
  if (parsedUrl) {
    const token = parsedUrl.searchParams.get("token") || parsedUrl.searchParams.get("apiKey");
    if (token === expectedApiKey) {
      return true;
    }
  }

  return false;
}

export function extractPlankaCredentials(
  req: http.IncomingMessage,
  parsedUrl: URL,
): PlankaAuthContext | null {
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
  if (typeof headerBaseUrl === "string" && headerBaseUrl.trim()) {
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
  if (qBaseUrl && qBaseUrl.trim()) {
    baseUrl = qBaseUrl.trim();
  }

  const qIgnoreSsl =
    parsedUrl.searchParams.get("ignoreSsl") ||
    parsedUrl.searchParams.get("plankaIgnoreSsl");
  if (qIgnoreSsl !== null) {
    ignoreSsl = qIgnoreSsl === "true";
  }

  // 4. Fallback to process.env if available (for backwards compatibility / single-tenant setups)
  if (!email && process.env.PLANKA_AGENT_EMAIL) {
    email = process.env.PLANKA_AGENT_EMAIL;
  }
  if (!password && process.env.PLANKA_AGENT_PASSWORD) {
    password = process.env.PLANKA_AGENT_PASSWORD;
  }
  if (!baseUrl && process.env.PLANKA_BASE_URL) {
    baseUrl = process.env.PLANKA_BASE_URL;
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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-Planka-Email, X-Planka-Password, X-Planka-Token, X-Planka-Base-Url, X-Planka-Ignore-Ssl",
  );
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

      // 3. SSE Connection Handshake
      if (req.method === "GET" && pathname === "/sse") {
        const plankaContext = extractPlankaCredentials(req, parsedUrl);
        if (!plankaContext) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "MissingCredentials",
              message:
                "Planka credentials required. Provide them via headers (X-Planka-Email, X-Planka-Password) or query parameters (?email=...&password=...).",
            }),
          );
          return;
        }

        // Validate credentials against Planka
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

      // 4. POST Messages Endpoint
      if (req.method === "POST" && pathname === "/messages") {
        const sessionId = parsedUrl.searchParams.get("sessionId");
        if (!sessionId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Bad Request",
              message: "Missing sessionId parameter in URL query",
            }),
          );
          return;
        }

        const session = sessions.get(sessionId);
        if (!session) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Not Found",
              message: `Session ${sessionId} not found or expired`,
            }),
          );
          return;
        }

        await runWithPlankaContext(session.context, async () => {
          await session.transport.handlePostMessage(req, res);
        });
        return;
      }

      // 5. Fallback 404
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
