export const DYNAMIC_GROUP_NODE_TYPE = "dynamic-group";

export interface DynamicGroupNodeProperties extends Record<string, unknown> {
  children: string[];
  groupMeta: {
    version: number;
    groupKind: "team" | "shikigami";
    ruleEnabled: boolean;
  };
  collapsible: boolean;
  isCollapsed: boolean;
  width: number;
  height: number;
  collapsedWidth: number;
  collapsedHeight: number;
  radius: number;
  isRestrict: boolean;
  autoResize: boolean;
  transformWithContainer: boolean;
  autoToFront: boolean;
}

export const createDynamicGroupNodeProperties =
  (): DynamicGroupNodeProperties => ({
    children: [],
    groupMeta: {
      version: 1,
      groupKind: "team",
      ruleEnabled: true,
    },
    collapsible: true,
    isCollapsed: false,
    width: 420,
    height: 250,
    collapsedWidth: 100,
    collapsedHeight: 60,
    radius: 6,
    isRestrict: false,
    autoResize: false,
    transformWithContainer: false,
    autoToFront: true,
  });

// Registration is supplied by the @logicflow/extension DynamicGroup plugin.
