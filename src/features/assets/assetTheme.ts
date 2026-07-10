import { normalizeNodeStyle } from "@/core/document/nodeStyle";

import { ASSET_LIBRARY_IDS, type AssetLibraryId } from "./model/types";
import type {
  AssetThemeConfig,
  NodeCreateSizeConfig,
} from "./nodeAppearanceRepository";
import {
  resolveAssetThemeConfig,
  resolveAssetThemeEnabled,
} from "./nodeAppearanceRepository";

export const ASSET_NAME_FALLBACK = "未选择资产";

export interface AssetNameNodeConfig {
  visible: boolean;
  labelNodeId: string | null;
  offsetX: number;
  offsetY: number;
  lastSyncedAssetName: string;
}

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toString = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const isAssetLibraryId = (value: unknown): value is AssetLibraryId =>
  typeof value === "string" &&
  (ASSET_LIBRARY_IDS as readonly string[]).includes(value);

export const isAssetSelectorNode = (node: any): boolean =>
  node?.type === "assetSelector";

export const resolveAssetLibrary = (
  primary: unknown,
  fallback?: unknown,
): AssetLibraryId => {
  if (isAssetLibraryId(primary)) return primary;
  if (isAssetLibraryId(fallback)) return fallback;
  return "shikigami";
};

export const getAssetLabelOwnerId = (node: any): string | null => {
  const ownerId = node?.properties?.meta?.assetNameOwnerId;
  return typeof ownerId === "string" && ownerId ? ownerId : null;
};

export const getAssetDisplayName = (selectedAsset: any): string => {
  const name =
    selectedAsset && typeof selectedAsset.name === "string"
      ? selectedAsset.name.trim()
      : "";
  return name || ASSET_NAME_FALLBACK;
};

export const normalizeAssetNameNodeConfig = (
  raw: any,
  theme: AssetThemeConfig,
): AssetNameNodeConfig => {
  const source = raw && typeof raw === "object" ? raw : {};
  const visible =
    source.visible == null ? theme.name.show : source.visible !== false;
  return {
    visible,
    labelNodeId:
      typeof source.labelNodeId === "string" && source.labelNodeId
        ? source.labelNodeId
        : null,
    offsetX: Math.round(toNumber(source.offsetX, theme.name.offsetX)),
    offsetY: Math.round(toNumber(source.offsetY, theme.name.offsetY)),
    lastSyncedAssetName: toString(source.lastSyncedAssetName, ""),
  };
};

const buildAssetNodeThemeStyle = (
  baseStyle: any,
  theme: AssetThemeConfig,
  sizeFallback?: { width?: number; height?: number },
) =>
  normalizeNodeStyle(
    {
      ...baseStyle,
      fill: theme.nodeStyle.fill,
      stroke: theme.nodeStyle.stroke,
      strokeWidth: theme.nodeStyle.strokeWidth,
      radius: theme.nodeStyle.radius,
      opacity: theme.nodeStyle.opacity,
    },
    sizeFallback,
  );

export const buildAssetNameLabelStyle = (theme: AssetThemeConfig) => ({
  width: theme.name.width,
  height: theme.name.height,
  fill: "transparent",
  stroke: "",
  shadow: {
    color: "transparent",
    blur: 0,
    offsetX: 0,
    offsetY: 0,
  },
  textStyle: {
    color: theme.name.textStyle.color,
    fontFamily: "system-ui",
    fontSize: theme.name.textStyle.fontSize,
    fontWeight: theme.name.textStyle.fontWeight,
    lineHeight: theme.name.textStyle.lineHeight,
    align: theme.name.textStyle.align,
  },
});

export const buildAssetNameLabelText = (name: string) => ({
  content: name,
  rich: false,
});

export const buildAssetNameLabelPosition = (
  assetModel: any,
  nameConfig: AssetNameNodeConfig,
) => {
  const x = Number(assetModel?.x ?? 0) + nameConfig.offsetX;
  const y =
    Number(assetModel?.y ?? 0) +
    Number(assetModel?.height ?? 0) / 2 +
    nameConfig.offsetY;
  return { x, y };
};

export const buildAssetNodeCreateProperties = (
  baseProperties: Record<string, unknown>,
  options?: {
    config?: NodeCreateSizeConfig;
  },
) => {
  if (!resolveAssetThemeEnabled({ config: options?.config })) {
    return {
      ...baseProperties,
    };
  }
  const assetLibrary = resolveAssetLibrary(
    baseProperties.assetLibrary,
    (baseProperties as any).selectedAsset?.library,
  );
  const theme = resolveAssetThemeConfig({
    config: options?.config,
    assetLibrary,
  });
  const style = buildAssetNodeThemeStyle(baseProperties.style, theme, {
    width: toNumber(baseProperties.width, theme.name.width),
    height: toNumber(baseProperties.height, theme.name.height),
  });
  return {
    ...baseProperties,
    style,
    assetName: {
      visible: theme.name.show,
      labelNodeId: null,
      offsetX: theme.name.offsetX,
      offsetY: theme.name.offsetY,
      lastSyncedAssetName: "",
    },
  };
};

export const applyAssetThemeToAssetNodeProperties = (
  nodeProperties: Record<string, any>,
  theme: AssetThemeConfig,
  sizeFallback?: {
    width?: number;
    height?: number;
  },
) => {
  const currentStyle = buildAssetNodeThemeStyle(
    {
      ...(nodeProperties.style || {}),
      ...(sizeFallback?.width != null ? { width: sizeFallback.width } : {}),
      ...(sizeFallback?.height != null ? { height: sizeFallback.height } : {}),
    },
    theme,
    sizeFallback,
  );
  const currentAssetName = normalizeAssetNameNodeConfig(
    nodeProperties.assetName,
    theme,
  );
  return {
    ...nodeProperties,
    width: currentStyle.width,
    height: currentStyle.height,
    style: currentStyle,
    assetName: {
      ...currentAssetName,
      visible: theme.name.show,
      offsetX: theme.name.offsetX,
      offsetY: theme.name.offsetY,
    },
  };
};
