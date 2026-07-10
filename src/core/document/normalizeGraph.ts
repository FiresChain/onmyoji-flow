import type {
  GraphData,
  GraphEdge,
  GraphNode,
  NodeProperties,
  UnknownRecord,
} from "./types";

export interface NormalizeGraphOptions {
  hideDynamicGroups?: boolean;
}

const isPlainObject = (input: unknown): input is UnknownRecord =>
  input !== null && typeof input === "object" && !Array.isArray(input);

export const normalizeZIndex = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
};

const hasLabelContent = (value: unknown): value is UnknownRecord =>
  isPlainObject(value) &&
  ["id", "text", "value", "content"].some((key) => value[key] != null);

const normalizeProperties = (input: unknown): NodeProperties | undefined => {
  if (!isPlainObject(input)) {
    return undefined;
  }

  const properties: NodeProperties = { ...input };
  if (Array.isArray(properties._label)) {
    const labels = properties._label.filter(hasLabelContent);
    if (labels.length > 0) {
      properties._label = labels;
    } else {
      delete properties._label;
    }
  }

  return properties;
};

export const normalizeGraphNode = (input: unknown): GraphNode | null => {
  if (!isPlainObject(input)) {
    return null;
  }

  const node = { ...input } as UnknownRecord;
  const properties = normalizeProperties(input.properties);
  const meta = isPlainObject(properties?.meta)
    ? { ...properties.meta }
    : undefined;
  const zIndex =
    normalizeZIndex(input.zIndex) ??
    normalizeZIndex(meta?.zIndex) ??
    normalizeZIndex(meta?.z);

  if (zIndex == null) {
    delete node.zIndex;
  } else {
    node.zIndex = zIndex;
  }

  if (properties) {
    if (meta) {
      delete meta.z;
      delete meta.zIndex;
      if (Object.keys(meta).length > 0) {
        properties.meta = meta;
      } else {
        delete properties.meta;
      }
    }
    node.properties = properties;
  } else {
    delete node.properties;
  }

  return node as unknown as GraphNode;
};

export const normalizeGraphEdge = (input: unknown): GraphEdge | null => {
  if (!isPlainObject(input)) {
    return null;
  }

  const edge = { ...input } as UnknownRecord;
  const properties = normalizeProperties(input.properties);
  if (properties) {
    edge.properties = properties;
  } else {
    delete edge.properties;
  }
  return edge as unknown as GraphEdge;
};

export const normalizeGraph = (
  input: unknown,
  options: NormalizeGraphOptions = {},
): GraphData => {
  const rawGraph = isPlainObject(input) ? input : {};
  const rawNodes = Array.isArray(rawGraph.nodes) ? rawGraph.nodes : [];
  const rawEdges = Array.isArray(rawGraph.edges) ? rawGraph.edges : [];

  const normalizedNodes = rawNodes
    .map(normalizeGraphNode)
    .filter((node): node is GraphNode => node !== null);
  const nodes = options.hideDynamicGroups
    ? normalizedNodes.filter((node) => node.type !== "dynamic-group")
    : normalizedNodes;
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = rawEdges
    .map(normalizeGraphEdge)
    .filter((edge): edge is GraphEdge => edge !== null)
    .filter(
      (edge) =>
        !options.hideDynamicGroups ||
        (nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId)),
    );

  return {
    ...rawGraph,
    nodes,
    edges,
  } as GraphData;
};
