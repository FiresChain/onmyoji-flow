import type LogicFlow from "@logicflow/core";

import type { Transform } from "@/core/document/types";

export const DEFAULT_TRANSFORM: Readonly<Transform> = Object.freeze({
  SCALE_X: 1,
  SCALE_Y: 1,
  TRANSLATE_X: 0,
  TRANSLATE_Y: 0,
});

const finiteOr = (value: unknown, fallback: number): number => {
  if (value == null) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function normalizeViewport(
  transform?: Partial<Transform> | null,
): Transform {
  return {
    SCALE_X: finiteOr(transform?.SCALE_X, DEFAULT_TRANSFORM.SCALE_X),
    SCALE_Y: finiteOr(transform?.SCALE_Y, DEFAULT_TRANSFORM.SCALE_Y),
    TRANSLATE_X: finiteOr(
      transform?.TRANSLATE_X,
      DEFAULT_TRANSFORM.TRANSLATE_X,
    ),
    TRANSLATE_Y: finiteOr(
      transform?.TRANSLATE_Y,
      DEFAULT_TRANSFORM.TRANSLATE_Y,
    ),
  };
}

export function getViewport(instance: LogicFlow): Transform {
  return normalizeViewport(instance.getTransform?.());
}

export function setViewport(instance: LogicFlow, transform: Transform): void {
  const normalized = normalizeViewport(transform);

  instance.resetZoom?.();
  instance.resetTranslate?.();
  instance.zoom?.(normalized.SCALE_X);
  instance.translate?.(normalized.TRANSLATE_X, normalized.TRANSLATE_Y);
}

export function resetViewport(instance: LogicFlow): void {
  setViewport(instance, DEFAULT_TRANSFORM);
}

export function zoomViewport(
  instance: LogicFlow,
  zoomSize?: number | boolean,
  point?: [number, number],
): boolean {
  if (typeof instance.zoom !== "function") {
    return false;
  }

  instance.zoom(zoomSize, point);
  return true;
}

export function resetViewportZoom(instance: LogicFlow): boolean {
  if (typeof instance.resetZoom !== "function") {
    return false;
  }

  instance.resetZoom();
  return true;
}

export function resetViewportTranslate(instance: LogicFlow): boolean {
  if (typeof instance.resetTranslate !== "function") {
    return false;
  }

  instance.resetTranslate();
  return true;
}

export function centerViewport(instance: LogicFlow): boolean {
  if (typeof instance.translateCenter !== "function") {
    return false;
  }

  instance.translateCenter();
  return true;
}

export function fitView(
  instance: LogicFlow,
  verticalOffset?: number,
  horizontalOffset?: number,
): void {
  if (
    typeof verticalOffset === "number" ||
    typeof horizontalOffset === "number"
  ) {
    instance.fitView?.(verticalOffset, horizontalOffset);
    return;
  }

  instance.fitView?.();
}
