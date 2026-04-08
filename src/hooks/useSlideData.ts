// hooks/useSlideData.ts
// Fetches live data from Supabase or MSSQL proxy and injects into block configs

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import type {
  QueryConfig,
  SlideBlock,
  ChartBlock,
  KPIBlock,
  TableBlock,
} from "../types/slide";

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase ist nicht konfiguriert. Bitte Datenquelle auf MSSQL lassen.");
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

// ─── Supabase Query ───────────────────────────────────────────
async function fetchFromSupabase(q: QueryConfig): Promise<Record<string, unknown>[]> {
  const supabase = getSupabaseClient();
  if (q.sql) {
    // Raw SQL via Supabase RPC (requires a Postgres function `run_query(sql_text text)`)
    const { data, error } = await (supabase as any).rpc("run_query", { sql_text: q.sql });
    if (error) throw error;
    return data as Record<string, unknown>[];
  }

  let query: any = supabase.from(q.table!).select("*");
  if (q.filters) {
    for (const [key, value] of Object.entries(q.filters)) {
      query = query.eq(key, value);
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}

// ─── MSSQL Proxy ─────────────────────────────────────────────
// Express server: POST http://localhost:4001/query
async function fetchFromMSSQL(q: QueryConfig): Promise<Record<string, unknown>[]> {
  const resp = await fetch("/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sql: q.sql,
      table: q.table,
      filters: q.filters,
      selectedColumns: q.selectedColumns,
      limit: q.limit,
    }),
  });
  if (!resp.ok) throw new Error(`MSSQL proxy error: ${resp.status}`);
  const payload = (await resp.json()) as {
    success?: boolean;
    data?: Record<string, unknown>[];
    error?: string;
  };

  if (payload.success === false) {
    throw new Error(payload.error ?? "Unknown MSSQL proxy error");
  }

  return payload.data ?? [];
}

// ─── Data → Block mapping ─────────────────────────────────────
function applyDataToBlock(
  block: SlideBlock,
  data: Record<string, unknown>[],
  query: QueryConfig
): SlideBlock {
  if (block.type === "chart") {
    const cb = block as ChartBlock;
    const labels = data.map((r) => String(r[query.labelColumn ?? "label"]));
    const seriesColumns = query.valueColumns?.length
      ? query.valueColumns
      : [query.valueColumn ?? "value"];

    const nextDatasets = seriesColumns.map((column, datasetIndex) => ({
      ...(cb.datasets[datasetIndex] ?? {
        label: column,
        data: [],
      }),
      label: cb.datasets[datasetIndex]?.label ?? column,
      color: cb.datasets[datasetIndex]?.color,
      data: data.map((row) => Number(row[column] ?? 0)),
    }));

    return {
      ...cb,
      labels,
      datasets: nextDatasets,
    };
  }

  if (block.type === "kpi") {
    const kb = block as KPIBlock;
    const agg = query.aggregation ?? "sum";
    const col = query.valueColumn ?? "value";
    const aggregated =
      agg === "avg"   ? data.reduce((acc, r) => acc + Number(r[col]), 0) / (data.length || 1) :
      agg === "count" ? data.length :
      agg === "max"   ? Math.max(...data.map((r) => Number(r[col]))) :
      agg === "min"   ? Math.min(...data.map((r) => Number(r[col]))) :
                        data.reduce((acc, r) => acc + Number(r[col]), 0); // sum
    return { ...kb, value: aggregated };
  }

  if (block.type === "table") {
    const tb = block as TableBlock;
    const selectedColumns = query.selectedColumns?.length
      ? query.selectedColumns
      : tb.columns.map((column) => column.key);

    const columns = selectedColumns.map((column) => {
      const existing = tb.columns.find((entry) => entry.key === column);
      return existing ?? {
        key: column,
        label: column,
        align: "left" as const,
        format: "text" as const,
      };
    });

    const rows = data.map((row) => {
      const mappedRow: Record<string, string | number> = {};
      columns.forEach((column) => {
        const value = row[column.key];
        mappedRow[column.key] =
          typeof value === "number" || typeof value === "string"
            ? value
            : value == null
              ? ""
              : String(value);
      });
      return mappedRow;
    });

    return {
      ...tb,
      columns,
      rows,
    };
  }

  return block;
}

// ─── Hook ─────────────────────────────────────────────────────
export function useSlideData(
  blocks: SlideBlock[],
  queries: QueryConfig[]
): { resolvedBlocks: SlideBlock[]; loading: boolean; error: string | null; refresh: () => void } {
  const [resolvedBlocks, setResolvedBlocks] = useState<SlideBlock[]>(blocks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const queryMap = new Map(queries.map((q) => [q.id, q]));
    const needsData = blocks.filter(
      (b) => (b as ChartBlock | KPIBlock).queryId &&
        queryMap.has((b as ChartBlock | KPIBlock).queryId!)
    );

    if (needsData.length === 0) {
      setResolvedBlocks(blocks);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updated = await Promise.all(
        blocks.map(async (block) => {
          const qid = (block as ChartBlock | KPIBlock).queryId;
          if (!qid) return block;
          const query = queryMap.get(qid);
          if (!query) return block;

          if (query.source === "static") {
            return block;
          }

          const data = query.source === "mssql"
            ? await fetchFromMSSQL(query)
            : await fetchFromSupabase(query);

          return applyDataToBlock(block, data, query);
        })
      );
      setResolvedBlocks(updated);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [blocks, queries]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { resolvedBlocks, loading, error, refresh: fetchAll };
}
