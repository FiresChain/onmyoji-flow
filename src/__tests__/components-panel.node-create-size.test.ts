import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ComponentsPanel from "@/components/flow/ComponentsPanel.vue";
import {
  resetNodeCreateSizeConfig,
  writeNodeCreateSizeConfig,
} from "@/utils/nodeCreateSizeConfig";

const startDragMock = vi.fn();

vi.mock("@/ts/useLogicFlow", () => ({
  useLogicFlowScope: vi.fn(() => Symbol("components-panel-scope")),
  getLogicFlowInstance: vi.fn(() => ({
    dnd: {
      startDrag: startDragMock,
    },
  })),
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

describe("ComponentsPanel node create size", () => {
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

    const wrapper = mount(ComponentsPanel);
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
