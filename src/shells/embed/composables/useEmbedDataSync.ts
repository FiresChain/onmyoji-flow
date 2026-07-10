import { watch, type ShallowRef } from "vue";

import { normalizeGraph } from "@/core/document/normalizeGraph";
import type { GraphData, GraphEdge, GraphNode } from "@/core/document/types";
import type { EditorPort } from "@/core/logicflow/types";
import { rewriteAssetUrlsDeepWithResolver } from "@/features/assets/public";

interface UseEmbedDataSyncOptions {
  data: () => GraphData | undefined;
  mode: () => "preview" | "edit";
  port: ShallowRef<EditorPort | null>;
  resolveAssetUrl: (path: string) => string;
  emitUpdate: (data: GraphData) => void;
}

export const sanitizeEmbedGraphData = (
  input: GraphData | null | undefined,
  options: {
    hideDynamicGroups?: boolean;
    resolveAssetUrl?: (path: string) => string;
  } = {},
): GraphData => {
  const graphData = normalizeGraph(input, {
    hideDynamicGroups: options.hideDynamicGroups,
  });
  const rewriteAssetUrls = <T>(value: T): T =>
    options.resolveAssetUrl
      ? rewriteAssetUrlsDeepWithResolver(value, (assetValue) =>
          typeof assetValue === "string"
            ? options.resolveAssetUrl?.(assetValue)
            : assetValue,
        )
      : value;

  return {
    ...graphData,
    nodes: graphData.nodes.map(
      (node): GraphNode => ({
        ...node,
        ...(node.properties
          ? { properties: rewriteAssetUrls(node.properties) }
          : {}),
      }),
    ),
    edges: graphData.edges.map(
      (edge): GraphEdge => ({
        ...edge,
        ...(edge.properties
          ? { properties: rewriteAssetUrls(edge.properties) }
          : {}),
      }),
    ),
  };
};

export function useEmbedDataSync(options: UseEmbedDataSyncOptions) {
  let pendingData: GraphData | null = null;
  let lastRenderedPort: EditorPort | null = null;

  const getGraphData = (): GraphData | null =>
    options.port.value?.capture() ?? null;

  const renderGraphData = (data: GraphData): boolean => {
    const port = options.port.value;
    if (!port) {
      pendingData = data;
      return false;
    }

    port.render(
      sanitizeEmbedGraphData(data, {
        hideDynamicGroups: options.mode() === "preview",
        resolveAssetUrl: options.resolveAssetUrl,
      }),
    );
    lastRenderedPort = port;
    pendingData = null;
    return true;
  };

  const setGraphData = (data: GraphData): void => {
    renderGraphData(data);
  };

  const syncDataToPort = (): boolean => {
    const data = pendingData ?? options.data();
    return data ? renderGraphData(data) : false;
  };

  const handleGraphDataChange = (graphData: GraphData): void => {
    options.emitUpdate(getGraphData() ?? graphData);
  };

  const stopDataWatch = watch(
    options.data,
    (data) => {
      if (data) setGraphData(data);
    },
    { deep: true },
  );
  const stopPortWatch = watch(
    options.port,
    (port) => {
      if (port && port !== lastRenderedPort) syncDataToPort();
    },
    { flush: "post" },
  );

  const dispose = () => {
    stopDataWatch();
    stopPortWatch();
    pendingData = null;
    lastRenderedPort = null;
  };

  return {
    getGraphData,
    setGraphData,
    syncDataToPort,
    handleGraphDataChange,
    dispose,
  };
}
