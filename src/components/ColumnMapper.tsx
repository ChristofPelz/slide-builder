import React from "react";
import type { BlockType, ColumnMetadata, QueryConfig } from "../types/slide";

interface ColumnMapperProps {
  blockType: BlockType;
  columns: ColumnMetadata[];
  query: QueryConfig;
  onChange: (partial: Partial<QueryConfig>) => void;
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

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "5px" }}>
        {label}
      </div>
      <select style={inputStyle} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Bitte wählen</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ColumnMapper({ blockType, columns, query, onChange }: ColumnMapperProps) {
  const numericColumns = columns.filter((column) => column.isNumeric).map((column) => column.name);
  const allColumns = columns.map((column) => column.name);
  const selectedValueColumns = query.valueColumns?.length
    ? query.valueColumns
    : query.valueColumn
      ? [query.valueColumn]
      : [];

  const toggleValueColumn = (columnName: string) => {
    const next = selectedValueColumns.includes(columnName)
      ? selectedValueColumns.filter((entry) => entry !== columnName)
      : [...selectedValueColumns, columnName];
    onChange({ valueColumns: next, valueColumn: next[0] });
  };

  const toggleTableColumn = (columnName: string) => {
    const selectedColumns = query.selectedColumns ?? [];
    const next = selectedColumns.includes(columnName)
      ? selectedColumns.filter((entry) => entry !== columnName)
      : [...selectedColumns, columnName];
    onChange({ selectedColumns: next });
  };

  if (blockType === "chart") {
    return (
      <>
        <SelectField
          label="Beschriftungsspalte"
          value={query.labelColumn ?? ""}
          options={allColumns}
          onChange={(value) => onChange({ labelColumn: value })}
        />
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "5px" }}>
            Wertespalten
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "132px", overflowY: "auto" }}>
            {numericColumns.map((columnName) => (
              <label key={columnName} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.72)" }}>
                <input
                  type="checkbox"
                  checked={selectedValueColumns.includes(columnName)}
                  onChange={() => toggleValueColumn(columnName)}
                />
                <span>{columnName}</span>
              </label>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (blockType === "kpi") {
    return (
      <>
        <SelectField
          label="Wertespalte"
          value={query.valueColumn ?? ""}
          options={numericColumns}
          onChange={(value) => onChange({ valueColumn: value })}
        />
        <SelectField
          label="Aggregation"
          value={query.aggregation ?? "sum"}
          options={["sum", "avg", "count", "max", "min"]}
          onChange={(value) => onChange({ aggregation: value as QueryConfig["aggregation"] })}
        />
      </>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "170px", overflowY: "auto", marginBottom: "10px" }}>
      {allColumns.map((columnName) => (
        <label key={columnName} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.72)" }}>
          <input
            type="checkbox"
            checked={(query.selectedColumns ?? []).includes(columnName)}
            onChange={() => toggleTableColumn(columnName)}
          />
          <span>{columnName}</span>
        </label>
      ))}
    </div>
  );
}