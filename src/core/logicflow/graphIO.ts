import type LogicFlow from "@logicflow/core";

import type { GraphData } from "@/core/document/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export function normalizeZIndex(value: unknown): number | undefined {
  if (value == null) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

export function applyNodeZIndexToInstance(
  instance: LogicFlow,
  graphData: GraphData,
): void {
  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];

  nodes.forEach((node) => {
    const nodeId = typeof node?.id === "string" ? node.id : "";
    const zIndex = normalizeZIndex(node?.zIndex);
    if (!nodeId || zIndex == null) {
      return;
    }

    instance.getNodeModelById?.(nodeId)?.setZIndex?.(zIndex);
  });
}

export function renderGraphData(
  instance: LogicFlow,
  graphData: GraphData,
): void {
  instance.render(graphData as never);
  applyNodeZIndexToInstance(instance, graphData);
}

export function captureGraphData(instance: LogicFlow): GraphData {
  const captured = instance.getGraphRawData?.();
  if (!isRecord(captured)) {
    return { nodes: [], edges: [] };
  }

  const rawNodes = Array.isArray(captured.nodes) ? captured.nodes : [];
  const nodes = rawNodes.filter(isRecord).map((node) => {
    const nodeId = typeof node.id === "string" ? node.id : "";
    const model = nodeId ? instance.getNodeModelById?.(nodeId) : undefined;
    const modelZIndex = normalizeZIndex(model?.zIndex);
    const dataZIndex = normalizeZIndex(node.zIndex);
    const zIndex = modelZIndex ?? dataZIndex;

    return zIndex == null ? { ...node } : { ...node, zIndex };
  });

  return {
    ...captured,
    nodes,
    edges: Array.isArray(captured.edges) ? [...captured.edges] : [],
  } as unknown as GraphData;
}

export function clearGraphData(instance: LogicFlow): void {
  instance.clearData?.();
}

export const renderGraphDataWithLayer = renderGraphData;
export const collectGraphDataWithLayer = captureGraphData;
