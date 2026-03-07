import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToolbarCanvasRefresh } from "@/components/composables/useToolbarCanvasRefresh";
import { getLogicFlowInstance } from "@/ts/useLogicFlow";

vi.mock("@/ts/useLogicFlow", () => ({
  getLogicFlowInstance: vi.fn(),
}));

describe("useToolbarCanvasRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refreshLogicFlowCanvas 渲染后应恢复节点 zIndex 与画布 transform", () => {
    const nodeModelA = { setZIndex: vi.fn() };
    const nodeModelB = { setZIndex: vi.fn() };
    const logicFlowInstance = {
      clearData: vi.fn(),
      render: vi.fn(),
      getNodeModelById: vi.fn((nodeId: string) => {
        if (nodeId === "node-a") return nodeModelA;
        if (nodeId === "node-b") return nodeModelB;
        return null;
      }),
      zoom: vi.fn(),
    };

    vi.mocked(getLogicFlowInstance).mockReturnValue(logicFlowInstance as never);

    const filesStore = {
      activeFileId: "file-1",
      getTab: vi.fn(() => ({
        graphRawData: {
          nodes: [
            { id: "node-a", type: "rect", zIndex: 12 },
            { id: "node-b", type: "rect", zIndex: "3" },
          ],
          edges: [],
        },
        transform: {
          SCALE_X: 1.5,
          TRANSLATE_X: 40,
          TRANSLATE_Y: -16,
        },
      })),
    };

    const { refreshLogicFlowCanvas } = useToolbarCanvasRefresh({
      filesStore,
      logicFlowScope: Symbol("scope"),
    });

    refreshLogicFlowCanvas();
    expect(logicFlowInstance.clearData).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(logicFlowInstance.clearData).toHaveBeenCalledTimes(1);
    expect(logicFlowInstance.render).toHaveBeenCalledTimes(1);
    expect(nodeModelA.setZIndex).toHaveBeenCalledWith(12);
    expect(nodeModelB.setZIndex).toHaveBeenCalledWith(3);
    expect(logicFlowInstance.zoom).toHaveBeenCalledWith(1.5, [40, -16]);
  });

  it("refreshLogicFlowCanvas 在非法 zIndex 与缺失 transform 时应安全跳过", () => {
    const nodeModel = { setZIndex: vi.fn() };
    const logicFlowInstance = {
      clearData: vi.fn(),
      render: vi.fn(),
      getNodeModelById: vi.fn(() => nodeModel),
      zoom: vi.fn(),
    };

    vi.mocked(getLogicFlowInstance).mockReturnValue(logicFlowInstance as never);

    const filesStore = {
      activeFileId: "file-2",
      getTab: vi.fn(() => ({
        graphRawData: {
          nodes: [{ id: "node-a", type: "rect", zIndex: "not-number" }],
          edges: [],
        },
      })),
    };

    const { refreshLogicFlowCanvas } = useToolbarCanvasRefresh({
      filesStore,
      logicFlowScope: Symbol("scope"),
    });

    refreshLogicFlowCanvas();
    vi.advanceTimersByTime(100);

    expect(logicFlowInstance.clearData).toHaveBeenCalledTimes(1);
    expect(logicFlowInstance.render).toHaveBeenCalledTimes(1);
    expect(nodeModel.setZIndex).not.toHaveBeenCalled();
    expect(logicFlowInstance.zoom).not.toHaveBeenCalled();
  });
});
