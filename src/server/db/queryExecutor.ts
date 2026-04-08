import { executeQuery } from "./pool.js";

/**
 * Generic query executor for data proxy endpoints
 * Handles SQL and table-based queries with security constraints
 */

export interface QueryPayload {
  sql?: string;
  table?: string;
  filters?: Record<string, unknown>;
  selectedColumns?: string[];
  limit?: number;
  offset?: number;
}

function normalizeTableName(tableName: string): { schema: string; name: string; fullName: string } {
  const sanitized = tableName.replace(/[\[\]]/g, "");
  if (sanitized.includes(".")) {
    const [schema, name] = sanitized.split(".");
    return { schema, name, fullName: `${schema}.${name}` };
  }

  return { schema: "dbo", name: sanitized, fullName: `dbo.${sanitized}` };
}

async function ensureAllowedTable(tableName: string): Promise<{ schema: string; name: string; fullName: string }> {
  const normalized = normalizeTableName(tableName);
  const result = await executeQuery<{ count: number }>(
    `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = @schemaName
        AND TABLE_NAME = @tableName
        AND TABLE_TYPE IN ('BASE TABLE', 'VIEW')
    `,
    {
      schemaName: normalized.schema,
      tableName: normalized.name,
    }
  );

  if (!result.recordset[0] || result.recordset[0].count < 1) {
    throw new Error(`Table '${tableName}' is not available`);
  }

  return normalized;
}

/**
 * Execute a secure data query
 * - Only SELECT statements allowed
 * - If sql is provided, it's executed directly (already validated by route handler)
 * - If table is provided, a safe SELECT * is constructed
 */
export async function executeDataQuery(
  payload: QueryPayload,
  maxRows = 1000
): Promise<Record<string, unknown>[]> {
  let query = "";
  const params: Record<string, unknown> = {};

  if (payload.sql) {
    // Direct SQL (must be SELECT and already cleaned by route handler)
    query = payload.sql;
  } else if (payload.table) {
    const table = await ensureAllowedTable(payload.table);

    const whereClausesParts: string[] = [];
    const selectedColumns =
      payload.selectedColumns && payload.selectedColumns.length > 0
        ? payload.selectedColumns.map((column) => `[${column.replace(/[\[\]]/g, "")}]`).join(", ")
        : "*";

    if (payload.filters) {
      let filterIndex = 0;
      for (const [key, value] of Object.entries(payload.filters)) {
        const paramKey = `filter_${filterIndex}`;
        whereClausesParts.push(`[${key}] = @${paramKey}`);
        params[paramKey] = value;
        filterIndex++;
      }
    }

    const whereClause =
      whereClausesParts.length > 0 ? `WHERE ${whereClausesParts.join(" AND ")}` : "";
    const limitClause = `OFFSET ${payload.offset || 0} ROWS FETCH NEXT ${Math.min(payload.limit || 100, maxRows)} ROWS ONLY`;

    query = `SELECT ${selectedColumns} FROM [${table.schema}].[${table.name}] ${whereClause} ORDER BY (SELECT NULL) ${limitClause}`;
  } else {
    throw new Error("Either 'sql' or 'table' must be provided");
  }

  // Enforce SELECT-only and prevent dangerous keywords
  const upperQuery = query.toUpperCase().trim();
  if (!upperQuery.startsWith("SELECT")) {
    throw new Error("Only SELECT queries are allowed");
  }

  // Additional safety checks
  const dangerousKeywords = ["DROP", "DELETE", "INSERT", "UPDATE", "EXEC", "EXECUTE"];
  for (const keyword of dangerousKeywords) {
    if (upperQuery.includes(` ${keyword} `)) {
      throw new Error(`'${keyword}' statements are not allowed`);
    }
  }

  const result = await executeQuery<Record<string, unknown>>(query, params);
  return result.recordset;
}
