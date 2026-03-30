import React, { useState, useRef, useCallback } from "react";
import { SlideCanvas, SLIDE_WIDTH, SLIDE_HEIGHT } from "./components/SlideCanvas";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { defaultTheme } from "./types/theme";
import type { Theme } from "./types/theme";
import type { SlideConfig, SlideBlock, KPIBlock, ChartBlock, TableBlock, TextBlock } from "./types/slide";
import "./App.css";

// ─── Demo Slides ──────────────────────────────────────────────
const initialSlides: SlideConfig[] = [
  {
    id: "s1",
    title: "Quartalsbericht Q1 2025",
    subtitle: "B&B Unternehmensgruppe",
    footerLeft: "INVARIA Finanzmanagement GmbH",
    footerRight: "März 2025 · Vertraulich",
    blocks: [
      {
        id: "kpi1", type: "kpi", label: "Umsatz",
        value: 4_820_000, format: "currency", prefix: "€",
        delta: 7.3, deltaLabel: "vs. Q1 2024", trend: "up",
        variant: "highlight",
        x: 40, y: 76, width: 270, height: 110,
      } as KPIBlock,
      {
        id: "kpi2", type: "kpi", label: "EBITDA",
        value: 1_105_000, format: "currency", prefix: "€",
        delta: 2.1, deltaLabel: "vs. Q1 2024", trend: "up",
        variant: "default",
        x: 330, y: 76, width: 270, height: 110,
      } as KPIBlock,
      {
        id: "kpi3", type: "kpi", label: "EBITDA-Marge",
        value: 22.9, format: "percent",
        delta: -0.8, deltaLabel: "vs. Q1 2024", trend: "down",
        variant: "dark",
        x: 620, y: 76, width: 270, height: 110,
      } as KPIBlock,
      {
        id: "kpi4", type: "kpi", label: "Liquidität (aktuell)",
        value: 2_340_000, format: "currency", prefix: "€",
        variant: "default",
        x: 910, y: 76, width: 310, height: 110,
      } as KPIBlock,
      {
        id: "chart1", type: "chart", chartType: "bar",
        title: "Umsatz nach Monat (€)",
        labels: ["Jan", "Feb", "Mär"],
        datasets: [
          { label: "2025", data: [1_480_000, 1_620_000, 1_720_000] },
          { label: "2024", data: [1_350_000, 1_480_000, 1_640_000] },
        ],
        showGrid: true, showLegend: true, formatY: "currency",
        x: 40, y: 206, width: 560, height: 460,
      } as ChartBlock,
      {
        id: "chart2", type: "chart", chartType: "donut",
        title: "Umsatz nach Segment",
        labels: ["Wohnen", "Gewerbe", "Sondernutzung"],
        datasets: [{ label: "Segment", data: [58, 28, 14] }],
        showLegend: false,
        x: 620, y: 206, width: 600, height: 460,
      } as ChartBlock,
    ],
  },
  {
    id: "s2",
    title: "GuV-Übersicht",
    subtitle: "Januar – März 2025",
    footerLeft: "INVARIA Finanzmanagement GmbH",
    footerRight: "März 2025 · Vertraulich",
    blocks: [
      {
        id: "txt1", type: "text", variant: "caption",
        content: "Alle Beträge in EUR · vorläufig, ungeprüft",
        align: "right", color: "#9AA3B0",
        x: 800, y: 76, width: 420, height: 28,
      } as TextBlock,
      {
        id: "tbl1", type: "table",
        title: "Gewinn- und Verlustrechnung",
        showHeader: true, striped: true, highlightLast: true,
        columns: [
          { key: "pos",  label: "Position",   align: "left",  width: 280 },
          { key: "jan",  label: "Jan",         align: "right", format: "currency" },
          { key: "feb",  label: "Feb",         align: "right", format: "currency" },
          { key: "mar",  label: "Mär",         align: "right", format: "currency" },
          { key: "sum",  label: "Q1 Gesamt",   align: "right", format: "currency" },
          { key: "vj",   label: "VJ Q1",       align: "right", format: "currency" },
          { key: "abw",  label: "Abw. %",      align: "right", format: "percent" },
        ],
        rows: [
          { pos: "Erlöse aus LuL",                jan: 1_480_000, feb: 1_620_000, mar: 1_720_000, sum: 4_820_000, vj: 4_470_000, abw: 7.3 },
          { pos: "Sonstige betriebliche Erträge", jan:    28_000, feb:    32_000, mar:    25_000, sum:    85_000, vj:    91_000, abw: -6.6 },
          { pos: "Materialaufwand",               jan:  -420_000, feb:  -470_000, mar:  -490_000, sum:-1_380_000, vj:-1_260_000, abw: 9.5 },
          { pos: "Personalaufwand",               jan:  -510_000, feb:  -510_000, mar:  -510_000, sum:-1_530_000, vj:-1_450_000, abw: 5.5 },
          { pos: "Abschreibungen",                jan:  -180_000, feb:  -180_000, mar:  -180_000, sum:  -540_000, vj:  -520_000, abw: 3.8 },
          { pos: "Sonstige Aufwendungen",         jan:  -148_000, feb:  -162_000, mar:  -172_000, sum:  -482_000, vj:  -441_000, abw: 9.3 },
          { pos: "EBIT",                          jan:   250_000, feb:   330_000, mar:   393_000, sum:   973_000, vj:   890_000, abw: 9.3 },
        ],
        x: 40, y: 108, width: 1200, height: 568,
      } as TableBlock,
    ],
  },
  {
    id: "s3",
    title: "Liquiditätsentwicklung",
    subtitle: "Rollierende 6-Monats-Vorschau",
    footerLeft: "INVARIA Finanzmanagement GmbH",
    footerRight: "März 2025 · Vertraulich",
    blocks: [
      {
        id: "area1", type: "chart", chartType: "area",
        title: "Kontostand (€)",
        labels: ["Okt", "Nov", "Dez", "Jan", "Feb", "Mär", "Apr (P)", "Mai (P)", "Jun (P)"],
        datasets: [
          { label: "Ist / Plan",         data: [1_800_000, 2_100_000, 1_750_000, 2_340_000, 2_150_000, 2_340_000, 2_500_000, 2_680_000, 2_820_000] },
          { label: "Minimum (Covenant)", data: [1_200_000, 1_200_000, 1_200_000, 1_200_000, 1_200_000, 1_200_000, 1_200_000, 1_200_000, 1_200_000] },
        ],
        showGrid: true, showLegend: true, formatY: "currency",
        x: 40, y: 76, width: 740, height: 580,
      } as ChartBlock,
      {
        id: "kpi-liq1", type: "kpi", label: "Freie Liquidität",
        value: 2_340_000, format: "currency", prefix: "€",
        delta: 12.4, deltaLabel: "vs. Vormonat", trend: "up",
        variant: "highlight",
        x: 800, y: 76, width: 420, height: 120,
      } as KPIBlock,
      {
        id: "kpi-liq2", type: "kpi", label: "Working Capital",
        value: 1_860_000, format: "currency", prefix: "€",
        delta: -3.2, deltaLabel: "vs. Vormonat", trend: "down",
        variant: "default",
        x: 800, y: 216, width: 420, height: 120,
      } as KPIBlock,
      {
        id: "kpi-liq3", type: "kpi", label: "Ø DSO (Tage)",
        value: 38, unit: "d",
        delta: -2.0, deltaLabel: "vs. Vorquartal", trend: "up",
        variant: "dark",
        x: 800, y: 356, width: 420, height: 120,
      } as KPIBlock,
      {
        id: "kpi-liq4", type: "kpi", label: "Offene Forderungen",
        value: 620_000, format: "currency", prefix: "€",
        variant: "default",
        x: 800, y: 496, width: 420, height: 120,
      } as KPIBlock,
    ],
  },
];

// ─── Slide Thumbnail ──────────────────────────────────────────
function SlideThumbnail({ slide, theme, active, index, onClick }: {
  slide: SlideConfig; theme: Theme; active: boolean; index: number; onClick: () => void;
}) {
  const THUMB_W = 200;
  const scale = THUMB_W / SLIDE_WIDTH;
  const THUMB_H = SLIDE_HEIGHT * scale;

  return (
    <div onClick={onClick} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
      <div style={{
        width: THUMB_W, height: THUMB_H,
        borderRadius: "4px", overflow: "hidden",
        border: active ? `2px solid ${theme.accent}` : "1.5px solid rgba(255,255,255,0.12)",
        boxSizing: "border-box", position: "relative", flexShrink: 0,
      }}>
        <div style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}>
          <SlideCanvas slide={slide} theme={theme} />
        </div>
      </div>
      <span style={{ fontSize: "10px", color: active ? theme.accent : "rgba(255,255,255,0.45)", fontFamily: theme.fontBody }}>
        {index + 1}
      </span>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function App() {
  const [slides, setSlides] = useState<SlideConfig[]>(initialSlides);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [theme] = useState<Theme>(defaultTheme);
  const [isPresentMode, setIsPresentMode] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const current = slides[currentIdx];

  // Deselect when switching slides
  const switchSlide = (idx: number) => {
    setCurrentIdx(idx);
    setSelectedBlockId(null);
  };

  const selectedBlock = selectedBlockId
    ? current.blocks.find((b) => b.id === selectedBlockId) ?? null
    : null;

  // Update a single block in the current slide
  const updateBlock = useCallback((partial: Partial<SlideBlock>) => {
    setSlides((prev) =>
      prev.map((slide, i) =>
        i !== currentIdx ? slide : {
          ...slide,
          blocks: slide.blocks.map((b) =>
            b.id === selectedBlockId ? { ...b, ...partial } as SlideBlock : b
          ),
        }
      )
    );
  }, [currentIdx, selectedBlockId]);

  const handleExportPDF = useCallback(() => {
    alert("PDF-Export läuft über den Server:\nPOST /api/export-pdf\n\nPlaywright rendert jede Folie in 1280×720 px.");
  }, []);

  const previewScale = 0.72;

  // ─ Präsentationsmodus ─
  if (isPresentMode) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: SLIDE_WIDTH }}>
          <SlideCanvas ref={canvasRef} slide={current} theme={theme} scale={1} />
        </div>
        <div style={{ position: "fixed", bottom: "24px", display: "flex", gap: "12px", alignItems: "center" }}>
          <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} style={btnStyle}>← Zurück</button>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>{currentIdx + 1} / {slides.length}</span>
          <button onClick={() => setCurrentIdx(Math.min(slides.length - 1, currentIdx + 1))} disabled={currentIdx === slides.length - 1} style={btnStyle}>Weiter →</button>
          <button onClick={() => setIsPresentMode(false)} style={{ ...btnStyle, color: theme.accent }}>✕ Beenden</button>
        </div>
      </div>
    );
  }

  // ─ Editor ─
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#141820", fontFamily: theme.fontBody }}>

      {/* Thumbnail-Sidebar */}
      <div style={{
        width: "224px", flexShrink: 0,
        background: "#0F1318",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column",
        padding: "16px 12px", gap: "12px", overflowY: "auto",
      }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", paddingLeft: "4px", marginBottom: "4px" }}>
          FOLIEN
        </div>
        {slides.map((slide, i) => (
          <SlideThumbnail key={slide.id} slide={slide} theme={theme} active={i === currentIdx} index={i} onClick={() => switchSlide(i)} />
        ))}
      </div>

      {/* Hauptbereich */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Toolbar */}
        <div style={{
          height: "48px", flexShrink: 0,
          background: "#0F1318",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center",
          paddingLeft: "20px", paddingRight: "20px", gap: "12px",
        }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {current.title}
          </span>
          {selectedBlock && (
            <span style={{ fontSize: "11px", color: theme.accent, background: "rgba(232,160,32,0.12)", borderRadius: "4px", padding: "2px 8px", whiteSpace: "nowrap" }}>
              {selectedBlock.type} · {selectedBlock.id}
            </span>
          )}
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", whiteSpace: "nowrap" }}>
            {currentIdx + 1} / {slides.length}
          </span>
          <button onClick={() => setIsPresentMode(true)} style={toolbarBtn}>▶ Präsentieren</button>
          <button onClick={handleExportPDF} style={{ ...toolbarBtn, background: theme.accent, color: "#0F1318", borderColor: theme.accent }}>↓ PDF</button>
        </div>

        {/* Canvas-Vorschau + Properties nebeneinander */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Canvas */}
          <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px" }}>
            <div style={{
              width: SLIDE_WIDTH * previewScale,
              height: SLIDE_HEIGHT * previewScale,
              flexShrink: 0,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.4)",
              borderRadius: "4px", overflow: "hidden",
            }}>
              <SlideCanvas
                ref={canvasRef}
                slide={current}
                theme={theme}
                scale={previewScale}
                isEditing={true}
                selectedBlockId={selectedBlockId}
                onBlockSelect={setSelectedBlockId}
              />
            </div>
          </div>

          {/* Properties Panel */}
          {selectedBlock ? (
            <PropertiesPanel
              block={selectedBlock}
              theme={theme}
              onUpdate={updateBlock}
            />
          ) : (
            <div style={{
              width: "264px", flexShrink: 0,
              background: "#0F1318",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "12px", padding: "24px" }}>
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>↖</div>
                Block im Canvas<br />anklicken zum Bearbeiten
              </div>
            </div>
          )}
        </div>

        {/* Unternavigation */}
        <div style={{
          height: "44px", flexShrink: 0,
          background: "#0F1318",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
        }}>
          <button onClick={() => switchSlide(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} style={navBtn}>← Zurück</button>
          {slides.map((_, i) => (
            <div key={i} onClick={() => switchSlide(i)} style={{
              width: i === currentIdx ? "20px" : "6px", height: "6px",
              borderRadius: "3px",
              background: i === currentIdx ? theme.accent : "rgba(255,255,255,0.2)",
              cursor: "pointer", transition: "all 0.2s",
            }} />
          ))}
          <button onClick={() => switchSlide(Math.min(slides.length - 1, currentIdx + 1))} disabled={currentIdx === slides.length - 1} style={navBtn}>Weiter →</button>
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#fff", borderRadius: "6px",
  padding: "8px 18px", fontSize: "13px", cursor: "pointer",
};
const toolbarBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "rgba(255,255,255,0.8)", borderRadius: "6px",
  padding: "6px 14px", fontSize: "12px", cursor: "pointer",
  letterSpacing: "0.02em", whiteSpace: "nowrap",
};
const navBtn: React.CSSProperties = {
  background: "transparent", border: "none",
  color: "rgba(255,255,255,0.4)", fontSize: "12px",
  cursor: "pointer", padding: "4px 10px",
};
