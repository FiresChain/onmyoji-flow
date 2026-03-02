import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { useFlowCanvasInteraction } from '@/components/flow/composables/useFlowCanvasInteraction';

function setElementSize(element: HTMLElement, width: number, height: number) {
  Object.defineProperty(element, 'clientWidth', {
    value: width,
    configurable: true
  });
  Object.defineProperty(element, 'clientHeight', {
    value: height,
    configurable: true
  });
}

describe('useFlowCanvasInteraction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('keeps right-drag panning and contextmenu suppression behavior unchanged', async () => {
    const flowHost = document.createElement('div');
    const container = document.createElement('div');
    flowHost.appendChild(container);
    document.body.appendChild(flowHost);
    setElementSize(flowHost, 800, 600);

    const lf = ref({
      translate: vi.fn(),
      resize: vi.fn()
    } as any);

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    const { mountCanvasInteraction, disposeCanvasInteraction } = useFlowCanvasInteraction({
      lf,
      flowHostRef: ref(flowHost),
      containerRef: ref(container)
    });

    mountCanvasInteraction();
    await nextTick();
    vi.runAllTimers();

    container.dispatchEvent(new MouseEvent('mousedown', {
      button: 2,
      bubbles: true,
      clientX: 10,
      clientY: 10
    }));
    window.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: 16,
      clientY: 14
    }));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    expect((lf.value as any).translate).toHaveBeenCalledTimes(1);
    expect((lf.value as any).translate).toHaveBeenCalledWith(6, 4);

    const menuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    container.dispatchEvent(menuEvent);
    expect(menuEvent.defaultPrevented).toBe(true);

    disposeCanvasInteraction();
  });

  it('keeps ResizeObserver/window resize wiring and cleanup behavior unchanged', async () => {
    const observeSpy = vi.fn();
    const disconnectSpy = vi.fn();
    class MockResizeObserver {
      observe = observeSpy;
      disconnect = disconnectSpy;
      unobserve = vi.fn();
    }
    vi.stubGlobal('ResizeObserver', MockResizeObserver as any);

    const flowHost = document.createElement('div');
    const container = document.createElement('div');
    flowHost.appendChild(container);
    document.body.appendChild(flowHost);
    setElementSize(flowHost, 640, 360);

    const lf = ref({
      resize: vi.fn(),
      translate: vi.fn()
    } as any);

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    const { mountCanvasInteraction, disposeCanvasInteraction } = useFlowCanvasInteraction({
      lf,
      flowHostRef: ref(flowHost),
      containerRef: ref(container)
    });

    mountCanvasInteraction();
    await nextTick();
    vi.runAllTimers();

    expect(observeSpy).toHaveBeenCalled();
    const beforeWindowResize = (lf.value as any).resize.mock.calls.length;
    window.dispatchEvent(new Event('resize'));
    expect((lf.value as any).resize.mock.calls.length).toBeGreaterThan(beforeWindowResize);

    vi.runAllTimers();
    const beforeDisposeResizeCalls = (lf.value as any).resize.mock.calls.length;
    disposeCanvasInteraction();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('resize'));
    vi.runAllTimers();
    expect((lf.value as any).resize.mock.calls.length).toBe(beforeDisposeResizeCalls);
  });
});
