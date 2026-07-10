import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it, vi } from "vitest";

import AssetManagerDialog from "@/features/assets/ui/AssetManagerDialog.vue";
import NodeThemeDialog from "@/features/assets/ui/NodeThemeDialog.vue";
import {
  DEFAULT_NODE_CREATE_SIZE_CONFIG,
  cloneNodeCreateSizeConfig,
} from "@/features/assets/public";

const DialogStub = defineComponent({
  props: ["modelValue"],
  emits: ["update:modelValue"],
  template: "<section><slot /><slot name='footer' /></section>",
});

const ButtonStub = defineComponent({
  inheritAttrs: false,
  emits: ["click"],
  template:
    "<button type='button' :class=\"$attrs.class\" @click=\"$emit('click')\"><slot /></button>",
});

const PassThroughStub = defineComponent({
  inheritAttrs: false,
  template: "<div><slot /></div>",
});

const TabsStub = defineComponent({
  name: "ElTabs",
  inheritAttrs: false,
  props: ["modelValue"],
  emits: ["update:modelValue"],
  template: "<div><slot /></div>",
});

const InputStub = defineComponent({
  inheritAttrs: false,
  props: ["modelValue", "size"],
  emits: ["update:modelValue", "change"],
  template: "<input />",
});

const AssetThemeDetailStub = defineComponent({
  name: "AssetThemeDetailDialog",
  props: ["modelValue", "title", "mode", "theme", "t"],
  emits: ["update:modelValue", "confirm"],
  template: "<div />",
});

const elementStubs = {
  "el-dialog": DialogStub,
  "el-button": ButtonStub,
  "el-input-number": InputStub,
  "el-switch": InputStub,
  "el-tabs": TabsStub,
  "el-tab-pane": PassThroughStub,
  "el-empty": true,
};

const findButton = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper.findAll("button").find((button) => button.text().trim() === label);

describe("asset feature dialogs", () => {
  it("keeps node-theme draft state and delegates only confirmed commands", async () => {
    const config = cloneNodeCreateSizeConfig(DEFAULT_NODE_CREATE_SIZE_CONFIG);
    config.imageNode.width = 999;
    const wrapper = mount(NodeThemeDialog, {
      props: {
        modelValue: true,
        config,
        t: (key: string) => key,
      },
      global: {
        stubs: {
          ...elementStubs,
          AssetThemeDetailDialog: AssetThemeDetailStub,
        },
      },
    });

    await findButton(wrapper, "nodeSize.reset")!.trigger("click");
    await findButton(wrapper, "nodeSize.applyCurrent")!.trigger("click");

    expect(wrapper.emitted("reset")).toHaveLength(1);
    expect(wrapper.emitted("applyCurrent")?.[0]?.[0]).toMatchObject({
      imageNode: DEFAULT_NODE_CREATE_SIZE_CONFIG.imageNode,
    });
  });

  it("round-trips a detail-theme confirmation into the apply command", async () => {
    const wrapper = mount(NodeThemeDialog, {
      props: {
        modelValue: true,
        config: cloneNodeCreateSizeConfig(DEFAULT_NODE_CREATE_SIZE_CONFIG),
        t: (key: string) => key,
      },
      global: {
        stubs: {
          ...elementStubs,
          AssetThemeDetailDialog: AssetThemeDetailStub,
        },
      },
    });

    await wrapper.find(".node-size-action").trigger("click");
    const detail = wrapper.getComponent({ name: "AssetThemeDetailDialog" });
    expect(detail.props("modelValue")).toBe(true);
    const theme = cloneNodeCreateSizeConfig(DEFAULT_NODE_CREATE_SIZE_CONFIG)
      .assetThemeByLibrary.shikigami;
    theme.nodeStyle.fill = "#123456";
    detail.vm.$emit("confirm", theme);
    await findButton(wrapper, "nodeSize.applyCurrent")!.trigger("click");

    expect(wrapper.emitted("applyCurrent")?.[0]?.[0]).toMatchObject({
      assetThemeByLibrary: {
        shikigami: { nodeStyle: { fill: "#123456" } },
      },
    });
  });

  it("emits manager library, upload, and delete interactions", async () => {
    const item = {
      id: "custom-1",
      name: "asset",
      avatar: "/asset.png",
      library: "shikigami",
      __userAsset: true as const,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const wrapper = mount(AssetManagerDialog, {
      props: {
        modelValue: true,
        library: "shikigami",
        libraries: [{ id: "shikigami", label: "assets" }],
        assets: { shikigami: [item] },
        resolveAssetUrl: (value: unknown) => value,
        t: (key: string) => key,
      },
      global: { stubs: elementStubs },
    });

    const file = new File(["asset"], "asset.png", { type: "image/png" });
    const input = wrapper.get("input[type='file']");
    Object.defineProperty(input.element, "files", { value: [file] });
    await input.trigger("change");
    const upload = wrapper.emitted("upload")?.[0];
    expect(upload?.[0]).toBe(file);
    expect(upload?.[1]).toEqual(expect.any(Function));

    await findButton(wrapper, "common.delete")!.trigger("click");
    expect(wrapper.emitted("remove")?.[0]).toEqual(["shikigami", item]);

    wrapper.getComponent(TabsStub).vm.$emit("update:modelValue", "yuhun");
    expect(wrapper.emitted("update:library")?.[0]).toEqual(["yuhun"]);
  });
});
