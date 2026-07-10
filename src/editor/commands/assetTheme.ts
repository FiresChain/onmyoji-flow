import type LogicFlow from "@logicflow/core";

import {
  applyAssetThemeToAssetNodeProperties,
  buildAssetNameLabelPosition,
  buildAssetNameLabelStyle,
  buildAssetNameLabelText,
  getAssetDisplayName,
  getAssetLabelOwnerId,
  isAssetSelectorNode,
  normalizeAssetNameNodeConfig,
  resolveAssetLibrary,
  resolveAssetThemeConfig,
  resolveAssetThemeEnabled,
  resolveCreateNodeSize,
  type AssetNameNodeConfig,
  type AssetThemeConfig,
  type NodeCreateSizeConfig,
} from "@/features/assets/public";

const stringify = (value: unknown) => JSON.stringify(value);

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
    const position = buildAssetNameLabelPosition(assetModel, nameConfig);
    const created = lf.addNode({
      type: "textNode",
      x: position.x,
      y: position.y,
      properties: {
        width: theme.name.width,
        height: theme.name.height,
        text: buildAssetNameLabelText(labelText),
        style: buildAssetNameLabelStyle(theme),
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
  const nextPosition = buildAssetNameLabelPosition(assetModel, nameConfig);
  if (labelNode.x !== nextPosition.x || labelNode.y !== nextPosition.y) {
    labelNode.moveTo?.(nextPosition.x, nextPosition.y);
  }

  const labelProps =
    (labelNode.getProperties?.() as any) || labelNode.properties || {};
  const nextText =
    shouldOverrideText || !labelProps.text
      ? buildAssetNameLabelText(labelText)
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
    nextProps.style = buildAssetNameLabelStyle(theme);
  }
  if (stringify(nextProps) !== stringify(labelProps)) {
    lf.setProperties(labelNode.id, nextProps);
  }
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
