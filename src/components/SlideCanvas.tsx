import React, { forwardRef, useRef } from "react";
import type { SlideConfig, SlideBlock } from "../types/slide";
import type { Theme } from "../types/theme";
import { KPIBlock } from "./blocks/KPIBlock";
import { ChartBlock } from "./blocks/ChartBlock";
import { TableBlock } from "./blocks/TableBlock";
import { TextBlock } from "./blocks/TextBlock";
import { ImageBlock } from "./blocks/ImageBlock";

// 16:9 base dimensions — Playwright renders at exactly these px
export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

interface SlideCanvasProps {
  slide: SlideConfig;
  theme: Theme;
  scale?: number;
  isEditing?: boolean;
  onBlockSelect?: (blockId: string | null) => void;
  selectedBlockId?: string | null;
  onBlockUpdate?: (blockId: string, partial: Partial<SlideBlock>) => void;
}

type InteractionMode = "drag" | "resize";

interface InteractionState {
  mode: InteractionMode;
  blockId: string;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
}

export const SlideCanvas = forwardRef<HTMLDivElement, SlideCanvasProps>(
  ({ slide, theme, scale = 1, isEditing = false, onBlockSelect, selectedBlockId, onBlockUpdate }, ref) => {
    const interactionRef = useRef<InteractionState | null>(null);
    const MIN_BLOCK_WIDTH = 80;
    const MIN_BLOCK_HEIGHT = 40;

    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);

    const beginInteraction = (
      e: React.MouseEvent,
      block: SlideBlock,
      mode: InteractionMode
    ) => {
      if (!isEditing || !onBlockUpdate) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      onBlockSelect?.(block.id);

      interactionRef.current = {
        mode,
        blockId: block.id,
        startX: e.clientX,
        startY: e.clientY,
        initialX: block.x,
        initialY: block.y,
        initialWidth: block.width,
        initialHeight: block.height,
      };

      const handleMouseMove = (event: MouseEvent) => {
        const interaction = interactionRef.current;
        if (!interaction) {
          return;
        }

        const dx = (event.clientX - interaction.startX) / scale;
        const dy = (event.clientY - interaction.startY) / scale;

        if (interaction.mode === "drag") {
          const nextX = clamp(
            interaction.initialX + dx,
            0,
            SLIDE_WIDTH - interaction.initialWidth
          );
          const nextY = clamp(
            interaction.initialY + dy,
            0,
            SLIDE_HEIGHT - interaction.initialHeight
          );

          onBlockUpdate(interaction.blockId, {
            x: Math.round(nextX),
            y: Math.round(nextY),
          });
          return;
        }

        const nextWidth = clamp(
          interaction.initialWidth + dx,
          MIN_BLOCK_WIDTH,
          SLIDE_WIDTH - interaction.initialX
        );
        const nextHeight = clamp(
          interaction.initialHeight + dy,
          MIN_BLOCK_HEIGHT,
          SLIDE_HEIGHT - interaction.initialY
        );

        onBlockUpdate(interaction.blockId, {
          width: Math.round(nextWidth),
          height: Math.round(nextHeight),
        });
      };

      const handleMouseUp = () => {
        interactionRef.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };

    const renderBlock = (block: SlideBlock) => {
      const isSelected = selectedBlockId === block.id;
      const wrapStyle: React.CSSProperties = {
        position: "absolute",
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        boxSizing: "border-box",
        borderRadius: `${theme.borderRadius}px`,
        overflow: "hidden",
        outline: isEditing && isSelected ? `2px solid ${theme.accent}` : "none",
        outlineOffset: "2px",
        cursor: isEditing ? "move" : "default",
        zIndex: block.zIndex ?? 1,
      };

      const handleClick = (e: React.MouseEvent) => {
        if (isEditing && onBlockSelect) {
          e.stopPropagation();
          onBlockSelect(block.id);
        }
      };

      let inner: React.ReactNode;
      switch (block.type) {
        case "kpi":    inner = <KPIBlock    block={block} theme={theme} />; break;
        case "chart":  inner = <ChartBlock  block={block} theme={theme} />; break;
        case "table":  inner = <TableBlock  block={block} theme={theme} />; break;
        case "text":   inner = <TextBlock   block={block} theme={theme} />; break;
        case "image":  inner = <ImageBlock  block={block} theme={theme} />; break;
        default:       return null;
      }

      return (
        <div
          key={block.id}
          style={wrapStyle}
          onClick={handleClick}
          onMouseDown={(e) => beginInteraction(e, block, "drag")}
        >
          {inner}
          {isEditing && isSelected && (
            <div
              onMouseDown={(e) => beginInteraction(e, block, "resize")}
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: "12px",
                height: "12px",
                background: theme.accent,
                borderTopLeftRadius: "4px",
                cursor: "nwse-resize",
                zIndex: 12,
              }}
            />
          )}
        </div>
      );
    };

    return (
      <div style={{
        width: SLIDE_WIDTH * scale,
        height: SLIDE_HEIGHT * scale,
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <div
          ref={ref}
          data-slide-canvas
          style={{
            position: "relative",
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
            background: slide.backgroundImage
              ? `url(${slide.backgroundImage}) center/cover no-repeat`
              : slide.backgroundColor ?? theme.background,
            fontFamily: theme.fontBody,
            overflow: "hidden",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            flexShrink: 0,
          }}
          onClick={() => isEditing && onBlockSelect?.(null)}
        >
          {/* Header bar */}
          {slide.showHeader !== false && (
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "56px",
              background: theme.primary,
              display: "flex", alignItems: "center",
              paddingLeft: "40px", paddingRight: "40px",
              justifyContent: "space-between",
              zIndex: 10,
            }}>
              <div style={{
                fontFamily: theme.fontHeading,
                fontSize: "22px", fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                {slide.title}
              </div>
              {slide.subtitle && (
                <div style={{
                  fontFamily: theme.fontBody,
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.65)",
                  letterSpacing: "0.02em",
                }}>
                  {slide.subtitle}
                </div>
              )}
              {theme.logo && (
                <img src={theme.logo} alt="Logo" style={{ height: "32px", objectFit: "contain" }} />
              )}
            </div>
          )}

          {/* Accent line under header */}
          {slide.showHeader !== false && (
            <div style={{
              position: "absolute",
              top: "56px", left: 0, right: 0,
              height: "3px",
              background: theme.accent,
              zIndex: 10,
            }} />
          )}

          {/* Blocks */}
          {slide.blocks.map(renderBlock)}

          {/* Footer */}
          {slide.showFooter !== false && (
            <div style={{
              position: "absolute",
              bottom: 0, left: 0, right: 0,
              height: "32px",
              background: theme.surface,
              borderTop: "1px solid rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center",
              paddingLeft: "40px", paddingRight: "40px",
              justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "11px", color: theme.textMuted, fontFamily: theme.fontBody }}>
                {slide.footerLeft ?? "INVARIA Finanzmanagement"}
              </span>
              <span style={{ fontSize: "11px", color: theme.textMuted, fontFamily: theme.fontBody }}>
                {slide.footerRight ?? new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

SlideCanvas.displayName = "SlideCanvas";
