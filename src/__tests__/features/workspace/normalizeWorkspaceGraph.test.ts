import { describe, expect, it } from "vitest";
import { normalizeWorkspaceGraph } from "@/features/workspace/public";

describe("workspace graph normalization", () => {
  it("canonicalizes onmyojiSkill aliases", () => {
    const graph = normalizeWorkspaceGraph({
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
    const graph = normalizeWorkspaceGraph({
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

  it("keeps graph extensions while applying core and business normalization", () => {
    const graph = normalizeWorkspaceGraph({
      graphExtension: { revision: 2 },
      nodes: [
        {
          id: "group-1",
          type: "dynamic-group",
          nodeExtension: "keep-node",
          properties: {
            children: [" node-1 ", "node-1"],
            propertyExtension: "keep-property",
            meta: { z: 4, metaExtension: "keep-meta" },
          },
        },
      ],
      edges: [
        {
          id: "edge-1",
          sourceNodeId: "group-1",
          targetNodeId: "group-1",
          edgeExtension: "keep-edge",
        },
      ],
    });

    expect(graph).toMatchObject({
      graphExtension: { revision: 2 },
      nodes: [
        {
          zIndex: 4,
          children: ["node-1"],
          nodeExtension: "keep-node",
          properties: {
            children: ["node-1"],
            propertyExtension: "keep-property",
            meta: { metaExtension: "keep-meta" },
            groupMeta: {
              version: 1,
              groupKind: "team",
            },
          },
        },
      ],
      edges: [{ edgeExtension: "keep-edge" }],
    });
  });

  it("keeps the legacy empty-properties materialization", () => {
    const graph = normalizeWorkspaceGraph({
      nodes: [{ id: "plain-1", type: "rect" }],
      edges: [],
    });

    expect(graph.nodes[0].properties).toEqual({});
  });
});
