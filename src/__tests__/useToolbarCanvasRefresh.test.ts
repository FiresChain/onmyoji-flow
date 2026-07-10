import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToolbarCanvasRefresh } from "@/components/composables/useToolbarCanvasRefresh";
import type { WorkspaceSession } from "@/features/workspace/public";

const createSession = (rendered = true) =>
  ({
    renderActiveFile: vi.fn(() => rendered),
  }) as unknown as WorkspaceSession;

describe("useToolbarCanvasRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delegates delayed rendering to WorkspaceSession", () => {
    const workspaceSession = createSession();
    const { refreshLogicFlowCanvas } = useToolbarCanvasRefresh({
      workspaceSession,
    });

    refreshLogicFlowCanvas();
    vi.advanceTimersByTime(99);
    expect(workspaceSession.renderActiveFile).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(workspaceSession.renderActiveFile).toHaveBeenCalledOnce();
  });

  it("coalesces repeated refresh requests", () => {
    const workspaceSession = createSession();
    const { refreshLogicFlowCanvas } = useToolbarCanvasRefresh({
      workspaceSession,
    });

    refreshLogicFlowCanvas("first");
    vi.advanceTimersByTime(50);
    refreshLogicFlowCanvas("second");
    vi.advanceTimersByTime(100);

    expect(workspaceSession.renderActiveFile).toHaveBeenCalledOnce();
  });

  it("disposeCanvasRefresh cancels pending work", () => {
    const workspaceSession = createSession();
    const { refreshLogicFlowCanvas, disposeCanvasRefresh } =
      useToolbarCanvasRefresh({ workspaceSession });

    refreshLogicFlowCanvas();
    disposeCanvasRefresh();
    vi.advanceTimersByTime(100);

    expect(workspaceSession.renderActiveFile).not.toHaveBeenCalled();
  });
});
