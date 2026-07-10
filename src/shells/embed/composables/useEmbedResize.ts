import { nextTick, ref, watch, type Ref, type ShallowRef } from "vue";

import type { EditorPort } from "@/core/logicflow/types";

interface UseEmbedResizeOptions {
  root: Ref<HTMLElement | null>;
  toolbarHost: Ref<HTMLElement | null>;
  port: ShallowRef<EditorPort | null>;
  mode: () => "preview" | "edit";
  showToolbar: () => boolean;
  width: () => string | number;
  height: () => string | number;
  showComponentPanel: () => boolean;
}

export function useEmbedResize(options: UseEmbedResizeOptions) {
  const editorContentHeight = ref("100%");
  let resizeObserver: ResizeObserver | null = null;
  let disposed = false;
  let resizeGeneration = 0;

  const recalculateEditorContentHeight = () => {
    if (options.mode() !== "edit") return;

    const root = options.root.value;
    if (!root) return;

    const toolbarHeight = options.showToolbar()
      ? (options.toolbarHost.value?.offsetHeight ?? 0)
      : 0;
    const contentHeight = Math.max(0, root.clientHeight - toolbarHeight);
    editorContentHeight.value =
      contentHeight > 0 ? `${contentHeight}px` : "100%";
  };

  const resizeCanvas = () => {
    const generation = ++resizeGeneration;
    void nextTick(() => {
      if (disposed || generation !== resizeGeneration) return;
      recalculateEditorContentHeight();
      options.port.value?.resize();
    });
  };

  const stopLayoutWatch = watch(
    [
      options.mode,
      options.width,
      options.height,
      options.showToolbar,
      options.showComponentPanel,
    ],
    resizeCanvas,
    { flush: "post" },
  );
  const stopPortWatch = watch(options.port, resizeCanvas, { flush: "post" });

  const mountResizeObserver = (): (() => void) => {
    const root = options.root.value;
    if (typeof ResizeObserver !== "undefined" && root) {
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(root);
    }
    resizeCanvas();
    return dispose;
  };

  function dispose() {
    if (disposed) return;
    disposed = true;
    resizeGeneration += 1;
    stopLayoutWatch();
    stopPortWatch();
    resizeObserver?.disconnect();
    resizeObserver = null;
  }

  return {
    editorContentHeight,
    recalculateEditorContentHeight,
    resizeCanvas,
    mountResizeObserver,
    dispose,
  };
}
