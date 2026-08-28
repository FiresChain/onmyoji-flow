import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import YysEditorEmbed from "@/YysEditorEmbed.vue";

vi.mock("@/configs/assetCatalog", () => ({
  DEFAULT_ASSET_BASE_URL: "https://assets.example",
  isAssetCatalogLoaded: vi.fn(() => false),
  loadAssetCatalog: vi.fn().mockRejectedValue(new Error("catalog unavailable")),
  resolveAssetCatalogUrl: vi.fn(() => "https://assets.example/v1/catalog.json"),
}));

describe("YysEditorEmbed asset catalog startup", () => {
  it("emits an error and does not render editor children when loading fails", async () => {
    const wrapper = mount(YysEditorEmbed, {
      props: { mode: "edit" },
      global: {
        stubs: {
          Toolbar: { template: '<div class="toolbar-stub" />' },
          ComponentsPanel: { template: '<div class="components-stub" />' },
          FlowEditor: { template: '<div class="flow-editor-stub" />' },
          DialogManager: { template: '<div class="dialog-stub" />' },
        },
      },
    });

    await vi.waitFor(() => {
      expect(wrapper.emitted("error")?.length).toBe(1);
    });

    expect((wrapper.emitted("error")?.[0]?.[0] as Error).message).toBe(
      "catalog unavailable",
    );
    expect(wrapper.find(".flow-editor-stub").exists()).toBe(false);
    expect(wrapper.find(".components-stub").exists()).toBe(false);
  });
});
