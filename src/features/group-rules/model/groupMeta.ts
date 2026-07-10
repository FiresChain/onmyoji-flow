import type { GraphNode } from "@/core/document/types";

export const GROUP_META_VERSION = 1;
export const DEFAULT_GROUP_RULE_SCOPE = Object.freeze([
  "shikigami-yuhun",
  "shikigami-shikigami",
]);

export type GroupKind = "team" | "shikigami";

export type DynamicGroupMeta = {
  version: number;
  groupKind: GroupKind;
  groupName: string;
  ruleEnabled: boolean;
  ruleScope: string[];
};

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeStringList = (
  value: unknown,
  fallback: readonly string[],
): string[] => {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  const normalized = value
    .map((item) => normalizeText(item))
    .filter((item) => !!item);
  return normalized.length ? Array.from(new Set(normalized)) : [...fallback];
};

export const normalizeDynamicGroupMeta = (
  input: unknown,
  fallbackKind: GroupKind = "team",
): DynamicGroupMeta => {
  const raw =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const versionCandidate = Number(raw.version);
  const version =
    Number.isFinite(versionCandidate) && versionCandidate > 0
      ? Math.trunc(versionCandidate)
      : GROUP_META_VERSION;
  const groupKind: GroupKind =
    raw.groupKind === "shikigami" ? "shikigami" : fallbackKind;

  return {
    version,
    groupKind,
    groupName: normalizeText(raw.groupName),
    ruleEnabled: raw.ruleEnabled !== false,
    ruleScope: normalizeStringList(raw.ruleScope, DEFAULT_GROUP_RULE_SCOPE),
  };
};

const normalizeChildren = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return Array.from(
    new Set(value.map((item) => normalizeText(item)).filter((item) => !!item)),
  );
};

export const getDynamicGroupChildIds = (node: unknown): string[] => {
  const source =
    node && typeof node === "object" ? (node as Record<string, any>) : {};
  const nodeChildren = normalizeChildren(source.children);
  const propertyChildren = normalizeChildren(source.properties?.children);
  return nodeChildren.length ? nodeChildren : propertyChildren;
};

export const normalizeDynamicGroupNode = (node: GraphNode): GraphNode => {
  if (node.type !== "dynamic-group") {
    return node;
  }

  const properties =
    node.properties && typeof node.properties === "object"
      ? { ...node.properties }
      : {};
  const children = getDynamicGroupChildIds(node);

  return {
    ...node,
    children,
    properties: {
      ...properties,
      children,
      groupMeta: normalizeDynamicGroupMeta(properties.groupMeta),
    },
  };
};
