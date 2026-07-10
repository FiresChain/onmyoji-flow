import {
  normalizeGraph,
  normalizeGraphNode,
  normalizeZIndex,
} from "./normalizeGraph";
import type {
  FlowFile,
  GraphData,
  GraphNode,
  NodeProperties,
  NodeStyle,
  RootDocument,
  Transform,
  UnknownRecord,
} from "./types";

export const CURRENT_SCHEMA_VERSION = "1.0.0";

export interface GraphMigration {
  id: string;
  from: string;
  to: string;
}

export interface GraphMigrationResult {
  graphData: GraphData;
  migratedCount: number;
  migrations: GraphMigration[];
}

export interface LegacyNodeMigrationResult {
  node: GraphNode;
  migrated: boolean;
}

export interface RootDocumentMigrationOptions {
  now?: number;
  createFileId?: (index: number, file: UnknownRecord) => string;
}

type LegacySelectorConfig = Readonly<{
  assetLibrary: "shikigami" | "yuhun";
  propertyKey: "shikigami" | "yuhun";
}>;

const LEGACY_SELECTOR_CONFIG: Readonly<Record<string, LegacySelectorConfig>> =
  Object.freeze({
    shikigamiSelect: Object.freeze({
      assetLibrary: "shikigami",
      propertyKey: "shikigami",
    }),
    yuhunSelect: Object.freeze({
      assetLibrary: "yuhun",
      propertyKey: "yuhun",
    }),
  });

const isPlainObject = (input: unknown): input is UnknownRecord =>
  input !== null && typeof input === "object" && !Array.isArray(input);

const isNonEmptyString = (input: unknown): input is string =>
  typeof input === "string" && input.trim().length > 0;

const toProperties = (input: unknown): NodeProperties =>
  isPlainObject(input) ? { ...input } : {};

export const migrateLegacyNode = (
  input: GraphNode,
): LegacyNodeMigrationResult => {
  const node = normalizeGraphNode(input) ?? input;
  const config = LEGACY_SELECTOR_CONFIG[node.type];
  if (!config) {
    return { node, migrated: false };
  }

  const properties = toProperties(node.properties);
  const originalData = properties[config.propertyKey] ?? null;
  return {
    node: {
      ...node,
      type: "assetSelector",
      properties: {
        ...properties,
        assetLibrary: config.assetLibrary,
        selectedAsset: originalData,
        _migrated: {
          from: node.type,
          originalData,
        },
      },
    },
    migrated: true,
  } as LegacyNodeMigrationResult;
};

export const migrateNode = migrateLegacyNode;

export const migrateGraphData = (input: unknown): GraphMigrationResult => {
  const graphData = normalizeGraph(input);
  const migrations: GraphMigration[] = [];
  const nodes = graphData.nodes.map((node) => {
    const result = migrateLegacyNode(node);
    if (result.migrated) {
      migrations.push({
        id: node.id,
        from: node.type,
        to: result.node.type,
      });
    }
    return result.node;
  });

  return {
    graphData: { ...graphData, nodes },
    migratedCount: migrations.length,
    migrations,
  };
};

export const needsGraphMigration = (input: unknown): boolean => {
  if (!isPlainObject(input) || !Array.isArray(input.nodes)) {
    return false;
  }
  return input.nodes.some(
    (node) =>
      isPlainObject(node) &&
      typeof node.type === "string" &&
      Object.prototype.hasOwnProperty.call(LEGACY_SELECTOR_CONFIG, node.type),
  );
};

export const needsMigration = needsGraphMigration;

export const getMigrationSummary = (input: unknown): string => {
  const { migratedCount, migrations } = migrateGraphData(input);
  if (migratedCount === 0) {
    return "无需迁移";
  }
  const summary = migrations
    .map(
      (migration) =>
        `节点 ${migration.id}: ${migration.from} → ${migration.to}`,
    )
    .join("\n");
  return `迁移了 ${migratedCount} 个节点:\n${summary}`;
};

const ensureTransform = (input: unknown): Transform => {
  const transform = isPlainObject(input) ? input : {};
  return {
    ...transform,
    SCALE_X: transform.SCALE_X ?? 1,
    SCALE_Y: transform.SCALE_Y ?? 1,
    TRANSLATE_X: transform.TRANSLATE_X ?? 0,
    TRANSLATE_Y: transform.TRANSLATE_Y ?? 0,
  } as Transform;
};

const migrateNodeToV1 = (input: unknown): GraphNode | null => {
  if (!isPlainObject(input)) {
    return null;
  }

  const initialNode = normalizeGraphNode(input);
  if (!initialNode) {
    return null;
  }
  const { node: selectorMigratedNode } = migrateLegacyNode(initialNode);
  const node = { ...selectorMigratedNode };
  const properties = toProperties(node.properties);
  const style: NodeStyle = isPlainObject(properties.style)
    ? { ...properties.style }
    : {};
  const meta = isPlainObject(properties.meta) ? { ...properties.meta } : {};

  const propertyWidth = properties.width ?? properties.w;
  const propertyHeight = properties.height ?? properties.h;
  if (style.width == null) {
    style.width = (propertyWidth ?? node.width) as number | undefined;
  }
  if (style.height == null) {
    style.height = (propertyHeight ?? node.height) as number | undefined;
  }
  if (style.width == null) {
    delete style.width;
  }
  if (style.height == null) {
    delete style.height;
  }

  if (meta.visible == null) {
    meta.visible = true;
  }
  if (meta.locked == null) {
    meta.locked = false;
  }

  const zIndex =
    normalizeZIndex(node.zIndex) ??
    normalizeZIndex(meta.zIndex) ??
    normalizeZIndex(meta.z);
  if (zIndex == null) {
    delete node.zIndex;
  } else {
    node.zIndex = zIndex;
  }
  delete meta.z;
  delete meta.zIndex;

  properties.style = style;
  properties.meta = meta;
  node.properties = properties;
  if (style.width != null) {
    node.width = style.width;
  }
  if (style.height != null) {
    node.height = style.height;
  }

  return normalizeGraphNode(node);
};

const ensureGraphData = (input: unknown): GraphData => {
  const rawGraph = isPlainObject(input) ? input : {};
  const rawNodes = Array.isArray(rawGraph.nodes) ? rawGraph.nodes : [];
  const migratedNodes = rawNodes
    .map(migrateNodeToV1)
    .filter((node): node is GraphNode => node !== null);
  return normalizeGraph({
    ...rawGraph,
    nodes: migratedNodes,
    edges: Array.isArray(rawGraph.edges) ? rawGraph.edges : [],
  });
};

const createDefaultFileInput = (): UnknownRecord => ({
  label: "File 1",
  name: "File 1",
  visible: true,
  type: "FLOW",
});

const migrateFlowFile = (
  input: unknown,
  index: number,
  now: number,
  createFileId?: RootDocumentMigrationOptions["createFileId"],
): FlowFile => {
  const file = isPlainObject(input) ? input : {};
  const fallbackName = `File ${index + 1}`;
  const id = isNonEmptyString(file.id)
    ? file.id
    : (createFileId?.(index, file) ?? `file-${index + 1}`);

  return {
    ...file,
    id,
    label: isNonEmptyString(file.label) ? file.label : fallbackName,
    name: isNonEmptyString(file.name) ? file.name : fallbackName,
    visible: typeof file.visible === "boolean" ? file.visible : true,
    type: isNonEmptyString(file.type) ? file.type : "FLOW",
    graphRawData: ensureGraphData(file.graphRawData),
    transform: ensureTransform(file.transform),
    createdAt: file.createdAt ?? now,
    updatedAt: file.updatedAt ?? now,
  } as FlowFile;
};

export const migrateToV1 = (
  input: unknown,
  options: RootDocumentMigrationOptions = {},
): RootDocument => {
  const now = options.now ?? Date.now();
  let sourceRoot: UnknownRecord = {};
  let rawFiles: unknown[];

  if (Array.isArray(input)) {
    rawFiles = input;
  } else if (isPlainObject(input) && "fileList" in input) {
    sourceRoot = input;
    rawFiles = Array.isArray(input.fileList) ? input.fileList : [];
  } else if (input == null) {
    rawFiles = [createDefaultFileInput()];
  } else {
    rawFiles = [{ ...createDefaultFileInput(), groups: input }];
  }

  const fileList = rawFiles.map((file, index) =>
    migrateFlowFile(file, index, now, options.createFileId),
  );
  const activeById = isNonEmptyString(sourceRoot.activeFileId)
    ? fileList.find((file) => file.id === sourceRoot.activeFileId)
    : undefined;
  const activeByName = isNonEmptyString(sourceRoot.activeFile)
    ? fileList.find((file) => file.name === sourceRoot.activeFile)
    : undefined;
  const activeFile = activeById ?? activeByName ?? fileList[0];
  const schemaVersion = sourceRoot.schemaVersion || CURRENT_SCHEMA_VERSION;

  return {
    ...sourceRoot,
    schemaVersion,
    fileList,
    activeFile:
      activeFile?.name ??
      (isNonEmptyString(sourceRoot.activeFile)
        ? sourceRoot.activeFile
        : "File 1"),
    ...(activeFile?.id ? { activeFileId: activeFile.id } : {}),
  } as RootDocument;
};

export const migrateRootDocument = migrateToV1;
