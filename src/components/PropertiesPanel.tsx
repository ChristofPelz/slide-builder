import React, { useState } from "react";
import type { SlideBlock, ChartBlock, ChartType, ChartDataset, KPIBlock, TextBlock, TextVariant } from "../types/slide";
import type { Theme } from "../types/theme";

interface Props {
  block: SlideBlock;
  theme: Theme;
  onUpdate: (partial: Partial<SlideBlock>) => void;
}

// ─── Shared UI primitives ──────────────────────────────────────
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
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "5px",
  color: "#e2e8f0", fontSize: "12px",
  padding: "6px 9px", outline: "none",
  fontFamily: "inherit",
};

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input style={inputStyle} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number" style={inputStyle}
      value={value}
      onChange={(e) => { const n = parseFloat(e.target.value); if (!isNaN(n)) onChange(n); }}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      style={{ ...inputStyle, cursor: "pointer" }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      paddingBottom: "8px", marginBottom: "14px", marginTop: "4px",
    }}>
      {children}
    </div>
  );
}

// ─── Chart Type Picker ─────────────────────────────────────────
const CHART_TYPES: { value: ChartType; label: string; icon: string }[] = [
  { value: "bar",       label: "Balken",  icon: "▊▊" },
  { value: "line",      label: "Linie",   icon: "╱╲" },
  { value: "area",      label: "Fläche",  icon: "◢◣" },
  { value: "pie",       label: "Kreis",   icon: "◔" },
  { value: "donut",     label: "Donut",   icon: "◎" },
  { value: "waterfall", label: "Wasserf.", icon: "┴┬" },
];

function ChartTypePicker({ value, onChange, accent }: { value: ChartType; onChange: (v: ChartType) => void; accent: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px" }}>
      {CHART_TYPES.map((ct) => (
        <button
          key={ct.value}
          onClick={() => onChange(ct.value)}
          style={{
            background: value === ct.value ? accent : "rgba(255,255,255,0.05)",
            border: `1px solid ${value === ct.value ? accent : "rgba(255,255,255,0.1)"}`,
            borderRadius: "5px",
            color: value === ct.value ? "#0F1B2D" : "rgba(255,255,255,0.6)",
            fontSize: "11px", fontWeight: value === ct.value ? 700 : 400,
            padding: "6px 4px",
            cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
          }}
        >
          <span style={{ fontSize: "14px" }}>{ct.icon}</span>
          <span>{ct.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Labels Editor ─────────────────────────────────────────────
function LabelsEditor({ labels, onChange }: { labels: string[]; onChange: (labels: string[]) => void }) {
  const raw = labels.join(", ");
  const [draft, setDraft] = useState(raw);

  const commit = () => {
    const parsed = draft.split(",").map((s) => s.trim()).filter(Boolean);
    onChange(parsed);
  };

  return (
    <textarea
      style={{ ...inputStyle, resize: "vertical", minHeight: "52px", lineHeight: "1.5" }}
      value={draft}
      placeholder="Jan, Feb, Mär, ..."
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
    />
  );
}

// ─── Dataset Row ───────────────────────────────────────────────
function DatasetRow({
  dataset, index, labelCount, onUpdate, onRemove, accent,
}: {
  dataset: ChartDataset;
  index: number;
  labelCount: number;
  onUpdate: (ds: ChartDataset) => void;
  onRemove: () => void;
  accent: string;
}) {
  const [open, setOpen] = useState(index === 0);
  const cells = Array.from({ length: labelCount }, (_, i) => dataset.data[i] ?? 0);

  return (
    <div style={{ marginBottom: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "5px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "6px 8px",
        cursor: "pointer",
        borderBottom: open ? "1px solid rgba(255,255,255,0.07)" : "none",
      }} onClick={() => setOpen(!open)}>
        {/* Color dot */}
        <input
          type="color"
          value={dataset.color ?? "#2D6A9F"}
          onChange={(e) => onUpdate({ ...dataset, color: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          style={{ width: "18px", height: "18px", border: "none", borderRadius: "3px", cursor: "pointer", padding: 0, background: "none" }}
        />
        <input
          style={{ ...inputStyle, flex: 1, padding: "3px 6px", fontSize: "11px" }}
          value={dataset.label}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdate({ ...dataset, label: e.target.value })}
          placeholder={`Datenreihe ${index + 1}`}
        />
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "10px", padding: "0 2px" }}
        >
          {open ? "▲" : "▼"}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ background: "none", border: "none", color: "rgba(255,80,80,0.6)", cursor: "pointer", fontSize: "13px", padding: "0 2px" }}
        >
          ×
        </button>
      </div>

      {/* Data cells */}
      {open && (
        <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {cells.map((val, ci) => (
            <div key={ci} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", width: "28px", textAlign: "right", flexShrink: 0 }}>
                [{ci + 1}]
              </span>
              <input
                type="number" style={{ ...inputStyle, padding: "4px 7px", fontSize: "12px" }}
                value={val}
                onChange={(e) => {
                  const n = parseFloat(e.target.value);
                  const newData = [...cells];
                  newData[ci] = isNaN(n) ? 0 : n;
                  onUpdate({ ...dataset, data: newData });
                }}
              />
            </div>
          ))}
          {/* Bulk paste */}
          <details style={{ marginTop: "4px" }}>
            <summary style={{ fontSize: "10px", color: accent, cursor: "pointer", userSelect: "none" }}>Werte einfügen (kommasepariert)</summary>
            <textarea
              style={{ ...inputStyle, marginTop: "4px", resize: "vertical", minHeight: "40px", fontSize: "11px" }}
              placeholder="1000, 2000, 3000"
              onBlur={(e) => {
                const vals = e.target.value.split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
                if (vals.length > 0) onUpdate({ ...dataset, data: vals });
                e.target.value = "";
              }}
            />
          </details>
        </div>
      )}
    </div>
  );
}

// ─── Chart Properties ──────────────────────────────────────────
function ChartProperties({ block, theme, onUpdate }: { block: ChartBlock; theme: Theme; onUpdate: (p: Partial<ChartBlock>) => void }) {
  const addDataset = () => {
    const newDs: ChartDataset = {
      label: `Reihe ${block.datasets.length + 1}`,
      data: new Array(block.labels.length).fill(0),
    };
    onUpdate({ datasets: [...block.datasets, newDs] });
  };

  const updateDataset = (i: number, ds: ChartDataset) => {
    const updated = block.datasets.map((d, idx) => idx === i ? ds : d);
    onUpdate({ datasets: updated });
  };

  const removeDataset = (i: number) => {
    onUpdate({ datasets: block.datasets.filter((_, idx) => idx !== i) });
  };

  return (
    <>
      <SectionTitle>Diagrammtyp</SectionTitle>
      <Field>
        <ChartTypePicker value={block.chartType} onChange={(v) => onUpdate({ chartType: v })} accent={theme.accent} />
      </Field>

      <SectionTitle>Allgemein</SectionTitle>
      <Field>
        <Label>Titel</Label>
        <TextInput value={block.title ?? ""} onChange={(v) => onUpdate({ title: v })} placeholder="Diagrammtitel" />
      </Field>
      <Field>
        <Label>Y-Achse Format</Label>
        <Select
          value={block.formatY ?? "number"}
          onChange={(v) => onUpdate({ formatY: v as ChartBlock["formatY"] })}
          options={[
            { value: "number",   label: "Zahl" },
            { value: "currency", label: "Währung (€)" },
            { value: "percent",  label: "Prozent (%)" },
          ]}
        />
      </Field>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
          <input type="checkbox" checked={block.showLegend ?? true} onChange={(e) => onUpdate({ showLegend: e.target.checked })} />
          Legende
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
          <input type="checkbox" checked={block.showGrid ?? true} onChange={(e) => onUpdate({ showGrid: e.target.checked })} />
          Gitternetz
        </label>
      </div>

      <SectionTitle>X-Achse / Kategorien</SectionTitle>
      <Field>
        <Label>Beschriftungen (kommasepariert)</Label>
        <LabelsEditor labels={block.labels} onChange={(labels) => onUpdate({ labels })} />
      </Field>

      <SectionTitle>Datenreihen ({block.datasets.length})</SectionTitle>
      {block.datasets.map((ds, i) => (
        <DatasetRow
          key={i} dataset={ds} index={i}
          labelCount={block.labels.length}
          onUpdate={(updated) => updateDataset(i, updated)}
          onRemove={() => removeDataset(i)}
          accent={theme.accent}
        />
      ))}
      <button
        onClick={addDataset}
        style={{
          width: "100%", marginTop: "4px",
          background: "transparent",
          border: `1px dashed ${theme.accent}`,
          borderRadius: "5px",
          color: theme.accent, fontSize: "12px",
          padding: "7px", cursor: "pointer",
        }}
      >
        + Datenreihe hinzufügen
      </button>
    </>
  );
}

// ─── KPI Properties ────────────────────────────────────────────
function KPIProperties({ block, onUpdate }: { block: KPIBlock; onUpdate: (p: Partial<KPIBlock>) => void }) {
  return (
    <>
      <SectionTitle>Kennzahl</SectionTitle>
      <Field>
        <Label>Bezeichnung</Label>
        <TextInput value={block.label} onChange={(v) => onUpdate({ label: v })} />
      </Field>
      <Field>
        <Label>Wert</Label>
        <NumberInput value={typeof block.value === "number" ? block.value : 0} onChange={(v) => onUpdate({ value: v })} />
      </Field>
      <Field>
        <Label>Format</Label>
        <Select
          value={block.format ?? "number"}
          onChange={(v) => onUpdate({ format: v as KPIBlock["format"] })}
          options={[
            { value: "number",   label: "Zahl" },
            { value: "currency", label: "Währung" },
            { value: "percent",  label: "Prozent" },
          ]}
        />
      </Field>
      <Field>
        <Label>Präfix (z.B. €)</Label>
        <TextInput value={block.prefix ?? ""} onChange={(v) => onUpdate({ prefix: v })} />
      </Field>
      <Field>
        <Label>Einheit (z.B. d)</Label>
        <TextInput value={block.unit ?? ""} onChange={(v) => onUpdate({ unit: v })} />
      </Field>

      <SectionTitle>Delta / Trend</SectionTitle>
      <Field>
        <Label>Änderung (%)</Label>
        <NumberInput value={block.delta ?? 0} onChange={(v) => onUpdate({ delta: v })} />
      </Field>
      <Field>
        <Label>Delta-Beschriftung</Label>
        <TextInput value={block.deltaLabel ?? ""} onChange={(v) => onUpdate({ deltaLabel: v })} placeholder="vs. Vorjahr" />
      </Field>
      <Field>
        <Label>Trend</Label>
        <Select
          value={block.trend ?? "neutral"}
          onChange={(v) => onUpdate({ trend: v as KPIBlock["trend"] })}
          options={[
            { value: "up",      label: "↑ Aufwärts" },
            { value: "down",    label: "↓ Abwärts" },
            { value: "neutral", label: "– Neutral" },
          ]}
        />
      </Field>

      <SectionTitle>Darstellung</SectionTitle>
      <Field>
        <Label>Variante</Label>
        <Select
          value={block.variant ?? "default"}
          onChange={(v) => onUpdate({ variant: v as KPIBlock["variant"] })}
          options={[
            { value: "default",   label: "Standard (hell)" },
            { value: "highlight", label: "Highlight (amber)" },
            { value: "dark",      label: "Dark (dunkelblau)" },
          ]}
        />
      </Field>
    </>
  );
}

// ─── Text Properties ───────────────────────────────────────────
function TextProperties({ block, onUpdate }: { block: TextBlock; onUpdate: (p: Partial<TextBlock>) => void }) {
  return (
    <>
      <SectionTitle>Inhalt</SectionTitle>
      <Field>
        <Label>Text</Label>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: "80px", lineHeight: "1.5" }}
          value={block.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
        />
      </Field>
      <Field>
        <Label>Variante</Label>
        <Select
          value={block.variant ?? "body"}
          onChange={(v) => onUpdate({ variant: v as TextVariant })}
          options={[
            { value: "h1",      label: "H1 – Hauptüberschrift" },
            { value: "h2",      label: "H2 – Abschnittstitel" },
            { value: "body",    label: "Fließtext" },
            { value: "caption", label: "Caption / Fußnote" },
            { value: "quote",   label: "Zitat" },
          ]}
        />
      </Field>
      <Field>
        <Label>Ausrichtung</Label>
        <Select
          value={block.align ?? "left"}
          onChange={(v) => onUpdate({ align: v as TextBlock["align"] })}
          options={[
            { value: "left",   label: "Links" },
            { value: "center", label: "Zentriert" },
            { value: "right",  label: "Rechts" },
          ]}
        />
      </Field>
    </>
  );
}

// ─── Main Panel ────────────────────────────────────────────────
export function PropertiesPanel({ block, theme, onUpdate }: Props) {
  const typeLabel: Record<string, string> = {
    chart: "Diagramm", kpi: "Kennzahl", table: "Tabelle", text: "Text", image: "Bild",
  };

  return (
    <div style={{
      width: "264px", flexShrink: 0,
      background: "#0F1318",
      borderLeft: "1px solid rgba(255,255,255,0.07)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Panel header */}
      <div style={{
        height: "48px", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center",
        paddingLeft: "16px", paddingRight: "16px",
        gap: "8px",
      }}>
        <div style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: theme.accent, flexShrink: 0,
        }} />
        <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
          {typeLabel[block.type] ?? block.type}
        </span>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
          #{block.id}
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {block.type === "chart" && (
          <ChartProperties block={block} theme={theme} onUpdate={onUpdate as (p: Partial<ChartBlock>) => void} />
        )}
        {block.type === "kpi" && (
          <KPIProperties block={block} onUpdate={onUpdate as (p: Partial<KPIBlock>) => void} />
        )}
        {block.type === "text" && (
          <TextProperties block={block} onUpdate={onUpdate as (p: Partial<TextBlock>) => void} />
        )}
        {(block.type === "table" || block.type === "image") && (
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "40px" }}>
            Editor für diesen Block-Typ<br />folgt in der nächsten Version.
          </div>
        )}
      </div>
    </div>
  );
}
