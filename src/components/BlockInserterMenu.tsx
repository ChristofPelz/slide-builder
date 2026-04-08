import React, { useState } from "react";
import type {
  BlockTemplate,
  ChartBlock,
  ChartTemplate,
  KPIBlock,
  SlideTemplate,
  TableBlock,
  TextBlock,
} from "../types/slide";
import type { Theme } from "../types/theme";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "./SlideCanvas";

interface BlockInserterMenuProps {
  theme: Theme;
  chartTemplates: ChartTemplate[];
  slideTemplates: SlideTemplate[];
  blockTemplates: BlockTemplate[];
  onAddTextBlock: (block: TextBlock) => void;
  onAddChartBlock: (block: ChartBlock) => void;
  onAddKpiBlock: (block: KPIBlock) => void;
  onAddTableBlock: (block: TableBlock) => void;
  onAddBlockTemplate: (template: BlockTemplate) => void;
  onInsertSlideTemplate: (template: SlideTemplate) => void;
  onSaveCurrentSlideTemplate: (name: string, description?: string) => void;
}

type MenuSection = "main" | "charts" | "blocks" | "slides" | "save";

export const BlockInserterMenu: React.FC<BlockInserterMenuProps> = ({
  theme,
  chartTemplates,
  slideTemplates,
  blockTemplates,
  onAddTextBlock,
  onAddChartBlock,
  onAddKpiBlock,
  onAddTableBlock,
  onAddBlockTemplate,
  onInsertSlideTemplate,
  onSaveCurrentSlideTemplate,
}) => {
  const [section, setSection] = useState<MenuSection>("main");
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    top: "48px",
    right: "24px",
    background: "#1F2937",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
    zIndex: 1000,
    minWidth: "300px",
    maxWidth: "420px",
  };

  const headerStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.5)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    padding: "12px 16px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  };

  const itemStyle: React.CSSProperties = {
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    fontSize: "13px",
    color: "rgba(255,255,255,0.8)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  };

  const backButtonStyle: React.CSSProperties = {
    padding: "10px 16px",
    background: "transparent",
    border: "none",
    color: theme.accent,
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

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

  const createTextBlock = () => {
    onAddTextBlock({
      id: generateId("txt"),
      type: "text",
      content: "Text einfügen",
      variant: "body",
      align: "left",
      x: 40,
      y: SLIDE_HEIGHT - 120,
      width: 400,
      height: 100,
    });
    setSection("main");
  };

  const createKpiBlock = () => {
    onAddKpiBlock({
      id: generateId("kpi"),
      type: "kpi",
      label: "Neue Kennzahl",
      value: 0,
      format: "number",
      variant: "default",
      x: 60,
      y: 100,
      width: 320,
      height: 120,
    });
    setSection("main");
  };

  const createTableBlock = () => {
    onAddTableBlock({
      id: generateId("tbl"),
      type: "table",
      title: "Neue Tabelle",
      columns: [],
      rows: [],
      showHeader: true,
      striped: true,
      x: 60,
      y: 120,
      width: 780,
      height: 420,
    });
    setSection("main");
  };

  const createChartFromTemplate = (template: ChartTemplate) => {
    onAddChartBlock({
      id: generateId("chart"),
      type: "chart",
      chartType: template.defaultConfig.chartType ?? template.chartType,
      title: template.defaultConfig.title,
      labels: template.defaultConfig.labels ?? [],
      datasets: template.defaultConfig.datasets ?? [],
      showLegend: template.defaultConfig.showLegend ?? true,
      showGrid: template.defaultConfig.showGrid ?? true,
      formatY: template.defaultConfig.formatY,
      x: (SLIDE_WIDTH - 600) / 2,
      y: 150,
      width: 600,
      height: 400,
    });
    setSection("main");
  };

  if (section === "main") {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>Neues Element</div>
        <div style={itemStyle} onClick={createTextBlock}>Textblock</div>
        <div style={itemStyle} onClick={() => setSection("charts")}>Diagrammtypen</div>
        <div style={itemStyle} onClick={createKpiBlock}>KPI-Block</div>
        <div style={itemStyle} onClick={createTableBlock}>Tabelle</div>
        {blockTemplates.length > 0 && <div style={itemStyle} onClick={() => setSection("blocks")}>Gespeicherte Block-Vorlagen</div>}
        {slideTemplates.length > 0 && <div style={itemStyle} onClick={() => setSection("slides")}>Slide-Templates</div>}
        <div style={itemStyle} onClick={() => setSection("save")}>Aktuelle Folie als Template speichern</div>
      </div>
    );
  }

  if (section === "charts") {
    return (
      <div style={containerStyle}>
        <button style={backButtonStyle} onClick={() => setSection("main")}>← Zurück</button>
        <div style={headerStyle}>Diagrammtypen</div>
        {chartTemplates.map((template) => (
          <div key={template.id} style={itemStyle} onClick={() => createChartFromTemplate(template)}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{template.name}</div>
              {template.description && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{template.description}</div>}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{template.chartType}</div>
          </div>
        ))}
      </div>
    );
  }

  if (section === "blocks") {
    return (
      <div style={containerStyle}>
        <button style={backButtonStyle} onClick={() => setSection("main")}>← Zurück</button>
        <div style={headerStyle}>Block-Vorlagen</div>
        {blockTemplates.map((template) => (
          <div key={template.id} style={itemStyle} onClick={() => onAddBlockTemplate(template)}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{template.name}</div>
              {template.description && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{template.description}</div>}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{template.blockType}</div>
          </div>
        ))}
      </div>
    );
  }

  if (section === "slides") {
    return (
      <div style={containerStyle}>
        <button style={backButtonStyle} onClick={() => setSection("main")}>← Zurück</button>
        <div style={headerStyle}>Slide-Templates</div>
        {slideTemplates.map((template) => (
          <div key={template.id} style={itemStyle} onClick={() => onInsertSlideTemplate(template)}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{template.name}</div>
              {template.description && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{template.description}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <button style={backButtonStyle} onClick={() => setSection("main")}>← Zurück</button>
      <div style={headerStyle}>Folie als Template speichern</div>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="text"
          style={inputStyle}
          placeholder="Template Name"
          value={templateName}
          onChange={(event) => setTemplateName(event.target.value)}
        />
        <textarea
          style={{ ...inputStyle, minHeight: "72px", resize: "vertical" }}
          placeholder="Beschreibung"
          value={templateDescription}
          onChange={(event) => setTemplateDescription(event.target.value)}
        />
        <button
          onClick={() => {
            if (!templateName.trim()) {
              window.alert("Bitte einen Namen eingeben.");
              return;
            }

            onSaveCurrentSlideTemplate(templateName.trim(), templateDescription.trim() || undefined);
            setTemplateName("");
            setTemplateDescription("");
            setSection("main");
          }}
          style={{ background: theme.accent, border: "none", color: "#0F1318", borderRadius: "5px", padding: "8px", cursor: "pointer", fontWeight: 600 }}
        >
          Speichern
        </button>
      </div>
    </div>
  );
};