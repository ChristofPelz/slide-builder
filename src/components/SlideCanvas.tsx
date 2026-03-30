import type { Slide, SlideBlock } from '../types/slide';
import { KPIBlock } from './KPIBlock';
import { ChartBlock } from './ChartBlock';
import { TableBlock } from './TableBlock';
import { TextBlock } from './TextBlock';

const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

interface Props {
  slide: Slide;
  /** Scale factor for display (e.g. 0.5 renders at 640×360). Defaults to 1. */
  scale?: number;
}

function renderBlock(block: SlideBlock) {
  switch (block.type) {
    case 'kpi':
      return <KPIBlock key={block.id} block={block} />;
    case 'chart':
      return <ChartBlock key={block.id} block={block} />;
    case 'table':
      return <TableBlock key={block.id} block={block} />;
    case 'text':
      return <TextBlock key={block.id} block={block} />;
  }
}

export function SlideCanvas({ slide, scale = 1 }: Props) {
  return (
    <div
      style={{
        width: SLIDE_WIDTH * scale,
        height: SLIDE_HEIGHT * scale,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Inner layer rendered at full 1280×720, then scaled down */}
      <div
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          position: 'relative',
          background: slide.backgroundColor ?? '#0f172a',
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {slide.blocks.map(renderBlock)}
      </div>
    </div>
  );
}

export { SLIDE_WIDTH, SLIDE_HEIGHT };
