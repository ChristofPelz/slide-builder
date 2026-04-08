import React from "react";
import type { QueryFilter } from "../types/slide";

interface FilterBuilderProps {
  filters: QueryFilter[];
  onChange: (filters: QueryFilter[]) => void;
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

export function FilterBuilder({ filters, onChange }: FilterBuilderProps) {
  const updateFilter = (index: number, next: QueryFilter) => {
    onChange(filters.map((filter, filterIndex) => (filterIndex === index ? next : filter)));
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, filterIndex) => filterIndex !== index));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {filters.map((filter, index) => (
        <div key={`${filter.key}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "6px" }}>
          <input
            style={inputStyle}
            value={filter.key}
            placeholder="Spalte"
            onChange={(event) => updateFilter(index, { ...filter, key: event.target.value })}
          />
          <input
            style={inputStyle}
            value={filter.value}
            placeholder="Wert"
            onChange={(event) => updateFilter(index, { ...filter, value: event.target.value })}
          />
          <button
            onClick={() => removeFilter(index)}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "5px",
              color: "rgba(255,255,255,0.55)",
              cursor: "pointer",
              padding: "0 10px",
            }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...filters, { key: "", value: "" }])}
        style={{
          width: "100%",
          background: "transparent",
          border: "1px dashed rgba(255,255,255,0.2)",
          borderRadius: "5px",
          color: "rgba(255,255,255,0.7)",
          cursor: "pointer",
          padding: "7px 9px",
          fontSize: "12px",
        }}
      >
        + Filter hinzufügen
      </button>
    </div>
  );
}