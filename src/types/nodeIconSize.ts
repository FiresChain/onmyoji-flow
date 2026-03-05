export const NODE_ICON_SIZE_TARGETS = ["assetSelector", "imageNode"] as const;

export type NodeIconSizeTarget = (typeof NODE_ICON_SIZE_TARGETS)[number];

export interface NodeIconSize {
  width: number;
  height: number;
}

export type NodeIconSizeByType = Partial<
  Record<NodeIconSizeTarget, NodeIconSize>
>;

const MIN_NODE_ICON_SIZE = 40;
const MAX_NODE_ICON_SIZE = 1200;

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

const normalizeAxisSize = (value: unknown, fallback: number): number => {
  const parsed = toNumber(value);
  const resolved = parsed == null ? fallback : parsed;
  return Math.round(clamp(resolved, MIN_NODE_ICON_SIZE, MAX_NODE_ICON_SIZE));
};

export const DEFAULT_NODE_ICON_SIZE_BY_TYPE: Record<
  NodeIconSizeTarget,
  NodeIconSize
> = {
  assetSelector: { width: 180, height: 120 },
  imageNode: { width: 180, height: 120 },
};

export const normalizeNodeIconSize = (
  value: unknown,
  fallback: NodeIconSize,
): NodeIconSize => {
  const input =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    width: normalizeAxisSize(input.width, fallback.width),
    height: normalizeAxisSize(input.height, fallback.height),
  };
};

export const normalizeNodeIconSizeByType = (
  input: unknown,
): NodeIconSizeByType => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  const raw = input as Record<string, unknown>;
  const normalized: NodeIconSizeByType = {};
  NODE_ICON_SIZE_TARGETS.forEach((target) => {
    const targetInput = raw[target];
    if (!targetInput || typeof targetInput !== "object") {
      return;
    }
    normalized[target] = normalizeNodeIconSize(
      targetInput,
      DEFAULT_NODE_ICON_SIZE_BY_TYPE[target],
    );
  });
  return normalized;
};

export const hasNodeIconSizeByTypeOverrides = (
  value: NodeIconSizeByType | undefined,
): boolean => {
  if (!value) {
    return false;
  }
  return NODE_ICON_SIZE_TARGETS.some((target) => !!value[target]);
};

const mergeNodeIconSizeByType = (
  base: Record<NodeIconSizeTarget, NodeIconSize>,
  override?: NodeIconSizeByType,
): Record<NodeIconSizeTarget, NodeIconSize> => {
  if (!override) {
    return base;
  }
  const next = { ...base };
  NODE_ICON_SIZE_TARGETS.forEach((target) => {
    const targetOverride = override[target];
    if (!targetOverride) {
      return;
    }
    next[target] = normalizeNodeIconSize(targetOverride, next[target]);
  });
  return next;
};

export const buildMergedNodeIconSizeByType = (options?: {
  globalOverride?: NodeIconSizeByType;
  fileOverride?: NodeIconSizeByType;
}): Record<NodeIconSizeTarget, NodeIconSize> => {
  const withGlobal = mergeNodeIconSizeByType(
    DEFAULT_NODE_ICON_SIZE_BY_TYPE,
    options?.globalOverride,
  );
  return mergeNodeIconSizeByType(withGlobal, options?.fileOverride);
};

export const resolveNodeIconSize = (
  target: NodeIconSizeTarget,
  options?: {
    globalOverride?: NodeIconSizeByType;
    fileOverride?: NodeIconSizeByType;
    explicit?: {
      width?: unknown;
      height?: unknown;
    };
  },
): NodeIconSize => {
  const merged = buildMergedNodeIconSizeByType({
    globalOverride: options?.globalOverride,
    fileOverride: options?.fileOverride,
  });
  const fallback = merged[target];
  return {
    width: normalizeAxisSize(options?.explicit?.width, fallback.width),
    height: normalizeAxisSize(options?.explicit?.height, fallback.height),
  };
};

