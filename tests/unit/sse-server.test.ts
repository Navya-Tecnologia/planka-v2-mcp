import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import http from "node:http";
import { parseCliArgs } from "../../index.js";
import { checkAuth, createHttpServer } from "../../transport/httpServer.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

describe("CLI Argument Parser", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MCP_TRANSPORT;
    delete process.env.PORT;
    delete process.env.HOST;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should default to stdio transport and undefined port/host", () => {
    const opts = parseCliArgs([]);
    expect(opts.transport).toBe("stdio");
    expect(opts.port).toBeUndefined();
    expect(opts.host).toBeUndefined();
  });

  it("should parse --transport sse and --port", () => {
    const opts = parseCliArgs(["--transport", "sse", "--port", "4000", "--host", "127.0.0.1"]);
    expect(opts.transport).toBe("sse");
    expect(opts.port).toBe(4000);
    expect(opts.host).toBe("127.0.0.1");
  });

  it("should parse --transport=sse and --port=4000", () => {
    const opts = parseCliArgs(["--transport=sse", "--port=5000", "--host=localhost"]);
    expect(opts.transport).toBe("sse");
    expect(opts.port).toBe(5000);
    expect(opts.host).toBe("localhost");
  });

  it("should respect environment variables if CLI args are omitted", () => {
    process.env.MCP_TRANSPORT = "sse";
    process.env.PORT = "8080";
    process.env.HOST = "0.0.0.0";

    const opts = parseCliArgs([]);
    expect(opts.transport).toBe("sse");
    expect(opts.port).toBe(8080);
    expect(opts.host).toBe("0.0.0.0");
  });
});

describe("HTTP SSE Authentication Logic", () => {
  it("should allow any request if expectedApiKey is undefined", () => {
    const mockReq = { headers: {} } as http.IncomingMessage;
    expect(checkAuth(mockReq, undefined)).toBe(true);
  });

  it("should reject request if expectedApiKey is set but no credentials provided", () => {
    const mockReq = { headers: {} } as http.IncomingMessage;
    expect(checkAuth(mockReq, "secret-123")).toBe(false);
  });

  it("should accept valid Authorization Bearer header", () => {
    const mockReq = {
      headers: { authorization: "Bearer secret-123" },
    } as unknown as http.IncomingMessage;
    expect(checkAuth(mockReq, "secret-123")).toBe(true);
  });

  it("should reject incorrect Authorization Bearer header", () => {
    const mockReq = {
      headers: { authorization: "Bearer wrong-key" },
    } as unknown as http.IncomingMessage;
    expect(checkAuth(mockReq, "secret-123")).toBe(false);
  });

  it("should accept valid token in URL search parameters", () => {
    const mockReq = { headers: {} } as http.IncomingMessage;
    const url = new URL("http://localhost:3000/sse?token=secret-123");
    expect(checkAuth(mockReq, "secret-123", url)).toBe(true);
  });

  it("should accept valid apiKey in URL search parameters", () => {
    const mockReq = { headers: {} } as http.IncomingMessage;
    const url = new URL("http://localhost:3000/sse?apiKey=secret-123");
    expect(checkAuth(mockReq, "secret-123", url)).toBe(true);
  });
});

describe("HTTP Server Endpoints", () => {
  let server: http.Server;
  let port: number;

  function mockServerFactory(): McpServer {
    return new McpServer({
      name: "mock-server",
      version: "1.0.0",
    });
  }

  function makeRequest(
    method: string,
    path: string,
    headers: Record<string, string> = {},
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path,
          method,
          headers,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            resolve({
              status: res.statusCode || 0,
              headers: res.headers,
              body: data,
            });
          });
        },
      );
      req.on("error", reject);
      req.end();
    });
  }

  afterEach(async () => {
    if (server && server.listening) {
      if (typeof server.closeAllConnections === "function") {
        server.closeAllConnections();
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("should return 200 OK on GET /health", async () => {
    const httpSetup = createHttpServer({
      serverFactory: mockServerFactory,
    });
    server = httpSetup.server;

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (typeof addr === "object" && addr) {
          port = addr.port;
        }
        resolve();
      });
    });

    const res = await makeRequest("GET", "/health");
    expect(res.status).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.status).toBe("ok");
    expect(parsed.transport).toBe("sse");
  });

  it("should respond to OPTIONS with 204 and CORS headers", async () => {
    const httpSetup = createHttpServer({
      serverFactory: mockServerFactory,
    });
    server = httpSetup.server;

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (typeof addr === "object" && addr) {
          port = addr.port;
        }
        resolve();
      });
    });

    const res = await makeRequest("OPTIONS", "/sse");
    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("*");
  });

  it("should enforce authentication when apiKey is configured", async () => {
    const httpSetup = createHttpServer({
      serverFactory: mockServerFactory,
      apiKey: "my-secure-key",
    });
    server = httpSetup.server;

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (typeof addr === "object" && addr) {
          port = addr.port;
        }
        resolve();
      });
    });

    // Unauthenticated request to /sse should return 401
    const unauthRes = await makeRequest("GET", "/sse");
    expect(unauthRes.status).toBe(401);

    // Request with missing sessionId to /messages with auth should return 400
    const authRes = await makeRequest("POST", "/messages", {
      authorization: "Bearer my-secure-key",
    });
    expect(authRes.status).toBe(400);

    // Request with non-existent sessionId to /messages with auth should return 404
    const notFoundSessionRes = await makeRequest("POST", "/messages?sessionId=non-existent", {
      authorization: "Bearer my-secure-key",
    });
    expect(notFoundSessionRes.status).toBe(404);
  });
});
