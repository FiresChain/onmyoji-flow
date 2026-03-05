import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import AssetSelectorPanel from "@/components/flow/panels/AssetSelectorPanel.vue";

const setPropertiesMock = vi.fn();
const openGenericSelectorMock = vi.fn(
  (_config: any, callback: (item: any) => void) => {
    callback({
      id: "a1",
      library: "shikigami",
      name: "测试式神",
      avatar: "/assets/Shikigami/sp/1.png",
    });
  },
);

vi.mock("@/ts/useDialogs", () => ({
  useDialogs: vi.fn(() => ({
    openGenericSelector: openGenericSelectorMock,
  })),
}));

vi.mock("@/ts/useLogicFlow", () => ({
  useLogicFlowScope: vi.fn(() => Symbol("asset-selector-panel-scope")),
  getLogicFlowInstance: vi.fn(() => ({
    setProperties: setPropertiesMock,
  })),
}));

vi.mock("@/configs/selectorPresets", () => ({
  getSelectorPreset: vi.fn(() => ({
    itemRender: {
      imageField: "avatar",
      labelField: "name",
    },
    groups: [],
    dataSource: [],
  })),
}));

vi.mock("@/utils/assetUrl", () => ({
  resolveAssetUrl: vi.fn((value: string) => value),
  resolveAssetUrlsInDataSource: vi.fn((value: any[]) => value),
}));

vi.mock("@/utils/customAssets", () => ({
  listCustomAssets: vi.fn(() => []),
  deleteCustomAsset: vi.fn(),
}));

vi.mock("@/utils/graphSchema", () => ({
  normalizeSelectedAssetRecord: vi.fn((input: any, library: string) => ({
    ...input,
    library,
    assetId: `${library}:${input?.id || "unknown"}`,
  })),
}));

vi.mock("@/ts/useSafeI18n", () => ({
  useSafeI18n: vi.fn(() => ({
    t: (key: string) => key,
    getLocale: () => "zh",
  })),
}));

describe("AssetSelectorPanel size policy", () => {
  it("keeps node size unchanged after selecting asset", async () => {
    setPropertiesMock.mockReset();
    openGenericSelectorMock.mockClear();

    const wrapper = mount(AssetSelectorPanel, {
      props: {
        node: {
          id: "node-1",
          properties: {
            assetLibrary: "shikigami",
            width: 320,
            height: 220,
            style: {
              width: 320,
              height: 220,
            },
            selectedAsset: null,
          },
        },
      },
      global: {
        stubs: {
          "el-button": {
            emits: ["click"],
            template:
              '<button type="button" @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    });

    const button = wrapper.find("button");
    expect(button.exists()).toBe(true);
    await button.trigger("click");

    expect(openGenericSelectorMock).toHaveBeenCalledTimes(1);
    expect(setPropertiesMock).toHaveBeenCalledTimes(1);
    const payload = setPropertiesMock.mock.calls[0][1];
    expect(payload.width).toBe(320);
    expect(payload.height).toBe(220);
    expect(payload.style).toEqual({
      width: 320,
      height: 220,
    });
    expect(payload.selectedAsset).toMatchObject({
      id: "a1",
      library: "shikigami",
    });
  });
});
