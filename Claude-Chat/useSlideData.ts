// hooks/useSlideData.ts
// Fetches live data from Supabase or MSSQL proxy and injects into block configs

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { QueryConfig, SlideBlock, ChartBlock, KPIBlock } from "../types";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Supabase Query ───────────────────────────────────────────
async function fetchFromSupabase(q: QueryConfig): Promise<Record<string, unknown>[]> {
  if (q.sql) {
    // Raw SQL via Supabase RPC (create a Postgres function `run_query(sql text)`)
    const { data, error } = await supabase.rpc("run_query", { sql_text: q.sql });
    if (error) throw error;
    return data as Record<string, unknown>[];
  }

  let query = supabase.from(q.table!).select("*");
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
// A small Express server runs locally: POST http://localhost:4001/query
async function fetchFromMSSQL(q: QueryConfig): Promise<Record<string, unknown>[]> {
  const resp = await fetch("http://localhost:4001/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql: q.sql, table: q.table, filters: q.filters }),
  });
  if (!resp.ok) throw new Error(`MSSQL proxy error: ${resp.status}`);
  return resp.json() as Promise<Record<string, unknown>[]>;
}

// ─── Data → Block mapping ─────────────────────────────────────
function applyDataToBlock(
  block: SlideBlock,
  data: Record<string, unknown>[],
  query: QueryConfig
): SlideBlock {
  if (block.type === "chart") {
    const cb = block as ChartBlock;
    // Expect rows: [{label: "Jan", value: 1000}, ...]
    const labels = data.map((r) => String(r[query.labelColumn ?? "label"]));
    const values = data.map((r) => Number(r[query.valueColumn ?? "value"]));
    return {
      ...cb,
      labels,
      datasets: [{ ...cb.datasets[0], data: values }],
    };
  }

  if (block.type === "kpi") {
    const kb = block as KPIBlock;
    const agg = query.aggregation ?? "sum";
    const col = query.valueColumn ?? "value";
    const aggregated =
      agg === "sum"
        ? data.reduce((acc, r) => acc + Number(r[col]), 0)
        : agg === "avg"
        ? data.reduce((acc, r) => acc + Number(r[col]), 0) / (data.length || 1)
        : agg === "count"
        ? data.length
        : Number(data[0]?.[col] ?? 0);
    return { ...kb, value: aggregated };
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
          const qid = (block as ChartBlock).queryId;
          if (!qid) return block;
          const query = queryMap.get(qid);
          if (!query) return block;

          const data =
            query.source === "mssql"
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

  useEffect(() => { fetchAll(); }, []);

  return { resolvedBlocks, loading, error, refresh: fetchAll };
}
