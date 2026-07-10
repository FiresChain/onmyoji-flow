import { beforeEach, describe, expect, it, vi } from "vitest";
import { ElMessageBox } from "element-plus";
import { useWorkspaceCommands } from "@/features/workspace/useWorkspaceCommands";
import type { WorkspaceSession } from "@/features/workspace/public";

vi.mock("element-plus", () => ({
  ElMessageBox: { confirm: vi.fn() },
}));

const createContext = () => {
  const workspaceSession = {
    importData: vi.fn(() => ({ ok: true })),
    resetWorkspace: vi.fn(),
    clearActiveFile: vi.fn(),
  } as unknown as WorkspaceSession;
  const showMessage = vi.fn();
  const refreshLogicFlowCanvas = vi.fn();
  return {
    workspaceSession,
    showMessage,
    refreshLogicFlowCanvas,
    commands: useWorkspaceCommands({
      workspaceSession,
      showMessage,
      refreshLogicFlowCanvas,
    }),
  };
};

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("useWorkspaceCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the example through WorkspaceSession after confirmation", async () => {
    const context = createContext();
    vi.mocked(ElMessageBox.confirm).mockResolvedValue("confirm" as never);

    context.commands.loadExample();
    await flushMicrotasks();

    expect(context.workspaceSession.importData).toHaveBeenCalledWith(
      expect.objectContaining({ activeFile: "example" }),
    );
    expect(context.refreshLogicFlowCanvas).toHaveBeenCalledWith(
      "LogicFlow 画布已重新渲染（示例数据）",
    );
    expect(context.showMessage).toHaveBeenCalledWith("success", "数据已恢复");
  });

  it("keeps load-example cancellation behavior", async () => {
    const context = createContext();
    vi.mocked(ElMessageBox.confirm).mockRejectedValue(new Error("cancel"));

    context.commands.loadExample();
    await flushMicrotasks();

    expect(context.workspaceSession.importData).not.toHaveBeenCalled();
    expect(context.showMessage).toHaveBeenCalledWith(
      "info",
      "选择了不恢复旧数据",
    );
  });

  it("resets the workspace only after confirmation", async () => {
    const context = createContext();
    vi.mocked(ElMessageBox.confirm).mockResolvedValue("confirm" as never);

    context.commands.handleResetWorkspace();
    await flushMicrotasks();

    expect(context.workspaceSession.resetWorkspace).toHaveBeenCalledOnce();
  });

  it("keeps reset cancellation as a no-op", async () => {
    const context = createContext();
    vi.mocked(ElMessageBox.confirm).mockRejectedValue(new Error("cancel"));

    context.commands.handleResetWorkspace();
    await flushMicrotasks();

    expect(context.workspaceSession.resetWorkspace).not.toHaveBeenCalled();
  });

  it("clears the active document through WorkspaceSession", async () => {
    const context = createContext();
    vi.mocked(ElMessageBox.confirm).mockResolvedValue("confirm" as never);

    context.commands.handleClearCanvas();
    await flushMicrotasks();

    expect(context.workspaceSession.clearActiveFile).toHaveBeenCalledOnce();
    expect(context.showMessage).toHaveBeenCalledWith(
      "success",
      "当前画布已清空",
    );
  });

  it("keeps clear cancellation as a no-op", async () => {
    const context = createContext();
    vi.mocked(ElMessageBox.confirm).mockRejectedValue(new Error("cancel"));

    context.commands.handleClearCanvas();
    await flushMicrotasks();

    expect(context.workspaceSession.clearActiveFile).not.toHaveBeenCalled();
  });
});
