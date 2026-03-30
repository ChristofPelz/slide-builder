import React, { useRef, forwardRef } from "react";
import { SlideConfig, SlideBlock } from "../types";
import { KPIBlock } from "./blocks/KPIBlock";
import { ChartBlock } from "./blocks/ChartBlock";
import { TableBlock } from "./blocks/TableBlock";
import { TextBlock } from "./blocks/TextBlock";
import { ImageBlock } from "./blocks/ImageBlock";

interface SlideCanvasProps {
  slide: SlideConfig;
  theme: Theme;
  isEditing?: boolean;
  onBlockSelect?: (blockId: string | null) => void;
  selectedBlockId?: string | null;
  scale?: number;
}

export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: number;
  logo?: string;
}

export const defaultTheme: Theme = {
  primary: "#1B2A4A",
  secondary: "#2D6A9F",
  accent: "#E8A020",
  background: "#FFFFFF",
  surface: "#F4F6F9",
  text: "#0F1B2D",
  textMuted: "#6B7A90",
  fontHeading: "'Barlow Condensed', sans-serif",
  fontBody: "'Barlow', sans-serif",
  borderRadius: 6,
};

// 16:9 base dimensions — Playwright renders at exactly these px
export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

export const SlideCanvas = forwardRef<HTMLDivElement, SlideCanvasProps>(
  (
    {
      slide,
      theme,
      isEditing = false,
      onBlockSelect,
      selectedBlockId,
      scale = 1,
    },
    ref
  ) => {
    const renderBlock = (block: SlideBlock) => {
      const isSelected = selectedBlockId === block.id;
      const baseStyle: React.CSSProperties = {
        position: "absolute",
        left: `${block.x}px`,
        top: `${block.y}px`,
        width: `${block.width}px`,
        height: `${block.height}px`,
        boxSizing: "border-box",
        outline: isEditing && isSelected ? `2px solid ${theme.accent}` : "none",
        outlineOffset: "2px",
        cursor: isEditing ? "pointer" : "default",
        borderRadius: `${theme.borderRadius}px`,
        overflow: "hidden",
      };

      const handleClick = () => {
        if (isEditing && onBlockSelect) onBlockSelect(block.id);
      };

      switch (block.type) {
        case "kpi":
          return (
            <div key={block.id} style={baseStyle} onClick={handleClick}>
              <KPIBlock block={block} theme={theme} />
            </div>
          );
        case "chart":
          return (
            <div key={block.id} style={baseStyle} onClick={handleClick}>
              <ChartBlock block={block} theme={theme} />
            </div>
          );
        case "table":
          return (
            <div key={block.id} style={baseStyle} onClick={handleClick}>
              <TableBlock block={block} theme={theme} />
            </div>
          );
        case "text":
          return (
            <div key={block.id} style={baseStyle} onClick={handleClick}>
              <TextBlock block={block} theme={theme} />
            </div>
          );
        case "image":
          return (
            <div key={block.id} style={baseStyle} onClick={handleClick}>
              <ImageBlock block={block} theme={theme} />
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div
        ref={ref}
        data-slide-canvas
        style={{
          position: "relative",
          width: `${SLIDE_WIDTH}px`,
          height: `${SLIDE_HEIGHT}px`,
          background: slide.backgroundImage
            ? `url(${slide.backgroundImage}) center/cover no-repeat`
            : slide.backgroundColor || theme.background,
          fontFamily: theme.fontBody,
          overflow: "hidden",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          flexShrink: 0,
        }}
        onClick={() => isEditing && onBlockSelect && onBlockSelect(null)}
      >
        {/* Header bar */}
        {slide.showHeader !== false && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "56px",
              background: theme.primary,
              display: "flex",
              alignItems: "center",
              paddingLeft: "40px",
              paddingRight: "40px",
              justifyContent: "space-between",
              zIndex: 10,
            }}
          >
            <div
              style={{
                fontFamily: theme.fontHeading,
                fontSize: "22px",
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {slide.title}
            </div>
            {slide.subtitle && (
              <div
                style={{
                  fontFamily: theme.fontBody,
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.65)",
                  letterSpacing: "0.02em",
                }}
              >
                {slide.subtitle}
              </div>
            )}
            {theme.logo && (
              <img
                src={theme.logo}
                alt="Logo"
                style={{ height: "32px", objectFit: "contain" }}
              />
            )}
          </div>
        )}

        {/* Accent line under header */}
        {slide.showHeader !== false && (
          <div
            style={{
              position: "absolute",
              top: "56px",
              left: 0,
              right: 0,
              height: "3px",
              background: theme.accent,
              zIndex: 10,
            }}
          />
        )}

        {/* Blocks */}
        {slide.blocks.map(renderBlock)}

        {/* Footer */}
        {slide.showFooter !== false && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "32px",
              background: theme.surface,
              borderTop: `1px solid rgba(0,0,0,0.06)`,
              display: "flex",
              alignItems: "center",
              paddingLeft: "40px",
              paddingRight: "40px",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: theme.textMuted,
                fontFamily: theme.fontBody,
              }}
            >
              {slide.footerLeft || "INVARIA Finanzmanagement"}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: theme.textMuted,
                fontFamily: theme.fontBody,
              }}
            >
              {slide.footerRight ||
                new Date().toLocaleDateString("de-DE", {
                  month: "long",
                  year: "numeric",
                })}
            </span>
          </div>
        )}
      </div>
    );
  }
);

SlideCanvas.displayName = "SlideCanvas";
