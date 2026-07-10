import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import NodePalette from "@/editor/components/NodePalette.vue";
import {
  resetNodeCreateSizeConfig,
  writeNodeCreateSizeConfig,
} from "@/features/assets/public";

const startDragMock = vi.fn();

vi.mock("@/ts/useLogicFlow", () => ({
  useLogicFlowScope: vi.fn(() => Symbol("components-panel-scope")),
  getLogicFlowInstance: vi.fn(() => ({
    dnd: {
      startDrag: startDragMock,
    },
  })),
}));

vi.mock("@/editor/context/useEditorI18n", () => ({
  useEditorI18n: vi.fn(() => ({
    t: (key: string) => key,
  })),
}));

vi.mock("@/features/assets/catalog/assetCatalog", () => ({
  getAssetDataSource: vi.fn(() => [{ avatar: "/assets/mock.png" }]),
}));

vi.mock("@/features/assets/assetUrlResolver", () => ({
  resolveAssetUrl: vi.fn((value: string) => value),
}));

describe("NodePalette node create size", () => {
  beforeEach(() => {
    startDragMock.mockReset();
    resetNodeCreateSizeConfig();
  });

  it("applies configured size when dragging onmyoji selector", async () => {
    writeNodeCreateSizeConfig({
      assetSelectorByLibrary: {
        onmyoji: { width: 340, height: 210 },
      },
    });

    const wrapper = mount(NodePalette);
    const target = wrapper
      .findAll(".component-item")
      .find((item) => item.text().includes("flow.components.onmyoji.name"));

    expect(target).toBeTruthy();
    await target!.trigger("mousedown", { button: 0 });

    expect(startDragMock).toHaveBeenCalledTimes(1);
    expect(startDragMock.mock.calls[0][0]).toMatchObject({
      type: "assetSelector",
      properties: {
        assetLibrary: "onmyoji",
        width: 340,
        height: 210,
      },
    });
  });
});
