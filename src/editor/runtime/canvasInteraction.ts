import type LogicFlow from "@logicflow/core";
import { nextTick, type Ref } from "vue";

const RIGHT_MOUSE_BUTTON = 2;
const RIGHT_DRAG_THRESHOLD = 2;
const RIGHT_DRAG_CONTEXTMENU_SUPPRESS_MS = 300;

interface FlowCanvasInteractionOptions {
  lf: Ref<LogicFlow | null>;
  flowHostRef: Ref<HTMLElement | null>;
  containerRef: Ref<HTMLElement | null>;
}

export function useFlowCanvasInteraction(
  options: FlowCanvasInteractionOptions,
) {
  const { lf, flowHostRef, containerRef } = options;
  let containerResizeObserver: ResizeObserver | null = null;
  let isRightDragging = false;
  let rightDragMoved = false;
  let rightDragLastX = 0;
  let rightDragLastY = 0;
  let rightDragDistance = 0;
  let suppressContextMenuUntil = 0;
  let resizeAnimationFrameId: number | null = null;
  let resizeTimerId: ReturnType<typeof setTimeout> | null = null;
  let mountedContainer: HTMLElement | null = null;
  let mountedFlowHost: HTMLElement | null = null;
  let mounted = false;
  let mountGeneration = 0;

  const resolveResizeHost = () => {
    const container = containerRef.value;
    if (!container) return null;
    return (
      flowHostRef.value ??
      (container.parentElement as HTMLElement | null) ??
      container
    );
  };

  const resizeCanvas = () => {
    const lfInstance = lf.value as any;
    const resizeHost = resolveResizeHost();
    if (!lfInstance || !resizeHost || typeof lfInstance.resize !== "function") {
      return;
    }
    const width = resizeHost.clientWidth;
    const height = resizeHost.clientHeight;
    if (width > 0 && height > 0) {
      lfInstance.resize(width, height);
    }
  };

  const handleWindowResize = () => {
    resizeCanvas();
  };

  const queueCanvasResize = (generation: number) => {
    resizeCanvas();
    if (typeof window === "undefined") return;
    resizeAnimationFrameId = window.requestAnimationFrame(() => {
      resizeAnimationFrameId = null;
      if (mounted && generation === mountGeneration) resizeCanvas();
    });
    resizeTimerId = setTimeout(() => {
      resizeTimerId = null;
      if (mounted && generation === mountGeneration) resizeCanvas();
    }, 120);
  };

  function handleRightDragMouseMove(event: MouseEvent) {
    if (!isRightDragging) return;

    const deltaX = event.clientX - rightDragLastX;
    const deltaY = event.clientY - rightDragLastY;
    rightDragLastX = event.clientX;
    rightDragLastY = event.clientY;
    if (deltaX === 0 && deltaY === 0) return;

    rightDragDistance += Math.abs(deltaX) + Math.abs(deltaY);
    if (!rightDragMoved && rightDragDistance >= RIGHT_DRAG_THRESHOLD) {
      rightDragMoved = true;
    }
    if (rightDragMoved) {
      lf.value?.translate(deltaX, deltaY);
      event.preventDefault();
    }
  }

  function stopRightDrag() {
    if (!isRightDragging) return;

    isRightDragging = false;
    mountedFlowHost?.classList.remove("flow-container--panning");
    window.removeEventListener("mousemove", handleRightDragMouseMove);
    window.removeEventListener("mouseup", handleRightDragMouseUp);
    if (rightDragMoved) {
      suppressContextMenuUntil =
        Date.now() + RIGHT_DRAG_CONTEXTMENU_SUPPRESS_MS;
    }
  }

  function handleRightDragMouseUp() {
    stopRightDrag();
  }

  function handleCanvasMouseDown(event: MouseEvent) {
    if (event.button !== RIGHT_MOUSE_BUTTON) return;

    const target = event.target as HTMLElement | null;
    if (target?.closest(".lf-menu")) return;
    if (!mountedContainer?.contains(target)) return;

    isRightDragging = true;
    rightDragMoved = false;
    rightDragDistance = 0;
    rightDragLastX = event.clientX;
    rightDragLastY = event.clientY;
    suppressContextMenuUntil = 0;

    mountedFlowHost?.classList.add("flow-container--panning");
    window.addEventListener("mousemove", handleRightDragMouseMove);
    window.addEventListener("mouseup", handleRightDragMouseUp);
  }

  function handleCanvasContextMenu(event: MouseEvent) {
    if (Date.now() >= suppressContextMenuUntil) return;

    event.preventDefault();
    event.stopPropagation();
    suppressContextMenuUntil = 0;
  }

  function mountCanvasInteraction() {
    disposeCanvasInteraction();
    const generation = ++mountGeneration;
    mounted = true;
    mountedContainer = containerRef.value;
    mountedFlowHost = flowHostRef.value;

    try {
      mountedContainer?.addEventListener("mousedown", handleCanvasMouseDown);
      mountedContainer?.addEventListener(
        "contextmenu",
        handleCanvasContextMenu,
        true,
      );

      if (typeof ResizeObserver !== "undefined") {
        containerResizeObserver = new ResizeObserver(() => {
          resizeCanvas();
        });
        if (mountedFlowHost) {
          containerResizeObserver.observe(mountedFlowHost);
        }
        if (mountedContainer && mountedContainer !== mountedFlowHost) {
          containerResizeObserver.observe(mountedContainer);
        }
      }
      window.addEventListener("resize", handleWindowResize);
      nextTick(() => {
        if (mounted && generation === mountGeneration) {
          queueCanvasResize(generation);
        }
      });
    } catch (error) {
      if (generation === mountGeneration) {
        disposeCanvasInteraction();
      }
      throw error;
    }

    return () => {
      if (generation === mountGeneration) {
        disposeCanvasInteraction();
      }
    };
  }

  function disposeCanvasInteraction() {
    mountGeneration += 1;
    if (!mounted && !containerResizeObserver && !mountedContainer) return;
    mounted = false;
    stopRightDrag();
    containerResizeObserver?.disconnect();
    containerResizeObserver = null;
    if (resizeAnimationFrameId !== null) {
      window.cancelAnimationFrame?.(resizeAnimationFrameId);
      resizeAnimationFrameId = null;
    }
    if (resizeTimerId !== null) {
      clearTimeout(resizeTimerId);
      resizeTimerId = null;
    }
    window.removeEventListener("resize", handleWindowResize);
    mountedContainer?.removeEventListener("mousedown", handleCanvasMouseDown);
    mountedContainer?.removeEventListener(
      "contextmenu",
      handleCanvasContextMenu,
      true,
    );
    mountedFlowHost?.classList.remove("flow-container--panning");
    mountedContainer = null;
    mountedFlowHost = null;
  }

  return {
    resizeCanvas,
    mountCanvasInteraction,
    disposeCanvasInteraction,
  };
}
