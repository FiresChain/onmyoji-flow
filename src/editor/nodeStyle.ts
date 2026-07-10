import type { CSSProperties } from "vue";

import { normalizeNodeStyle } from "@/core/document/nodeStyle";
import type { NodeStyle } from "@/core/document/types";

export type { NodeStyle } from "@/core/document/types";

const toNumber = (
  value: unknown,
  fallback: number | undefined,
): number | undefined => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export function radiusToCss(radius?: NodeStyle["radius"]): string | undefined {
  if (radius == null) return undefined;
  if (Array.isArray(radius)) {
    return radius.map((value) => `${value}px`).join(" ");
  }
  return `${radius}px`;
}

export function buildBoxShadow(
  shadow?: NodeStyle["shadow"],
): string | undefined {
  if (!shadow || shadow.color == null) return undefined;
  const blur = toNumber(shadow.blur, 0) ?? 0;
  const offsetX = toNumber(shadow.offsetX, 0) ?? 0;
  const offsetY = toNumber(shadow.offsetY, 0) ?? 0;
  return `${offsetX}px ${offsetY}px ${blur}px ${shadow.color}`;
}

export function toContainerStyle(style: NodeStyle): CSSProperties {
  return {
    background: style.fill,
    borderColor: style.stroke,
    borderWidth: style.stroke ? `${style.strokeWidth ?? 1}px` : undefined,
    borderStyle: style.stroke ? "solid" : undefined,
    borderRadius: radiusToCss(style.radius),
    boxShadow: buildBoxShadow(style.shadow),
    opacity: style.opacity ?? 1,
  };
}

export function toTextStyle(style: NodeStyle): CSSProperties {
  const text = style.textStyle ?? {};
  return {
    color: text.color,
    fontFamily: text.fontFamily,
    fontSize: text.fontSize != null ? `${text.fontSize}px` : undefined,
    fontWeight: text.fontWeight,
    lineHeight: text.lineHeight as CSSProperties["lineHeight"],
    textAlign: text.align,
  };
}

export function extractStyleFromNode(node?: any): NodeStyle {
  const properties = node?.properties ?? {};
  return normalizeNodeStyle(properties.style, {
    width: properties.width ?? node?.width,
    height: properties.height ?? node?.height,
  });
}
