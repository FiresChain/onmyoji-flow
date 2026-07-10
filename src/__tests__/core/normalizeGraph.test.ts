import { describe, expect, it } from "vitest";
import { normalizeGraph } from "@/core/document/normalizeGraph";

describe("core document graph normalization", () => {
  it("normalizes labels and zIndex without dropping unknown fields or mutating input", () => {
    const input = {
      canvasExtension: { revision: 3 },
      nodes: [
        {
          id: "node-1",
          type: "rect",
          zIndex: 9.8,
          nodeExtension: "keep-node",
          properties: {
            propertyExtension: "keep-property",
            meta: {
              z: 2,
              zIndex: 3,
              locked: true,
              metaExtension: "keep-meta",
            },
            _label: [
              null,
              {},
              { id: "label-1", extension: "keep-label" },
              { content: "content-only" },
            ],
          },
        },
        {
          id: "node-2",
          type: "rect",
          properties: {
            meta: { zIndex: "6.9" },
          },
        },
        null,
      ],
      edges: [
        {
          id: "edge-1",
          type: "polyline",
          sourceNodeId: "node-1",
          targetNodeId: "node-2",
          edgeExtension: "keep-edge",
          properties: {
            _label: [{ text: "edge label" }, { ignored: true }],
          },
        },
      ],
    };

    const normalized = normalizeGraph(input);

    expect(normalized.canvasExtension).toEqual({ revision: 3 });
    expect(normalized.nodes).toHaveLength(2);
    expect(normalized.nodes[0]).toMatchObject({
      zIndex: 9,
      nodeExtension: "keep-node",
      properties: {
        propertyExtension: "keep-property",
        meta: {
          locked: true,
          metaExtension: "keep-meta",
        },
        _label: [
          { id: "label-1", extension: "keep-label" },
          { content: "content-only" },
        ],
      },
    });
    expect(normalized.nodes[0].properties?.meta).not.toHaveProperty("z");
    expect(normalized.nodes[0].properties?.meta).not.toHaveProperty("zIndex");
    expect(normalized.nodes[1].zIndex).toBe(6);
    expect(normalized.edges[0]).toMatchObject({
      edgeExtension: "keep-edge",
      properties: { _label: [{ text: "edge label" }] },
    });

    expect(input.nodes[0]?.properties.meta).toMatchObject({ z: 2, zIndex: 3 });
    expect(input.nodes[0]?.properties._label).toHaveLength(4);
  });

  it("can hide dynamic groups and their dangling edges", () => {
    const normalized = normalizeGraph(
      {
        nodes: [
          { id: "group", type: "dynamic-group" },
          { id: "node", type: "rect" },
        ],
        edges: [
          {
            id: "group-edge",
            sourceNodeId: "group",
            targetNodeId: "node",
          },
          {
            id: "node-edge",
            sourceNodeId: "node",
            targetNodeId: "node",
          },
        ],
      },
      { hideDynamicGroups: true },
    );

    expect(normalized.nodes.map((node) => node.id)).toEqual(["node"]);
    expect(normalized.edges.map((edge) => edge.id)).toEqual(["node-edge"]);
  });

  it("keeps canonical zIndex stable across a JSON round trip", () => {
    const once = normalizeGraph({
      graphExtension: "keep-graph",
      nodes: [
        {
          id: "node-1",
          type: "rect",
          properties: { meta: { z: 7, visible: true } },
        },
      ],
      edges: [],
    });
    const twice = normalizeGraph(JSON.parse(JSON.stringify(once)));

    expect(twice).toEqual(once);
    expect(twice.nodes[0].zIndex).toBe(7);
    expect(twice.nodes[0].properties?.meta).toEqual({ visible: true });
  });
});
