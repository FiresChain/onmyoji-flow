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

  const normalizeGraphData = (input: unknown) => {
    if (!input || typeof input !== "object") {
      return { nodes: [], edges: [] };
    }
    const source = input as Record<string, unknown>;
    return {
      ...source,
      nodes: Array.isArray(source.nodes) ? source.nodes : [],
      edges: Array.isArray(source.edges) ? source.edges : [],
    };
  };

  const applyNodeZIndex = (logicFlowInstance: any, graphData: any) => {
    const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
    nodes.forEach((node: any) => {
      const nodeId = typeof node?.id === "string" ? node.id : "";
      if (!nodeId) return;
      const parsedZIndex = Number(node?.zIndex);
      if (!Number.isFinite(parsedZIndex)) return;
      const model = logicFlowInstance.getNodeModelById?.(nodeId);
      model?.setZIndex?.(Math.trunc(parsedZIndex));
    });
  };

  const applyViewportTransform = (
    logicFlowInstance: any,
    transform?: ToolbarCanvasFileLike["transform"],
  ) => {
    if (!transform || typeof logicFlowInstance.zoom !== "function") {
      return;
    }
    const scale = Number(transform.SCALE_X);
    const translateX = Number(transform.TRANSLATE_X);
    const translateY = Number(transform.TRANSLATE_Y);
    logicFlowInstance.zoom(
      Number.isFinite(scale) ? scale : 1,
      [
        Number.isFinite(translateX) ? translateX : 0,
        Number.isFinite(translateY) ? translateY : 0,
      ],
    );
  };

  const refreshLogicFlowCanvas = (message?: string) => {
    setTimeout(() => {
      const logicFlowInstance = getLogicFlowInstance(logicFlowScope);
      if (!logicFlowInstance) return;

      const currentFileData = filesStore.getTab(filesStore.activeFileId);
      if (!currentFileData) return;

      logicFlowInstance.clearData();
      const rawData = (currentFileData as any).graphRawData || currentFileData;
      const graphData = normalizeGraphData(rawData);
      logicFlowInstance.render(graphData);
      applyNodeZIndex(logicFlowInstance, graphData);
      applyViewportTransform(logicFlowInstance, currentFileData.transform);
      console.log(message || "LogicFlow 画布已重新渲染");
    }, 100);
  };

  return {
    refreshLogicFlowCanvas,
  };
}
