import type { KPIBlock as KPIBlockType } from "../../types/slide";
import type { Theme } from "../../types/theme";

interface Props {
  block: KPIBlockType;
  theme: Theme;
}

function formatValue(value: string | number, format?: string, prefix?: string, unit?: string): string {
  if (typeof value === "string") return value;
  let formatted: string;
  if (format === "currency") {
    formatted = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  } else if (format === "percent") {
    formatted = value.toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " %";
  } else {
    formatted = value.toLocaleString("de-DE");
  }
  if (prefix && format !== "percent") formatted = prefix + "\u00A0" + formatted;
  if (unit) formatted += "\u00A0" + unit;
  return formatted;
}

export function KPIBlock({ block, theme }: Props) {
  const { label, value, delta, deltaLabel, trend, format, prefix, unit, variant = "default" } = block;

  const bgColor =
    variant === "highlight" ? theme.accent :
    variant === "dark"      ? theme.primary :
    theme.surface;

  const textColor =
    variant === "highlight" ? "#0F1B2D" :
    variant === "dark"      ? "#FFFFFF"  :
    theme.text;

  const mutedColor =
    variant === "highlight" ? "rgba(0,0,0,0.55)" :
    variant === "dark"      ? "rgba(255,255,255,0.6)" :
    theme.textMuted;

  const trendColor =
    trend === "up"   ? (variant === "highlight" ? "#1a6b2e" : "#22c55e") :
    trend === "down" ? (variant === "highlight" ? "#7f1d1d" : "#ef4444") :
    mutedColor;

  const trendIcon = trend === "up" ? "▲" : trend === "down" ? "▼" : "–";

  return (
    <div style={{
      width: "100%", height: "100%",
      background: bgColor,
      borderRadius: `${theme.borderRadius}px`,
      padding: "14px 18px",
      boxSizing: "border-box",
      display: "flex", flexDirection: "column", justifyContent: "center",
      gap: "2px",
    }}>
      <span style={{
        fontSize: "11px", fontWeight: 600,
        fontFamily: theme.fontBody,
        color: mutedColor,
        textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: "30px", fontWeight: 700, lineHeight: 1.1,
        fontFamily: theme.fontHeading,
        color: textColor,
      }}>
        {formatValue(value, format, prefix, unit)}
      </span>
      {delta !== undefined && (
        <span style={{
          fontSize: "12px", fontWeight: 500,
          fontFamily: theme.fontBody,
          color: trendColor,
          display: "flex", alignItems: "center", gap: "4px",
        }}>
          <span>{trendIcon} {Math.abs(delta).toFixed(1)} %</span>
          {deltaLabel && (
            <span style={{ color: mutedColor, fontWeight: 400 }}>{deltaLabel}</span>
          )}
        </span>
      )}
    </div>
  );
}
