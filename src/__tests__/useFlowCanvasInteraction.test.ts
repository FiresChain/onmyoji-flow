import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import { useFlowCanvasInteraction } from "@/editor/runtime/canvasInteraction";

function setElementSize(element: HTMLElement, width: number, height: number) {
  Object.defineProperty(element, "clientWidth", {
    value: width,
    configurable: true,
  });
  Object.defineProperty(element, "clientHeight", {
    value: height,
    configurable: true,
  });
}

describe("useFlowCanvasInteraction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("keeps right-drag panning and contextmenu suppression behavior unchanged", async () => {
    const flowHost = document.createElement("div");
    const container = document.createElement("div");
    flowHost.appendChild(container);
    document.body.appendChild(flowHost);
    setElementSize(flowHost, 800, 600);

    const lf = ref({
      translate: vi.fn(),
      resize: vi.fn(),
    } as any);

    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    );

    const { mountCanvasInteraction, disposeCanvasInteraction } =
      useFlowCanvasInteraction({
        lf,
        flowHostRef: ref(flowHost),
        containerRef: ref(container),
      });

    mountCanvasInteraction();
    await nextTick();
    vi.runAllTimers();

    container.dispatchEvent(
      new MouseEvent("mousedown", {
        button: 2,
        bubbles: true,
        clientX: 10,
        clientY: 10,
      }),
    );
    window.dispatchEvent(
      new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        clientX: 16,
        clientY: 14,
      }),
    );
    window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    expect((lf.value as any).translate).toHaveBeenCalledTimes(1);
    expect((lf.value as any).translate).toHaveBeenCalledWith(6, 4);

    const menuEvent = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });
    container.dispatchEvent(menuEvent);
    expect(menuEvent.defaultPrevented).toBe(true);

    disposeCanvasInteraction();
  });

  it("keeps ResizeObserver/window resize wiring and cleanup behavior unchanged", async () => {
    const observeSpy = vi.fn();
    const disconnectSpy = vi.fn();
    class MockResizeObserver {
      observe = observeSpy;
      disconnect = disconnectSpy;
      unobserve = vi.fn();
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver as any);

    const flowHost = document.createElement("div");
    const container = document.createElement("div");
    flowHost.appendChild(container);
    document.body.appendChild(flowHost);
    setElementSize(flowHost, 640, 360);

    const lf = ref({
      resize: vi.fn(),
      translate: vi.fn(),
    } as any);

    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    );

    const { mountCanvasInteraction, disposeCanvasInteraction } =
      useFlowCanvasInteraction({
        lf,
        flowHostRef: ref(flowHost),
        containerRef: ref(container),
      });

    mountCanvasInteraction();
    await nextTick();
    vi.runAllTimers();

    expect(observeSpy).toHaveBeenCalled();
    const beforeWindowResize = (lf.value as any).resize.mock.calls.length;
    window.dispatchEvent(new Event("resize"));
    expect((lf.value as any).resize.mock.calls.length).toBeGreaterThan(
      beforeWindowResize,
    );

    vi.runAllTimers();
    const beforeDisposeResizeCalls = (lf.value as any).resize.mock.calls.length;
    disposeCanvasInteraction();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("resize"));
    vi.runAllTimers();
    expect((lf.value as any).resize.mock.calls.length).toBe(
      beforeDisposeResizeCalls,
    );
  });

  it("returns an idempotent disposer that cancels queued work and cleans the mounted elements", async () => {
    const observeSpy = vi.fn();
    const disconnectSpy = vi.fn();
    class MockResizeObserver {
      observe = observeSpy;
      disconnect = disconnectSpy;
      unobserve = vi.fn();
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver as any);

    const originalFlowHost = document.createElement("div");
    const originalContainer = document.createElement("div");
    originalFlowHost.appendChild(originalContainer);
    document.body.appendChild(originalFlowHost);
    setElementSize(originalFlowHost, 640, 360);

    const replacementFlowHost = document.createElement("div");
    const replacementContainer = document.createElement("div");
    replacementFlowHost.appendChild(replacementContainer);
    document.body.appendChild(replacementFlowHost);
    setElementSize(replacementFlowHost, 320, 180);

    const resize = vi.fn();
    const translate = vi.fn();
    const lf = ref({ resize, translate } as any);
    const flowHostRef = ref<HTMLElement | null>(originalFlowHost);
    const containerRef = ref<HTMLElement | null>(originalContainer);
    let queuedAnimationFrame: FrameRequestCallback | null = null;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      queuedAnimationFrame = callback;
      return 17;
    });
    const cancelAnimationFrameSpy = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => {});

    const { mountCanvasInteraction, disposeCanvasInteraction } =
      useFlowCanvasInteraction({ lf, flowHostRef, containerRef });
    const dispose = mountCanvasInteraction();
    await nextTick();
    resize.mockClear();

    flowHostRef.value = replacementFlowHost;
    containerRef.value = replacementContainer;
    dispose();
    disposeCanvasInteraction();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(cancelAnimationFrameSpy).toHaveBeenCalledOnce();
    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(17);

    queuedAnimationFrame?.(0);
    vi.runAllTimers();
    window.dispatchEvent(new Event("resize"));
    originalContainer.dispatchEvent(
      new MouseEvent("mousedown", {
        button: 2,
        bubbles: true,
        clientX: 10,
        clientY: 10,
      }),
    );
    window.dispatchEvent(
      new MouseEvent("mousemove", {
        bubbles: true,
        clientX: 20,
        clientY: 20,
      }),
    );

    expect(resize).not.toHaveBeenCalled();
    expect(translate).not.toHaveBeenCalled();
  });

  it("does not let a stale mount disposer clean a replacement mount", async () => {
    const flowHost = document.createElement("div");
    const container = document.createElement("div");
    flowHost.appendChild(container);
    document.body.appendChild(flowHost);
    setElementSize(flowHost, 640, 360);

    const resize = vi.fn();
    const lf = ref({ resize, translate: vi.fn() } as any);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const interaction = useFlowCanvasInteraction({
      lf,
      flowHostRef: ref(flowHost),
      containerRef: ref(container),
    });

    const disposeFirstMount = interaction.mountCanvasInteraction();
    await nextTick();
    vi.runAllTimers();
    const disposeSecondMount = interaction.mountCanvasInteraction();
    await nextTick();
    vi.runAllTimers();
    resize.mockClear();

    disposeFirstMount();
    window.dispatchEvent(new Event("resize"));
    expect(resize).toHaveBeenCalledOnce();

    disposeSecondMount();
    window.dispatchEvent(new Event("resize"));
    expect(resize).toHaveBeenCalledOnce();
  });

  it("rolls back DOM listeners when mounting the resize observer fails", () => {
    class FailingResizeObserver {
      constructor() {
        throw new Error("observer failed");
      }
    }
    vi.stubGlobal("ResizeObserver", FailingResizeObserver as any);

    const flowHost = document.createElement("div");
    const container = document.createElement("div");
    flowHost.appendChild(container);
    document.body.appendChild(flowHost);
    const translate = vi.fn();
    const interaction = useFlowCanvasInteraction({
      lf: ref({ resize: vi.fn(), translate } as any),
      flowHostRef: ref(flowHost),
      containerRef: ref(container),
    });

    expect(() => interaction.mountCanvasInteraction()).toThrow(
      "observer failed",
    );
    container.dispatchEvent(
      new MouseEvent("mousedown", {
        button: 2,
        bubbles: true,
        clientX: 10,
        clientY: 10,
      }),
    );
    window.dispatchEvent(
      new MouseEvent("mousemove", {
        bubbles: true,
        clientX: 20,
        clientY: 20,
      }),
    );

    expect(translate).not.toHaveBeenCalled();
  });
});
