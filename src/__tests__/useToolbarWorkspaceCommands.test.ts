import { beforeEach, describe, expect, it, vi } from "vitest";
import { ElMessageBox } from "element-plus";
import { useToolbarWorkspaceCommands } from "@/components/composables/useToolbarWorkspaceCommands";
import { getLogicFlowInstance } from "@/ts/useLogicFlow";

vi.mock("element-plus", () => ({
  ElMessageBox: {
    confirm: vi.fn(),
  },
}));

vi.mock("@/ts/useLogicFlow", async () => {
  const actual =
    await vi.importActual<typeof import("@/ts/useLogicFlow")>(
      "@/ts/useLogicFlow",
    );
  return {
    ...actual,
    getLogicFlowInstance: vi.fn(),
  };
});

interface ToolbarWorkspaceTestContext {
  activeFile?: {
    graphRawData: unknown;
    transform: {
      SCALE_X: number;
      SCALE_Y: number;
      TRANSLATE_X: number;
      TRANSLATE_Y: number;
    };
  };
  filesStore: {
    importData: ReturnType<typeof vi.fn>;
    resetWorkspace: ReturnType<typeof vi.fn>;
    updateTab: ReturnType<typeof vi.fn>;
    getTab: ReturnType<typeof vi.fn>;
    activeFileId: string;
  };
  showMessage: ReturnType<typeof vi.fn>;
  refreshLogicFlowCanvas: ReturnType<typeof vi.fn>;
  commands: ReturnType<typeof useToolbarWorkspaceCommands>;
}

interface CreateWorkspaceContextOptions {
  activeFile?: ToolbarWorkspaceTestContext["activeFile"] | null;
}

const createContext = (
  options: CreateWorkspaceContextOptions = {},
): ToolbarWorkspaceTestContext => {
  const defaultActiveFile = {
    graphRawData: { nodes: [{ id: "n1" }], edges: [] },
    transform: {
      SCALE_X: 2,
      SCALE_Y: 2,
      TRANSLATE_X: 12,
      TRANSLATE_Y: 24,
    },
  };
  const activeFile = Object.prototype.hasOwnProperty.call(options, "activeFile")
    ? (options.activeFile ?? undefined)
    : defaultActiveFile;

  const filesStore = {
    importData: vi.fn(),
    resetWorkspace: vi.fn(),
    updateTab: vi.fn(),
    getTab: vi.fn(() => activeFile),
    activeFileId: "file-a",
  };

  const showMessage = vi.fn();
  const refreshLogicFlowCanvas = vi.fn();

  const commands = useToolbarWorkspaceCommands({
    filesStore,
    logicFlowScope: Symbol("toolbar-workspace-scope"),
    showMessage,
    refreshLogicFlowCanvas,
  });

  return {
    activeFile,
    filesStore,
    showMessage,
    refreshLogicFlowCanvas,
    commands,
  };
};

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("useToolbarWorkspaceCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loadExample keeps confirm-import-refresh behavior", async () => {
    const context = createContext();
    vi.mocked(ElMessageBox.confirm).mockResolvedValue("confirm" as never);

    context.commands.loadExample();
    await flushMicrotasks();

    expect(context.filesStore.importData).toHaveBeenCalledTimes(1);
    expect(context.filesStore.importData).toHaveBeenCalledWith(
      expect.objectContaining({
        activeFile: "example",
      }),
    );
    expect(context.refreshLogicFlowCanvas).toHaveBeenCalledWith(
      "LogicFlow 画布已重新渲染（示例数据）",
    );
    expect(context.showMessage).toHaveBeenCalledWith("success", "数据已恢复");
  });

  it("loadExample keeps cancel-info behavior", async () => {
    const context = createContext();
    vi.mocked(ElMessageBox.confirm).mockRejectedValue(new Error("cancel"));

    context.commands.loadExample();
    await flushMicrotasks();

    expect(context.filesStore.importData).not.toHaveBeenCalled();
    expect(context.showMessage).toHaveBeenCalledWith(
      "info",
      "选择了不恢复旧数据",
    );
  });

  it("handleResetWorkspace keeps confirm-reset behavior", async () => {
    const context = createContext();
    vi.mocked(ElMessageBox.confirm).mockResolvedValue("confirm" as never);

    context.commands.handleResetWorkspace();
    await flushMicrotasks();

    expect(context.filesStore.resetWorkspace).toHaveBeenCalledTimes(1);
  });

  it("handleResetWorkspace keeps cancel behavior", async () => {
    const context = createContext();
    vi.mocked(ElMessageBox.confirm).mockRejectedValue(new Error("cancel"));

    context.commands.handleResetWorkspace();
    await flushMicrotasks();

    expect(context.filesStore.resetWorkspace).not.toHaveBeenCalled();
  });

  it("handleClearCanvas keeps clear-active-tab behavior", async () => {
    const context = createContext();
    const lfInstance = {
      clearData: vi.fn(),
      render: vi.fn(),
      zoom: vi.fn(),
    };

    vi.mocked(ElMessageBox.confirm).mockResolvedValue("confirm" as never);
    vi.mocked(getLogicFlowInstance).mockReturnValue(lfInstance as never);

    context.commands.handleClearCanvas();
    await flushMicrotasks();

    expect(lfInstance.clearData).toHaveBeenCalledTimes(1);
    expect(lfInstance.render).toHaveBeenCalledWith({ nodes: [], edges: [] });
    expect(lfInstance.zoom).toHaveBeenCalledWith(1, [0, 0]);
    expect(context.activeFile).toBeDefined();
    expect(context.activeFile?.graphRawData).toEqual({ nodes: [], edges: [] });
    expect(context.activeFile?.transform).toEqual({
      SCALE_X: 1,
      SCALE_Y: 1,
      TRANSLATE_X: 0,
      TRANSLATE_Y: 0,
    });
    expect(context.filesStore.updateTab).toHaveBeenCalledWith("file-a");
    expect(context.showMessage).toHaveBeenCalledWith(
      "success",
      "当前画布已清空",
    );
  });

  it("handleClearCanvas keeps cancel-noop behavior", async () => {
    const context = createContext();
    const lfInstance = {
      clearData: vi.fn(),
      render: vi.fn(),
      zoom: vi.fn(),
    };

    vi.mocked(ElMessageBox.confirm).mockRejectedValue(new Error("cancel"));
    vi.mocked(getLogicFlowInstance).mockReturnValue(lfInstance as never);

    context.commands.handleClearCanvas();
    await flushMicrotasks();

    expect(lfInstance.clearData).not.toHaveBeenCalled();
    expect(lfInstance.render).not.toHaveBeenCalled();
    expect(lfInstance.zoom).not.toHaveBeenCalled();
    expect(context.filesStore.updateTab).not.toHaveBeenCalled();
    expect(context.showMessage).not.toHaveBeenCalledWith(
      "success",
      "当前画布已清空",
    );
  });

  it("handleClearCanvas keeps active-file reset behavior when LogicFlow instance is missing", async () => {
    const context = createContext();

    vi.mocked(ElMessageBox.confirm).mockResolvedValue("confirm" as never);
    vi.mocked(getLogicFlowInstance).mockReturnValue(null as never);

    context.commands.handleClearCanvas();
    await flushMicrotasks();

    expect(context.activeFile).toBeDefined();
    expect(context.activeFile?.graphRawData).toEqual({ nodes: [], edges: [] });
    expect(context.activeFile?.transform).toEqual({
      SCALE_X: 1,
      SCALE_Y: 1,
      TRANSLATE_X: 0,
      TRANSLATE_Y: 0,
    });
    expect(context.filesStore.updateTab).toHaveBeenCalledWith("file-a");
    expect(context.showMessage).toHaveBeenCalledWith(
      "success",
      "当前画布已清空",
    );
  });

  it("handleClearCanvas keeps no-active-file guard behavior", async () => {
    const context = createContext({ activeFile: null });
    const lfInstance = {
      clearData: vi.fn(),
      render: vi.fn(),
      zoom: vi.fn(),
    };

    vi.mocked(ElMessageBox.confirm).mockResolvedValue("confirm" as never);
    vi.mocked(getLogicFlowInstance).mockReturnValue(lfInstance as never);

    context.commands.handleClearCanvas();
    await flushMicrotasks();

    expect(context.activeFile).toBeUndefined();
    expect(lfInstance.clearData).toHaveBeenCalledTimes(1);
    expect(lfInstance.render).toHaveBeenCalledWith({ nodes: [], edges: [] });
    expect(lfInstance.zoom).toHaveBeenCalledWith(1, [0, 0]);
    expect(context.filesStore.updateTab).not.toHaveBeenCalled();
    expect(context.showMessage).toHaveBeenCalledWith(
      "success",
      "当前画布已清空",
    );
  });
});
