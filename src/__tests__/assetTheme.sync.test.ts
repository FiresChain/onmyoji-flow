import { describe, expect, it } from "vitest";
import {
  applyAssetThemeToCurrentFile,
  syncAssetNameLabelForNode,
} from "@/utils/assetTheme";
import {
  DEFAULT_NODE_CREATE_SIZE_CONFIG,
  cloneNodeCreateSizeConfig,
} from "@/utils/nodeCreateSizeConfig";

type NodeModel = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, any>;
  getProperties: () => Record<string, any>;
  moveTo: (x: number, y: number) => void;
};

const createModel = (
  input: Partial<NodeModel> & { id: string; type: string },
) => {
  const model: NodeModel = {
    id: input.id,
    type: input.type,
    x: input.x ?? 0,
    y: input.y ?? 0,
    width: input.width ?? 180,
    height: input.height ?? 120,
    properties: input.properties ?? {},
    getProperties() {
      return this.properties;
    },
    moveTo(x, y) {
      this.x = x;
      this.y = y;
    },
  };
  return model;
};

const createLfMock = (assetNode: NodeModel) => {
  const nodes: NodeModel[] = [assetNode];
  let seq = 1;
  return {
    graphModel: {
      nodes,
    },
    getNodeModelById(id: string) {
      return nodes.find((item) => item.id === id) || null;
    },
    addNode(input: any) {
      const created = createModel({
        id: `label-${seq++}`,
        type: input.type,
        x: input.x,
        y: input.y,
        width: input.properties?.width,
        height: input.properties?.height,
        properties: input.properties || {},
      });
      nodes.push(created);
      return created;
    },
    setProperties(id: string, nextProps: Record<string, any>) {
      const model = nodes.find((item) => item.id === id);
      if (model) {
        model.properties = nextProps;
      }
    },
    deleteNode(id: string) {
      const index = nodes.findIndex((item) => item.id === id);
      if (index >= 0) {
        nodes.splice(index, 1);
      }
    },
  };
};

describe("assetTheme sync", () => {
  it("keeps applied label text style during non-theme follow-up sync", () => {
    const assetNode = createModel({
      id: "asset-1",
      type: "assetSelector",
      x: 100,
      y: 100,
      width: 180,
      height: 120,
      properties: {
        assetLibrary: "shikigami",
        selectedAsset: {
          name: "茨木童子",
          library: "shikigami",
        },
      },
    });
    const lf = createLfMock(assetNode) as any;

    const appliedConfig = cloneNodeCreateSizeConfig(
      DEFAULT_NODE_CREATE_SIZE_CONFIG,
    );
    appliedConfig.assetThemeByLibrary.shikigami.name.show = true;
    appliedConfig.assetThemeByLibrary.shikigami.name.textStyle.color =
      "#ff0000";
    appliedConfig.assetThemeByLibrary.shikigami.name.textStyle.fontSize = 28;
    const defaultConfig = cloneNodeCreateSizeConfig(
      DEFAULT_NODE_CREATE_SIZE_CONFIG,
    );

    syncAssetNameLabelForNode(lf, assetNode.id, {
      config: appliedConfig,
      applyThemeStyle: true,
      forceSyncText: true,
    });
    const labelNodeId = assetNode.properties.assetName?.labelNodeId as string;
    const labelNode = lf.getNodeModelById(labelNodeId);
    expect(labelNode).toBeTruthy();
    expect(labelNode.properties.style.textStyle.color).toBe("#ff0000");
    expect(labelNode.properties.style.textStyle.fontSize).toBe(28);

    syncAssetNameLabelForNode(lf, assetNode.id, {
      config: defaultConfig,
      applyThemeStyle: false,
      forceSyncText: false,
    });
    const labelNodeAfter = lf.getNodeModelById(labelNodeId);
    expect(labelNodeAfter.properties.style.textStyle.color).toBe("#ff0000");
    expect(labelNodeAfter.properties.style.textStyle.fontSize).toBe(28);
  });

  it("applies configured asset size to existing asset nodes when applying to current file", () => {
    const assetNode = createModel({
      id: "asset-2",
      type: "assetSelector",
      x: 80,
      y: 120,
      width: 180,
      height: 120,
      properties: {
        assetLibrary: "onmyoji",
        selectedAsset: {
          name: "神乐",
          library: "onmyoji",
        },
        style: {
          width: 180,
          height: 120,
        },
      },
    });
    const lf = createLfMock(assetNode) as any;
    const appliedConfig = cloneNodeCreateSizeConfig(
      DEFAULT_NODE_CREATE_SIZE_CONFIG,
    );
    appliedConfig.assetThemeByLibrary.onmyoji.name.show = true;
    appliedConfig.assetSelectorByLibrary.onmyoji.width = 340;
    appliedConfig.assetSelectorByLibrary.onmyoji.height = 210;

    applyAssetThemeToCurrentFile(lf, {
      config: appliedConfig,
    });

    expect(assetNode.width).toBe(340);
    expect(assetNode.height).toBe(210);
    expect(assetNode.properties.width).toBe(340);
    expect(assetNode.properties.height).toBe(210);
    expect(assetNode.properties.style.width).toBe(340);
    expect(assetNode.properties.style.height).toBe(210);
  });
});
