export type BlockType = 'kpi' | 'chart' | 'table' | 'text';

export interface BaseBlock {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface KPIBlock extends BaseBlock {
  type: 'kpi';
  label: string;
  value: number | string;
  unit?: string;
  trend?: number; // percentage change
}

export interface ChartBlock extends BaseBlock {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'area';
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKeys: string[];
  title?: string;
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  columns: Array<{ key: string; header: string; align?: 'left' | 'right' | 'center' }>;
  rows: Array<Record<string, unknown>>;
  title?: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export type SlideBlock = KPIBlock | ChartBlock | TableBlock | TextBlock;

export interface Slide {
  id: string;
  title: string;
  blocks: SlideBlock[];
  backgroundColor?: string;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
}
