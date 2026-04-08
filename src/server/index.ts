import express, { type Request, type Response } from "express";
import cors from "cors";
import { config, logConfig, isDevelopment } from "./config.js";
import { getPool, isConnected, closePool } from "./db/pool.js";
import { ensureSchema } from "./db/queries.js";
import templatesRouter from "./routes/templates.js";
import dataRouter from "./routes/data.js";
import queryTemplatesRouter from "./routes/query-templates.js";

const app = express();

/**
 * Middleware
 */
app.use(express.json({ limit: "10mb" }));
app.use(cors({
  origin: isDevelopment ? "*" : process.env.CORS_ORIGIN,
  credentials: true,
}));

/**
 * Logging middleware (development)
 */
if (isDevelopment) {
  app.use((req: Request, _res: Response, next) => {
    console.log(`[${req.method}] ${req.path}`);
    next();
  });
}

/**
 * Health check endpoint
 */
app.get("/health", async (_req: Request, res: Response) => {
  try {
    const connected = await isConnected();
    res.json({
      status: connected ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      database: connected ? "connected" : "disconnected",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    const connected = await isConnected();
    res.json({
      status: connected ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      database: connected ? "connected" : "disconnected",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

/**
 * API Routes
 */

// Templates CRUD endpoints
app.use("/api", templatesRouter);
app.use("/api", queryTemplatesRouter);

// Data proxy endpoint (for charts, KPIs, etc.)
app.use("/", dataRouter);

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    path: req.path,
  });
});

/**
 * Error handler
 */
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error("[Server Error]", err);

  res.status(err.status || 500).json({
    success: false,
    error: "Internal server error",
    ...(isDevelopment && { details: err.message }),
  });
});

/**
 * Startup
 */
async function start() {
  try {
    // Log configuration
    logConfig();

    // Initialize database connection pool
    console.log("[Server] Initializing database connection...");
    await getPool();

    // Ensure schema exists
    console.log("[Server] Ensuring database schema...");
    await ensureSchema();

    // Start listening
    app.listen(config.port, () => {
      console.log(`[Server] Listening on http://localhost:${config.port}`);
      console.log(
        `[Server] Health check: http://localhost:${config.port}/health`
      );
    });
  } catch (err) {
    console.error("[Server] Failed to start", err);
    await closePool();
    process.exit(1);
  }
}

start();

export default app;
