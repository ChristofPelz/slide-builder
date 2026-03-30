import type { KPIBlock as KPIBlockType } from '../types/slide';

interface Props {
  block: KPIBlockType;
}

export function KPIBlock({ block }: Props) {
  const { label, value, unit, trend } = block;
  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        boxSizing: 'border-box',
        padding: '16px',
        background: '#1e293b',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '4px',
        overflow: 'hidden',
      }}
    >
      <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ fontSize: '32px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span style={{ fontSize: '14px', color: '#94a3b8' }}>{unit}</span>
        )}
      </div>
      {trend !== undefined && (
        <span style={{ fontSize: '13px', color: trendPositive ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
          {trendPositive ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
        </span>
      )}
    </div>
  );
}
