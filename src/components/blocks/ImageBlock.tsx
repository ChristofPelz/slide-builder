import type { ImageBlock as ImageBlockType } from "../../types/slide";
import type { Theme } from "../../types/theme";

interface Props {
  block: ImageBlockType;
  theme: Theme;
}

export function ImageBlock({ block, theme }: Props) {
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
