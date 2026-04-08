import React, { useState } from "react";
import { DataBindingPanel } from "./DataBindingPanel";
import type {
  BerichtInfo,
  ChartBlock,
  ChartDataset,
  ChartType,
  ColumnMetadata,
  KPIBlock,
  QueryConfig,
  QueryTemplate,
  SlideBlock,
  TableBlock,
  TableMetadata,
  TextBlock,
  TextVariant,
} from "../types/slide";
import type { Theme } from "../types/theme";

interface Props {
  block: SlideBlock;
  theme: Theme;
  query: QueryConfig | null;
  tables: TableMetadata[];
  columns: ColumnMetadata[];
  loadingTables: boolean;
  queryTemplates: QueryTemplate[];
  berichte: BerichtInfo[];
  onUpdate: (partial: Partial<SlideBlock>) => void;
  onUpdateQuery: (partial: Partial<QueryConfig>) => void;
  onApplyQueryTemplate: (template: QueryTemplate) => void;
  onSaveQueryTemplate: (name: string, description?: string) => void;
  onSaveBlockTemplate: (name: string, description?: string) => void;
  loadColumns: (tableName: string) => Promise<ColumnMetadata[]>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "5px" }}>
      {children}
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: "16px" }}>{children}</div>;
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

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input style={inputStyle} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      style={inputStyle}
      value={value}
      onChange={(event) => {
        const next = parseFloat(event.target.value);
        if (!Number.isNaN(next)) {
          onChange(next);
        }
      }}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select style={{ ...inputStyle, cursor: "pointer" }} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px", marginBottom: "14px", marginTop: "4px" }}>
      {children}
    </div>
  );
}

const CHART_TYPES: { value: ChartType; label: string; icon: string }[] = [
  { value: "bar", label: "Balken", icon: "▊▊" },
  { value: "line", label: "Linie", icon: "╱╲" },
  { value: "area", label: "Fläche", icon: "◢◣" },
  { value: "pie", label: "Kreis", icon: "◔" },
  { value: "donut", label: "Donut", icon: "◎" },
  { value: "waterfall", label: "Wasserf.", icon: "┴┬" },
];

function ChartTypePicker({ value, onChange, accent }: { value: ChartType; onChange: (v: ChartType) => void; accent: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px" }}>
      {CHART_TYPES.map((chartType) => (
        <button
          key={chartType.value}
          onClick={() => onChange(chartType.value)}
          style={{
            background: value === chartType.value ? accent : "rgba(255,255,255,0.05)",
            border: `1px solid ${value === chartType.value ? accent : "rgba(255,255,255,0.1)"}`,
            borderRadius: "5px",
            color: value === chartType.value ? "#0F1B2D" : "rgba(255,255,255,0.6)",
            fontSize: "11px",
            fontWeight: value === chartType.value ? 700 : 400,
            padding: "6px 4px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <span style={{ fontSize: "14px" }}>{chartType.icon}</span>
          <span>{chartType.label}</span>
        </button>
      ))}
    </div>
  );
}

function LabelsEditor({ labels, onChange }: { labels: string[]; onChange: (labels: string[]) => void }) {
  const [draft, setDraft] = useState(labels.join(", "));

  return (
    <textarea
      style={{ ...inputStyle, resize: "vertical", minHeight: "52px", lineHeight: "1.5" }}
      value={draft}
      placeholder="Jan, Feb, Mär"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onChange(draft.split(",").map((entry) => entry.trim()).filter(Boolean))}
    />
  );
}

function DatasetRow({
  dataset,
  labelCount,
  onUpdate,
  onRemove,
}: {
  dataset: ChartDataset;
  labelCount: number;
  onUpdate: (dataset: ChartDataset) => void;
  onRemove: () => void;
}) {
  const cells = Array.from({ length: labelCount }, (_, index) => dataset.data[index] ?? 0);

  return (
    <div style={{ marginBottom: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "5px", padding: "8px" }}>
      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "8px" }}>
        <input type="color" value={dataset.color ?? "#2D6A9F"} onChange={(event) => onUpdate({ ...dataset, color: event.target.value })} />
        <input style={{ ...inputStyle, flex: 1 }} value={dataset.label} onChange={(event) => onUpdate({ ...dataset, label: event.target.value })} />
        <button onClick={onRemove} style={{ background: "none", border: "none", color: "rgba(255,80,80,0.6)", cursor: "pointer", fontSize: "14px" }}>×</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "6px" }}>
        {cells.map((value, index) => (
          <input
            key={index}
            type="number"
            style={inputStyle}
            value={value}
            onChange={(event) => {
              const next = [...cells];
              next[index] = Number(event.target.value) || 0;
              onUpdate({ ...dataset, data: next });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ChartProperties({ block, theme, onUpdate }: { block: ChartBlock; theme: Theme; onUpdate: (partial: Partial<ChartBlock>) => void }) {
  const addDataset = () => {
    onUpdate({
      datasets: [
        ...block.datasets,
        { label: `Reihe ${block.datasets.length + 1}`, data: new Array(block.labels.length).fill(0), color: "#2D6A9F" },
      ],
    });
  };

  return (
    <>
      <SectionTitle>Diagrammtyp</SectionTitle>
      <Field>
        <ChartTypePicker value={block.chartType} onChange={(chartType) => onUpdate({ chartType })} accent={theme.accent} />
      </Field>
      <SectionTitle>Allgemein</SectionTitle>
      <Field>
        <Label>Titel</Label>
        <TextInput value={block.title ?? ""} onChange={(title) => onUpdate({ title })} placeholder="Diagrammtitel" />
      </Field>
      <Field>
        <Label>Y-Achse Format</Label>
        <Select
          value={block.formatY ?? "number"}
          onChange={(formatY) => onUpdate({ formatY: formatY as ChartBlock["formatY"] })}
          options={[
            { value: "number", label: "Zahl" },
            { value: "currency", label: "Währung" },
            { value: "percent", label: "Prozent" },
          ]}
        />
      </Field>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <label style={{ display: "flex", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
          <input type="checkbox" checked={block.showLegend ?? true} onChange={(event) => onUpdate({ showLegend: event.target.checked })} />
          Legende
        </label>
        <label style={{ display: "flex", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
          <input type="checkbox" checked={block.showGrid ?? true} onChange={(event) => onUpdate({ showGrid: event.target.checked })} />
          Gitternetz
        </label>
      </div>
      <SectionTitle>Kategorien</SectionTitle>
      <Field>
        <Label>Beschriftungen</Label>
        <LabelsEditor labels={block.labels} onChange={(labels) => onUpdate({ labels })} />
      </Field>
      <SectionTitle>Datenreihen</SectionTitle>
      {block.datasets.map((dataset, index) => (
        <DatasetRow
          key={`${dataset.label}-${index}`}
          dataset={dataset}
          labelCount={block.labels.length}
          onUpdate={(nextDataset) => onUpdate({ datasets: block.datasets.map((entry, datasetIndex) => (datasetIndex === index ? nextDataset : entry)) })}
          onRemove={() => onUpdate({ datasets: block.datasets.filter((_, datasetIndex) => datasetIndex !== index) })}
        />
      ))}
      <button onClick={addDataset} style={{ width: "100%", background: "transparent", border: `1px dashed ${theme.accent}`, borderRadius: "5px", color: theme.accent, cursor: "pointer", padding: "7px" }}>
        + Datenreihe hinzufügen
      </button>
    </>
  );
}

function KPIProperties({ block, onUpdate }: { block: KPIBlock; onUpdate: (partial: Partial<KPIBlock>) => void }) {
  return (
    <>
      <SectionTitle>Kennzahl</SectionTitle>
      <Field>
        <Label>Bezeichnung</Label>
        <TextInput value={block.label} onChange={(label) => onUpdate({ label })} />
      </Field>
      <Field>
        <Label>Wert</Label>
        <NumberInput value={typeof block.value === "number" ? block.value : 0} onChange={(value) => onUpdate({ value })} />
      </Field>
      <Field>
        <Label>Format</Label>
        <Select
          value={block.format ?? "number"}
          onChange={(format) => onUpdate({ format: format as KPIBlock["format"] })}
          options={[
            { value: "number", label: "Zahl" },
            { value: "currency", label: "Währung" },
            { value: "percent", label: "Prozent" },
          ]}
        />
      </Field>
      <Field>
        <Label>Präfix</Label>
        <TextInput value={block.prefix ?? ""} onChange={(prefix) => onUpdate({ prefix })} />
      </Field>
      <Field>
        <Label>Einheit</Label>
        <TextInput value={block.unit ?? ""} onChange={(unit) => onUpdate({ unit })} />
      </Field>
      <SectionTitle>Delta / Trend</SectionTitle>
      <Field>
        <Label>Änderung (%)</Label>
        <NumberInput value={block.delta ?? 0} onChange={(delta) => onUpdate({ delta })} />
      </Field>
      <Field>
        <Label>Delta-Beschriftung</Label>
        <TextInput value={block.deltaLabel ?? ""} onChange={(deltaLabel) => onUpdate({ deltaLabel })} />
      </Field>
      <Field>
        <Label>Trend</Label>
        <Select
          value={block.trend ?? "neutral"}
          onChange={(trend) => onUpdate({ trend: trend as KPIBlock["trend"] })}
          options={[
            { value: "up", label: "Aufwärts" },
            { value: "down", label: "Abwärts" },
            { value: "neutral", label: "Neutral" },
          ]}
        />
      </Field>
      <Field>
        <Label>Variante</Label>
        <Select
          value={block.variant ?? "default"}
          onChange={(variant) => onUpdate({ variant: variant as KPIBlock["variant"] })}
          options={[
            { value: "default", label: "Standard" },
            { value: "highlight", label: "Highlight" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </Field>
    </>
  );
}

function TableProperties({ block, onUpdate }: { block: TableBlock; onUpdate: (partial: Partial<TableBlock>) => void }) {
  return (
    <>
      <SectionTitle>Tabelle</SectionTitle>
      <Field>
        <Label>Titel</Label>
        <TextInput value={block.title ?? ""} onChange={(title) => onUpdate({ title })} />
      </Field>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
        <label style={{ display: "flex", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
          <input type="checkbox" checked={block.showHeader ?? true} onChange={(event) => onUpdate({ showHeader: event.target.checked })} />
          Kopfzeile anzeigen
        </label>
        <label style={{ display: "flex", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
          <input type="checkbox" checked={block.striped ?? false} onChange={(event) => onUpdate({ striped: event.target.checked })} />
          Zeilen streifen
        </label>
        <label style={{ display: "flex", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
          <input type="checkbox" checked={block.highlightLast ?? false} onChange={(event) => onUpdate({ highlightLast: event.target.checked })} />
          Letzte Zeile hervorheben
        </label>
      </div>
    </>
  );
}

function TextProperties({ block, onUpdate }: { block: TextBlock; onUpdate: (partial: Partial<TextBlock>) => void }) {
  return (
    <>
      <SectionTitle>Inhalt</SectionTitle>
      <Field>
        <Label>Text</Label>
        <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px", lineHeight: "1.5" }} value={block.content} onChange={(event) => onUpdate({ content: event.target.value })} />
      </Field>
      <Field>
        <Label>Variante</Label>
        <Select
          value={block.variant ?? "body"}
          onChange={(variant) => onUpdate({ variant: variant as TextVariant })}
          options={[
            { value: "h1", label: "H1" },
            { value: "h2", label: "H2" },
            { value: "body", label: "Fließtext" },
            { value: "caption", label: "Caption" },
            { value: "quote", label: "Zitat" },
          ]}
        />
      </Field>
      <Field>
        <Label>Ausrichtung</Label>
        <Select
          value={block.align ?? "left"}
          onChange={(align) => onUpdate({ align: align as TextBlock["align"] })}
          options={[
            { value: "left", label: "Links" },
            { value: "center", label: "Zentriert" },
            { value: "right", label: "Rechts" },
          ]}
        />
      </Field>
    </>
  );
}

export function PropertiesPanel({
  block,
  theme,
  query,
  tables,
  columns,
  loadingTables,
  queryTemplates,
  berichte,
  onUpdate,
  onUpdateQuery,
  onApplyQueryTemplate,
  onSaveQueryTemplate,
  onSaveBlockTemplate,
  loadColumns,
}: Props) {
  const typeLabel: Record<string, string> = {
    chart: "Diagramm",
    kpi: "Kennzahl",
    table: "Tabelle",
    text: "Text",
    image: "Bild",
  };

  return (
    <div style={{ width: "296px", flexShrink: 0, background: "#0F1318", borderLeft: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: "48px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", paddingLeft: "16px", paddingRight: "16px", gap: "8px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: theme.accent, flexShrink: 0 }} />
        <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{typeLabel[block.type] ?? block.type}</span>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>#{block.id}</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {block.type === "chart" && <ChartProperties block={block} theme={theme} onUpdate={onUpdate as (partial: Partial<ChartBlock>) => void} />}
        {block.type === "kpi" && <KPIProperties block={block} onUpdate={onUpdate as (partial: Partial<KPIBlock>) => void} />}
        {block.type === "table" && <TableProperties block={block} onUpdate={onUpdate as (partial: Partial<TableBlock>) => void} />}
        {block.type === "text" && <TextProperties block={block} onUpdate={onUpdate as (partial: Partial<TextBlock>) => void} />}
        {block.type === "image" && (
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "40px" }}>
            Editor für diesen Block-Typ folgt in der nächsten Version.
          </div>
        )}

        {(block.type === "chart" || block.type === "kpi" || block.type === "table") && (
          <DataBindingPanel
            block={block}
            query={query}
            tables={tables}
            columns={columns}
            loadingTables={loadingTables}
            queryTemplates={queryTemplates}
            berichte={berichte}
            onQueryChange={onUpdateQuery}
            onApplyQueryTemplate={onApplyQueryTemplate}
            onSaveQueryTemplate={onSaveQueryTemplate}
            onSaveBlockTemplate={onSaveBlockTemplate}
            loadColumns={loadColumns}
          />
        )}
      </div>
    </div>
  );
}