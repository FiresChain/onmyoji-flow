import type LogicFlow from "@logicflow/core";
import { normalizeNodeStyle } from "@/ts/nodeStyle";
import { ASSET_LIBRARY_IDS, type AssetLibraryId } from "@/types/assets";
import type {
  AssetThemeConfig,
  NodeCreateSizeConfig,
} from "@/utils/nodeCreateSizeConfig";
import {
  resolveAssetThemeConfig,
  resolveAssetThemeEnabled,
  resolveCreateNodeSize,
} from "@/utils/nodeCreateSizeConfig";

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

const toFontWeight = (
  value: unknown,
  fallback: number | string,
): number | string => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : trimmed;
  }
  return fallback;
};

const toAlign = (
  value: unknown,
  fallback: "left" | "center" | "right",
): "left" | "center" | "right" => {
  if (value === "left" || value === "center" || value === "right") {
    return value;
  }
  return fallback;
};

const stringify = (value: unknown) => JSON.stringify(value);

const isAssetSelectorNode = (node: any) => node?.type === "assetSelector";
const isAssetLibraryId = (value: unknown): value is AssetLibraryId =>
  typeof value === "string" &&
  (ASSET_LIBRARY_IDS as readonly string[]).includes(value);
const resolveAssetLibrary = (
  primary: unknown,
  fallback?: unknown,
): AssetLibraryId => {
  if (isAssetLibraryId(primary)) return primary;
  if (isAssetLibraryId(fallback)) return fallback;
  return "shikigami";
};

const getAssetLabelOwnerId = (node: any): string | null => {
  const ownerId = node?.properties?.meta?.assetNameOwnerId;
  return typeof ownerId === "string" && ownerId ? ownerId : null;
};

const getAssetDisplayName = (selectedAsset: any) => {
  const name =
    selectedAsset && typeof selectedAsset.name === "string"
      ? selectedAsset.name.trim()
      : "";
  return name || ASSET_NAME_FALLBACK;
};

const normalizeAssetNameNodeConfig = (
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

const buildLabelNodeStyle = (theme: AssetThemeConfig) => ({
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

const buildLabelTextProperty = (name: string) => ({
  content: name,
  rich: false,
});

const buildLabelPosition = (
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

const findLabelNodeByOwner = (lf: LogicFlow, assetNodeId: string) => {
  const nodes = (lf as any).graphModel?.nodes || [];
  return (
    nodes.find((node: any) => getAssetLabelOwnerId(node) === assetNodeId) ||
    null
  );
};

const ensureLabelNode = (
  lf: LogicFlow,
  assetModel: any,
  labelNodeId: string | null,
  nameConfig: AssetNameNodeConfig,
  labelText: string,
  theme: AssetThemeConfig,
) => {
  const ownerId = assetModel.id;
  const byId = labelNodeId ? lf.getNodeModelById(labelNodeId) : null;
  const byOwner = findLabelNodeByOwner(lf, ownerId);
  const labelNode = byOwner || byId;

  if (!labelNode) {
    const position = buildLabelPosition(assetModel, nameConfig);
    const created = lf.addNode({
      type: "textNode",
      x: position.x,
      y: position.y,
      properties: {
        width: theme.name.width,
        height: theme.name.height,
        text: buildLabelTextProperty(labelText),
        style: buildLabelNodeStyle(theme),
        meta: {
          visible: true,
          locked: false,
          assetNameOwnerId: ownerId,
        },
      },
    }) as any;
    return created;
  }

  return labelNode as any;
};

const syncLabelNodeContentAndStyle = (
  lf: LogicFlow,
  labelNode: any,
  assetModel: any,
  nameConfig: AssetNameNodeConfig,
  labelText: string,
  theme: AssetThemeConfig,
  shouldOverrideText: boolean,
  applyThemeStyle: boolean,
) => {
  const nextPosition = buildLabelPosition(assetModel, nameConfig);
  if (labelNode.x !== nextPosition.x || labelNode.y !== nextPosition.y) {
    labelNode.moveTo?.(nextPosition.x, nextPosition.y);
  }

  const labelProps =
    (labelNode.getProperties?.() as any) || labelNode.properties || {};
  const nextText =
    shouldOverrideText || !labelProps.text
      ? buildLabelTextProperty(labelText)
      : labelProps.text;
  const nextMeta = {
    ...(labelProps.meta || {}),
    assetNameOwnerId: assetModel.id,
    visible: true,
    locked: false,
  };
  const nextProps = {
    ...labelProps,
    text: nextText,
    meta: nextMeta,
  };
  if (applyThemeStyle || labelProps.width == null) {
    nextProps.width = theme.name.width;
  }
  if (applyThemeStyle || labelProps.height == null) {
    nextProps.height = theme.name.height;
  }
  if (applyThemeStyle || !labelProps.style) {
    nextProps.style = buildLabelNodeStyle(theme);
  }
  if (stringify(nextProps) !== stringify(labelProps)) {
    lf.setProperties(labelNode.id, nextProps);
  }
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

export const syncAssetNameLabelForNode = (
  lf: LogicFlow,
  assetNodeId: string,
  options?: {
    config?: NodeCreateSizeConfig;
    applyThemeStyle?: boolean;
    forceSyncText?: boolean;
  },
) => {
  if (!resolveAssetThemeEnabled({ config: options?.config })) return;
  const assetModel = lf.getNodeModelById(assetNodeId) as any;
  if (!assetModel || !isAssetSelectorNode(assetModel)) return;

  const props =
    (assetModel.getProperties?.() as Record<string, any>) ||
    assetModel.properties ||
    {};
  const assetLibrary = resolveAssetLibrary(
    props.assetLibrary,
    props.selectedAsset?.library,
  );
  const theme = resolveAssetThemeConfig({
    config: options?.config,
    assetLibrary,
  });
  const configuredNodeSize =
    options?.applyThemeStyle === true
      ? resolveCreateNodeSize("assetSelector", {
          config: options?.config,
          assetLibrary,
        })
      : null;
  const sizeFallback = configuredNodeSize || {
    width: assetModel.width,
    height: assetModel.height,
  };
  const nextProps = options?.applyThemeStyle
    ? applyAssetThemeToAssetNodeProperties(props, theme, sizeFallback)
    : { ...props };
  if (options?.applyThemeStyle === true) {
    if (Number.isFinite(nextProps.width)) {
      assetModel.width = Number(nextProps.width);
    }
    if (Number.isFinite(nextProps.height)) {
      assetModel.height = Number(nextProps.height);
    }
  }
  const nameConfig = normalizeAssetNameNodeConfig(nextProps.assetName, theme);
  const nextName = getAssetDisplayName(nextProps.selectedAsset);
  const shouldOverrideText =
    options?.forceSyncText || nameConfig.lastSyncedAssetName !== nextName;

  if (!nameConfig.visible) {
    if (nameConfig.labelNodeId) {
      lf.deleteNode(nameConfig.labelNodeId);
    } else {
      const ghostLabel = findLabelNodeByOwner(lf, assetModel.id);
      if (ghostLabel?.id) {
        lf.deleteNode(ghostLabel.id);
      }
    }
    const finalProps = {
      ...nextProps,
      assetName: {
        ...nameConfig,
        labelNodeId: null,
      },
    };
    if (stringify(finalProps) !== stringify(props)) {
      lf.setProperties(assetModel.id, finalProps);
    }
    return;
  }

  const ensuredLabel = ensureLabelNode(
    lf,
    assetModel,
    nameConfig.labelNodeId,
    nameConfig,
    nextName,
    theme,
  );
  syncLabelNodeContentAndStyle(
    lf,
    ensuredLabel,
    assetModel,
    nameConfig,
    nextName,
    theme,
    shouldOverrideText,
    options?.applyThemeStyle === true,
  );

  const finalProps = {
    ...nextProps,
    assetName: {
      ...nameConfig,
      labelNodeId: ensuredLabel.id,
      lastSyncedAssetName: shouldOverrideText
        ? nextName
        : nameConfig.lastSyncedAssetName,
    },
  };
  if (stringify(finalProps) !== stringify(props)) {
    lf.setProperties(assetModel.id, finalProps);
  }
};

export const applyAssetThemeToCurrentFile = (
  lf: LogicFlow,
  options?: {
    config?: NodeCreateSizeConfig;
  },
) => {
  if (!resolveAssetThemeEnabled({ config: options?.config })) return;
  const nodes = ((lf as any).graphModel?.nodes || []) as any[];
  nodes
    .filter((node) => isAssetSelectorNode(node))
    .forEach((assetNode) => {
      syncAssetNameLabelForNode(lf, assetNode.id, {
        config: options?.config,
        applyThemeStyle: true,
        forceSyncText: false,
      });
    });
};

export const clearAssetNodeReferenceByLabelOwner = (
  lf: LogicFlow,
  assetNodeId: string,
  labelNodeId?: string,
) => {
  const model = lf.getNodeModelById(assetNodeId) as any;
  if (!model || !isAssetSelectorNode(model)) return;
  const props =
    (model.getProperties?.() as Record<string, any>) || model.properties || {};
  const nextAssetName = {
    ...(props.assetName || {}),
    labelNodeId: null,
  };
  if (
    typeof labelNodeId === "string" &&
    props.assetName &&
    props.assetName.labelNodeId &&
    props.assetName.labelNodeId !== labelNodeId
  ) {
    return;
  }
  lf.setProperties(model.id, {
    ...props,
    assetName: nextAssetName,
  });
};

export const getAssetLabelOwnerFromNode = (nodeData: any): string | null =>
  getAssetLabelOwnerId(nodeData);

export const isAssetNameLabelTextNode = (nodeData: any): boolean =>
  nodeData?.type === "textNode" && !!getAssetLabelOwnerId(nodeData);
