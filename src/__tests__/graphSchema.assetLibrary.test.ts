import { describe, expect, it } from "vitest";
import { normalizeGraphRawDataSchema } from "@/utils/graphSchema";

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
