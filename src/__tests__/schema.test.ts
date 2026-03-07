import { describe, it, expect } from "vitest";
import {
  CURRENT_SCHEMA_VERSION,
  DefaultNodeStyle,
  ROOT_DOCUMENT_V1_SCHEMA,
  migrateToV1,
  validateRootDocumentV1,
  type GraphNode,
  type GraphEdge,
  type NodeProperties,
  type RootDocument,
} from "../ts/schema";

describe("Schema 数据结构验证", () => {
  it("当前 schema 版本应该是 1.0.0", () => {
    expect(CURRENT_SCHEMA_VERSION).toBe("1.0.0");
  });

  it("DefaultNodeStyle 应该包含正确的默认值", () => {
    expect(DefaultNodeStyle).toMatchObject({
      width: 180,
      height: 120,
      rotate: 0,
      fill: "#ffffff",
      stroke: "#dcdfe6",
    });
  });

  it("创建 GraphNode 应该符合类型定义", () => {
    const node: GraphNode = {
      id: "node-1",
      type: "rect",
      x: 100,
      y: 200,
      properties: {
        style: {
          width: 200,
          height: 150,
          fill: "#ff0000",
        },
      },
    };

    expect(node.id).toBe("node-1");
    expect(node.type).toBe("rect");
    expect(node.properties.style.width).toBe(200);
  });

  it("创建 GraphEdge 应该包含必需字段", () => {
    const edge: GraphEdge = {
      id: "edge-1",
      sourceNodeId: "node-1",
      targetNodeId: "node-2",
    };

    expect(edge.id).toBe("edge-1");
    expect(edge.sourceNodeId).toBe("node-1");
    expect(edge.targetNodeId).toBe("node-2");
  });

  it("NodeProperties 应该支持式神数据", () => {
    const properties: NodeProperties = {
      style: DefaultNodeStyle,
      shikigami: {
        name: "茨木童子",
        avatar: "/assets/Shikigami/ibaraki.png",
        rarity: "SSR",
      },
    };

    expect(properties.shikigami?.name).toBe("茨木童子");
    expect(properties.shikigami?.rarity).toBe("SSR");
  });

  it("NodeProperties 应该支持御魂数据", () => {
    const properties: NodeProperties = {
      style: DefaultNodeStyle,
      yuhun: {
        name: "破势",
        type: "攻击",
        avatar: "/assets/Yuhun/poshi.png",
      },
    };

    expect(properties.yuhun?.name).toBe("破势");
    expect(properties.yuhun?.type).toBe("攻击");
  });

  it("NodeProperties 应支持资产名称文本关联字段", () => {
    const properties: NodeProperties = {
      style: DefaultNodeStyle,
      meta: {
        assetNameOwnerId: "asset-node-1",
      },
      assetName: {
        visible: true,
        labelNodeId: "text-node-1",
        offsetX: 0,
        offsetY: 78,
        lastSyncedAssetName: "茨木童子",
      },
    };

    expect(properties.meta?.assetNameOwnerId).toBe("asset-node-1");
    expect(properties.assetName?.labelNodeId).toBe("text-node-1");
    expect(properties.assetName?.visible).toBe(true);
  });

  it("RootDocument 应该包含文件列表和活动文件", () => {
    const doc: RootDocument = {
      schemaVersion: "1.0.0",
      fileList: [],
      activeFile: "File 1",
      activeFileId: "f_123",
    };

    expect(doc.schemaVersion).toBe("1.0.0");
    expect(doc.activeFile).toBe("File 1");
    expect(doc.activeFileId).toBe("f_123");
  });

  it("migrateToV1 应将 legacy meta.z 迁移为节点 zIndex", () => {
    const migrated = migrateToV1([
      {
        id: "file-1",
        name: "File 1",
        label: "File 1",
        visible: true,
        type: "FLOW",
        graphRawData: {
          nodes: [
            {
              id: "node-1",
              type: "rect",
              properties: {
                style: { width: 120, height: 80 },
                meta: { z: 7, locked: true },
              },
            },
          ],
          edges: [],
        },
      },
    ]);

    const migratedNode = (migrated.fileList[0].graphRawData as any).nodes[0];
    expect(migratedNode.zIndex).toBe(7);
    expect(migratedNode.properties.meta.z).toBeUndefined();
    expect(migratedNode.properties.meta.locked).toBe(true);
  });

  it("migrateToV1 应优先保留节点自身 zIndex", () => {
    const migrated = migrateToV1([
      {
        id: "file-1",
        name: "File 1",
        label: "File 1",
        visible: true,
        type: "FLOW",
        graphRawData: {
          nodes: [
            {
              id: "node-1",
              type: "rect",
              zIndex: 11,
              properties: {
                style: { width: 120, height: 80 },
                meta: { z: 7 },
              },
            },
          ],
          edges: [],
        },
      },
    ]);

    const migratedNode = (migrated.fileList[0].graphRawData as any).nodes[0];
    expect(migratedNode.zIndex).toBe(11);
    expect(migratedNode.properties.meta.z).toBeUndefined();
  });

  it("RootDocument schema 常量应与当前版本一致", () => {
    expect(ROOT_DOCUMENT_V1_SCHEMA.properties.schemaVersion.const).toBe(
      CURRENT_SCHEMA_VERSION,
    );
  });

  it("validateRootDocumentV1 应通过合法文档", () => {
    const validation = validateRootDocumentV1({
      schemaVersion: "1.0.0",
      fileList: [
        {
          id: "f_1",
          label: "File 1",
          name: "File 1",
          visible: true,
          type: "FLOW",
          graphRawData: {
            nodes: [
              {
                id: "n_1",
                type: "rect",
                properties: {},
                zIndex: 1,
              },
            ],
            edges: [],
          },
          transform: {
            SCALE_X: 1,
            SCALE_Y: 1,
            TRANSLATE_X: 0,
            TRANSLATE_Y: 0,
          },
        },
      ],
      activeFile: "File 1",
      activeFileId: "f_1",
    });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("validateRootDocumentV1 应拒绝非法文档", () => {
    const validation = validateRootDocumentV1({
      schemaVersion: "1.0.0",
      fileList: [
        {
          id: "f_1",
          label: "File 1",
          name: "File 1",
          visible: true,
          type: "FLOW",
          graphRawData: {},
          transform: {
            SCALE_X: 1,
            SCALE_Y: 1,
            TRANSLATE_X: 0,
            TRANSLATE_Y: 0,
          },
        },
      ],
      activeFile: "Missing File",
      activeFileId: "missing-id",
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((item) => item.path.includes("graphRawData")),
    ).toBe(true);
    expect(validation.errors.some((item) => item.path === "$.activeFile")).toBe(
      true,
    );
  });
});
