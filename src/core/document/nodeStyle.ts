import { DefaultNodeStyle, type NodeStyle } from "./types";

export type { NodeStyle } from "./types";

const toNumber = (
  value: unknown,
  fallback: number | undefined,
): number | undefined => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeRadius = (radius: NodeStyle["radius"]): NodeStyle["radius"] => {
  const defaultRadius =
    typeof DefaultNodeStyle.radius === "number" ? DefaultNodeStyle.radius : 0;
  if (Array.isArray(radius)) {
    const fallback: [number, number, number, number] = Array.isArray(
      DefaultNodeStyle.radius,
    )
      ? [
          toNumber(DefaultNodeStyle.radius[0], defaultRadius) ?? defaultRadius,
          toNumber(DefaultNodeStyle.radius[1], defaultRadius) ?? defaultRadius,
          toNumber(DefaultNodeStyle.radius[2], defaultRadius) ?? defaultRadius,
          toNumber(DefaultNodeStyle.radius[3], defaultRadius) ?? defaultRadius,
        ]
      : [defaultRadius, defaultRadius, defaultRadius, defaultRadius];
    return [
      toNumber(radius[0], fallback[0]) ?? 0,
      toNumber(radius[1], fallback[1]) ?? 0,
      toNumber(radius[2], fallback[2]) ?? 0,
      toNumber(radius[3], fallback[3]) ?? 0,
    ];
  }
  return toNumber(radius, defaultRadius) ?? defaultRadius;
};

export function normalizeNodeStyle(
  style?: Partial<NodeStyle>,
  sizeFallback?: { width?: number; height?: number },
): NodeStyle {
  const incoming = style ?? {};
  const width =
    toNumber(incoming.width, sizeFallback?.width ?? DefaultNodeStyle.width) ??
    DefaultNodeStyle.width;
  const height =
    toNumber(
      incoming.height,
      sizeFallback?.height ?? DefaultNodeStyle.height,
    ) ?? DefaultNodeStyle.height;

  const shadow = incoming.shadow ?? {};
  const textStyle = incoming.textStyle;
  const hasTextStyle = textStyle != null;

  const resolvedOpacity =
    incoming.opacity != null
      ? clamp(
          toNumber(incoming.opacity, DefaultNodeStyle.opacity ?? 1) ?? 1,
          0,
          1,
        )
      : (DefaultNodeStyle.opacity ?? 1);

  return {
    ...DefaultNodeStyle,
    ...incoming,
    width,
    height,
    opacity: resolvedOpacity,
    radius: normalizeRadius(incoming.radius),
    strokeWidth:
      toNumber(incoming.strokeWidth, DefaultNodeStyle.strokeWidth) ??
      DefaultNodeStyle.strokeWidth,
    shadow: {
      ...DefaultNodeStyle.shadow,
      ...shadow,
      blur:
        toNumber(shadow.blur, DefaultNodeStyle.shadow?.blur) ??
        DefaultNodeStyle.shadow?.blur,
      offsetX:
        toNumber(shadow.offsetX, DefaultNodeStyle.shadow?.offsetX) ??
        DefaultNodeStyle.shadow?.offsetX,
      offsetY:
        toNumber(shadow.offsetY, DefaultNodeStyle.shadow?.offsetY) ??
        DefaultNodeStyle.shadow?.offsetY,
    },
    textStyle: hasTextStyle
      ? {
          color: textStyle?.color,
          fontFamily: textStyle?.fontFamily,
          fontSize:
            textStyle?.fontSize != null
              ? toNumber(
                  textStyle.fontSize,
                  DefaultNodeStyle.textStyle?.fontSize,
                )
              : undefined,
          fontWeight: textStyle?.fontWeight,
          lineHeight: textStyle?.lineHeight,
          align: textStyle?.align,
          verticalAlign: textStyle?.verticalAlign,
          letterSpacing: textStyle?.letterSpacing,
          padding: textStyle?.padding,
          background: textStyle?.background,
        }
      : textStyle,
  };
}

export function normalizePropertiesWithStyle<T extends Record<string, any>>(
  properties: T,
  sizeFallback?: { width?: number; height?: number },
): T & { style: NodeStyle } {
  const normalizedStyle = normalizeNodeStyle(properties?.style, sizeFallback);
  return {
    ...properties,
    style: normalizedStyle,
    width: normalizedStyle.width,
    height: normalizedStyle.height,
  };
}

export function styleEquals(
  first?: Partial<NodeStyle>,
  second?: Partial<NodeStyle>,
): boolean {
  return (
    JSON.stringify(normalizeNodeStyle(first)) ===
    JSON.stringify(normalizeNodeStyle(second))
  );
}
