import type { TableBlock as TableBlockType } from "../../types/slide";
import type { Theme } from "../../types/theme";

interface Props {
  block: TableBlockType;
  theme: Theme;
}

function formatCell(value: string | number, fmt?: string): string {
  if (typeof value === "string") return value;
  if (fmt === "currency")
    return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) + " €";
  if (fmt === "percent")
    return value.toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " %";
  return value.toLocaleString("de-DE");
}

export function TableBlock({ block, theme }: Props) {
  const { columns, rows, title, showHeader = true, striped = false, highlightLast = false } = block;

  return (
    <div style={{
      width: "100%", height: "100%",
      background: theme.surface,
      borderRadius: `${theme.borderRadius}px`,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      {title && (
        <div style={{
          padding: "10px 16px",
          fontFamily: theme.fontHeading,
          fontSize: "15px", fontWeight: 600,
          color: theme.text,
          background: theme.surface,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          flexShrink: 0,
        }}>
          {title}
        </div>
      )}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{
          width: "100%", borderCollapse: "collapse",
          fontFamily: theme.fontBody, fontSize: "13px",
        }}>
          {showHeader && (
            <thead>
              <tr style={{ background: theme.primary }}>
                {columns.map((col) => (
                  <th key={col.key} style={{
                    padding: "8px 14px",
                    textAlign: col.align ?? "left",
                    color: "#fff",
                    fontWeight: 600, fontSize: "12px",
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                    width: col.width ? `${col.width}px` : undefined,
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, ri) => {
              const isLast = highlightLast && ri === rows.length - 1;
              return (
                <tr key={ri} style={{
                  background: isLast
                    ? theme.secondary
                    : striped && ri % 2 === 1
                    ? "rgba(0,0,0,0.025)"
                    : "transparent",
                  borderBottom: isLast ? "none" : "1px solid rgba(0,0,0,0.04)",
                }}>
                  {columns.map((col) => (
                    <td key={col.key} style={{
                      padding: "7px 14px",
                      textAlign: col.align ?? "left",
                      color: isLast ? "#fff" : theme.text,
                      fontWeight: isLast ? 700 : 400,
                    }}>
                      {formatCell(row[col.key], col.format)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
