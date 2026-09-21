import http from "node:http";
import { URL } from "node:url";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VERSION } from "../common/version.js";

export interface HttpServerOptions {
  port?: number;
  host?: string;
  serverFactory: () => McpServer;
  apiKey?: string;
}

export interface ActiveSession {
  transport: SSEServerTransport;
  server: McpServer;
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

export function setCorsHeaders(res: http.ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
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

      // 2. Authentication check
      if (!checkAuth(req, apiKey, parsedUrl)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Unauthorized",
            message: "Missing or invalid authorization credentials",
          }),
        );
        return;
      }

      // 3. SSE Connection Handshake
      if (req.method === "GET" && pathname === "/sse") {
        const transport = new SSEServerTransport("/messages", res);
        const mcpServerInstance = options.serverFactory();
        const sessionId = transport.sessionId;

        sessions.set(sessionId, {
          transport,
          server: mcpServerInstance,
        });

        transport.onclose = () => {
          sessions.delete(sessionId);
        };

        await mcpServerInstance.connect(transport);
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

        await session.transport.handlePostMessage(req, res);
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
      if (options.apiKey || process.env.MCP_API_KEY) {
        console.log(`   - Authentication:     Bearer token protected (MCP_API_KEY)`);
      } else {
        console.log(`   - Authentication:     None (Public/Local network access)`);
      }
      resolve({ server, sessions, port, host });
    });
  });
}
