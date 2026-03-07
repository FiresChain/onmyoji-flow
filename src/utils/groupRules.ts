import type { GroupRulesConfig } from "@/configs/groupRules";
import { readSharedGroupRulesConfig } from "@/utils/groupRulesConfigSource";
import {
  getDynamicGroupChildIds,
  normalizeGraphRawDataSchema,
} from "@/utils/graphSchema";
import { evaluateRuleExpressionAsBoolean } from "@/utils/ruleExpression";

type GraphData = {
  nodes: any[];
  edges: any[];
};

type TeamAsset = {
  nodeId: string;
  assetId: string;
  name: string;
  library: string;
};

type TeamAssetSnapshot = {
  groupId: string;
  groupName: string;
  nodeIds: string[];
  shikigamiAssets: TeamAsset[];
  yuhunAssets: TeamAsset[];
};

type ShikigamiUnitSnapshot = {
  groupId: string;
  groupName: string;
  nodeIds: string[];
  shikigamiAsset: TeamAsset;
  yuhunAssets: TeamAsset[];
};

type TeamRuleSnapshot = TeamAssetSnapshot & {
  shikigamiUnits: ShikigamiUnitSnapshot[];
};

export type GroupRuleWarning = {
  id: string;
  ruleId: string;
  code: string;
  severity: "warning" | "error" | "info";
  groupId: string;
  groupName?: string;
  message: string;
  nodeIds: string[];
};

type TeamExpressionScope = {
  ctx: {
    group: {
      id: string;
      name: string;
    };
    team: {
      shikigamis: TeamAsset[];
      yuhuns: TeamAsset[];
      shikigamiNames: string[];
      yuhunNames: string[];
    };
    members: {
      shikigami: TeamAsset[];
      yuhun: TeamAsset[];
      shikigamiNames: string[];
      yuhunNames: string[];
    };
    nodeIds: string[];
    unit?: {
      shikigami: TeamAsset;
      yuhuns: TeamAsset[];
      shikigamiNames: string[];
      yuhunNames: string[];
    };
  };
  shared: {
    fireShikigamiWhitelist: string[];
    vars: Record<string, string[]>;
  };
};

const normalizeText = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const isAssetSelectorNode = (node: any): boolean => {
  return !!node && node.type === "assetSelector";
};

const isDynamicGroupNode = (node: any): boolean => {
  return !!node && node.type === "dynamic-group";
};

const inferLibrary = (node: any): string => {
  const assetLibrary = normalizeText(
    node?.properties?.assetLibrary,
  ).toLowerCase();
  if (assetLibrary) {
    return assetLibrary;
  }

  const selectedLibrary = normalizeText(
    node?.properties?.selectedAsset?.library,
  ).toLowerCase();
  if (selectedLibrary) {
    return selectedLibrary;
  }

  const avatar = normalizeText(node?.properties?.selectedAsset?.avatar);
  if (avatar.includes("/Yuhun/")) {
    return "yuhun";
  }
  if (avatar.includes("/Shikigami/")) {
    return "shikigami";
  }
  return "";
};

const dedupeNodeIds = (ids: string[]): string[] => Array.from(new Set(ids));

const createNodeMap = (nodes: any[]): Map<string, any> => {
  const nodeMap = new Map<string, any>();
  nodes.forEach((node) => {
    const nodeId = normalizeText(node?.id);
    if (!nodeId) return;
    nodeMap.set(nodeId, node);
  });
  return nodeMap;
};

const parseVariableValue = (value: string): string[] => {
  return value
    .split(/[\n,，]/g)
    .map((item) => item.trim())
    .filter((item) => !!item);
};

const createSharedVariableMap = (
  config: GroupRulesConfig,
): Record<string, string[]> => {
  const map: Record<string, string[]> = {};
  config.ruleVariables.forEach((item) => {
    const key = normalizeText(item.key);
    if (!key) return;
    map[key] = dedupeNodeIds(parseVariableValue(item.value));
  });
  map.fireShikigamiWhitelist = [...config.fireShikigamiWhitelist];
  return map;
};

const isRuleEnabledDynamicGroup = (node: any): boolean =>
  node?.properties?.groupMeta?.ruleEnabled !== false;

const toTeamAsset = (node: any): TeamAsset | null => {
  if (!isAssetSelectorNode(node)) {
    return null;
  }
  const name = normalizeText(node?.properties?.selectedAsset?.name);
  if (!name) {
    return null;
  }
  return {
    nodeId: normalizeText(node?.id),
    assetId: normalizeText(node?.properties?.selectedAsset?.assetId),
    name,
    library: inferLibrary(node),
  };
};

const collectTeamAssetsInGroup = (
  groupNode: any,
  nodeMap: Map<string, any>,
): { shikigamiAssets: TeamAsset[]; yuhunAssets: TeamAsset[] } => {
  const queue = [...getDynamicGroupChildIds(groupNode)];
  const visited = new Set<string>();
  const shikigamiAssets: TeamAsset[] = [];
  const yuhunAssets: TeamAsset[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    const node = nodeMap.get(currentId);
    if (!node) {
      continue;
    }

    if (isDynamicGroupNode(node)) {
      const groupKind = normalizeText(node?.properties?.groupMeta?.groupKind);
      if (groupKind === "team") {
        continue;
      }
      queue.push(...getDynamicGroupChildIds(node));
      continue;
    }

    const asset = toTeamAsset(node);
    if (!asset) {
      continue;
    }

    if (asset.library === "shikigami") {
      shikigamiAssets.push(asset);
    } else if (asset.library === "yuhun") {
      yuhunAssets.push(asset);
    }
  }

  return { shikigamiAssets, yuhunAssets };
};

const collectAssetsInShikigamiGroup = (
  shikigamiGroupNode: any,
  nodeMap: Map<string, any>,
): { shikigamiAssets: TeamAsset[]; yuhunAssets: TeamAsset[] } => {
  const queue = [...getDynamicGroupChildIds(shikigamiGroupNode)];
  const visited = new Set<string>();
  const shikigamiAssets: TeamAsset[] = [];
  const yuhunAssets: TeamAsset[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    const node = nodeMap.get(currentId);
    if (!node) {
      continue;
    }

    if (isDynamicGroupNode(node)) {
      const groupKind = normalizeText(node?.properties?.groupMeta?.groupKind);
      if (groupKind === "team" || groupKind === "shikigami") {
        continue;
      }
      queue.push(...getDynamicGroupChildIds(node));
      continue;
    }

    const asset = toTeamAsset(node);
    if (!asset) {
      continue;
    }

    if (asset.library === "shikigami") {
      shikigamiAssets.push(asset);
    } else if (asset.library === "yuhun") {
      yuhunAssets.push(asset);
    }
  }

  return { shikigamiAssets, yuhunAssets };
};

const collectShikigamiUnitSnapshots = (
  teamNode: any,
  nodeMap: Map<string, any>,
): ShikigamiUnitSnapshot[] => {
  const queue = [...getDynamicGroupChildIds(teamNode)];
  const visited = new Set<string>();
  const unitSnapshots: ShikigamiUnitSnapshot[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    const node = nodeMap.get(currentId);
    if (!node || !isDynamicGroupNode(node)) {
      continue;
    }

    const groupKind = normalizeText(node?.properties?.groupMeta?.groupKind);
    if (groupKind === "team") {
      continue;
    }

    if (groupKind === "shikigami") {
      if (!isRuleEnabledDynamicGroup(node)) {
        continue;
      }
      const { shikigamiAssets, yuhunAssets } = collectAssetsInShikigamiGroup(
        node,
        nodeMap,
      );
      const mainShikigami = shikigamiAssets[0];
      if (!mainShikigami) {
        continue;
      }
      unitSnapshots.push({
        groupId: normalizeText(node?.id) || "unknown-shikigami",
        groupName: normalizeText(node?.properties?.groupMeta?.groupName),
        nodeIds: dedupeNodeIds([
          ...shikigamiAssets.map((item) => item.nodeId),
          ...yuhunAssets.map((item) => item.nodeId),
        ]),
        shikigamiAsset: mainShikigami,
        yuhunAssets,
      });
      continue;
    }

    queue.push(...getDynamicGroupChildIds(node));
  }

  return unitSnapshots;
};

const collectTeamRuleSnapshots = (graphData: GraphData): TeamRuleSnapshot[] => {
  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  const nodeMap = createNodeMap(nodes);

  const teamGroups = nodes.filter((node) => {
    if (!isDynamicGroupNode(node)) return false;
    const groupKind = normalizeText(node?.properties?.groupMeta?.groupKind);
    return groupKind === "team" && isRuleEnabledDynamicGroup(node);
  });

  return teamGroups.map((teamNode) => {
    const { shikigamiAssets, yuhunAssets } = collectTeamAssetsInGroup(
      teamNode,
      nodeMap,
    );
    return {
      groupId: normalizeText(teamNode?.id) || "unknown-team",
      groupName: normalizeText(teamNode?.properties?.groupMeta?.groupName),
      nodeIds: dedupeNodeIds([
        ...shikigamiAssets.map((item) => item.nodeId),
        ...yuhunAssets.map((item) => item.nodeId),
      ]),
      shikigamiAssets,
      yuhunAssets,
      shikigamiUnits: collectShikigamiUnitSnapshots(teamNode, nodeMap),
    };
  });
};

const createWarningId = (groupId: string, ruleId: string): string =>
  `${groupId}::${ruleId}`;

const createTeamScope = (
  team: TeamAssetSnapshot,
  shared: TeamExpressionScope["shared"],
): TeamExpressionScope => {
  const shikigamiNames = team.shikigamiAssets.map((item) => item.name);
  const yuhunNames = team.yuhunAssets.map((item) => item.name);
  return {
    ctx: {
      group: {
        id: team.groupId,
        name: team.groupName,
      },
      team: {
        shikigamis: team.shikigamiAssets.map((item) => ({ ...item })),
        yuhuns: team.yuhunAssets.map((item) => ({ ...item })),
        shikigamiNames: [...shikigamiNames],
        yuhunNames: [...yuhunNames],
      },
      members: {
        shikigami: team.shikigamiAssets.map((item) => ({ ...item })),
        yuhun: team.yuhunAssets.map((item) => ({ ...item })),
        shikigamiNames,
        yuhunNames,
      },
      nodeIds: [...team.nodeIds],
    },
    shared: {
      fireShikigamiWhitelist: [...shared.fireShikigamiWhitelist],
      vars: { ...shared.vars },
    },
  };
};

const createShikigamiScope = (
  team: TeamAssetSnapshot,
  shikigamiUnit: ShikigamiUnitSnapshot,
  shared: TeamExpressionScope["shared"],
): TeamExpressionScope => {
  const baseScope = createTeamScope(team, shared);
  const yuhunNames = shikigamiUnit.yuhunAssets.map((item) => item.name);
  return {
    ...baseScope,
    ctx: {
      ...baseScope.ctx,
      group: {
        id: shikigamiUnit.groupId,
        name: shikigamiUnit.groupName,
      },
      nodeIds: [...shikigamiUnit.nodeIds],
      unit: {
        shikigami: { ...shikigamiUnit.shikigamiAsset },
        yuhuns: shikigamiUnit.yuhunAssets.map((item) => ({ ...item })),
        shikigamiNames: [shikigamiUnit.shikigamiAsset.name],
        yuhunNames,
      },
    },
  };
};

const evaluateCondition = (
  expression: string,
  scope: TeamExpressionScope,
): boolean => {
  try {
    return evaluateRuleExpressionAsBoolean(expression, scope);
  } catch (error) {
    console.warn("[groupRules] 表达式执行失败:", expression, error);
    return false;
  }
};

export const validateGraphGroupRules = (
  graphData: GraphData,
  config?: GroupRulesConfig,
): GroupRuleWarning[] => {
  const effectiveConfig = config || readSharedGroupRulesConfig();
  const normalizedGraphData = normalizeGraphRawDataSchema(graphData);
  const teams = collectTeamRuleSnapshots(normalizedGraphData);
  const sharedScope: TeamExpressionScope["shared"] = {
    fireShikigamiWhitelist: [...effectiveConfig.fireShikigamiWhitelist],
    vars: createSharedVariableMap(effectiveConfig),
  };
  const warnings: GroupRuleWarning[] = [];

  teams.forEach((team) => {
    const teamScope = createTeamScope(team, sharedScope);

    effectiveConfig.expressionRules.forEach((rule) => {
      if (rule.enabled === false) {
        return;
      }
      const scopeKind = rule.scopeKind === "shikigami" ? "shikigami" : "team";

      if (scopeKind === "team") {
        if (!evaluateCondition(rule.condition, teamScope)) {
          return;
        }
        warnings.push({
          id: createWarningId(team.groupId, `expr:${rule.id}`),
          ruleId: rule.id,
          code: rule.code || "CUSTOM_EXPRESSION",
          severity: rule.severity || "warning",
          groupId: team.groupId,
          groupName: team.groupName || undefined,
          nodeIds: [...team.nodeIds],
          message: rule.message,
        });
        return;
      }

      team.shikigamiUnits.forEach((unit) => {
        const shikigamiScope = createShikigamiScope(team, unit, sharedScope);
        if (!evaluateCondition(rule.condition, shikigamiScope)) {
          return;
        }
        warnings.push({
          id: createWarningId(unit.groupId, `expr:${rule.id}`),
          ruleId: rule.id,
          code: rule.code || "CUSTOM_EXPRESSION",
          severity: rule.severity || "warning",
          groupId: unit.groupId,
          groupName: unit.groupName || undefined,
          nodeIds: [...unit.nodeIds],
          message: rule.message,
        });
      });
    });
  });

  return warnings;
};
