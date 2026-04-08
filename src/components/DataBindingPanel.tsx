import React, { useEffect, useMemo, useState } from "react";
import { ColumnMapper } from "./ColumnMapper";
import { FilterBuilder } from "./FilterBuilder";
import type {
  BerichtInfo,
  ColumnMetadata,
  QueryConfig,
  QueryFilter,
  QueryTemplate,
  SlideBlock,
  TableMetadata,
} from "../types/slide";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface DataBindingPanelProps {
  block: SlideBlock;
  query: QueryConfig | null;
  tables: TableMetadata[];
  columns: ColumnMetadata[];
  loadingTables: boolean;
  queryTemplates: QueryTemplate[];
  berichte: BerichtInfo[];
  onQueryChange: (partial: Partial<QueryConfig>) => void;
  onApplyQueryTemplate: (template: QueryTemplate) => void;
  onSaveQueryTemplate: (name: string, description?: string) => void;
  onSaveBlockTemplate: (name: string, description?: string) => void;
  loadColumns: (tableName: string) => Promise<ColumnMetadata[]>;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "5px",
  color: "#e2e8f0",
  fontSize: "12px",
  padding: "6px 9px",
  outline: "none",
  fontFamily: "inherit",
};

function filtersToEntries(filters: Record<string, unknown> | undefined): QueryFilter[] {
  return Object.entries(filters ?? {}).map(([key, value]) => ({ key, value: String(value) }));
}

function entriesToFilters(filters: QueryFilter[]): Record<string, unknown> {
  return filters.reduce<Record<string, unknown>>((accumulator, filter) => {
    if (filter.key.trim()) {
      accumulator[filter.key.trim()] = filter.value;
    }
    return accumulator;
  }, {});
}

export function DataBindingPanel({
  block,
  query,
  tables,
  columns,
  loadingTables,
  queryTemplates,
  berichte,
  onQueryChange,
  onApplyQueryTemplate,
  onSaveQueryTemplate,
  onSaveBlockTemplate,
  loadColumns,
}: DataBindingPanelProps) {
  const [filterDraft, setFilterDraft] = useState<QueryFilter[]>(filtersToEntries(query?.filters));
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    setFilterDraft(filtersToEntries(query?.filters));
  }, [query?.filters]);

  useEffect(() => {
    if (query?.table) {
      void loadColumns(query.table);
    }
  }, [loadColumns, query?.table]);

  const templateOptions = useMemo(() => {
    return queryTemplates.map((template) => (
      <option key={template.id} value={template.id}>
        {template.name}
      </option>
    ));
  }, [queryTemplates]);

  const handleFilterChange = (filters: QueryFilter[]) => {
    setFilterDraft(filters);
    onQueryChange({ filters: entriesToFilters(filters) });
  };

  const handlePreview = async () => {
    if (!query?.table) {
      setPreviewError("Bitte zuerst eine Tabelle wählen.");
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const response = await fetch("/api/query-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: query.table,
          filters: query.filters,
          selectedColumns: query.selectedColumns,
          limit: Math.min(query.limit ?? 10, 10),
        }),
      });

      const payload = (await response.json()) as ApiResponse<Record<string, unknown>[]>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? `Preview failed: ${response.status}`);
      }

      setPreviewRows(payload.data);
    } catch (err) {
      setPreviewError(String(err));
      setPreviewRows([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>
        Datenbindung
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "5px" }}>
          Gespeicherte Query anwenden
        </div>
        <select
          style={inputStyle}
          value=""
          onChange={(event) => {
            const selected = queryTemplates.find((template) => template.id === event.target.value);
            if (selected) {
              onApplyQueryTemplate(selected);
            }
          }}
        >
          <option value="">Vorlage auswählen</option>
          {templateOptions}
        </select>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "5px" }}>
          Datenquelle
        </div>
        <select style={inputStyle} value={query?.source ?? "mssql"} onChange={(event) => onQueryChange({ source: event.target.value as QueryConfig["source"] })}>
          <option value="mssql">MS SQL</option>
          <option value="static">Statisch</option>
        </select>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "5px" }}>
          Tabelle
        </div>
        <select
          style={inputStyle}
          value={query?.table ?? ""}
          onChange={(event) => onQueryChange({ table: event.target.value, labelColumn: undefined, valueColumn: undefined, valueColumns: [], selectedColumns: [] })}
          disabled={loadingTables}
        >
          <option value="">Tabelle auswählen</option>
          {tables.map((table) => (
            <option key={table.fullName} value={table.fullName}>
              {table.fullName}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "5px" }}>
          Bericht
        </div>
        <select
          style={inputStyle}
          value={String(query?.filters?.Berichts_ID ?? "")}
          onChange={(event) => {
            const val = event.target.value;
            const next = { ...(query?.filters ?? {}) };
            if (val) {
              next.Berichts_ID = Number(val);
            } else {
              delete next.Berichts_ID;
            }
            onQueryChange({ filters: next });
          }}
          disabled={berichte.length === 0}
        >
          <option value="">Alle Berichte</option>
          {berichte.map((b) => (
            <option key={b.Berichts_ID} value={String(b.Berichts_ID)}>
              {b.Berichtsname}
            </option>
          ))}
        </select>
        {berichte.length === 0 && (
          <div style={{ fontSize: "11px", marginTop: "6px", color: "rgba(255,255,255,0.45)" }}>
            Keine Berichte geladen (Backend/API aktuell nicht erreichbar).
          </div>
        )}
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "5px" }}>
          Zeilenlimit
        </div>
        <input
          type="number"
          min={1}
          max={500}
          style={inputStyle}
          value={query?.limit ?? 100}
          onChange={(event) => onQueryChange({ limit: Math.max(1, Number(event.target.value) || 100) })}
        />
      </div>

      {query?.table && columns.length > 0 && (
        <ColumnMapper blockType={block.type} columns={columns} query={query} onChange={onQueryChange} />
      )}

      <div style={{ marginTop: "14px", marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "5px" }}>
          Filter
        </div>
        <FilterBuilder filters={filterDraft} onChange={handleFilterChange} />
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button
          onClick={handlePreview}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: "5px",
            color: "rgba(255,255,255,0.8)",
            cursor: "pointer",
            padding: "8px 10px",
            fontSize: "12px",
          }}
        >
          {previewLoading ? "Lädt..." : "Vorschau laden"}
        </button>
        <button
          onClick={() => {
            const name = window.prompt("Name für Query-Vorlage", query?.name ?? `${block.type}-query`);
            if (name) {
              const description = window.prompt("Beschreibung (optional)", "") ?? undefined;
              onSaveQueryTemplate(name, description || undefined);
            }
          }}
          style={{
            flex: 1,
            background: "transparent",
            border: "1px dashed rgba(255,255,255,0.2)",
            borderRadius: "5px",
            color: "rgba(255,255,255,0.8)",
            cursor: "pointer",
            padding: "8px 10px",
            fontSize: "12px",
          }}
        >
          Query speichern
        </button>
      </div>

      <button
        onClick={() => {
          const name = window.prompt("Name für Block-Vorlage", block.type);
          if (name) {
            const description = window.prompt("Beschreibung (optional)", "") ?? undefined;
            onSaveBlockTemplate(name, description || undefined);
          }
        }}
        style={{
          width: "100%",
          background: "transparent",
          border: "1px dashed rgba(255,255,255,0.2)",
          borderRadius: "5px",
          color: "rgba(255,255,255,0.8)",
          cursor: "pointer",
          padding: "8px 10px",
          fontSize: "12px",
          marginBottom: "12px",
        }}
      >
        Block mit Datenbindung speichern
      </button>

      {previewError && <div style={{ color: "#fca5a5", fontSize: "11px", marginBottom: "10px" }}>{previewError}</div>}

      {previewRows.length > 0 && (
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "5px", overflow: "hidden" }}>
          <div style={{ maxHeight: "140px", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                  {Object.keys(previewRows[0]).map((key) => (
                    <th key={key} style={{ padding: "6px 8px", textAlign: "left", color: "rgba(255,255,255,0.75)" }}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {Object.entries(row).map(([key, value]) => (
                      <td key={key} style={{ padding: "6px 8px", color: "rgba(255,255,255,0.7)" }}>
                        {String(value ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}