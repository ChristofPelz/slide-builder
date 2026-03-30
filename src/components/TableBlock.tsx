import type { TableBlock as TableBlockType } from '../types/slide';

interface Props {
  block: TableBlockType;
}

export function TableBlock({ block }: Props) {
  const { columns, rows, title } = block;

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
        background: '#0f172a',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {title && (
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', flexShrink: 0 }}>
          {title}
        </span>
      )}
      <div style={{ overflow: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '6px 10px',
                    textAlign: col.align ?? 'left',
                    color: '#94a3b8',
                    fontWeight: 600,
                    borderBottom: '1px solid #334155',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{ background: i % 2 === 1 ? 'rgba(255,255,255,0.03)' : 'transparent' }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '5px 10px',
                      textAlign: col.align ?? 'left',
                      color: '#e2e8f0',
                      borderBottom: '1px solid #1e293b',
                    }}
                  >
                    {String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
