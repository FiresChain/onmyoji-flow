import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ComponentsPanel from "@/components/flow/ComponentsPanel.vue";

const startDragMock = vi.fn();

vi.mock("@/ts/useLogicFlow", () => ({
  useLogicFlowScope: vi.fn(() => Symbol("components-panel-scope")),
  getLogicFlowInstance: vi.fn(() => ({
    dnd: {
      startDrag: startDragMock,
    },
  })),
}));

vi.mock("@/ts/useStore", () => ({
  useFilesStore: vi.fn(() => ({
    getActiveFileNodeIconSizeByType: () => ({
      imageNode: { width: 250, height: 180 },
      assetSelector: { width: 300, height: 200 },
    }),
  })),
}));

vi.mock("@/utils/nodeIconSizeThemeSource", () => ({
  readNodeIconSizeThemeConfig: vi.fn(() => ({
    imageNode: { width: 220, height: 160 },
    assetSelector: { width: 280, height: 160 },
  })),
  subscribeNodeIconSizeThemeConfig: vi.fn(() => () => {}),
}));

vi.mock("@/ts/useSafeI18n", () => ({
  useSafeI18n: vi.fn(() => ({
    t: (key: string) => key,
  })),
}));

vi.mock("@/configs/assetCatalog", () => ({
  getAssetDataSource: vi.fn(() => [{ avatar: "/assets/mock.png" }]),
}));

vi.mock("@/utils/assetUrl", () => ({
  resolveAssetUrl: vi.fn((value: string) => value),
}));

describe("ComponentsPanel node icon size", () => {
  beforeEach(() => {
    startDragMock.mockReset();
  });

  it("applies file override size when dragging imageNode and assetSelector", async () => {
    const wrapper = mount(ComponentsPanel);

    const imageItem = wrapper
      .findAll(".component-item")
      .find((item) =>
        item.text().includes("flow.components.image.name"),
      );
    expect(imageItem).toBeTruthy();
    await imageItem!.trigger("mousedown", { button: 0 });

    const assetItem = wrapper
      .findAll(".component-item")
      .find((item) =>
        item.text().includes("flow.components.assetSelector.name"),
      );
    expect(assetItem).toBeTruthy();
    await assetItem!.trigger("mousedown", { button: 0 });

    expect(startDragMock).toHaveBeenCalledTimes(2);
    expect(startDragMock.mock.calls[0][0]).toMatchObject({
      type: "imageNode",
      properties: {
        width: 250,
        height: 180,
      },
    });
    expect(startDragMock.mock.calls[1][0]).toMatchObject({
      type: "assetSelector",
      properties: {
        width: 300,
        height: 200,
      },
    });
  });
});

