import { describe, expect, it } from "vitest";
import {
  CURRENT_SCHEMA_VERSION,
  migrateGraphData,
  migrateToV1,
  needsGraphMigration,
} from "@/core/document/migrations";
import { validateRootDocumentV1 } from "@/core/document/validation";

describe("core document migrations", () => {
  it("migrates legacy selector nodes and keeps compatibility payloads", () => {
    const input = {
      graphExtension: "keep-graph",
      nodes: [
        {
          id: "shikigami-node",
          type: "shikigamiSelect",
          nodeExtension: "keep-node",
          properties: {
            shikigami: { id: "sp-1", name: "Legacy Shikigami" },
            propertyExtension: "keep-property",
          },
        },
        {
          id: "yuhun-node",
          type: "yuhunSelect",
          properties: {
            yuhun: { id: "soul-1", name: "Legacy Soul" },
          },
        },
      ],
      edges: [],
    };

    expect(needsGraphMigration(input)).toBe(true);
    const result = migrateGraphData(input);

    expect(result.migratedCount).toBe(2);
    expect(result.migrations).toEqual([
      {
        id: "shikigami-node",
        from: "shikigamiSelect",
        to: "assetSelector",
      },
      {
        id: "yuhun-node",
        from: "yuhunSelect",
        to: "assetSelector",
      },
    ]);
    expect(result.graphData.graphExtension).toBe("keep-graph");
    expect(result.graphData.nodes[0]).toMatchObject({
      type: "assetSelector",
      nodeExtension: "keep-node",
      properties: {
        assetLibrary: "shikigami",
        selectedAsset: { id: "sp-1", name: "Legacy Shikigami" },
        propertyExtension: "keep-property",
        _migrated: {
          from: "shikigamiSelect",
          originalData: { id: "sp-1", name: "Legacy Shikigami" },
        },
      },
    });
    expect(result.graphData.nodes[1]).toMatchObject({
      type: "assetSelector",
      properties: {
        assetLibrary: "yuhun",
        selectedAsset: { id: "soul-1", name: "Legacy Soul" },
      },
    });
    expect(input.nodes[0].type).toBe("shikigamiSelect");
  });

  it("migrates RootDocument fields while preserving unknown extensions", () => {
    const input = {
      rootExtension: { owner: "plugin-a" },
      activeFile: "File A",
      activeFileId: "file-b",
      fileList: [
        {
          label: "File A",
          name: "File A",
          visible: true,
          type: "FLOW",
          fileExtension: "keep-file",
          createdAt: 10,
          graphRawData: {
            graphExtension: "keep-graph",
            nodes: [
              {
                id: "node-a",
                type: "shikigamiSelect",
                height: 80,
                nodeExtension: "keep-node",
                properties: {
                  width: 120,
                  shikigami: { id: "sp-1" },
                  propertyExtension: "keep-property",
                  meta: { z: 4, metaExtension: "keep-meta" },
                },
              },
            ],
            edges: [],
          },
          transform: {
            SCALE_X: 2,
            SCALE_Y: 2,
            TRANSLATE_X: 5,
            TRANSLATE_Y: 6,
            transformExtension: "keep-transform",
          },
        },
        {
          id: "file-b",
          label: "File B",
          name: "File B",
          visible: true,
          type: "FLOW",
          graphRawData: { nodes: [], edges: [] },
        },
      ],
    };

    const migrated = migrateToV1(input, { now: 99 });
    const firstFile = migrated.fileList[0];
    const node = firstFile.graphRawData.nodes[0];

    expect(migrated).toMatchObject({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      activeFile: "File B",
      activeFileId: "file-b",
      rootExtension: { owner: "plugin-a" },
    });
    expect(firstFile).toMatchObject({
      id: "file-1",
      fileExtension: "keep-file",
      createdAt: 10,
      updatedAt: 99,
      transform: { transformExtension: "keep-transform" },
      graphRawData: { graphExtension: "keep-graph" },
    });
    expect(node).toMatchObject({
      type: "assetSelector",
      width: 120,
      height: 80,
      zIndex: 4,
      nodeExtension: "keep-node",
      properties: {
        style: { width: 120, height: 80 },
        meta: {
          visible: true,
          locked: false,
          metaExtension: "keep-meta",
        },
        propertyExtension: "keep-property",
        assetLibrary: "shikigami",
      },
    });
    expect(node.properties?.meta).not.toHaveProperty("z");
    expect(input.fileList[0].graphRawData.nodes[0].type).toBe(
      "shikigamiSelect",
    );
    expect(validateRootDocumentV1(migrated)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("creates a valid deterministic default document", () => {
    const migrated = migrateToV1(null, { now: 42 });

    expect(migrated).toMatchObject({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      activeFile: "File 1",
      activeFileId: "file-1",
      fileList: [
        {
          id: "file-1",
          createdAt: 42,
          updatedAt: 42,
          graphRawData: { nodes: [], edges: [] },
        },
      ],
    });
    expect(validateRootDocumentV1(migrated).valid).toBe(true);
  });
});
