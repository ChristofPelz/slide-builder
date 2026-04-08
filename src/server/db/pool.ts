import sql, { ConnectionPool } from "mssql";
import { config } from "../config.js";
import type { IResult } from "mssql";

/**
 * Central MSSQL Connection Pool
 * - Lazy initialization on first use
 * - Graceful shutdown on process exit
 * - Error handling and retries
 */

let pool: ConnectionPool | null = null;
let poolPromise: Promise<ConnectionPool> | null = null;

export async function getPool(): Promise<ConnectionPool> {
  // Return existing pool if available
  if (pool) {
    return pool;
  }

  // If pool is currently initializing, wait for it
  if (poolPromise) {
    return poolPromise;
  }

  // Initialize new pool
  poolPromise = initializePool();
  pool = await poolPromise;
  poolPromise = null;

  return pool;
}

async function initializePool(): Promise<ConnectionPool> {
  const connectionOptions: Record<string, unknown> = {
    encrypt: config.db.encrypt,
    trustServerCertificate: config.db.trustServerCertificate,
    enableKeepAlive: true,
    requestTimeout: 30000,
  };

  if (config.db.instanceName) {
    connectionOptions.instanceName = config.db.instanceName;
  }

  const newPool = new sql.ConnectionPool({
    server: config.db.host,
    ...(config.db.port ? { port: config.db.port } : {}),
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    options: connectionOptions,
    pool: {
      min: 2,
      max: config.db.poolSize,
      idleTimeoutMillis: 30000,
    },
  } as any);

  newPool.on("error", (err: Error) => {
    console.error("[DB Pool Error]", err);
    pool = null;
  });

  try {
    await newPool.connect();
    console.log("[DB] Connection pool created successfully");
    return newPool;
  } catch (err) {
    console.error("[DB] Failed to create connection pool", err);
    throw err;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      console.log("[DB] Connection pool closed");
      pool = null;
    } catch (err) {
      console.error("[DB] Error closing pool", err);
    }
  }
}

/**
 * Execute a parameterized query
 */
export async function executeQuery<T extends Record<string, any> = Record<string, any>>(
  query: string,
  params?: Record<string, any>
): Promise<IResult<T>> {
  const connPool = await getPool();
  const request = connPool.request();

  // Add parameters if provided
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
  }

  try {
    const result = await request.query<T>(query);
    return result;
  } catch (err) {
    console.error("[DB Query Error]", { query, params, error: err });
    throw err;
  }
}

/**
 * Check if pool is connected
 */
export async function isConnected(): Promise<boolean> {
  try {
    const connPool = await getPool();
    return connPool.connected;
  } catch {
    return false;
  }
}

// Graceful shutdown on process termination
process.on("SIGTERM", async () => {
  console.log("[Shutdown] SIGTERM received, closing database connection...");
  await closePool();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[Shutdown] SIGINT received, closing database connection...");
  await closePool();
  process.exit(0);
});
