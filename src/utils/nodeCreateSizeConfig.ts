import { ASSET_LIBRARY_IDS, type AssetLibraryId } from "@/types/assets";

export interface NodeCreateSize {
  width: number;
  height: number;
}

export interface NodeCreateSizeConfig {
  imageNode: NodeCreateSize;
  assetSelectorByLibrary: Record<AssetLibraryId, NodeCreateSize>;
}

export const NODE_CREATE_SIZE_STORAGE_KEY = "yys-editor.node-create-size.v1";

const MIN_NODE_SIZE = 40;
const MAX_NODE_SIZE = 1200;

const cloneSize = (value: NodeCreateSize): NodeCreateSize => ({
  width: value.width,
  height: value.height,
});

const buildDefaultAssetSelectorSizeByLibrary = (): Record<
  AssetLibraryId,
  NodeCreateSize
> =>
  ASSET_LIBRARY_IDS.reduce(
    (acc, library) => {
      acc[library] = { width: 180, height: 120 };
      return acc;
    },
    {} as Record<AssetLibraryId, NodeCreateSize>,
  );

export const DEFAULT_NODE_CREATE_SIZE_CONFIG: NodeCreateSizeConfig = {
  imageNode: { width: 180, height: 120 },
  assetSelectorByLibrary: buildDefaultAssetSelectorSizeByLibrary(),
};

const isClient = () =>
  typeof window !== "undefined" && typeof localStorage !== "undefined";

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const normalizeSize = (
  value: unknown,
  fallback: NodeCreateSize,
): NodeCreateSize => {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const width = toNumber(source.width);
  const height = toNumber(source.height);
  return {
    width: Math.round(clamp(width ?? fallback.width, MIN_NODE_SIZE, MAX_NODE_SIZE)),
    height: Math.round(clamp(height ?? fallback.height, MIN_NODE_SIZE, MAX_NODE_SIZE)),
  };
};

export const normalizeNodeCreateSizeConfig = (
  input: unknown,
): NodeCreateSizeConfig => {
  const source =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const assetSelectorRaw =
    source.assetSelectorByLibrary &&
    typeof source.assetSelectorByLibrary === "object" &&
    !Array.isArray(source.assetSelectorByLibrary)
      ? (source.assetSelectorByLibrary as Record<string, unknown>)
      : {};

  const assetSelectorByLibrary = ASSET_LIBRARY_IDS.reduce(
    (acc, library) => {
      acc[library] = normalizeSize(
        assetSelectorRaw[library],
        DEFAULT_NODE_CREATE_SIZE_CONFIG.assetSelectorByLibrary[library],
      );
      return acc;
    },
    {} as Record<AssetLibraryId, NodeCreateSize>,
  );

  return {
    imageNode: normalizeSize(
      source.imageNode,
      DEFAULT_NODE_CREATE_SIZE_CONFIG.imageNode,
    ),
    assetSelectorByLibrary,
  };
};

export const cloneNodeCreateSizeConfig = (
  value: NodeCreateSizeConfig,
): NodeCreateSizeConfig => ({
  imageNode: cloneSize(value.imageNode),
  assetSelectorByLibrary: ASSET_LIBRARY_IDS.reduce(
    (acc, library) => {
      acc[library] = cloneSize(value.assetSelectorByLibrary[library]);
      return acc;
    },
    {} as Record<AssetLibraryId, NodeCreateSize>,
  ),
});

export const readNodeCreateSizeConfig = (): NodeCreateSizeConfig => {
  if (!isClient()) {
    return cloneNodeCreateSizeConfig(DEFAULT_NODE_CREATE_SIZE_CONFIG);
  }
  const raw = localStorage.getItem(NODE_CREATE_SIZE_STORAGE_KEY);
  if (!raw) {
    return cloneNodeCreateSizeConfig(DEFAULT_NODE_CREATE_SIZE_CONFIG);
  }
  try {
    const normalized = normalizeNodeCreateSizeConfig(JSON.parse(raw));
    const normalizedRaw = JSON.stringify(normalized);
    if (normalizedRaw !== raw) {
      localStorage.setItem(NODE_CREATE_SIZE_STORAGE_KEY, normalizedRaw);
    }
    return normalized;
  } catch {
    return cloneNodeCreateSizeConfig(DEFAULT_NODE_CREATE_SIZE_CONFIG);
  }
};

export const writeNodeCreateSizeConfig = (
  input: unknown,
): NodeCreateSizeConfig => {
  const normalized = normalizeNodeCreateSizeConfig(input);
  if (isClient()) {
    localStorage.setItem(NODE_CREATE_SIZE_STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
};

export const resetNodeCreateSizeConfig = (): NodeCreateSizeConfig => {
  if (isClient()) {
    localStorage.removeItem(NODE_CREATE_SIZE_STORAGE_KEY);
  }
  return cloneNodeCreateSizeConfig(DEFAULT_NODE_CREATE_SIZE_CONFIG);
};

const isAssetLibraryId = (value: unknown): value is AssetLibraryId =>
  typeof value === "string" &&
  (ASSET_LIBRARY_IDS as readonly string[]).includes(value);

export const resolveCreateNodeSize = (
  nodeType: string,
  options?: {
    assetLibrary?: unknown;
    config?: NodeCreateSizeConfig;
  },
): NodeCreateSize | null => {
  const config = options?.config || readNodeCreateSizeConfig();
  if (nodeType === "imageNode") {
    return cloneSize(config.imageNode);
  }
  if (nodeType === "assetSelector" && isAssetLibraryId(options?.assetLibrary)) {
    return cloneSize(config.assetSelectorByLibrary[options.assetLibrary]);
  }
  return null;
};
