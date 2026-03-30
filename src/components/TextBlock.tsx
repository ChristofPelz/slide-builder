import type { TextBlock as TextBlockType } from '../types/slide';

interface Props {
  block: TextBlockType;
}

export function TextBlock({ block }: Props) {
  const { content, fontSize = 16, fontWeight = 'normal', color = '#f1f5f9', align = 'left' } = block;

  return (
    <div
      style={{
        position: 'absolute',
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        boxSizing: 'border-box',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize,
          fontWeight,
          color,
          textAlign: align,
          lineHeight: 1.5,
          width: '100%',
        }}
      >
        {content}
      </p>
    </div>
  );
}
