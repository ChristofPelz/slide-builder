import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BlockInserterMenu } from "./components/BlockInserterMenu";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { SlideCanvas, SLIDE_HEIGHT, SLIDE_WIDTH } from "./components/SlideCanvas";
import { useDataSources } from "./hooks/useDataSources";
import { useSlideData } from "./hooks/useSlideData";
import { useTemplates } from "./hooks/useTemplates";
import type { Theme } from "./types/theme";
import { defaultTheme } from "./types/theme";
import type {
  BlockTemplate,
  ChartBlock,
  KPIBlock,
  QueryConfig,
  QueryTemplate,
  SlideBlock,
  SlideConfig,
  SlideTemplate,
  TableBlock,
  TextBlock,
} from "./types/slide";
import "./App.css";

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
        id: "chart1", type: "chart", chartType: "bar",
        title: "Umsatz nach Monat (€)",
        labels: ["Jan", "Feb", "Mär"],
        datasets: [
          { label: "2025", data: [1_480_000, 1_620_000, 1_720_000], color: "#2D6A9F" },
          { label: "2024", data: [1_350_000, 1_480_000, 1_640_000], color: "#8BA4C4" },
        ],
        showGrid: true, showLegend: true, formatY: "currency",
        x: 40, y: 206, width: 560, height: 460,
      } as ChartBlock,
      {
        id: "chart2", type: "chart", chartType: "donut",
        title: "Umsatz nach Segment",
        labels: ["Wohnen", "Gewerbe", "Sondernutzung"],
        datasets: [{ label: "Segment", data: [58, 28, 14], color: "#E89D3C" }],
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
          { key: "pos", label: "Position", align: "left", width: 280 },
          { key: "jan", label: "Jan", align: "right", format: "currency" },
          { key: "feb", label: "Feb", align: "right", format: "currency" },
          { key: "mar", label: "Mär", align: "right", format: "currency" },
          { key: "sum", label: "Q1 Gesamt", align: "right", format: "currency" },
        ],
        rows: [
          { pos: "Erlöse aus LuL", jan: 1_480_000, feb: 1_620_000, mar: 1_720_000, sum: 4_820_000 },
          { pos: "Personalaufwand", jan: -510_000, feb: -510_000, mar: -510_000, sum: -1_530_000 },
          { pos: "EBIT", jan: 250_000, feb: 330_000, mar: 393_000, sum: 973_000 },
        ],
        x: 40, y: 108, width: 1200, height: 568,
      } as TableBlock,
    ],
  },
];

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function cloneBlock<T extends SlideBlock>(block: T): T {
  return JSON.parse(JSON.stringify(block)) as T;
}

type BackendHealthState = {
  lastCheckMs: number;
  isAvailable: boolean | null;
  inFlight: Promise<boolean> | null;
};

const backendHealthState: BackendHealthState = {
  lastCheckMs: 0,
  isAvailable: null,
  inFlight: null,
};

function SlideThumbnail({ slide, theme, active, index, onClick }: {
  slide: SlideConfig;
  theme: Theme;
  active: boolean;
  index: number;
  onClick: () => void;
}) {
  const thumbWidth = 200;
  const scale = thumbWidth / SLIDE_WIDTH;
  const thumbHeight = SLIDE_HEIGHT * scale;

  return (
    <div onClick={onClick} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
      <div style={{ width: thumbWidth, height: thumbHeight, borderRadius: "4px", overflow: "hidden", border: active ? `2px solid ${theme.accent}` : "1.5px solid rgba(255,255,255,0.12)", boxSizing: "border-box", position: "relative", flexShrink: 0 }}>
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

export default function App() {
  const [slides, setSlides] = useState<SlideConfig[]>(initialSlides);
  const [queries, setQueries] = useState<QueryConfig[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [theme] = useState<Theme>(defaultTheme);
  const [isPresentMode, setIsPresentMode] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const {
    chartTemplates,
    slideTemplates,
    queryTemplates,
    blockTemplates,
    saveSlideTemplate,
    saveQueryTemplate,
    saveBlockTemplate,
    refetchSlideTemplates,
    refetchQueryTemplates,
    refetchBlockTemplates,
  } = useTemplates();

  const {
    tables,
    columnsByTable,
    loading: isLoadingTables,
    loadTables,
    loadColumns,
    berichte,
    loadBerichte,
  } = useDataSources();

  const current = slides[currentIdx];
  const selectedBlock = selectedBlockId
    ? current.blocks.find((block) => block.id === selectedBlockId) ?? null
    : null;
  const selectedQuery = selectedBlock?.type === "chart" || selectedBlock?.type === "kpi" || selectedBlock?.type === "table"
    ? queries.find((query) => query.id === selectedBlock.queryId) ?? null
    : null;

  const { resolvedBlocks, loading: isResolvingData, error: resolveError } = useSlideData(current.blocks, queries);
  const resolvedCurrent = useMemo(() => ({ ...current, blocks: resolvedBlocks }), [current, resolvedBlocks]);
  const selectedColumns = selectedQuery?.table ? columnsByTable[selectedQuery.table] ?? [] : [];
  const previewScale = 0.9;

  const ensureBackendAvailable = useCallback(async () => {
    const now = Date.now();
    const health = backendHealthState;
    const cacheWindowMs = health.isAvailable ? 30_000 : 5_000;

    // Re-use recent result to avoid noisy repeated proxy requests.
    if (health.isAvailable !== null && now - health.lastCheckMs < cacheWindowMs) {
      return health.isAvailable;
    }

    if (health.inFlight) {
      return health.inFlight;
    }

    health.inFlight = (async () => {
      let available = false;
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        available = response.ok;
      } catch {
        available = false;
      }

      backendHealthState.lastCheckMs = Date.now();
      backendHealthState.isAvailable = available;
      backendHealthState.inFlight = null;
      return available;
    })();

    try {
      return await health.inFlight;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!showInsertMenu) {
      return;
    }

    void (async () => {
      const isBackendAvailable = await ensureBackendAvailable();
      if (!isBackendAvailable) {
        return;
      }

      void refetchSlideTemplates();
      void refetchBlockTemplates();
    })();
  }, [showInsertMenu, refetchSlideTemplates, refetchBlockTemplates, ensureBackendAvailable]);

  useEffect(() => {
    const isDataBindableBlock =
      selectedBlock?.type === "chart" ||
      selectedBlock?.type === "kpi" ||
      selectedBlock?.type === "table";

    if (!isDataBindableBlock) {
      return;
    }

    void (async () => {
      const isBackendAvailable = await ensureBackendAvailable();
      if (!isBackendAvailable) {
        return;
      }

      void loadTables();
      void refetchQueryTemplates();
      void loadBerichte();
    })();
  }, [selectedBlock?.type, loadTables, refetchQueryTemplates, loadBerichte, ensureBackendAvailable]);

  const switchSlide = (index: number) => {
    setCurrentIdx(index);
    setSelectedBlockId(null);
  };

  const updateBlock = useCallback((partial: Partial<SlideBlock>) => {
    setSlides((prev) => prev.map((slide, index) => (
      index !== currentIdx
        ? slide
        : {
            ...slide,
            blocks: slide.blocks.map((block) => (
              block.id === selectedBlockId ? ({ ...block, ...partial } as SlideBlock) : block
            )),
          }
    )));
  }, [currentIdx, selectedBlockId]);

  const updateBlockById = useCallback((blockId: string, partial: Partial<SlideBlock>) => {
    setSlides((prev) => prev.map((slide, index) => (
      index !== currentIdx
        ? slide
        : {
            ...slide,
            blocks: slide.blocks.map((block) => (
              block.id === blockId ? ({ ...block, ...partial } as SlideBlock) : block
            )),
          }
    )));
  }, [currentIdx]);

  const addBlockToCurrentSlide = useCallback((block: SlideBlock) => {
    setSlides((prev) => prev.map((slide, index) => (
      index !== currentIdx ? slide : { ...slide, blocks: [...slide.blocks, block] }
    )));
    setSelectedBlockId(block.id);
    setShowInsertMenu(false);
  }, [currentIdx]);

  const ensureQueryForBlock = useCallback((block: ChartBlock | KPIBlock | TableBlock) => {
    const queryId = block.queryId ?? generateId("query");
    if (!block.queryId) {
      updateBlockById(block.id, { queryId } as Partial<SlideBlock>);
    }

    return queryId;
  }, [updateBlockById]);

  const updateSelectedBlockQuery = useCallback((partial: Partial<QueryConfig>) => {
    if (!selectedBlock || (selectedBlock.type !== "chart" && selectedBlock.type !== "kpi" && selectedBlock.type !== "table")) {
      return;
    }

    const queryId = ensureQueryForBlock(selectedBlock);
    setQueries((prev) => {
      const existing = prev.find((entry) => entry.id === queryId);
      const base: QueryConfig = existing ?? {
        id: queryId,
        name: `${selectedBlock.type}-${selectedBlock.id}`,
        source: "mssql",
        filters: {},
        limit: 100,
        aggregation: selectedBlock.type === "kpi" ? "sum" : undefined,
        selectedColumns: selectedBlock.type === "table" ? selectedBlock.columns.map((column) => column.key) : [],
      };
      const next = { ...base, ...partial, id: queryId };
      return [next, ...prev.filter((entry) => entry.id !== queryId)];
    });
  }, [ensureQueryForBlock, selectedBlock]);

  const applyQueryTemplateToSelectedBlock = useCallback((template: QueryTemplate) => {
    if (!selectedBlock || (selectedBlock.type !== "chart" && selectedBlock.type !== "kpi" && selectedBlock.type !== "table")) {
      return;
    }

    const queryId = generateId("query");
    updateBlockById(selectedBlock.id, { queryId } as Partial<SlideBlock>);
    setQueries((prev) => [
      { ...template.queryConfig, id: queryId, name: template.name },
      ...prev.filter((entry) => entry.id !== queryId),
    ]);
  }, [selectedBlock, updateBlockById]);

  const handleSaveQueryTemplate = useCallback((name: string, description?: string) => {
    if (!selectedQuery) {
      return;
    }

    void saveQueryTemplate({
      id: generateId("query-template"),
      name,
      description,
      queryConfig: { ...selectedQuery, name },
      isPublic: true,
    });
  }, [saveQueryTemplate, selectedQuery]);

  const handleSaveBlockTemplate = useCallback((name: string, description?: string) => {
    if (!selectedBlock) {
      return;
    }

    void saveBlockTemplate({
      id: generateId("block-template"),
      name,
      description,
      blockType: selectedBlock.type,
      block: cloneBlock(selectedBlock),
      queryConfig: selectedQuery ? { ...selectedQuery } : undefined,
      isPublic: true,
    });
  }, [saveBlockTemplate, selectedBlock, selectedQuery]);

  const insertSlideFromTemplate = useCallback((template: SlideTemplate) => {
    const newSlide: SlideConfig = {
      id: generateId("slide"),
      title: template.title,
      subtitle: template.subtitle,
      blocks: template.blocks.map((block) => ({
        ...cloneBlock(block),
        id: generateId(block.type),
      })),
    };

    setSlides((prev) => [...prev, newSlide]);
    setCurrentIdx(slides.length);
    setShowInsertMenu(false);
    setSelectedBlockId(null);
  }, [slides.length]);

  const addBlankWhiteSlide = useCallback(() => {
    const nextIndex = slides.length;
    const newSlide: SlideConfig = {
      id: generateId("slide"),
      title: `Neue Seite ${nextIndex + 1}`,
      subtitle: "",
      blocks: [],
      backgroundColor: "#FFFFFF",
      showHeader: false,
      showFooter: false,
    };

    setSlides((prev) => [...prev, newSlide]);
    setCurrentIdx(nextIndex);
    setSelectedBlockId(null);
    setShowInsertMenu(false);
  }, [slides.length]);

  const handleSaveSlideTemplate = useCallback((name: string, description?: string) => {
    void saveSlideTemplate({
      id: generateId("slide-template"),
      name,
      description,
      title: current.title,
      subtitle: current.subtitle,
      blocks: current.blocks,
      ispublic: true,
    });
  }, [current, saveSlideTemplate]);

  const handleAddBlockTemplate = useCallback((template: BlockTemplate) => {
    const cloned = cloneBlock(template.block);
    const blockId = generateId(cloned.type);
    const nextBlock = {
      ...cloned,
      id: blockId,
      x: Math.max(40, cloned.x),
      y: Math.max(80, cloned.y),
    } as SlideBlock;

    if (template.queryConfig && (nextBlock.type === "chart" || nextBlock.type === "kpi" || nextBlock.type === "table")) {
      const queryId = generateId("query");
      nextBlock.queryId = queryId;
      setQueries((prev) => [
        { ...template.queryConfig!, id: queryId, name: template.queryConfig?.name ?? template.name },
        ...prev,
      ]);
    }

    addBlockToCurrentSlide(nextBlock);
  }, [addBlockToCurrentSlide]);

  const handleExportPDF = useCallback(() => {
    window.alert("PDF-Export läuft über den Server via /api/export-pdf.");
  }, []);

  if (isPresentMode) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SlideCanvas ref={canvasRef} slide={resolvedCurrent} theme={theme} scale={Math.min(window.innerWidth / SLIDE_WIDTH, (window.innerHeight - 100) / SLIDE_HEIGHT)} />
        </div>
        <div style={{ position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "12px", alignItems: "center", background: "rgba(0,0,0,0.7)", padding: "12px 24px", borderRadius: "8px", backdropFilter: "blur(6px)", zIndex: 1000 }}>
          <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} style={btnStyle}>← Zurück</button>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", minWidth: "40px", textAlign: "center" }}>{currentIdx + 1} / {slides.length}</span>
          <button onClick={() => setCurrentIdx(Math.min(slides.length - 1, currentIdx + 1))} disabled={currentIdx === slides.length - 1} style={btnStyle}>Weiter →</button>
          <button onClick={() => setIsPresentMode(false)} style={{ ...btnStyle, color: theme.accent }}>✕</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#141820", fontFamily: theme.fontBody }}>
      <div style={{ width: "224px", flexShrink: 0, background: "#0F1318", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", padding: "16px 12px", gap: "12px", overflowY: "auto" }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", paddingLeft: "4px", marginBottom: "4px" }}>FOLIEN</div>
        <button onClick={addBlankWhiteSlide} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.85)", borderRadius: "6px", padding: "8px 10px", fontSize: "12px", cursor: "pointer", textAlign: "left" }}>
          + Neue weisse Seite
        </button>
        {slides.map((slide, index) => (
          <SlideThumbnail key={slide.id} slide={slide} theme={theme} active={index === currentIdx} index={index} onClick={() => switchSlide(index)} />
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <div style={{ height: "48px", flexShrink: 0, background: "#0F1318", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", paddingLeft: "20px", paddingRight: "20px", gap: "12px", position: "relative" }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{current.title}</span>
          {selectedBlock && <span style={{ fontSize: "11px", color: theme.accent, background: "rgba(232,160,32,0.12)", borderRadius: "4px", padding: "2px 8px", whiteSpace: "nowrap" }}>{selectedBlock.type} · {selectedBlock.id}</span>}
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", whiteSpace: "nowrap" }}>{currentIdx + 1} / {slides.length}</span>
          <button onClick={() => setShowInsertMenu((prev) => !prev)} style={{ ...toolbarBtn, position: "relative" }}>+ Element</button>
          {showInsertMenu && (
            <>
              <BlockInserterMenu
                theme={theme}
                chartTemplates={chartTemplates}
                slideTemplates={slideTemplates}
                blockTemplates={blockTemplates}
                onAddTextBlock={addBlockToCurrentSlide}
                onAddChartBlock={addBlockToCurrentSlide}
                onAddKpiBlock={addBlockToCurrentSlide}
                onAddTableBlock={addBlockToCurrentSlide}
                onAddBlockTemplate={handleAddBlockTemplate}
                onInsertSlideTemplate={insertSlideFromTemplate}
                onSaveCurrentSlideTemplate={handleSaveSlideTemplate}
              />
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setShowInsertMenu(false)} />
            </>
          )}
          <button onClick={() => setIsPresentMode(true)} style={toolbarBtn}>▶ Präsentieren</button>
          <button onClick={handleExportPDF} style={{ ...toolbarBtn, background: theme.accent, color: "#0F1318", borderColor: theme.accent }}>↓ PDF</button>
        </div>

        {(isResolvingData || resolveError) && (
          <div style={{ padding: "8px 20px", fontSize: "12px", background: resolveError ? "rgba(127,29,29,0.25)" : "rgba(45,106,159,0.18)", color: resolveError ? "#fecaca" : "#bfdbfe", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {resolveError ? `Datenfehler: ${resolveError}` : "Lade Daten aus MS SQL ..."}
          </div>
        )}

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "#0A0D12" }}>
            <div style={{ width: SLIDE_WIDTH * previewScale, height: SLIDE_HEIGHT * previewScale, flexShrink: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.4)", borderRadius: "4px", overflow: "hidden" }}>
              <SlideCanvas
                ref={canvasRef}
                slide={resolvedCurrent}
                theme={theme}
                scale={previewScale}
                isEditing={true}
                selectedBlockId={selectedBlockId}
                onBlockSelect={setSelectedBlockId}
                onBlockUpdate={updateBlockById}
              />
            </div>
          </div>

          {selectedBlock ? (
            <PropertiesPanel
              block={selectedBlock}
              theme={theme}
              query={selectedQuery}
              tables={tables}
              columns={selectedColumns}
              loadingTables={isLoadingTables}
              queryTemplates={queryTemplates}
              berichte={berichte}
              onUpdate={updateBlock}
              onUpdateQuery={updateSelectedBlockQuery}
              onApplyQueryTemplate={applyQueryTemplateToSelectedBlock}
              onSaveQueryTemplate={handleSaveQueryTemplate}
              onSaveBlockTemplate={handleSaveBlockTemplate}
              loadColumns={loadColumns}
            />
          ) : (
            <div style={{ width: "296px", flexShrink: 0, background: "#0F1318", borderLeft: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "12px", padding: "24px" }}>
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>↖</div>
                Block im Canvas anklicken zum Bearbeiten
              </div>
            </div>
          )}
        </div>

        <div style={{ height: "44px", flexShrink: 0, background: "#0F1318", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <button onClick={() => switchSlide(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} style={navBtn}>← Zurück</button>
          {slides.map((_, index) => (
            <div key={index} onClick={() => switchSlide(index)} style={{ width: index === currentIdx ? "20px" : "6px", height: "6px", borderRadius: "3px", background: index === currentIdx ? theme.accent : "rgba(255,255,255,0.2)", cursor: "pointer", transition: "all 0.2s" }} />
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
  color: "#fff",
  borderRadius: "6px",
  padding: "8px 18px",
  fontSize: "13px",
  cursor: "pointer",
};

const toolbarBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "rgba(255,255,255,0.8)",
  borderRadius: "6px",
  padding: "6px 14px",
  fontSize: "12px",
  cursor: "pointer",
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
};

const navBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,0.4)",
  fontSize: "12px",
  cursor: "pointer",
  padding: "4px 10px",
};
