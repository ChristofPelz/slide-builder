import dotenv from "dotenv";

/**
 * Load and validate environment variables for MSSQL backend.
 * Supports local .env.local and fallback defaults for development.
 */

dotenv.config({ path: ".env.local" });

export interface DBConfig {
  host: string;
  port?: number;
  instanceName?: string;
  user: string;
  password: string;
  database: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
  poolSize: number;
}

export interface ServerConfig {
  port: number;
  db: DBConfig;
}

const validateEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] || fallback;
  if (!value && !fallback) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || "";
};

function parseServerHost(rawHost: string): { host: string; instanceName?: string } {
  const explicitInstance = process.env.DB_INSTANCE?.trim();
  if (explicitInstance) {
    return { host: rawHost, instanceName: explicitInstance };
  }

  // Support DB_HOST="MACHINE\\INSTANCE" in .env.local
  if (rawHost.includes("\\")) {
    const [host, instanceName] = rawHost.split("\\");
    if (host && instanceName) {
      return { host, instanceName };
    }
  }

  return { host: rawHost };
}

const rawHost = validateEnv("DB_HOST", "localhost");
const parsedHost = parseServerHost(rawHost);

export const config: ServerConfig = {
  port: parseInt(process.env.SERVER_PORT || "4110", 10),
  db: {
    host: parsedHost.host,
    instanceName: parsedHost.instanceName,
    port: parsedHost.instanceName
      ? undefined
      : parseInt(process.env.DB_PORT || "1433", 10),
    user: validateEnv("DB_USER", "sa"),
    password: validateEnv("DB_PASSWORD", ""),
    database: validateEnv("DB_DATABASE", "slide_builder"),
    encrypt: process.env.DB_ENCRYPT !== "false",
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERT === "true" ||
      process.env.NODE_ENV === "development",
    poolSize: parseInt(process.env.DB_POOL_SIZE || "10", 10),
  },
};

export const isDevelopment = process.env.NODE_ENV !== "production";

export function logConfig() {
  console.log("[Config] Server listening on port:", config.port);
  console.log("[Config] Database:", {
    host: config.db.host,
    instanceName: config.db.instanceName,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
  });
}
