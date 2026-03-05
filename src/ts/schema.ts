import rootDocumentV1SchemaJson from "@/schemas/root-document.v1.json";
import type { AssetLibraryId } from "@/types/assets";
import {
  hasNodeIconSizeByTypeOverrides,
  normalizeNodeIconSizeByType,
  type NodeIconSizeByType,
} from "@/types/nodeIconSize";

export const CURRENT_SCHEMA_VERSION = "1.0.0";
export const ROOT_DOCUMENT_V1_SCHEMA = rootDocumentV1SchemaJson;

export interface RootDocumentValidationError {
  path: string;
  message: string;
}

export interface RootDocumentValidationResult {
  valid: boolean;
  errors: RootDocumentValidationError[];
}

export interface Transform {
  SCALE_X: number;
  SCALE_Y: number;
  TRANSLATE_X: number;
  TRANSLATE_Y: number;
}

export interface NodeStyle {
  // Size and transform
  width: number;
  height: number;
  rotate?: number; // deg

  // Shape/appearance
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number | [number, number, number, number];
  opacity?: number; // 0..1

  // Shadow
  shadow?: {
    color?: string;
    blur?: number;
    offsetX?: number;
    offsetY?: number;
  };

  // Text style for text node or nodes with text
  textStyle?: {
    color?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number | string;
    lineHeight?: number;
    align?: "left" | "center" | "right";
    verticalAlign?: "top" | "middle" | "bottom";
    letterSpacing?: number;
    padding?: [number, number, number, number];
    background?: string;
  };
}

export interface NodeMeta {
  /**
   * @deprecated Legacy compatibility input only. Canonical layer field is GraphNode.zIndex.
   */
  z?: number;
  locked?: boolean;
  visible?: boolean;
  groupId?: string;
  name?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface NodeProperties {
  style: NodeStyle;
  meta?: NodeMeta;
  children?: string[];
  groupMeta?: {
    version: number;
    groupKind: "team" | "shikigami";
    groupName: string;
    ruleEnabled: boolean;
    ruleScope: string[];
  };
  assetLibrary?: AssetLibraryId;
  selectedAsset?: {
    assetId: string;
    library: AssetLibraryId;
    name?: string;
    avatar?: string;
    [key: string]: any;
  } | null;
  image?: { url: string; fit?: "fill" | "contain" | "cover" };
  text?: { content: string; rich?: boolean };
  vector?: {
    kind: "path" | "rect" | "ellipse" | "polygon" | "svg";
    svgContent?: string;
    path?: string;
    points?: Array<[number, number]>;
    tileWidth: number;
    tileHeight: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
  shikigami?: { name: string; avatar: string; rarity: string };
  yuhun?: { name: string; type: string; avatar: string; shortName?: string };
  property?: Record<string, any>;
}

export interface GraphNode {
  id: string;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  children?: string[];
  properties: NodeProperties;
}

export interface GraphEdge {
  id: string;
  type?: string;
  sourceNodeId: string;
  targetNodeId: string;
  properties?: Record<string, any>;
}

export interface GraphDocument {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface FlowFile {
  id: string;
  label: string;
  name: string;
  visible: boolean;
  type: string;
  graphRawData: GraphDocument;
  transform: Transform;
  createdAt?: number;
  updatedAt?: number;
  nodeIconSizeByType?: NodeIconSizeByType;
}

export interface RootDocument {
  schemaVersion: string;
  fileList: FlowFile[];
  activeFile: string;
  // 可以缺省，旧数据会在加载时通过名称回退
  activeFileId?: string;
}

export const DefaultNodeStyle: NodeStyle = {
  width: 180,
  height: 120,
  rotate: 0,
  fill: "#ffffff",
  stroke: "#dcdfe6",
  strokeWidth: 1,
  radius: 4,
  opacity: 1,
  shadow: { color: "rgba(0,0,0,0.1)", blur: 4, offsetX: 0, offsetY: 2 },
  textStyle: {
    color: "#303133",
    fontFamily: "system-ui",
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.4,
    align: "left",
    verticalAlign: "top",
    letterSpacing: 0,
    padding: [8, 8, 8, 8],
  },
};

const isPlainObject = (input: unknown): input is Record<string, any> =>
  !!input && typeof input === "object" && !Array.isArray(input);

const isNonEmptyString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;

const isFiniteNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value);

const pushValidationError = (
  errors: RootDocumentValidationError[],
  path: string,
  message: string,
) => {
  errors.push({ path, message });
};

const validateGraphNode = (
  value: unknown,
  path: string,
  errors: RootDocumentValidationError[],
) => {
  if (!isPlainObject(value)) {
    pushValidationError(errors, path, "必须是对象");
    return;
  }
  if (!isNonEmptyString(value.id)) {
    pushValidationError(errors, `${path}.id`, "必须是非空字符串");
  }
  if (!isNonEmptyString(value.type)) {
    pushValidationError(errors, `${path}.type`, "必须是非空字符串");
  }
  if (!isPlainObject(value.properties)) {
    pushValidationError(errors, `${path}.properties`, "必须是对象");
  }
  if (value.zIndex != null && !Number.isInteger(value.zIndex)) {
    pushValidationError(errors, `${path}.zIndex`, "必须是整数");
  }
};

const validateGraphEdge = (
  value: unknown,
  path: string,
  errors: RootDocumentValidationError[],
) => {
  if (!isPlainObject(value)) {
    pushValidationError(errors, path, "必须是对象");
    return;
  }
  if (!isNonEmptyString(value.id)) {
    pushValidationError(errors, `${path}.id`, "必须是非空字符串");
  }
  if (!isNonEmptyString(value.sourceNodeId)) {
    pushValidationError(errors, `${path}.sourceNodeId`, "必须是非空字符串");
  }
  if (!isNonEmptyString(value.targetNodeId)) {
    pushValidationError(errors, `${path}.targetNodeId`, "必须是非空字符串");
  }
};

const validateTransform = (
  value: unknown,
  path: string,
  errors: RootDocumentValidationError[],
) => {
  if (!isPlainObject(value)) {
    pushValidationError(errors, path, "必须是对象");
    return;
  }

  const transformKeys = [
    "SCALE_X",
    "SCALE_Y",
    "TRANSLATE_X",
    "TRANSLATE_Y",
  ] as const;
  transformKeys.forEach((key) => {
    if (!isFiniteNumber(value[key])) {
      pushValidationError(errors, `${path}.${key}`, "必须是数字");
    }
  });
};

const validateNodeIconSizeByType = (
  value: unknown,
  path: string,
  errors: RootDocumentValidationError[],
) => {
  if (!isPlainObject(value)) {
    pushValidationError(errors, path, "必须是对象");
    return;
  }
  const normalized = normalizeNodeIconSizeByType(value);
  Object.keys(value).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(normalized, key)) {
      pushValidationError(errors, `${path}.${key}`, "不是受支持的节点类型");
    }
  });
};

const validateFlowFile = (
  value: unknown,
  path: string,
  errors: RootDocumentValidationError[],
) => {
  if (!isPlainObject(value)) {
    pushValidationError(errors, path, "必须是对象");
    return;
  }

  if (!isNonEmptyString(value.id)) {
    pushValidationError(errors, `${path}.id`, "必须是非空字符串");
  }
  if (!isNonEmptyString(value.label)) {
    pushValidationError(errors, `${path}.label`, "必须是非空字符串");
  }
  if (!isNonEmptyString(value.name)) {
    pushValidationError(errors, `${path}.name`, "必须是非空字符串");
  }
  if (typeof value.visible !== "boolean") {
    pushValidationError(errors, `${path}.visible`, "必须是布尔值");
  }
  if (!isNonEmptyString(value.type)) {
    pushValidationError(errors, `${path}.type`, "必须是非空字符串");
  }

  if (!isPlainObject(value.graphRawData)) {
    pushValidationError(errors, `${path}.graphRawData`, "必须是对象");
  } else {
    const nodes = value.graphRawData.nodes;
    const edges = value.graphRawData.edges;
    if (!Array.isArray(nodes)) {
      pushValidationError(errors, `${path}.graphRawData.nodes`, "必须是数组");
    } else {
      nodes.forEach((node, index) =>
        validateGraphNode(node, `${path}.graphRawData.nodes[${index}]`, errors),
      );
    }
    if (!Array.isArray(edges)) {
      pushValidationError(errors, `${path}.graphRawData.edges`, "必须是数组");
    } else {
      edges.forEach((edge, index) =>
        validateGraphEdge(edge, `${path}.graphRawData.edges[${index}]`, errors),
      );
    }
  }

  validateTransform(value.transform, `${path}.transform`, errors);

  if (value.nodeIconSizeByType != null) {
    validateNodeIconSizeByType(
      value.nodeIconSizeByType,
      `${path}.nodeIconSizeByType`,
      errors,
    );
  }
};

export function validateRootDocumentV1(
  input: unknown,
): RootDocumentValidationResult {
  const errors: RootDocumentValidationError[] = [];
  if (!isPlainObject(input)) {
    return {
      valid: false,
      errors: [{ path: "$", message: "RootDocument 必须是对象" }],
    };
  }

  if (input.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    pushValidationError(
      errors,
      "$.schemaVersion",
      `必须为 ${CURRENT_SCHEMA_VERSION}`,
    );
  }
  if (!isNonEmptyString(input.activeFile)) {
    pushValidationError(errors, "$.activeFile", "必须是非空字符串");
  }
  if (input.activeFileId != null && !isNonEmptyString(input.activeFileId)) {
    pushValidationError(errors, "$.activeFileId", "必须是非空字符串");
  }
  if (!Array.isArray(input.fileList)) {
    pushValidationError(errors, "$.fileList", "必须是数组");
    return { valid: false, errors };
  }
  if (input.fileList.length === 0) {
    pushValidationError(errors, "$.fileList", "至少包含一个文件");
  }

  input.fileList.forEach((file, index) => {
    validateFlowFile(file, `$.fileList[${index}]`, errors);
  });

  const fileNames = input.fileList
    .filter((item) => isPlainObject(item) && isNonEmptyString(item.name))
    .map((item) => item.name);
  if (
    isNonEmptyString(input.activeFile) &&
    !fileNames.includes(input.activeFile)
  ) {
    pushValidationError(
      errors,
      "$.activeFile",
      "必须匹配 fileList 中存在的文件名",
    );
  }

  const fileIds = input.fileList
    .filter((item) => isPlainObject(item) && isNonEmptyString(item.id))
    .map((item) => item.id);
  if (
    isNonEmptyString(input.activeFileId) &&
    !fileIds.includes(input.activeFileId)
  ) {
    pushValidationError(
      errors,
      "$.activeFileId",
      "必须匹配 fileList 中存在的文件 id",
    );
  }

  return { valid: errors.length === 0, errors };
}

export function formatRootDocumentValidationErrors(
  errors: RootDocumentValidationError[],
  maxCount = 3,
) {
  if (!errors.length) return "未知校验错误";
  const primary = errors
    .slice(0, maxCount)
    .map((error) => `${error.path}: ${error.message}`)
    .join("; ");
  if (errors.length <= maxCount) {
    return primary;
  }
  return `${primary}; 其余 ${errors.length - maxCount} 项略`;
}

function ensureTransform(t?: Partial<Transform>): Transform {
  return {
    SCALE_X: t?.SCALE_X ?? 1,
    SCALE_Y: t?.SCALE_Y ?? 1,
    TRANSLATE_X: t?.TRANSLATE_X ?? 0,
    TRANSLATE_Y: t?.TRANSLATE_Y ?? 0,
  };
}

const normalizeOptionalNodeIconSizeByType = (
  value: unknown,
): NodeIconSizeByType | undefined => {
  const normalized = normalizeNodeIconSizeByType(value);
  return hasNodeIconSizeByTypeOverrides(normalized) ? normalized : undefined;
};

// Migration to v1 root document
export function migrateToV1(input: any): RootDocument {
  const now = Date.now();
  const normalizeZIndex = (value: unknown): number | undefined => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return undefined;
    }
    return Math.trunc(parsed);
  };

  // Normalize a single node into the v1 shape (properties.style + meta, width/height mirrored)
  const migrateNode = (node: any): GraphNode => {
    const n: any = { ...node };
    const props: any =
      n.properties && typeof n.properties === "object"
        ? { ...n.properties }
        : {};
    const style: any =
      props.style && typeof props.style === "object" ? { ...props.style } : {};
    const meta: any =
      props.meta && typeof props.meta === "object" ? { ...props.meta } : {};

    // Prefer explicit style width/height; otherwise fall back to scattered fields
    const propWidth = props.width ?? props.w;
    const propHeight = props.height ?? props.h;

    if (style.width == null) {
      if (propWidth != null) {
        style.width = propWidth;
      } else if (n.width != null) {
        style.width = n.width;
      }
    }
    if (style.height == null) {
      if (propHeight != null) {
        style.height = propHeight;
      } else if (n.height != null) {
        style.height = n.height;
      }
    }

    // Ensure meta defaults
    if (meta.visible == null) meta.visible = true;
    if (meta.locked == null) meta.locked = false;

    const normalizedZIndex =
      normalizeZIndex(n.zIndex) ??
      normalizeZIndex((meta as any).zIndex) ??
      normalizeZIndex(meta.z);
    if (normalizedZIndex != null) {
      n.zIndex = normalizedZIndex;
    }
    // Canonical output uses GraphNode.zIndex. Keep meta.z only as migration input.
    if ("z" in meta) {
      delete meta.z;
    }
    if ("zIndex" in meta) {
      delete meta.zIndex;
    }

    props.style = style;
    props.meta = meta;
    n.properties = props;

    // Mirror back to node width/height for render engines that still read from the node itself
    if (style.width != null) n.width = style.width;
    if (style.height != null) n.height = style.height;

    return n as GraphNode;
  };

  const ensureGraphDocument = (f: any): GraphDocument => {
    const raw =
      f?.graphRawData && typeof f.graphRawData === "object"
        ? f.graphRawData
        : { nodes: [], edges: [] };
    const nodes = Array.isArray(raw.nodes) ? raw.nodes.map(migrateNode) : [];
    const edges = Array.isArray(raw.edges) ? raw.edges : [];
    return { nodes, edges };
  };
  const wrap = (files: any[], activeName?: string): RootDocument => {
    const normalizedFiles = files.map((f, i) => {
      const nodeIconSizeByType = normalizeOptionalNodeIconSizeByType(
        f?.nodeIconSizeByType,
      );
      return {
        label: f?.label ?? `File ${i + 1}`,
        name: f?.name ?? `File ${i + 1}`,
        visible: f?.visible ?? true,
        type: f?.type ?? "FLOW",
        graphRawData: ensureGraphDocument(f),
        transform: ensureTransform(f?.transform),
        createdAt: f?.createdAt ?? now,
        updatedAt: f?.updatedAt ?? now,
        id: f?.id,
        ...(nodeIconSizeByType ? { nodeIconSizeByType } : {}),
      };
    });

    const fallbackName = normalizedFiles[0]?.name ?? "File 1";
    const resolvedActiveName = activeName ?? fallbackName;
    const activeFile =
      normalizedFiles.find((f) => f.name === resolvedActiveName) ??
      normalizedFiles[0];

    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      fileList: normalizedFiles,
      activeFile: resolvedActiveName,
      activeFileId: activeFile?.id,
    };
  };

  if (!input) {
    return wrap([
      { label: "File 1", name: "File 1", visible: true, type: "FLOW" },
    ]);
  }

  if (Array.isArray(input)) {
    return wrap(input);
  }

  if (typeof input === "object" && "fileList" in input) {
    const active = (input as any).activeFile;
    const files = (input as any).fileList ?? [];
    const root = wrap(files, active);
    // Preserve version if present
    root.schemaVersion = (input as any).schemaVersion || CURRENT_SCHEMA_VERSION;
    return root;
  }

  // Oldest shape: treat input as groups array and wrap
  return wrap([
    {
      label: "File 1",
      name: "File 1",
      visible: true,
      type: "FLOW",
      groups: input,
    },
  ]);
}
