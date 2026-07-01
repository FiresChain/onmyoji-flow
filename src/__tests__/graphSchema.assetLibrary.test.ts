import { describe, expect, it } from "vitest";
import {
  normalizeDynamicGroupMeta,
  normalizeGraphRawDataSchema,
} from "@/utils/graphSchema";

describe("graphSchema asset library normalization", () => {
  it("canonicalizes onmyojiSkill aliases", () => {
    const graph = normalizeGraphRawDataSchema({
      nodes: [
        {
          id: "n1",
          type: "assetSelector",
          properties: {
            assetLibrary: "onmyoji_skill",
            selectedAsset: {
              id: "16:1601",
              name: "技能1",
              avatar: "/assets/downloaded_images/hero_16_skill_1601.png",
            },
          },
        },
      ],
      edges: [],
    });

    const node = graph.nodes[0];
    expect(node.properties.assetLibrary).toBe("onmyojiSkill");
    expect(node.properties.selectedAsset.library).toBe("onmyojiSkill");
    expect(node.properties.selectedAsset.assetId).toContain("onmyojiSkill:");
  });

  it("infers hunling library from avatar path", () => {
    const graph = normalizeGraphRawDataSchema({
      nodes: [
        {
          id: "n2",
          type: "assetSelector",
          properties: {
            selectedAsset: {
              id: "100",
              name: "魂灵100",
              avatar: "/assets/HunLing/100.png",
            },
          },
        },
      ],
      edges: [],
    });

    const node = graph.nodes[0];
    expect(node.properties.assetLibrary).toBe("hunling");
    expect(node.properties.selectedAsset.library).toBe("hunling");
    expect(node.properties.selectedAsset.assetId).toContain("hunling:");
  });
});

describe("graphSchema dynamic group team code normalization", () => {
  it("keeps old dynamic group metadata compatible without team code", () => {
    const meta = normalizeDynamicGroupMeta({
      version: 1,
      groupKind: "team",
      ruleEnabled: true,
    });

    expect(meta.teamCode).toBeUndefined();
    expect(meta.groupKind).toBe("team");
  });

  it("normalizes team code only for team groups", () => {
    const teamMeta = normalizeDynamicGroupMeta({
      version: 1,
      groupKind: "team",
      teamCode: {
        enabled: true,
        shortCode: "  SHORT  ",
        longCode: "  LONG  ",
        preferred: "short",
        label: "  复制冲榜队  ",
      },
    });

    expect(teamMeta.teamCode).toEqual({
      enabled: true,
      shortCode: "SHORT",
      longCode: "LONG",
      preferred: "short",
      label: "复制冲榜队",
    });

    const shikigamiMeta = normalizeDynamicGroupMeta({
      version: 1,
      groupKind: "shikigami",
      teamCode: {
        enabled: true,
        longCode: "LONG",
      },
    });

    expect(shikigamiMeta.teamCode).toBeUndefined();
  });
});
