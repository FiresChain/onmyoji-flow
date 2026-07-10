import { normalizeGraph } from "@/core/document/normalizeGraph";
import type { GraphData } from "@/core/document/types";
import { normalizeAssetSelectorNode } from "@/features/assets/public";
import { normalizeDynamicGroupNode } from "@/features/group-rules/public";

export const normalizeWorkspaceGraph = (graphData: unknown): GraphData => {
  const normalizedGraph = normalizeGraph(graphData);
  return {
    ...normalizedGraph,
    nodes: normalizedGraph.nodes.map((node) => {
      // The legacy schema pass always materialized a properties object.
      const nodeWithProperties = {
        ...node,
        properties:
          node.properties && typeof node.properties === "object"
            ? { ...node.properties }
            : {},
      };
      return normalizeAssetSelectorNode(
        normalizeDynamicGroupNode(nodeWithProperties),
      );
    }),
  };
};
