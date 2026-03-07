import { describe, it, expect } from "vitest";
import { validateGraphGroupRules } from "@/utils/groupRules";
import { DEFAULT_GROUP_RULES_CONFIG } from "@/configs/groupRules";

const baseGraph = {
  nodes: [
    {
      id: "team-1",
      type: "dynamic-group",
      children: ["s1", "s2"],
      properties: {
        children: ["s1", "s2"],
        groupMeta: {
          groupKind: "team",
          groupName: "一队",
          ruleEnabled: true,
        },
      },
    },
    {
      id: "s1",
      type: "assetSelector",
      properties: {
        assetLibrary: "shikigami",
        selectedAsset: { assetId: "a1", name: "辉夜姬", library: "shikigami" },
      },
    },
    {
      id: "s2",
      type: "assetSelector",
      properties: {
        assetLibrary: "shikigami",
        selectedAsset: { assetId: "a2", name: "千姬", library: "shikigami" },
      },
    },
  ],
  edges: [],
};

const graphWithoutFireShikigami = {
  ...baseGraph,
  nodes: baseGraph.nodes.map((node) => {
    if (node.id === "s1") {
      return {
        ...node,
        properties: {
          ...node.properties,
          selectedAsset: {
            assetId: "a1",
            name: "阿修罗",
            library: "shikigami",
          },
        },
      };
    }
    if (node.id === "s2") {
      return {
        ...node,
        properties: {
          ...node.properties,
          selectedAsset: {
            assetId: "a2",
            name: "不知火",
            library: "shikigami",
          },
        },
      };
    }
    return node;
  }),
};

const graphForShikigamiScope = {
  nodes: [
    {
      id: "team-1",
      type: "dynamic-group",
      children: ["unit-1", "unit-2"],
      properties: {
        children: ["unit-1", "unit-2"],
        groupMeta: {
          groupKind: "team",
          groupName: "一队",
          ruleEnabled: true,
        },
      },
    },
    {
      id: "unit-1",
      type: "dynamic-group",
      children: ["s1", "y1"],
      properties: {
        children: ["s1", "y1"],
        groupMeta: {
          groupKind: "shikigami",
          groupName: "一号位",
          ruleEnabled: true,
        },
      },
    },
    {
      id: "unit-2",
      type: "dynamic-group",
      children: ["s2", "y2"],
      properties: {
        children: ["s2", "y2"],
        groupMeta: {
          groupKind: "shikigami",
          groupName: "二号位",
          ruleEnabled: true,
        },
      },
    },
    {
      id: "s1",
      type: "assetSelector",
      properties: {
        assetLibrary: "shikigami",
        selectedAsset: { assetId: "s1", name: "辉夜姬", library: "shikigami" },
      },
    },
    {
      id: "y1",
      type: "assetSelector",
      properties: {
        assetLibrary: "yuhun",
        selectedAsset: { assetId: "y1", name: "兵主部", library: "yuhun" },
      },
    },
    {
      id: "s2",
      type: "assetSelector",
      properties: {
        assetLibrary: "shikigami",
        selectedAsset: { assetId: "s2", name: "葛叶", library: "shikigami" },
      },
    },
    {
      id: "y2",
      type: "assetSelector",
      properties: {
        assetLibrary: "yuhun",
        selectedAsset: { assetId: "y2", name: "破势", library: "yuhun" },
      },
    },
  ],
  edges: [],
};

const graphForShikigamiScopeMatched = {
  ...graphForShikigamiScope,
  nodes: graphForShikigamiScope.nodes.map((node) => {
    if (node.id !== "y1") {
      return node;
    }
    return {
      ...node,
      properties: {
        ...node.properties,
        selectedAsset: {
          assetId: "y1",
          name: "破势",
          library: "yuhun",
        },
      },
    };
  }),
};

describe("groupRules expression integration", () => {
  it("支持自定义 expressionRules 产出告警", () => {
    const warnings = validateGraphGroupRules(baseGraph, {
      ...DEFAULT_GROUP_RULES_CONFIG,
      shikigamiYuhunBlacklist: [],
      shikigamiConflictPairs: [],
      fireShikigamiWhitelist: ["座敷童子"],
      ruleVariables: [
        {
          key: "供火式神",
          value: "辉夜姬,座敷童子",
        },
      ],
      expressionRules: [
        {
          id: "team-has-kaguya",
          condition:
            'count(intersect(map(ctx.team.shikigamis, "name"), getVar("供火式神"))) > 0',
          message: "命中：包含辉夜姬",
          severity: "info",
          code: "CUSTOM_HAS_KAGUYA",
        },
      ],
    });

    const custom = warnings.find((item) => item.ruleId === "team-has-kaguya");
    expect(custom).toBeTruthy();
    expect(custom?.severity).toBe("info");
    expect(custom?.code).toBe("CUSTOM_HAS_KAGUYA");
    expect(custom?.nodeIds).toEqual(["s1", "s2"]);
  });

  it("当 expressionRules 为空时不再产出 legacy 告警", () => {
    const warnings = validateGraphGroupRules(baseGraph, {
      ...DEFAULT_GROUP_RULES_CONFIG,
      shikigamiYuhunBlacklist: [],
      shikigamiConflictPairs: [],
      fireShikigamiWhitelist: ["座敷童子"],
      ruleVariables: [],
      expressionRules: [],
    });

    expect(warnings).toHaveLength(0);
  });

  it("默认预制规则可命中“辉夜姬不能带破势”", () => {
    const warnings = validateGraphGroupRules(
      graphForShikigamiScopeMatched,
      DEFAULT_GROUP_RULES_CONFIG,
    );
    expect(
      warnings.some((item) => item.code === "TEAM_KAGUYA_POSHI_CONFLICT"),
    ).toBe(true);
  });

  it("默认预制规则可命中“队伍需要供火式神”", () => {
    const warnings = validateGraphGroupRules(
      graphWithoutFireShikigami,
      DEFAULT_GROUP_RULES_CONFIG,
    );
    expect(
      warnings.some((item) => item.code === "TEAM_MISSING_FIRE_SHIKIGAMI"),
    ).toBe(true);
  });

  it("shikigami scope 不会被其他式神的御魂误触发", () => {
    const warnings = validateGraphGroupRules(graphForShikigamiScope, {
      ...DEFAULT_GROUP_RULES_CONFIG,
      expressionRules: [
        {
          id: "unit-kaguya-no-poshi",
          scopeKind: "shikigami",
          condition:
            'ctx.unit.shikigami.name == "辉夜姬" && contains(map(ctx.unit.yuhuns, "name"), "破势")',
          message: "规则冲突：辉夜姬不建议携带破势。",
          severity: "warning",
          code: "UNIT_KAGUYA_POSHI_CONFLICT",
        },
      ],
    });

    expect(warnings).toHaveLength(0);
  });

  it("shikigami scope 可精准命中当前式神与其关联御魂", () => {
    const warnings = validateGraphGroupRules(graphForShikigamiScopeMatched, {
      ...DEFAULT_GROUP_RULES_CONFIG,
      expressionRules: [
        {
          id: "unit-kaguya-no-poshi",
          scopeKind: "shikigami",
          condition:
            'ctx.unit.shikigami.name == "辉夜姬" && contains(map(ctx.unit.yuhuns, "name"), "破势")',
          message: "规则冲突：辉夜姬不建议携带破势。",
          severity: "warning",
          code: "UNIT_KAGUYA_POSHI_CONFLICT",
        },
      ],
    });

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.groupId).toBe("unit-1");
    expect(warnings[0]?.code).toBe("UNIT_KAGUYA_POSHI_CONFLICT");
  });
});
