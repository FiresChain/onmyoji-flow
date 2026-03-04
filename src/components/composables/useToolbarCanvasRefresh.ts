import { getLogicFlowInstance, type LogicFlowScope } from "@/ts/useLogicFlow";

interface ToolbarCanvasFileLike {
  graphRawData?: unknown;
}

interface ToolbarCanvasStoreLike {
  getTab: (id: string) => ToolbarCanvasFileLike | undefined;
  activeFileId: string;
}

interface UseToolbarCanvasRefreshOptions {
  filesStore: ToolbarCanvasStoreLike;
  logicFlowScope: LogicFlowScope;
}

export function useToolbarCanvasRefresh(
  options: UseToolbarCanvasRefreshOptions,
) {
  const { filesStore, logicFlowScope } = options;

  const refreshLogicFlowCanvas = (message?: string) => {
    setTimeout(() => {
      const logicFlowInstance = getLogicFlowInstance(logicFlowScope);
      if (!logicFlowInstance) return;

      const currentFileData = filesStore.getTab(filesStore.activeFileId);
      if (!currentFileData) return;

      logicFlowInstance.clearData();
      const data = (currentFileData as any).graphRawData || currentFileData;
      logicFlowInstance.render(data);
      console.log(message || "LogicFlow 画布已重新渲染");
    }, 100);
  };

  return {
    refreshLogicFlowCanvas,
  };
}
