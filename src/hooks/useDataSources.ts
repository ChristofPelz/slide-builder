import { useCallback, useMemo, useState } from "react";
import type { BerichtInfo, ColumnMetadata, TableMetadata } from "../types/slide";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  if (!payload.success) {
    throw new Error(payload.error ?? "API request failed");
  }

  return payload.data;
}

export function useDataSources() {
  const [tables, setTables] = useState<TableMetadata[]>([]);
  const [columnsByTable, setColumnsByTable] = useState<Record<string, ColumnMetadata[]>>({});
  const [berichte, setBerichte] = useState<BerichtInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchApi<TableMetadata[]>("/api/tables");
      setTables(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadColumns = useCallback(async (tableName: string) => {
    if (!tableName || columnsByTable[tableName]) {
      return columnsByTable[tableName] ?? [];
    }

    const data = await fetchApi<ColumnMetadata[]>(`/api/tables/${encodeURIComponent(tableName)}/columns`);
    setColumnsByTable((prev) => ({ ...prev, [tableName]: data }));
    return data;
  }, [columnsByTable]);

  const loadBerichte = useCallback(async () => {
    if (berichte.length > 0) return;
    try {
      const data = await fetchApi<BerichtInfo[]>("/api/berichte");
      setBerichte(data);
    } catch {
      // Backend may not be running yet; silently ignore
    }
  }, [berichte.length]);

  const numericColumnsByTable = useMemo(() => {
    return Object.fromEntries(
      Object.entries(columnsByTable).map(([tableName, columns]) => [
        tableName,
        columns.filter((column) => column.isNumeric),
      ])
    ) as Record<string, ColumnMetadata[]>;
  }, [columnsByTable]);

  return {
    tables,
    columnsByTable,
    numericColumnsByTable,
    loading,
    error,
    loadTables,
    loadColumns,
    berichte,
    loadBerichte,
  };
}