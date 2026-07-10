import { ElMessageBox } from "element-plus";
import type { WorkspaceSession } from "./useWorkspaceSession";

type MessageType = "success" | "warning" | "info" | "error";

type ShowMessage = (type: MessageType, message: string) => void;

interface UseWorkspaceCommandsOptions {
  workspaceSession: WorkspaceSession;
  showMessage: ShowMessage;
  refreshLogicFlowCanvas: (message?: string) => void;
}

export function useWorkspaceCommands(options: UseWorkspaceCommandsOptions) {
  const { workspaceSession, showMessage, refreshLogicFlowCanvas } = options;

  const loadExample = () => {
    ElMessageBox.confirm("加载样例会覆盖当前数据，是否覆盖？", "提示", {
      confirmButtonText: "覆盖",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(() => {
        const defaultState = {
          fileList: [
            {
              label: "示例文件",
              name: "example",
              visible: true,
              type: "FLOW",
              groups: [
                {
                  shortDescription: "示例组",
                  groupInfo: [{}, {}, {}, {}, {}],
                  details: "这是一个示例文件",
                },
              ],
              flowData: {
                nodes: [],
                edges: [],
                viewport: { x: 0, y: 0, zoom: 1 },
              },
            },
          ],
          activeFile: "example",
        };
        workspaceSession.importData(defaultState);
        refreshLogicFlowCanvas("LogicFlow 画布已重新渲染（示例数据）");
        showMessage("success", "数据已恢复");
      })
      .catch(() => {
        showMessage("info", "选择了不恢复旧数据");
      });
  };

  const handleResetWorkspace = () => {
    ElMessageBox.confirm("确定重置当前工作区？该操作不可撤销", "提示", {
      confirmButtonText: "重置",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(() => {
        workspaceSession.resetWorkspace();
      })
      .catch(() => {
        // 用户取消
      });
  };

  const handleClearCanvas = () => {
    ElMessageBox.confirm("仅清空当前画布，不影响其他文件，确定继续？", "提示", {
      confirmButtonText: "清空",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(() => {
        workspaceSession.clearActiveFile();
        showMessage("success", "当前画布已清空");
      })
      .catch(() => {
        // 用户取消
      });
  };

  return {
    loadExample,
    handleResetWorkspace,
    handleClearCanvas,
  };
}
