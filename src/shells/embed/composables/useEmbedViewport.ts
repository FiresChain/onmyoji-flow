import type { Ref, ShallowRef } from "vue";

import type { EditorPort } from "@/core/logicflow/types";

interface UseEmbedViewportOptions {
  root: Ref<HTMLElement | null>;
  port: ShallowRef<EditorPort | null>;
}

export function useEmbedViewport(options: UseEmbedViewportOptions) {
  const hasRenderableGraphNodes = (port: EditorPort): boolean => {
    const graphData = port.capture();
    return Array.isArray(graphData.nodes) && graphData.nodes.length > 0;
  };

  const hasVisibleHost = (): boolean => {
    const root = options.root.value;
    return !!root && root.clientWidth > 0 && root.clientHeight > 0;
  };

  const fitView = (
    verticalOffset?: number,
    horizontalOffset?: number,
  ): boolean => {
    const port = options.port.value;
    if (!port || !hasRenderableGraphNodes(port) || !hasVisibleHost()) {
      return false;
    }

    if (
      typeof verticalOffset === "number" ||
      typeof horizontalOffset === "number"
    ) {
      port.fitView(verticalOffset, horizontalOffset);
    } else {
      port.fitView();
    }
    return true;
  };

  const zoom = (
    zoomSize?: number | boolean,
    point?: [number, number],
  ): boolean => options.port.value?.zoom(zoomSize, point) ?? false;

  const resetZoom = (): boolean => options.port.value?.resetZoom() ?? false;

  const resetTranslate = (): boolean =>
    options.port.value?.resetTranslate() ?? false;

  const translateCenter = (): boolean => {
    const port = options.port.value;
    if (!port || !hasRenderableGraphNodes(port) || !hasVisibleHost()) {
      return false;
    }
    return port.translateCenter();
  };

  const getTransform = (): Record<string, number> | null => {
    const transform = options.port.value?.getViewport();
    return transform ? (transform as Record<string, number>) : null;
  };

  return {
    fitView,
    zoom,
    resetZoom,
    resetTranslate,
    translateCenter,
    getTransform,
  };
}
