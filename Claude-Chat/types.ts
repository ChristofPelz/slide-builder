// ─── Block Types ──────────────────────────────────────────────
export type BlockType = "kpi" | "chart" | "table" | "text" | "image";

export interface BaseBlock {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
}

// KPI / Metric card
export interface KPIBlock extends BaseBlock {
  type: "kpi";
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;          // e.g. +5.2 (%)
  deltaLabel?: string;     // e.g. "vs. Vorjahr"
  trend?: "up" | "down" | "neutral";
  format?: "currency" | "percent" | "number";
  prefix?: string;         // e.g. "€"
  variant?: "default" | "highlight" | "dark";
}

// Chart block
export type ChartType = "bar" | "line" | "pie" | "donut" | "area" | "waterfall";

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
}

export interface ChartBlock extends BaseBlock {
  type: "chart";
  chartType: ChartType;
  title?: string;
  labels: string[];           // X axis / category labels
  datasets: ChartDataset[];
  showLegend?: boolean;
  showGrid?: boolean;
  yAxisLabel?: string;
  formatY?: "currency" | "percent" | "number";
  // DB query config (resolved before render)
  queryId?: string;
}

// Table block
export interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: "currency" | "percent" | "number" | "text";
  width?: number;
}

export interface TableBlock extends BaseBlock {
  type: "table";
  title?: string;
  columns: TableColumn[];
  rows: Record<string, string | number>[];
  highlightLast?: boolean;    // Summenzeile
  showHeader?: boolean;
  striped?: boolean;
}

// Text / Headline block
export type TextVariant = "h1" | "h2" | "body" | "caption" | "quote";

export interface TextBlock extends BaseBlock {
  type: "text";
  content: string;
  variant?: TextVariant;
  align?: "left" | "center" | "right";
  color?: string;
  bold?: boolean;
}

// Image / Logo block
export interface ImageBlock extends BaseBlock {
  type: "image";
  src: string;
  objectFit?: "contain" | "cover" | "fill";
  alt?: string;
}

export type SlideBlock =
  | KPIBlock
  | ChartBlock
  | TableBlock
  | TextBlock
  | ImageBlock;

// ─── Slide Config ─────────────────────────────────────────────
export interface SlideConfig {
  id: string;
  title: string;
  subtitle?: string;
  blocks: SlideBlock[];
  backgroundColor?: string;
  backgroundImage?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  footerLeft?: string;
  footerRight?: string;
  notes?: string;
}

// ─── Presentation ─────────────────────────────────────────────
export interface Presentation {
  id: string;
  name: string;
  themeId: string;
  slides: SlideConfig[];
  createdAt: string;
  updatedAt: string;
}

// ─── DB Query Config ──────────────────────────────────────────
export type DataSourceType = "supabase" | "mssql" | "static";

export interface QueryConfig {
  id: string;
  name: string;
  source: DataSourceType;
  sql?: string;
  table?: string;
  filters?: Record<string, unknown>;
  valueColumn?: string;
  labelColumn?: string;
  aggregation?: "sum" | "avg" | "count" | "max" | "min";
  groupBy?: string;
}
