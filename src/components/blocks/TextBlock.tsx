import type { TextBlock as TextBlockType } from "../../types/slide";
import type { Theme } from "../../types/theme";

interface Props {
  block: TextBlockType;
  theme: Theme;
}

const sizeMap: Record<string, string> = {
  h1: "42px", h2: "28px", body: "16px", caption: "12px", quote: "20px",
};
const weightMap: Record<string, number> = {
  h1: 700, h2: 600, body: 400, caption: 400, quote: 400,
};

export function TextBlock({ block, theme }: Props) {
  const { content, variant = "body", align = "left", color, bold } = block;

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "center",
      justifyContent:
        align === "center" ? "center" :
        align === "right"  ? "flex-end" : "flex-start",
      padding: variant === "h1" || variant === "h2" ? "0" : "8px 12px",
      boxSizing: "border-box",
    }}>
      <p style={{
        margin: 0,
        fontFamily: variant === "h1" || variant === "h2" ? theme.fontHeading : theme.fontBody,
        fontSize: sizeMap[variant],
        fontWeight: bold ? 700 : weightMap[variant],
        color: color ?? (variant === "caption" ? theme.textMuted : theme.text),
        textAlign: align,
        lineHeight: variant === "h1" ? 1.1 : 1.5,
        fontStyle: variant === "quote" ? "italic" : "normal",
        borderLeft: variant === "quote" ? `3px solid ${theme.accent}` : "none",
        paddingLeft: variant === "quote" ? "16px" : "0",
        width: "100%",
      }}>
        {content}
      </p>
    </div>
  );
}
