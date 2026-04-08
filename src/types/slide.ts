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
  delta?: number;           // e.g. +5.2 (%)
  deltaLabel?: string;      // e.g. "vs. Vorjahr"
  trend?: "up" | "down" | "neutral";
  format?: "currency" | "percent" | "number";
  prefix?: string;          // e.g. "€"
  variant?: "default" | "highlight" | "dark";
  queryId?: string;
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
  highlightLast?: boolean;  // Summenzeile hervorheben
  showHeader?: boolean;
  striped?: boolean;
  queryId?: string;
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

export interface QueryFilter {
  key: string;
  value: string;
}

export interface QueryConfig {
  id: string;
  name: string;
  source: DataSourceType;
  sql?: string;
  table?: string;
  filters?: Record<string, unknown>;
  selectedColumns?: string[];
  valueColumn?: string;
  valueColumns?: string[];
  labelColumn?: string;
  aggregation?: "sum" | "avg" | "count" | "max" | "min";
  groupBy?: string;
  limit?: number;
}

export interface ColumnMetadata {
  name: string;
  sqlType: string;
  nullable: boolean;
  isNumeric: boolean;
}

export interface TableMetadata {
  schema: string;
  name: string;
  fullName: string;
  columns?: ColumnMetadata[];
}

export interface BerichtInfo {
  Berichts_ID: number;
  Berichtsname: string;
}

export interface QueryTemplate {
  id: string;
  name: string;
  description?: string;
  queryConfig: QueryConfig;
  createdAt?: string;
  updatedAt?: string;
  isPublic?: boolean;
}

export interface BlockTemplate {
  id: string;
  name: string;
  description?: string;
  blockType: BlockType;
  block: SlideBlock;
  queryConfig?: QueryConfig;
  createdAt?: string;
  updatedAt?: string;
  isPublic?: boolean;
}

// ─── Chart Templates ──────────────────────────────────────────
export interface ChartTemplate {
  id: string;
  name: string;
  description?: string;
  chartType: ChartType;
  category?: "financial" | "sales" | "operations" | "general";
  defaultConfig: Partial<ChartBlock>;
}

// ─── Slide Templates ──────────────────────────────────────────
export interface SlideTemplate {
  id: string;
  name: string;
  description?: string;
  blocks: SlideBlock[];
  title: string;
  subtitle?: string;
  userId?: string;
  createdAt?: string;
  ispublic?: boolean;
}
