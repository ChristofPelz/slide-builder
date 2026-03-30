// ─── TableBlock ───────────────────────────────────────────────
import React from "react";
import { TableBlock as TableBlockType, TextBlock as TextBlockType, ImageBlock as ImageBlockType } from "../../types";
import { Theme } from "../SlideCanvas";

export function TableBlock({ block, theme }: { block: TableBlockType; theme: Theme }) {
  function formatCell(value: string | number, fmt?: string) {
    if (typeof value === "string") return value;
    if (fmt === "currency")
      return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) + " €";
    if (fmt === "percent")
      return value.toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " %";
    return value.toLocaleString("de-DE");
  }

  return (
    <div style={{
      width: "100%", height: "100%",
      background: theme.surface,
      borderRadius: `${theme.borderRadius}px`,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      {block.title && (
        <div style={{
          padding: "10px 16px",
          fontFamily: theme.fontHeading,
          fontSize: "15px", fontWeight: 600,
          color: theme.text, background: theme.surface,
          borderBottom: `1px solid rgba(0,0,0,0.06)`,
        }}>{block.title}</div>
      )}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{
          width: "100%", borderCollapse: "collapse",
          fontFamily: theme.fontBody, fontSize: "13px",
        }}>
          {block.showHeader !== false && (
            <thead>
              <tr style={{ background: theme.primary }}>
                {block.columns.map((col) => (
                  <th key={col.key} style={{
                    padding: "8px 14px",
                    textAlign: col.align ?? "left",
                    color: "#fff",
                    fontWeight: 600, fontSize: "12px",
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                    width: col.width ? `${col.width}px` : undefined,
                  }}>{col.label}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {block.rows.map((row, ri) => {
              const isLast = ri === block.rows.length - 1 && block.highlightLast;
              return (
                <tr key={ri} style={{
                  background: isLast
                    ? theme.secondary
                    : block.striped && ri % 2 === 1
                    ? "rgba(0,0,0,0.025)"
                    : "transparent",
                  borderBottom: isLast ? "none" : `1px solid rgba(0,0,0,0.04)`,
                }}>
                  {block.columns.map((col) => (
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

// ─── TextBlock ────────────────────────────────────────────────
export function TextBlock({ block, theme }: { block: TextBlockType; theme: Theme }) {
  const sizeMap: Record<string, string> = {
    h1: "42px", h2: "28px", body: "16px", caption: "12px", quote: "20px",
  };
  const weightMap: Record<string, number> = {
    h1: 700, h2: 600, body: 400, caption: 400, quote: 400,
  };
  const variant = block.variant ?? "body";

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "center",
      justifyContent: block.align === "center"
        ? "center"
        : block.align === "right"
        ? "flex-end"
        : "flex-start",
      padding: variant === "h1" || variant === "h2" ? "0" : "8px 12px",
      boxSizing: "border-box",
    }}>
      <p style={{
        margin: 0,
        fontFamily: variant === "h1" || variant === "h2" ? theme.fontHeading : theme.fontBody,
        fontSize: sizeMap[variant],
        fontWeight: block.bold ? 700 : weightMap[variant],
        color: block.color || (variant === "caption" ? theme.textMuted : theme.text),
        textAlign: block.align ?? "left",
        lineHeight: variant === "h1" ? 1.1 : 1.5,
        fontStyle: variant === "quote" ? "italic" : "normal",
        borderLeft: variant === "quote" ? `3px solid ${theme.accent}` : "none",
        paddingLeft: variant === "quote" ? "16px" : "0",
      }}>
        {block.content}
      </p>
    </div>
  );
}

// ─── ImageBlock ───────────────────────────────────────────────
export function ImageBlock({ block, theme }: { block: ImageBlockType; theme: Theme }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      borderRadius: `${theme.borderRadius}px`,
      overflow: "hidden",
      background: theme.surface,
    }}>
      <img
        src={block.src}
        alt={block.alt ?? ""}
        style={{
          width: "100%", height: "100%",
          objectFit: block.objectFit ?? "cover",
          display: "block",
        }}
      />
    </div>
  );
}
