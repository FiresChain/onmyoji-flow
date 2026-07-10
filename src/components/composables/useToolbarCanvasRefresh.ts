import { normalizeGraph } from "@/core/document/normalizeGraph";
import { renderGraphData } from "@/core/logicflow/graphIO";
import { normalizeViewport, setViewport } from "@/core/logicflow/viewport";
import { getLogicFlowInstance, type LogicFlowScope } from "@/ts/useLogicFlow";

interface ToolbarCanvasFileLike {
  graphRawData?: unknown;
  transform?: {
    SCALE_X?: number;
    SCALE_Y?: number;
    TRANSLATE_X?: number;
    TRANSLATE_Y?: number;
  };
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
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  const refreshLogicFlowCanvas = (message?: string) => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      const logicFlowInstance = getLogicFlowInstance(logicFlowScope);
      if (!logicFlowInstance) return;

      const currentFileData = filesStore.getTab(filesStore.activeFileId);
      if (!currentFileData) return;

      const rawData = currentFileData.graphRawData || currentFileData;
      renderGraphData(logicFlowInstance, normalizeGraph(rawData));
      setViewport(
        logicFlowInstance,
        normalizeViewport(currentFileData.transform),
      );
      console.log(message || "LogicFlow 画布已重新渲染");
    }, 100);
  };

  const disposeCanvasRefresh = () => {
    if (!refreshTimer) return;
    clearTimeout(refreshTimer);
    refreshTimer = null;
  };

  return {
    refreshLogicFlowCanvas,
    disposeCanvasRefresh,
  };
}
