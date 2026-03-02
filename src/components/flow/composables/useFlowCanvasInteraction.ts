import type LogicFlow from '@logicflow/core';
import { nextTick, type Ref } from 'vue';

const RIGHT_MOUSE_BUTTON = 2;
const RIGHT_DRAG_THRESHOLD = 2;
const RIGHT_DRAG_CONTEXTMENU_SUPPRESS_MS = 300;

interface FlowCanvasInteractionOptions {
  lf: Ref<LogicFlow | null>;
  flowHostRef: Ref<HTMLElement | null>;
  containerRef: Ref<HTMLElement | null>;
}

export function useFlowCanvasInteraction(options: FlowCanvasInteractionOptions) {
  const { lf, flowHostRef, containerRef } = options;
  let containerResizeObserver: ResizeObserver | null = null;
  let isRightDragging = false;
  let rightDragMoved = false;
  let rightDragLastX = 0;
  let rightDragLastY = 0;
  let rightDragDistance = 0;
  let suppressContextMenuUntil = 0;

  const resolveResizeHost = () => {
    const container = containerRef.value;
    if (!container) return null;
    return flowHostRef.value ?? (container.parentElement as HTMLElement | null) ?? container;
  };

  const resizeCanvas = () => {
    const lfInstance = lf.value as any;
    const resizeHost = resolveResizeHost();
    if (!lfInstance || !resizeHost || typeof lfInstance.resize !== 'function') {
      return;
    }
    const width = resizeHost.clientWidth;
    const height = resizeHost.clientHeight;
    if (width > 0 && height > 0) {
      lfInstance.resize(width, height);
      return;
    }
  };

  const handleWindowResize = () => {
    resizeCanvas();
  };

  const queueCanvasResize = () => {
    resizeCanvas();
    if (typeof window === 'undefined') return;
    window.requestAnimationFrame(() => resizeCanvas());
    setTimeout(() => resizeCanvas(), 120);
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
    flowHostRef.value?.classList.remove('flow-container--panning');
    window.removeEventListener('mousemove', handleRightDragMouseMove);
    window.removeEventListener('mouseup', handleRightDragMouseUp);

    if (rightDragMoved) {
      suppressContextMenuUntil = Date.now() + RIGHT_DRAG_CONTEXTMENU_SUPPRESS_MS;
    }
  }

  function handleRightDragMouseUp() {
    stopRightDrag();
  }

  function handleCanvasMouseDown(event: MouseEvent) {
    if (event.button !== RIGHT_MOUSE_BUTTON) return;

    const target = event.target as HTMLElement | null;
    if (target?.closest('.lf-menu')) return;
    if (!containerRef.value?.contains(target)) return;

    isRightDragging = true;
    rightDragMoved = false;
    rightDragDistance = 0;
    rightDragLastX = event.clientX;
    rightDragLastY = event.clientY;
    suppressContextMenuUntil = 0;

    flowHostRef.value?.classList.add('flow-container--panning');
    window.addEventListener('mousemove', handleRightDragMouseMove);
    window.addEventListener('mouseup', handleRightDragMouseUp);
  }

  function handleCanvasContextMenu(event: MouseEvent) {
    if (Date.now() >= suppressContextMenuUntil) return;

    event.preventDefault();
    event.stopPropagation();
    suppressContextMenuUntil = 0;
  }

  function mountCanvasInteraction() {
    containerRef.value?.addEventListener('mousedown', handleCanvasMouseDown);
    containerRef.value?.addEventListener('contextmenu', handleCanvasContextMenu, true);

    if (typeof ResizeObserver !== 'undefined') {
      containerResizeObserver = new ResizeObserver(() => {
        resizeCanvas();
      });
      if (flowHostRef.value) {
        containerResizeObserver.observe(flowHostRef.value);
      }
      if (containerRef.value && containerRef.value !== flowHostRef.value) {
        containerResizeObserver.observe(containerRef.value);
      }
    }
    window.addEventListener('resize', handleWindowResize);
    nextTick(() => {
      queueCanvasResize();
    });
  }

  function disposeCanvasInteraction() {
    stopRightDrag();
    containerResizeObserver?.disconnect();
    containerResizeObserver = null;
    window.removeEventListener('resize', handleWindowResize);
    containerRef.value?.removeEventListener('mousedown', handleCanvasMouseDown);
    containerRef.value?.removeEventListener('contextmenu', handleCanvasContextMenu, true);
  }

  return {
    resizeCanvas,
    mountCanvasInteraction,
    disposeCanvasInteraction
  };
}
