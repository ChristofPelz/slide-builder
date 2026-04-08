import { Router, type Request, type Response } from "express";
import { executeDataQuery, type QueryPayload } from "../db/queryExecutor.js";
import { getColumnMetadata, getTableMetadata, getBerichte } from "../db/queries.js";

const router = Router();

/**
 * POST /query
 * Data proxy endpoint for fetching data for charts, KPIs, tables
 * 
 * Request body: { sql?: string, table?: string, filters?: {}, limit?: number, offset?: number }
 * 
 * Returns: { success: true, data: Record<string, unknown>[] } | { success: false, error: string }
 */
router.post("/query", async (req: Request, res: Response) => {
  try {
    const payload = req.body as QueryPayload;

    // Basic validation
    if (!payload.sql && !payload.table) {
      return res.status(400).json({
        success: false,
        error: "Either 'sql' or 'table' must be provided",
      });
    }

    // If SQL is provided, do basic safety validation
    if (payload.sql) {
      const upperSql = payload.sql.toUpperCase().trim();

      // Ensure it starts with SELECT
      if (!upperSql.startsWith("SELECT")) {
        return res.status(400).json({
          success: false,
          error: "Only SELECT statements are allowed",
        });
      }

      // Check for dangerous keywords
      const dangerousKeywords = ["DROP", "DELETE", "INSERT", "UPDATE", "EXEC", "EXECUTE"];
      for (const keyword of dangerousKeywords) {
        if (upperSql.includes(` ${keyword} `)) {
          return res.status(400).json({
            success: false,
            error: `'${keyword}' statements are not allowed`,
          });
        }
      }
    }

    // Execute the query
    const data = await executeDataQuery(payload, 10000); // Max 10k rows per query

    res.json({ success: true, data });
  } catch (err) {
    console.error("[Route] POST /query error", err);

    const errorMessage = err instanceof Error ? err.message : String(err);
    const statusCode = errorMessage.includes("not allowed") ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: "Query execution failed",
      details: errorMessage,
    });
  }
});

router.post("/api/query-preview", async (req: Request, res: Response) => {
  try {
    const payload = req.body as QueryPayload;

    if (!payload.table) {
      return res.status(400).json({
        success: false,
        error: "Preview requires a table",
      });
    }

    const data = await executeDataQuery({ ...payload, limit: Math.min(payload.limit || 25, 25) }, 25);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Preview failed",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

router.get("/api/tables", async (_req: Request, res: Response) => {
  try {
    const tables = await getTableMetadata();
    res.json({ success: true, data: tables });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch tables",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

router.get("/api/tables/:tableName/columns", async (req: Request, res: Response) => {
  try {
    const rawTableName = Array.isArray(req.params.tableName)
      ? req.params.tableName[0]
      : req.params.tableName;
    const tableName = decodeURIComponent(rawTableName);
    const columns = await getColumnMetadata(tableName);
    res.json({ success: true, data: columns });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch columns",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

router.get("/api/berichte", async (_req: Request, res: Response) => {
  try {
    const data = await getBerichte();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch Berichte",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
