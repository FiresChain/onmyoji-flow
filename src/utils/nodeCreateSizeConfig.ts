import { ASSET_LIBRARY_IDS, type AssetLibraryId } from "@/types/assets";

export interface NodeCreateSize {
  width: number;
  height: number;
}

export interface AssetThemeNodeStyleConfig {
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;
  opacity: number;
}

export interface AssetThemeNameTextStyleConfig {
  color: string;
  fontSize: number;
  fontWeight: number | string;
  lineHeight: number;
  align: "left" | "center" | "right";
}

export interface AssetThemeNameConfig {
  show: boolean;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  textStyle: AssetThemeNameTextStyleConfig;
}

export interface AssetThemeConfig {
  nodeStyle: AssetThemeNodeStyleConfig;
  name: AssetThemeNameConfig;
}

export interface NodeCreateSizeConfig {
  imageNode: NodeCreateSize;
  assetSelectorByLibrary: Record<AssetLibraryId, NodeCreateSize>;
  assetThemeEnabled: boolean;
  assetThemeByLibrary: Record<AssetLibraryId, AssetThemeConfig>;
  // Backward-compatible fallback for old persisted payloads.
  assetTheme: AssetThemeConfig;
}

export const NODE_CREATE_SIZE_STORAGE_KEY = "yys-editor.node-create-size.v1";

const MIN_NODE_SIZE = 40;
const MAX_NODE_SIZE = 1200;
const MIN_OPACITY = 0;
const MAX_OPACITY = 1;
const MIN_LINE_HEIGHT = 0.8;
const MAX_LINE_HEIGHT = 3;

const cloneSize = (value: NodeCreateSize): NodeCreateSize => ({
  width: value.width,
  height: value.height,
});

const cloneAssetTheme = (value: AssetThemeConfig): AssetThemeConfig => ({
  nodeStyle: {
    ...value.nodeStyle,
  },
  name: {
    ...value.name,
    textStyle: {
      ...value.name.textStyle,
    },
  },
});

const buildAssetThemePreset = (
  nodeStyle: Partial<AssetThemeNodeStyleConfig> = {},
): AssetThemeConfig => ({
  nodeStyle: {
    fill: "#ffffff",
    stroke: "#dcdfe6",
    strokeWidth: 1,
    radius: 4,
    opacity: 1,
    ...nodeStyle,
  },
  name: {
    show: false,
    offsetX: 0,
    offsetY: 78,
    width: 160,
    height: 36,
    textStyle: {
      color: "#303133",
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 1.4,
      align: "center",
    },
  },
});

const DEFAULT_ASSET_SELECTOR_SIZE_BY_LIBRARY: Record<
  AssetLibraryId,
  NodeCreateSize
> = {
  shikigami: { width: 180, height: 180 },
  yuhun: { width: 75, height: 75 },
  onmyoji: { width: 147, height: 147 },
  onmyojiSkill: { width: 68, height: 67 },
  hunling: { width: 120, height: 120 },
};

const DEFAULT_ASSET_THEME_BY_LIBRARY: Record<AssetLibraryId, AssetThemeConfig> =
  {
    shikigami: buildAssetThemePreset({
      fill: "#ffffff",
      stroke: "#dcdfe6",
      strokeWidth: 0,
      radius: 200,
    }),
    yuhun: buildAssetThemePreset({
      fill: "transparent",
      stroke: "#dcdfe6",
      strokeWidth: 0,
      radius: 4,
    }),
    onmyoji: buildAssetThemePreset({
      fill: "#ffffff",
      stroke: "#dcdfe6",
      strokeWidth: 1,
      radius: 4,
    }),
    onmyojiSkill: buildAssetThemePreset({
      fill: "transparent",
      stroke: "#dcdfe6",
      strokeWidth: 1,
      radius: 100,
    }),
    hunling: buildAssetThemePreset({
      fill: "transparent",
      stroke: "#dcdfe6",
      strokeWidth: 1,
      radius: 100,
    }),
  };

const buildDefaultAssetTheme = (): AssetThemeConfig =>
  cloneAssetTheme(DEFAULT_ASSET_THEME_BY_LIBRARY.shikigami);

const buildDefaultAssetThemeByLibrary = (): Record<
  AssetLibraryId,
  AssetThemeConfig
> =>
  ASSET_LIBRARY_IDS.reduce(
    (acc, library) => {
      acc[library] = cloneAssetTheme(DEFAULT_ASSET_THEME_BY_LIBRARY[library]);
      return acc;
    },
    {} as Record<AssetLibraryId, AssetThemeConfig>,
  );

const buildDefaultAssetSelectorSizeByLibrary = (): Record<
  AssetLibraryId,
  NodeCreateSize
> =>
  ASSET_LIBRARY_IDS.reduce(
    (acc, library) => {
      acc[library] = cloneSize(DEFAULT_ASSET_SELECTOR_SIZE_BY_LIBRARY[library]);
      return acc;
    },
    {} as Record<AssetLibraryId, NodeCreateSize>,
  );

export const DEFAULT_NODE_CREATE_SIZE_CONFIG: NodeCreateSizeConfig = {
  imageNode: { width: 180, height: 120 },
  assetSelectorByLibrary: buildDefaultAssetSelectorSizeByLibrary(),
  assetThemeEnabled: true,
  assetThemeByLibrary: buildDefaultAssetThemeByLibrary(),
  assetTheme: buildDefaultAssetTheme(),
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

const normalizeAlign = (
  value: unknown,
  fallback: AssetThemeNameTextStyleConfig["align"],
): AssetThemeNameTextStyleConfig["align"] => {
  if (value === "left" || value === "center" || value === "right") {
    return value;
  }
  return fallback;
};

const normalizeWeight = (
  value: unknown,
  fallback: number | string,
): number | string => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : trimmed;
  }
  return fallback;
};

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
    width: Math.round(
      clamp(width ?? fallback.width, MIN_NODE_SIZE, MAX_NODE_SIZE),
    ),
    height: Math.round(
      clamp(height ?? fallback.height, MIN_NODE_SIZE, MAX_NODE_SIZE),
    ),
  };
};

const normalizeAssetThemeNodeStyle = (
  value: unknown,
  fallback: AssetThemeNodeStyleConfig,
): AssetThemeNodeStyleConfig => {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    fill: typeof source.fill === "string" ? source.fill : fallback.fill,
    stroke: typeof source.stroke === "string" ? source.stroke : fallback.stroke,
    strokeWidth: clamp(
      Math.round(toNumber(source.strokeWidth) ?? fallback.strokeWidth),
      0,
      20,
    ),
    radius: clamp(
      Math.round(toNumber(source.radius) ?? fallback.radius),
      0,
      200,
    ),
    opacity: clamp(
      toNumber(source.opacity) ?? fallback.opacity,
      MIN_OPACITY,
      MAX_OPACITY,
    ),
  };
};

const normalizeAssetThemeNameTextStyle = (
  value: unknown,
  fallback: AssetThemeNameTextStyleConfig,
): AssetThemeNameTextStyleConfig => {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    color: typeof source.color === "string" ? source.color : fallback.color,
    fontSize: clamp(
      Math.round(toNumber(source.fontSize) ?? fallback.fontSize),
      8,
      96,
    ),
    fontWeight: normalizeWeight(source.fontWeight, fallback.fontWeight),
    lineHeight: clamp(
      toNumber(source.lineHeight) ?? fallback.lineHeight,
      MIN_LINE_HEIGHT,
      MAX_LINE_HEIGHT,
    ),
    align: normalizeAlign(source.align, fallback.align),
  };
};

const normalizeAssetThemeName = (
  value: unknown,
  fallback: AssetThemeNameConfig,
): AssetThemeNameConfig => {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    show: source.show == null ? fallback.show : source.show !== false,
    offsetX: Math.round(toNumber(source.offsetX) ?? fallback.offsetX),
    offsetY: Math.round(toNumber(source.offsetY) ?? fallback.offsetY),
    width: clamp(
      Math.round(toNumber(source.width) ?? fallback.width),
      MIN_NODE_SIZE,
      MAX_NODE_SIZE,
    ),
    height: clamp(
      Math.round(toNumber(source.height) ?? fallback.height),
      20,
      MAX_NODE_SIZE,
    ),
    textStyle: normalizeAssetThemeNameTextStyle(
      source.textStyle,
      fallback.textStyle,
    ),
  };
};

const normalizeAssetTheme = (
  value: unknown,
  fallback: AssetThemeConfig,
): AssetThemeConfig => {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    nodeStyle: normalizeAssetThemeNodeStyle(
      source.nodeStyle,
      fallback.nodeStyle,
    ),
    name: normalizeAssetThemeName(source.name, fallback.name),
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
  const assetThemeByLibraryRaw =
    source.assetThemeByLibrary &&
    typeof source.assetThemeByLibrary === "object" &&
    !Array.isArray(source.assetThemeByLibrary)
      ? (source.assetThemeByLibrary as Record<string, unknown>)
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
  const legacyAssetTheme = normalizeAssetTheme(
    source.assetTheme,
    DEFAULT_NODE_CREATE_SIZE_CONFIG.assetTheme,
  );
  const assetThemeByLibrary = ASSET_LIBRARY_IDS.reduce(
    (acc, library) => {
      const fallback =
        DEFAULT_NODE_CREATE_SIZE_CONFIG.assetThemeByLibrary[library];
      acc[library] = normalizeAssetTheme(
        assetThemeByLibraryRaw[library],
        source.assetTheme == null ? fallback : legacyAssetTheme,
      );
      return acc;
    },
    {} as Record<AssetLibraryId, AssetThemeConfig>,
  );

  return {
    imageNode: normalizeSize(
      source.imageNode,
      DEFAULT_NODE_CREATE_SIZE_CONFIG.imageNode,
    ),
    assetSelectorByLibrary,
    assetThemeEnabled: source.assetThemeEnabled !== false,
    assetThemeByLibrary,
    assetTheme:
      source.assetTheme == null
        ? cloneAssetTheme(assetThemeByLibrary.shikigami)
        : legacyAssetTheme,
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
  assetThemeEnabled: value.assetThemeEnabled !== false,
  assetThemeByLibrary: ASSET_LIBRARY_IDS.reduce(
    (acc, library) => {
      acc[library] = cloneAssetTheme(value.assetThemeByLibrary[library]);
      return acc;
    },
    {} as Record<AssetLibraryId, AssetThemeConfig>,
  ),
  assetTheme: cloneAssetTheme(value.assetTheme),
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
    localStorage.setItem(
      NODE_CREATE_SIZE_STORAGE_KEY,
      JSON.stringify(normalized),
    );
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

export const resolveAssetThemeConfig = (options?: {
  config?: NodeCreateSizeConfig;
  assetLibrary?: unknown;
}): AssetThemeConfig => {
  const config = options?.config || readNodeCreateSizeConfig();
  if (isAssetLibraryId(options?.assetLibrary)) {
    return cloneAssetTheme(config.assetThemeByLibrary[options.assetLibrary]);
  }
  return cloneAssetTheme(config.assetTheme);
};

export const resolveAssetThemeEnabled = (options?: {
  config?: NodeCreateSizeConfig;
}): boolean => {
  const config = options?.config || readNodeCreateSizeConfig();
  return config.assetThemeEnabled !== false;
};
